import { onDocumentUpdated, onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import ical from 'ical-generator';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const messaging = admin.messaging();

setGlobalOptions({ region: 'europe-west1' });

export const onTripDocumentUploaded = onDocumentUpdated('trips/{tripId}', async (event: any) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    interface TripDoc {
      id: string;
      name: string;
      url: string;
      uploadedAt: string;
      paymentStatus: string;
    }

    const beforeDocs: TripDoc[] = beforeData.documents || [];
    const afterDocs: TripDoc[] = afterData.documents || [];

    // Check if a new document was added
    if (afterDocs.length > beforeDocs.length) {
      const addedDocs = afterDocs.filter(
        (ad) => !beforeDocs.some((bd) => bd.id === ad.id)
      );

      if (addedDocs.length > 0) {
        let uploaderName = 'Unknown Uploader';
        if (afterData.coordinatorId) {
          const coordDoc = await db.collection('coordinators').doc(afterData.coordinatorId).get();
          if (coordDoc.exists) {
            const cData = coordDoc.data();
            uploaderName = `${cData?.name} ${cData?.surname}`;
          }
        }

        const adminDomain = process.env.ADMIN_DOMAIN || 'admin.travelhandling.com';
        const tripUrl = `https://${adminDomain}/admin/trips/${event.params.tripId}`;

        const adminIds = afterData.adminIds || [];
        if (adminIds.length > 0) {
          const tokens: string[] = [];
          for (const adminId of adminIds) {
            const adminDoc = await db.collection('admins').doc(adminId).get();
            const token = adminDoc.data()?.fcmToken;
            if (token) {
              tokens.push(token);
            }
          }

          if (tokens.length > 0) {
            await messaging.sendEachForMulticast({
              tokens,
              notification: {
                title: 'New Trip Document',
                body: `A new document has been uploaded for trip ${afterData.destination} (${afterData.code}) by ${uploaderName}.`,
              },
              webpush: {
                fcmOptions: {
                  link: tripUrl
                }
              }
            });
          }
        }
      }
    }
  });

export const onDocumentStatusChanged = onDocumentUpdated('trips/{tripId}', async (event: any) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    interface TripDoc {
      id: string;
      name: string;
      url: string;
      uploadedAt: string;
      paymentStatus: string;
    }

    const beforeDocs: TripDoc[] = beforeData.documents || [];
    const afterDocs: TripDoc[] = afterData.documents || [];

    let statusChangedToPaid = false;
    for (const ad of afterDocs) {
      const bd = beforeDocs.find((b) => b.id === ad.id);
      if (bd && bd.paymentStatus === 'TO_BE_PAID' && ad.paymentStatus === 'PAID') {
        statusChangedToPaid = true;
        break;
      }
    }

    if (statusChangedToPaid) {
      // Find all super admins
      const superAdminsSnapshot = await db.collection('admins').where('role', '==', 'SUPER_ADMIN').get();
      const tokens: string[] = [];
      superAdminsSnapshot.forEach((doc: any) => {
        const token = doc.data().fcmToken;
        if (token) {
          tokens.push(token);
        }
      });

      const adminDomain = process.env.ADMIN_DOMAIN || 'admin.travelhandling.com';
      const tripUrl = `https://${adminDomain}/admin/trips/${event.params.tripId}`;

      if (tokens.length > 0) {
        await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: 'Payment Completed',
            body: `A document for trip ${afterData.destination} has been paid.`,
          },
          webpush: {
            fcmOptions: {
              link: tripUrl
            }
          }
        });
      }
    }
  });

export const checkUpcomingTripsCron = onSchedule('every day 00:00', async (event: any) => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekIso = nextWeek.toISOString().split('T')[0];

  const tripsSnapshot = await db.collection('trips')
    .where('startDate', '==', nextWeekIso)
    .get();

  for (const doc of tripsSnapshot.docs) {
    const data = doc.data();
    const docs = data.documents || [];
    if (docs.length === 0) {
      let coordInfo = 'No coordinator assigned';
      if (data.coordinatorId) {
        const coordDoc = await db.collection('coordinators').doc(data.coordinatorId).get();
        if (coordDoc.exists) {
          const cData = coordDoc.data();
          coordInfo = `Name: ${cData?.name} ${cData?.surname}, Email: ${cData?.email}, Phone: ${cData?.phone}`;
        }
      }

      const adminDomain = process.env.ADMIN_DOMAIN || 'admin.travelhandling.com';
      const tripUrl = `https://${adminDomain}/admin/trips/${doc.id}`;

      const adminIds = data.adminIds || [];
      if (adminIds.length > 0) {
        const tokens: string[] = [];
        for (const adminId of adminIds) {
          const adminDoc = await db.collection('admins').doc(adminId).get();
          const token = adminDoc.data()?.fcmToken;
          if (token) {
            tokens.push(token);
          }
        }

        if (tokens.length > 0) {
          await messaging.sendEachForMulticast({
            tokens,
            notification: {
              title: 'Action Required: Missing Documents',
              body: `The trip ${data.destination} starts in exactly one week and has no documents uploaded!\\nCoordinator: ${coordInfo}`,
            },
            webpush: {
              fcmOptions: {
                link: tripUrl
              }
            }
          });
        }
      }
    }
  }
});

export const onTripCreated = onDocumentCreated('trips/{tripId}', async (event: any) => {
    const tripData = event.data?.data();
    if (!tripData || !tripData.startDate) return;
    
    // 1. Fetch Relational Data (Tour)
    let tourName = 'Unknown Tour';
    const tourId = tripData.tourId;
    if (tourId) {
      const tourDoc = await db.collection('tours').doc(tourId).get();
      if (tourDoc.exists) {
        tourName = tourDoc.data()?.tourName || 'Unknown Tour';
      }
    }

    // 2. Calculate 1 month prior to startDate
    const startDate = new Date(tripData.startDate);
    const reminderDate = new Date(startDate);
    reminderDate.setMonth(reminderDate.getMonth() - 1);
    
    // 3. Generate native calendar event
    const calendar = ical({ name: 'Trip Reminders', method: 'REQUEST' as any });
    const adminDomain = process.env.ADMIN_DOMAIN || 'admin.travelhandling.com';
    const tripUrl = `https://${adminDomain}/admin/trips/${event.params.tripId}`;
    
    calendar.createEvent({
      start: reminderDate,
      end: new Date(reminderDate.getTime() + 60 * 60 * 1000), // 1 hour event
      summary: `Reminder: Trip ${tourName} - ${tripData.destination} starts in 1 month`,
      description: `Tour Name: ${tourName}\\nDestination: ${tripData.destination}\\nTrip Code: ${tripData.code}\\nDates: ${tripData.startDate} to ${tripData.endDate}\\n\\nView in Admin: ${tripUrl}`,
      organizer: { name: 'Travel Admin', email: 'noreply@travelhandling.com' }
    });
    
    const icsContent = calendar.toString();
    
    // 4. Find SUPER_ADMIN emails
    const superAdminsSnapshot = await db.collection('admins').where('role', '==', 'SUPER_ADMIN').get();
    const emails: string[] = [];
    superAdminsSnapshot.forEach((doc: any) => {
      const email = doc.data().email;
      if (email) {
        emails.push(email);
      }
    });
    
    if (emails.length === 0) return;
    
    // 5. Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass',
      },
    });
    
    const htmlBody = `
      <h2>New Trip Created</h2>
      <p>A new trip has been created. Please review the details below:</p>
      <ul>
        <li><strong>Tour:</strong> ${tourName}</li>
        <li><strong>Destination:</strong> ${tripData.destination}</li>
        <li><strong>Trip Code:</strong> ${tripData.code}</li>
        <li><strong>Dates:</strong> ${tripData.startDate} to ${tripData.endDate}</li>
      </ul>
      <p><a href="${tripUrl}">View Trip in Admin Dashboard</a></p>
    `;

    await transporter.sendMail({
      from: '"Travel Admin" <noreply@travelhandling.com>',
      to: emails.join(', '),
      subject: `New Trip Created: ${tourName} - ${tripData.destination}`,
      html: htmlBody,
      icalEvent: {
        method: 'request',
        content: icsContent
      }
    });
  });

export const onTripDeleted = onDocumentDeleted('trips/{tripId}', async (event: any) => {
    const tripId = event.params.tripId;
    try {
      const bucket = admin.storage().bucket();
      await bucket.deleteFiles({
        prefix: `trips/${tripId}/documents/`
      });
      console.log(`Successfully deleted storage files for trip: ${tripId}`);
    } catch (error) {
      console.error(`Failed to delete storage files for trip: ${tripId}`, error);
    }
  });

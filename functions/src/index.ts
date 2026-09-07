import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import ical from 'ical-generator';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const messaging = admin.messaging();

export const onTripDocumentUploaded = functions.firestore
  .document('trips/{tripId}')
  .onUpdate(async (change: any, context: any) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

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
                body: `A new document has been uploaded for trip ${afterData.destination}.`,
              },
            });
          }
        }
      }
    }
  });

export const onDocumentStatusChanged = functions.firestore
  .document('trips/{tripId}')
  .onUpdate(async (change: any, context: any) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

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

      if (tokens.length > 0) {
        await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: 'Payment Completed',
            body: `A document for trip ${afterData.destination} has been paid.`,
          },
        });
      }
    }
  });

export const checkUpcomingTripsCron = functions.pubsub.schedule('every day 00:00').onRun(async (context: any) => {
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
              body: `The trip ${data.destination} starts in exactly one week and has no documents uploaded!`,
            },
          });
        }
      }
    }
  }
});

export const onTripCreated = functions.firestore
  .document('trips/{tripId}')
  .onCreate(async (snap: any, context: any) => {
    const tripData = snap.data();
    if (!tripData || !tripData.startDate) return;
    
    // 1. Calculate 1 month prior to startDate
    const startDate = new Date(tripData.startDate);
    const reminderDate = new Date(startDate);
    reminderDate.setMonth(reminderDate.getMonth() - 1);
    
    // 2. Generate .ics attachment
    const calendar = ical({ name: 'Trip Reminders' });
    calendar.createEvent({
      start: reminderDate,
      end: new Date(reminderDate.getTime() + 60 * 60 * 1000), // 1 hour event
      summary: `Reminder: Trip ${tripData.destination} starts in 1 month`,
      description: `Trip Code: ${tripData.code}\nDates: ${tripData.startDate} to ${tripData.endDate}`,
    });
    
    const icsContent = calendar.toString();
    
    // 3. Find SUPER_ADMIN emails
    const superAdminsSnapshot = await db.collection('admins').where('role', '==', 'SUPER_ADMIN').get();
    const emails: string[] = [];
    superAdminsSnapshot.forEach((doc: any) => {
      const email = doc.data().email;
      if (email) {
        emails.push(email);
      }
    });
    
    if (emails.length === 0) return;
    
    // 4. Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass',
      },
    });
    
    await transporter.sendMail({
      from: '"Travel Admin" <noreply@travelhandling.com>',
      to: emails.join(', '),
      subject: `New Trip Created: ${tripData.destination}`,
      text: `A new trip to ${tripData.destination} has been created. Attached is a calendar reminder for 1 month prior to the start date.`,
      attachments: [
        {
          filename: 'reminder.ics',
          content: icsContent,
          contentType: 'text/calendar'
        }
      ]
    });
  });

export const onTripDeleted = functions.firestore
  .document('trips/{tripId}')
  .onDelete(async (snap: any, context: any) => {
    const tripId = context.params.tripId;
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

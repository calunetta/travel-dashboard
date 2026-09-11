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

async function getAssignedAdminContactInfo(
  data: Record<string, any>
): Promise<{ tokens: string[]; emails: string[] }> {
  const adminIds: string[] = data.adminIds || [];
  const tokens: string[] = [];
  const emails: string[] = [];
  if (adminIds.length > 0) {
    for (const adminId of adminIds) {
      const adminDoc = await db.collection('admins').doc(adminId).get();
      if (adminDoc.exists) {
        const adminData = adminDoc.data();
        if (adminData?.fcmToken) tokens.push(adminData.fcmToken);
        if (adminData?.email) emails.push(adminData.email);
      }
    }
  }
  return { tokens, emails };
}

async function writeInAppNotifications(
  adminIds: string[],
  title: string,
  body: string,
  link: string
): Promise<void> {
  if (!adminIds || adminIds.length === 0) return;
  const batch = db.batch();
  for (const adminId of adminIds) {
    const docRef = db.collection('admins').doc(adminId).collection('notifications').doc();
    batch.set(docRef, {
      title,
      body,
      link,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  await batch.commit();
}

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

        const { tokens, emails } = await getAssignedAdminContactInfo(afterData);

        const title = 'New Trip Document';
        const body = `A new document has been uploaded for trip ${afterData.destination} (${afterData.code}) by ${uploaderName}.`;

        const adminIds = afterData.adminIds || [];
        if (adminIds.length > 0) {
          await writeInAppNotifications(adminIds, title, body, tripUrl);
        }

        if (tokens.length > 0) {
          await messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            webpush: {
              fcmOptions: { link: tripUrl }
            }
          });
        }

        if (emails.length > 0) {
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
            subject: `New Document Uploaded: ${afterData.destination} (${afterData.code})`,
            html: `<p>A new document has been uploaded for trip <strong>${afterData.destination}</strong> (${afterData.code}) by ${uploaderName}.</p><p><a href="${tripUrl}">View Trip in Admin Dashboard</a></p>`,
          });
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
      const { tokens } = await getAssignedAdminContactInfo(afterData);

      const adminDomain = process.env.ADMIN_DOMAIN || 'admin.travelhandling.com';
      const tripUrl = `https://${adminDomain}/admin/trips/${event.params.tripId}`;
      const title = 'Payment Completed';
      const body = `A document for trip ${afterData.destination} has been paid.`;

      const adminIds = afterData.adminIds || [];
      if (adminIds.length > 0) {
        await writeInAppNotifications(adminIds, title, body, tripUrl);
      }

      if (tokens.length > 0) {
        await messaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          webpush: {
            fcmOptions: { link: tripUrl }
          }
        });
      }
    }
  });

export const checkUpcomingTripsCron = onSchedule('every day 00:00', async (event: any) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  const threeMonths = new Date(today);
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  const threeMonthsIso = threeMonths.toISOString().split('T')[0];

  // Base query optimization: only fetch trips happening between tomorrow and exactly 3 months from now.
  const tripsSnapshot = await db.collection('trips')
    .where('startDate', '>=', tomorrowIso)
    .where('startDate', '<=', threeMonthsIso)
    .get();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
      pass: process.env.SMTP_PASS || 'ethereal.pass',
    },
  });

  const adminDomain = process.env.ADMIN_DOMAIN || 'admin.travelhandling.com';

  for (const doc of tripsSnapshot.docs) {
    const data = doc.data();
    const docs = data.documents || [];
    const startDate = data.startDate;

    const tripUrl = `https://${adminDomain}/admin/trips/${doc.id}`;
    
    // Exact dates for logic
    const tMinus7 = new Date(today);
    tMinus7.setDate(tMinus7.getDate() + 7);
    const tMinus7Iso = tMinus7.toISOString().split('T')[0];

    const next1To3DaysIso: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      next1To3DaysIso.push(d.toISOString().split('T')[0]);
    }

    const tMinus1Month = new Date(startDate);
    tMinus1Month.setMonth(tMinus1Month.getMonth() - 1);
    
    const tMinus2Months = new Date(startDate);
    tMinus2Months.setMonth(tMinus2Months.getMonth() - 2);

    const tMinus3Months = new Date(startDate);
    tMinus3Months.setMonth(tMinus3Months.getMonth() - 3);

    const todayIso = today.toISOString().split('T')[0];
    const isExactly3Months = todayIso === tMinus3Months.toISOString().split('T')[0];
    const isExactly2Months = todayIso === tMinus2Months.toISOString().split('T')[0];
    const isExactly1Month = todayIso === tMinus1Month.toISOString().split('T')[0];

    // 1. T-7: Missing Documents Alert to Admins (via Email + Push)
    if (startDate === tMinus7Iso && docs.length === 0) {
      const { tokens, emails } = await getAssignedAdminContactInfo(data);
      const title = 'URGENT: Missing Documents';
      const body = `Trip ${data.destination} starts in 7 days, but no documents have been uploaded yet.`;

      const adminIds = data.adminIds || [];
      if (adminIds.length > 0) {
        await writeInAppNotifications(adminIds, title, body, tripUrl);
      }

      if (emails.length > 0) {
        await transporter.sendMail({
          from: '"Travel Admin" <noreply@travelhandling.com>',
          to: emails.join(', '),
          subject: `URGENT: Missing Documents for Trip ${data.destination}`,
          html: `<p>Hi,</p><p>The trip to <strong>${data.destination}</strong> starts in 7 days, but no documents have been uploaded yet. Please upload them immediately.</p><p><a href="${tripUrl}">View Trip in Admin Dashboard</a></p>`,
        });
      }
      if (tokens.length > 0) {
        await messaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          webpush: { fcmOptions: { link: tripUrl } }
        });
      }
    }

    // 2. T-1 to T-3: Unpaid Documents Warning to Admins (via Push)
    if (next1To3DaysIso.includes(startDate)) {
      const hasUnpaidDocs = docs.some((d: any) => d.paymentStatus === 'TO_BE_PAID');
      if (hasUnpaidDocs) {
        const { tokens } = await getAssignedAdminContactInfo(data);
        const title = 'URGENT: Unpaid Documents';
        const body = `Trip ${data.destination} starts very soon but has unpaid documents!`;

        const adminIds = data.adminIds || [];
        if (adminIds.length > 0) {
          await writeInAppNotifications(adminIds, title, body, tripUrl);
        }

        if (tokens.length > 0) {
          await messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            webpush: {
              fcmOptions: { link: tripUrl }
            }
          });
        }
      }
    }

    // 3. New Hotel Verification Logic (Exactly 3, 2, and 1 month prior)
    if ((isExactly3Months || isExactly2Months || isExactly1Month) && data.hotelBookedBy) {
      const hotelAdminDoc = await db.collection('admins').doc(data.hotelBookedBy).get();
      if (hotelAdminDoc.exists) {
        const hotelAdmin = hotelAdminDoc.data();
        const hotelBookerName = `${hotelAdmin?.name || ''} ${hotelAdmin?.surname || ''}`.trim() || 'Unknown Admin';
        let hotelInfo = 'No hotel assigned.';
        if (data.hotelId) {
          const hotelDoc = await db.collection('hotels').doc(data.hotelId).get();
          if (hotelDoc.exists) {
            hotelInfo = hotelDoc.data()?.name || 'Unnamed Hotel';
          }
        }

        const { tokens, emails } = await getAssignedAdminContactInfo(data);
        const title = 'Hotel Verification Reminder';
        const body = `Please verify the booking for ${data.destination} at ${hotelInfo} (Booked by: ${hotelBookerName}).`;

        const adminIds = data.adminIds || [];
        if (adminIds.length > 0) {
          await writeInAppNotifications(adminIds, title, body, tripUrl);
        }

        if (emails.length > 0) {
          await transporter.sendMail({
            from: '"Travel Admin" <noreply@travelhandling.com>',
            to: emails.join(', '),
            subject: `Reminder: Double Check Hotel Booking for ${data.destination}`,
            html: `<p>Hi,</p>
                   <p>This is a reminder to double-check the hotel booking for the upcoming trip to <strong>${data.destination}</strong> (${data.code}).</p>
                   <p><strong>Hotel:</strong> ${hotelInfo}</p>
                   <p><strong>Booked By:</strong> ${hotelBookerName}</p>
                   <p><a href="${tripUrl}">View Trip</a></p>`,
          });
        }

        if (tokens.length > 0) {
          await messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            webpush: {
              fcmOptions: { link: tripUrl }
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
      id: `trip-reminder-${event.params.tripId}@travelhandling.com`,
      start: reminderDate,
      end: new Date(reminderDate.getTime() + 60 * 60 * 1000), // 1 hour event
      summary: `Reminder: Trip ${tourName} - ${tripData.destination} starts in 1 month`,
      description: `Tour Name: ${tourName}\\nDestination: ${tripData.destination}\\nTrip Code: ${tripData.code}\\nDates: ${tripData.startDate} to ${tripData.endDate}\\n\\nView in Admin: ${tripUrl}`,
      organizer: { name: 'Travel Admin', email: 'noreply@travelhandling.com' }
    });
    
    const icsContent = calendar.toString();
    
    // 4. Find Assigned Admins emails and push tokens
    const { emails, tokens } = await getAssignedAdminContactInfo(tripData);
    
    if (emails.length === 0 && tokens.length === 0) return;
    
    const adminIds = tripData.adminIds || [];
    const title = 'New Trip Created';
    const body = `A new trip to ${tripData.destination} (${tripData.code}) has been added.`;

    // 5. In-App Notifications
    if (adminIds.length > 0) {
      await writeInAppNotifications(adminIds, title, body, tripUrl);
    }

    // 6. Push Notifications
    if (tokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: {
          fcmOptions: { link: tripUrl }
        }
      });
    }
    
    // 7. Send email
    if (emails.length > 0) {
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
    }
  });

export const onTripDeleted = onDocumentDeleted('trips/{tripId}', async (event: any) => {
    const tripId = event.params.tripId;
    const tripData = event.data?.data();

    try {
      const bucket = admin.storage().bucket();
      await bucket.deleteFiles({
        prefix: `trips/${tripId}/documents/`
      });
      console.log(`Successfully deleted storage files for trip: ${tripId}`);
    } catch (error) {
      console.error(`Failed to delete storage files for trip: ${tripId}`, error);
    }

    // Cancel Calendar Meeting
    if (tripData && tripData.startDate) {
      const { emails } = await getAssignedAdminContactInfo(tripData);
      
      if (emails.length > 0) {
        let tourName = 'Unknown Tour';
        const tourId = tripData.tourId;
        if (tourId) {
          const tourDoc = await db.collection('tours').doc(tourId).get();
          if (tourDoc.exists) {
            tourName = tourDoc.data()?.tourName || 'Unknown Tour';
          }
        }

        const startDate = new Date(tripData.startDate);
        const reminderDate = new Date(startDate);
        reminderDate.setMonth(reminderDate.getMonth() - 1);

        const calendar = ical({ name: 'Trip Reminders', method: 'CANCEL' as any });
        calendar.createEvent({
          id: `trip-reminder-${tripId}@travelhandling.com`,
          start: reminderDate,
          end: new Date(reminderDate.getTime() + 60 * 60 * 1000),
          summary: `CANCELED: Reminder: Trip ${tourName} - ${tripData.destination} starts in 1 month`,
          description: `This trip has been deleted.`,
          organizer: { name: 'Travel Admin', email: 'noreply@travelhandling.com' },
          status: 'cancelled' as any
        });

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
          subject: `Trip Canceled: ${tourName} - ${tripData.destination}`,
          html: `<p>The trip to ${tripData.destination} (${tripData.code}) has been deleted. The calendar reminder has been canceled.</p>`,
          icalEvent: {
            method: 'cancel',
            content: calendar.toString()
          }
        });
      }
    }
  });

export const onAssignmentCreated = onDocumentCreated('trips/{tripId}/assignments/{assignmentId}', async (event: any) => {
  const assignmentData = event.data?.data();
  if (!assignmentData || assignmentData.assignmentType !== 'AUTOMATIC') return;

  const tripId = event.params.tripId;
  const coordinatorId = assignmentData.coordinatorId;
  if (!coordinatorId) return;

  // Fetch coordinator
  const coordDoc = await db.collection('coordinators').doc(coordinatorId).get();
  if (!coordDoc.exists) return;
  const cData = coordDoc.data();
  if (!cData?.email) return;

  // Fetch trip
  const tripDoc = await db.collection('trips').doc(tripId).get();
  if (!tripDoc.exists) return;
  const tData = tripDoc.data();

  // Send Match Confirmation Email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
      pass: process.env.SMTP_PASS || 'ethereal.pass',
    },
  });

  const htmlBody = `
    <h2>Match Confirmation!</h2>
    <p>Hi ${cData.name},</p>
    <p>Great news! You have been automatically assigned to the trip <strong>${tData?.destination}</strong> (${tData?.code}).</p>
    <p>Dates: ${tData?.startDate} to ${tData?.endDate}</p>
    <p>Please log in to your dashboard to review the details and start uploading your documents.</p>
  `;

  await transporter.sendMail({
    from: '"Travel Admin" <noreply@travelhandling.com>',
    to: cData.email,
    subject: `Trip Match Confirmation: ${tData?.destination}`,
    html: htmlBody,
  });
});

export const deleteOldNotificationsCron = onSchedule('every day 02:00', async (event: any) => {
  const adminsSnapshot = await db.collection('admins').get();
  
  const now = Date.now();
  const thirtyDaysAgoMillis = now - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgoMillis = now - 7 * 24 * 60 * 60 * 1000;

  let deletedCount = 0;

  for (const adminDoc of adminsSnapshot.docs) {
    const notificationsRef = adminDoc.ref.collection('notifications');
    const snapshot = await notificationsRef.get();
    
    if (snapshot.docs.length === 0) continue;

    const batch = db.batch();
    let opsInBatch = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAtMillis = data.createdAt?.toMillis() || 0;
      
      const isOlderThan30Days = createdAtMillis < thirtyDaysAgoMillis;
      const isReadAndOlderThan7Days = data.read === true && createdAtMillis < sevenDaysAgoMillis;

      if (isOlderThan30Days || isReadAndOlderThan7Days) {
        batch.delete(doc.ref);
        opsInBatch++;
      }
    });

    if (opsInBatch > 0) {
      await batch.commit();
      deletedCount += opsInBatch;
    }
  }
  console.log(`Deleted ${deletedCount} old in-app notifications.`);
});

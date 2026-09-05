import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

export const onTripDocumentUploaded = functions.firestore
  .document('trips/{tripId}')
  .onUpdate(async (change, context) => {
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
  .onUpdate(async (change, context) => {
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
      superAdminsSnapshot.forEach(doc => {
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

export const checkUpcomingTripsCron = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
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

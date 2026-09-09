"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAssignmentCreated = exports.onTripDeleted = exports.onTripCreated = exports.checkUpcomingTripsCron = exports.onDocumentStatusChanged = exports.onTripDocumentUploaded = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
const ical_generator_1 = __importDefault(require("ical-generator"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const messaging = admin.messaging();
(0, v2_1.setGlobalOptions)({ region: 'europe-west1' });
exports.onTripDocumentUploaded = (0, firestore_1.onDocumentUpdated)('trips/{tripId}', async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const beforeDocs = beforeData.documents || [];
    const afterDocs = afterData.documents || [];
    // Check if a new document was added
    if (afterDocs.length > beforeDocs.length) {
        const addedDocs = afterDocs.filter((ad) => !beforeDocs.some((bd) => bd.id === ad.id));
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
                const tokens = [];
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
exports.onDocumentStatusChanged = (0, firestore_1.onDocumentUpdated)('trips/{tripId}', async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    const beforeDocs = beforeData.documents || [];
    const afterDocs = afterData.documents || [];
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
        const tokens = [];
        superAdminsSnapshot.forEach((doc) => {
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
exports.checkUpcomingTripsCron = (0, scheduler_1.onSchedule)('every day 00:00', async (event) => {
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
        const next1To3DaysIso = [];
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
        // Helper to get tokens and emails for assigned admins
        const getAssignedAdminContactInfo = async () => {
            const adminIds = data.adminIds || [];
            const tokens = [];
            const emails = [];
            if (adminIds.length > 0) {
                for (const adminId of adminIds) {
                    const adminDoc = await db.collection('admins').doc(adminId).get();
                    if (adminDoc.exists) {
                        const adminData = adminDoc.data();
                        if (adminData?.fcmToken)
                            tokens.push(adminData.fcmToken);
                        if (adminData?.email)
                            emails.push(adminData.email);
                    }
                }
            }
            return { tokens, emails };
        };
        // 1. T-7: Missing Documents Alert to Coordinator (via Email)
        if (startDate === tMinus7Iso && docs.length === 0) {
            if (data.coordinatorId) {
                const coordDoc = await db.collection('coordinators').doc(data.coordinatorId).get();
                if (coordDoc.exists) {
                    const cData = coordDoc.data();
                    if (cData?.email) {
                        await transporter.sendMail({
                            from: '"Travel Admin" <noreply@travelhandling.com>',
                            to: cData.email,
                            subject: `URGENT: Missing Documents for Trip ${data.destination}`,
                            html: `<p>Hi ${cData.name},</p><p>Your trip to <strong>${data.destination}</strong> starts in 7 days, but no documents have been uploaded yet. Please upload them immediately.</p>`,
                        });
                    }
                }
            }
        }
        // 2. T-1 to T-3: Unpaid Documents Warning to Admins (via Push)
        if (next1To3DaysIso.includes(startDate)) {
            const hasUnpaidDocs = docs.some((d) => d.paymentStatus === 'TO_BE_PAID');
            if (hasUnpaidDocs) {
                const { tokens } = await getAssignedAdminContactInfo();
                if (tokens.length > 0) {
                    await messaging.sendEachForMulticast({
                        tokens,
                        notification: {
                            title: 'URGENT: Unpaid Documents',
                            body: `Trip ${data.destination} starts very soon but has unpaid documents!`,
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
        // 3. New Hotel Verification Logic (Exactly 3, 2, and 1 month prior)
        if ((isExactly3Months || isExactly2Months || isExactly1Month) && data.hotelBookedBy) {
            const hotelAdminDoc = await db.collection('admins').doc(data.hotelBookedBy).get();
            if (hotelAdminDoc.exists) {
                const hotelAdmin = hotelAdminDoc.data();
                let hotelInfo = 'No hotel assigned.';
                if (data.hotelId) {
                    const hotelDoc = await db.collection('hotels').doc(data.hotelId).get();
                    if (hotelDoc.exists) {
                        hotelInfo = hotelDoc.data()?.name || 'Unnamed Hotel';
                    }
                }
                if (hotelAdmin?.email) {
                    await transporter.sendMail({
                        from: '"Travel Admin" <noreply@travelhandling.com>',
                        to: hotelAdmin.email,
                        subject: `Reminder: Double Check Hotel Booking for ${data.destination}`,
                        html: `<p>Hi,</p>
                   <p>This is a reminder to double-check the hotel booking for the upcoming trip to <strong>${data.destination}</strong> (${data.code}).</p>
                   <p><strong>Hotel:</strong> ${hotelInfo}</p>
                   <p><a href="${tripUrl}">View Trip</a></p>`,
                    });
                }
                if (hotelAdmin?.fcmToken) {
                    await messaging.send({
                        token: hotelAdmin.fcmToken,
                        notification: {
                            title: 'Hotel Verification Reminder',
                            body: `Please verify the booking for ${data.destination} at ${hotelInfo}.`,
                        },
                        webpush: {
                            fcmOptions: { link: tripUrl }
                        }
                    });
                }
            }
        }
    }
});
exports.onTripCreated = (0, firestore_1.onDocumentCreated)('trips/{tripId}', async (event) => {
    const tripData = event.data?.data();
    if (!tripData || !tripData.startDate)
        return;
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
    const calendar = (0, ical_generator_1.default)({ name: 'Trip Reminders', method: 'REQUEST' });
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
    const emails = [];
    superAdminsSnapshot.forEach((doc) => {
        const email = doc.data().email;
        if (email) {
            emails.push(email);
        }
    });
    if (emails.length === 0)
        return;
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
exports.onTripDeleted = (0, firestore_1.onDocumentDeleted)('trips/{tripId}', async (event) => {
    const tripId = event.params.tripId;
    try {
        const bucket = admin.storage().bucket();
        await bucket.deleteFiles({
            prefix: `trips/${tripId}/documents/`
        });
        console.log(`Successfully deleted storage files for trip: ${tripId}`);
    }
    catch (error) {
        console.error(`Failed to delete storage files for trip: ${tripId}`, error);
    }
});
exports.onAssignmentCreated = (0, firestore_1.onDocumentCreated)('trips/{tripId}/assignments/{assignmentId}', async (event) => {
    const assignmentData = event.data?.data();
    if (!assignmentData || assignmentData.assignmentType !== 'AUTOMATIC')
        return;
    const tripId = event.params.tripId;
    const coordinatorId = assignmentData.coordinatorId;
    if (!coordinatorId)
        return;
    // Fetch coordinator
    const coordDoc = await db.collection('coordinators').doc(coordinatorId).get();
    if (!coordDoc.exists)
        return;
    const cData = coordDoc.data();
    if (!cData?.email)
        return;
    // Fetch trip
    const tripDoc = await db.collection('trips').doc(tripId).get();
    if (!tripDoc.exists)
        return;
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
//# sourceMappingURL=index.js.map
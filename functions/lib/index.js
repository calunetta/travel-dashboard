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
exports.onTripCreated = exports.checkUpcomingTripsCron = exports.onDocumentStatusChanged = exports.onTripDocumentUploaded = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
const ical_generator_1 = __importDefault(require("ical-generator"));
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
exports.onTripDocumentUploaded = functions.firestore
    .document('trips/{tripId}')
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const beforeDocs = beforeData.documents || [];
    const afterDocs = afterData.documents || [];
    // Check if a new document was added
    if (afterDocs.length > beforeDocs.length) {
        const addedDocs = afterDocs.filter((ad) => !beforeDocs.some((bd) => bd.id === ad.id));
        if (addedDocs.length > 0) {
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
                            body: `A new document has been uploaded for trip ${afterData.destination}.`,
                        },
                    });
                }
            }
        }
    }
});
exports.onDocumentStatusChanged = functions.firestore
    .document('trips/{tripId}')
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
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
exports.checkUpcomingTripsCron = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
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
                            title: 'Action Required: Missing Documents',
                            body: `The trip ${data.destination} starts in exactly one week and has no documents uploaded!`,
                        },
                    });
                }
            }
        }
    }
});
exports.onTripCreated = functions.firestore
    .document('trips/{tripId}')
    .onCreate(async (snap, context) => {
    const tripData = snap.data();
    if (!tripData || !tripData.startDate)
        return;
    // 1. Calculate 1 month prior to startDate
    const startDate = new Date(tripData.startDate);
    const reminderDate = new Date(startDate);
    reminderDate.setMonth(reminderDate.getMonth() - 1);
    // 2. Generate .ics attachment
    const calendar = (0, ical_generator_1.default)({ name: 'Trip Reminders' });
    calendar.createEvent({
        start: reminderDate,
        end: new Date(reminderDate.getTime() + 60 * 60 * 1000), // 1 hour event
        summary: `Reminder: Trip ${tripData.destination} starts in 1 month`,
        description: `Trip Code: ${tripData.code}\nDates: ${tripData.startDate} to ${tripData.endDate}`,
    });
    const icsContent = calendar.toString();
    // 3. Find SUPER_ADMIN emails
    const superAdminsSnapshot = await db.collection('admins').where('role', '==', 'SUPER_ADMIN').get();
    const emails = [];
    superAdminsSnapshot.forEach(doc => {
        const email = doc.data().email;
        if (email) {
            emails.push(email);
        }
    });
    if (emails.length === 0)
        return;
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
//# sourceMappingURL=index.js.map
"use strict";
// Test file for Firebase Functions
Object.defineProperty(exports, "__esModule", { value: true });
const dbGetMock = jest.fn();
const dbWhereMock = jest.fn().mockReturnThis();
const dbDocGetMock = jest.fn();
const sendEachForMulticastMock = jest.fn();
const deleteFilesMock = jest.fn();
jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: jest.fn(),
    firestore: jest.fn(() => ({
        collection: jest.fn((colName) => {
            return {
                doc: jest.fn(() => ({ get: dbDocGetMock })),
                where: dbWhereMock,
                get: dbGetMock,
            };
        })
    })),
    messaging: jest.fn(() => ({
        sendEachForMulticast: sendEachForMulticastMock,
    })),
    storage: jest.fn(() => ({
        bucket: jest.fn(() => ({
            deleteFiles: deleteFilesMock,
        })),
    })),
}));
const sendMailMock = jest.fn().mockResolvedValue(true);
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: sendMailMock,
    })),
}));
// Import our functions AFTER mocking
const index_1 = require("./index");
// We wrap them manually to test them without the complex firebase-functions-test snapshot generator
beforeEach(() => {
    jest.clearAllMocks();
});
describe('onTripDocumentUploaded', () => {
    it('should not send notification if no new documents are added', async () => {
        const beforeSnap = { data: () => ({ documents: [{ id: 'doc1' }] }) };
        const afterSnap = { data: () => ({ documents: [{ id: 'doc1' }] }) };
        const change = { before: beforeSnap, after: afterSnap };
        await index_1.onTripDocumentUploaded.run({ data: change, params: { tripId: '123' } });
        expect(sendEachForMulticastMock).not.toHaveBeenCalled();
    });
    it('should send notification to admins if a new document is added', async () => {
        const beforeSnap = { data: () => ({ documents: [] }) };
        const afterSnap = {
            data: () => ({
                destination: 'Japan',
                code: 'JP-2026',
                coordinatorId: 'coord123',
                documents: [{ id: 'doc1' }],
                adminIds: ['admin1']
            })
        };
        const change = { before: beforeSnap, after: afterSnap };
        dbDocGetMock
            .mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Mario', surname: 'Rossi' }) })
            .mockResolvedValueOnce({ data: () => ({ fcmToken: 'token123' }) });
        await index_1.onTripDocumentUploaded.run({ data: change, params: { tripId: '123' } });
        expect(sendEachForMulticastMock).toHaveBeenCalledWith(expect.objectContaining({
            tokens: ['token123'],
            notification: expect.objectContaining({
                title: 'New Trip Document',
                body: expect.stringContaining('Mario Rossi')
            }),
            webpush: expect.objectContaining({
                fcmOptions: {
                    link: expect.stringContaining('/admin/trips/123')
                }
            })
        }));
    });
});
describe('onDocumentStatusChanged', () => {
    it('should not notify if document status does not change to PAID', async () => {
        const beforeSnap = { data: () => ({ documents: [{ id: 'doc1', paymentStatus: 'TO_BE_PAID' }] }) };
        const afterSnap = { data: () => ({ documents: [{ id: 'doc1', paymentStatus: 'TO_BE_PAID' }] }) };
        const change = { before: beforeSnap, after: afterSnap };
        await index_1.onDocumentStatusChanged.run({ data: change, params: { tripId: '123' } });
        expect(sendEachForMulticastMock).not.toHaveBeenCalled();
    });
    it('should notify SUPER_ADMINs if document status changes to PAID', async () => {
        const beforeSnap = { data: () => ({ documents: [{ id: 'doc1', paymentStatus: 'TO_BE_PAID' }] }) };
        const afterSnap = {
            data: () => ({
                destination: 'Japan',
                documents: [{ id: 'doc1', paymentStatus: 'PAID' }]
            })
        };
        const change = { before: beforeSnap, after: afterSnap };
        dbGetMock.mockResolvedValue([{ data: () => ({ fcmToken: 'superToken1' }) }]);
        await index_1.onDocumentStatusChanged.run({ data: change, params: { tripId: '123' } });
        expect(sendEachForMulticastMock).toHaveBeenCalledWith(expect.objectContaining({
            tokens: ['superToken1'],
            notification: expect.objectContaining({
                title: 'Payment Completed'
            }),
            webpush: expect.objectContaining({
                fcmOptions: {
                    link: expect.stringContaining('/admin/trips/123')
                }
            })
        }));
    });
});
describe('onTripCreated', () => {
    it('should send an email with an icalEvent attachment to SUPER_ADMINs', async () => {
        const snap = {
            data: () => ({
                tourId: 'tour123',
                destination: 'Japan',
                code: 'JP-2026',
                startDate: '2026-10-01',
                endDate: '2026-10-15'
            })
        };
        // Mock the get() call to return super admin, and also the tour fetch
        dbDocGetMock.mockResolvedValueOnce({ exists: true, data: () => ({ tourName: 'Awesome Japan Tour' }) }); // Tour mock
        dbGetMock.mockResolvedValueOnce([{ data: () => ({ email: 'super@example.com' }) }]); // Admin mock
        await index_1.onTripCreated.run({ data: snap, params: { tripId: 'trip_123' } });
        expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
            to: 'super@example.com',
            subject: 'New Trip Created: Awesome Japan Tour - Japan',
            html: expect.stringContaining('Awesome Japan Tour'),
            icalEvent: expect.objectContaining({
                method: 'request',
                content: expect.any(String)
            })
        }));
    });
});
describe('checkUpcomingTripsCron', () => {
    it('should notify admins if a trip starts in 7 days and has no documents', async () => {
        const tripsSnapshot = {
            docs: [
                {
                    id: 'trip123',
                    data: () => ({
                        destination: 'Japan',
                        documents: [],
                        coordinatorId: 'coord456',
                        adminIds: ['admin1']
                    })
                }
            ]
        };
        dbGetMock.mockResolvedValue(tripsSnapshot);
        dbDocGetMock
            .mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Luigi', surname: 'Verdi' }) })
            .mockResolvedValueOnce({ data: () => ({ fcmToken: 'adminToken1' }) });
        await index_1.checkUpcomingTripsCron.run({ data: {} });
        expect(sendEachForMulticastMock).toHaveBeenCalledWith(expect.objectContaining({
            tokens: ['adminToken1'],
            notification: expect.objectContaining({
                title: 'Action Required: Missing Documents',
                body: expect.stringContaining('Luigi Verdi')
            }),
            webpush: expect.objectContaining({
                fcmOptions: {
                    link: expect.stringContaining('/admin/trips/trip123')
                }
            })
        }));
    });
});
describe('onTripDeleted', () => {
    it('should delete files from storage', async () => {
        const snap = { data: () => ({}) };
        await index_1.onTripDeleted.run({ data: snap, params: { tripId: '123' } });
        expect(deleteFilesMock).toHaveBeenCalledWith({
            prefix: 'trips/123/documents/'
        });
    });
});
//# sourceMappingURL=index.spec.js.map
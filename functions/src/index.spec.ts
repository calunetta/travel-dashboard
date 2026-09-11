// Test file for Firebase Functions

const dbGetMock = jest.fn();
const dbWhereMock = jest.fn().mockReturnThis();
const dbDocGetMock = jest.fn();
const sendEachForMulticastMock = jest.fn();
const sendMock = jest.fn();
const deleteFilesMock = jest.fn();

const batchSetMock = jest.fn();
const batchDeleteMock = jest.fn();
const batchCommitMock = jest.fn().mockResolvedValue(true);
const batchMock = jest.fn(() => ({
  set: batchSetMock,
  delete: batchDeleteMock,
  commit: batchCommitMock,
}));

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(() => ({
    collection: jest.fn((_colName) => {
      const docMock = jest.fn(() => ({
        get: dbDocGetMock,
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({ id: 'mocked-doc-id', ref: 'mocked-ref' })),
          get: dbGetMock,
          where: dbWhereMock
        })),
        ref: {
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({ id: 'mocked-doc-id', ref: 'mocked-ref' })),
            get: dbGetMock,
            where: dbWhereMock
          }))
        }
      }));
      return {
        doc: docMock,
        where: dbWhereMock,
        get: dbGetMock,
      };
    }),
    batch: batchMock,
  })), {
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mocked-timestamp'),
    },
    Timestamp: {
      fromMillis: jest.fn((millis) => ({
        toMillis: () => millis
      })),
    }
  }),
  messaging: jest.fn(() => ({
    sendEachForMulticast: sendEachForMulticastMock,
    send: sendMock,
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
import {
  onTripDocumentUploaded,
  onDocumentStatusChanged,
  checkUpcomingTripsCron,
  onTripCreated,
  onTripDeleted,
  deleteOldNotificationsCron,
} from './index';

// We wrap them manually to test them without the complex firebase-functions-test snapshot generator

  beforeEach(() => {
    jest.clearAllMocks();
    dbGetMock.mockReset();
    dbDocGetMock.mockReset();
    sendEachForMulticastMock.mockReset();
    sendMock.mockReset();
    deleteFilesMock.mockReset();
    sendMailMock.mockReset();
    batchSetMock.mockReset();
    batchDeleteMock.mockReset();
    batchCommitMock.mockReset();
    batchMock.mockClear();
    
    dbWhereMock.mockReset();
    dbWhereMock.mockReturnThis();
  });

  describe('onTripDocumentUploaded', () => {
    it('should not send notification if no new documents are added', async () => {
      const beforeSnap = { data: () => ({ documents: [{ id: 'doc1' }] }) };
      const afterSnap = { data: () => ({ documents: [{ id: 'doc1' }] }) };
      const change = { before: beforeSnap, after: afterSnap };
      
      await onTripDocumentUploaded.run({ data: change, params: { tripId: '123' } } as any);
      expect(sendEachForMulticastMock).not.toHaveBeenCalled();
    });

    it('should send notification and email to admins if a new document is added', async () => {
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
        .mockResolvedValueOnce({ exists: true, data: () => ({ fcmToken: 'token123', email: 'admin@test.com' }) });
      
      await onTripDocumentUploaded.run({ data: change, params: { tripId: '123' } } as any);
      
      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['token123'],
          notification: expect.objectContaining({
            title: 'New Trip Document',
            body: expect.stringContaining('Mario Rossi')
          }),
          data: expect.objectContaining({
            link: expect.stringContaining('/admin/trips/123'),
            url: expect.stringContaining('/admin/trips/123'),
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }),
          webpush: expect.objectContaining({
            fcmOptions: {
              link: expect.stringContaining('/admin/trips/123')
            }
          })
        })
      );

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@test.com',
          subject: 'New Document Uploaded: Japan (JP-2026)'
        })
      );
      
      expect(batchSetMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'New Trip Document',
          body: expect.stringContaining('Mario Rossi'),
          read: false,
        })
      );
    });
  });

  describe('onDocumentStatusChanged', () => {
    it('should not notify if document status does not change to PAID', async () => {
      const beforeSnap = { data: () => ({ documents: [{ id: 'doc1', paymentStatus: 'TO_BE_PAID' }] }) };
      const afterSnap = { data: () => ({ documents: [{ id: 'doc1', paymentStatus: 'TO_BE_PAID' }] }) };
      const change = { before: beforeSnap, after: afterSnap };
      
      await onDocumentStatusChanged.run({ data: change, params: { tripId: '123' } } as any);
      expect(sendEachForMulticastMock).not.toHaveBeenCalled();
    });

    it('should notify adminIds if document status changes to PAID', async () => {
      const beforeSnap = { data: () => ({ documents: [{ id: 'doc1', paymentStatus: 'TO_BE_PAID' }] }) };
      const afterSnap = { 
        data: () => ({ 
          destination: 'Japan',
          documents: [{ id: 'doc1', paymentStatus: 'PAID' }],
          adminIds: ['admin1']
        }) 
      };
      const change = { before: beforeSnap, after: afterSnap };
      
      dbDocGetMock.mockResolvedValueOnce({ exists: true, data: () => ({ fcmToken: 'adminToken1' }) });
      
      await onDocumentStatusChanged.run({ data: change, params: { tripId: '123' } } as any);

      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['adminToken1'],
          notification: expect.objectContaining({
            title: 'Payment Completed'
          }),
          data: expect.objectContaining({
            link: expect.stringContaining('/admin/trips/123'),
            url: expect.stringContaining('/admin/trips/123'),
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }),
          webpush: expect.objectContaining({
            fcmOptions: {
              link: expect.stringContaining('/admin/trips/123')
            }
          })
        })
      );

      expect(batchSetMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Payment Completed',
          read: false,
        })
      );
    });
  });

  describe('onTripCreated', () => {
    it('should send an email with an icalEvent attachment to assigned admins', async () => {
      const snap = { 
        data: () => ({ 
          tourId: 'tour123',
          destination: 'Japan',
          code: 'JP-2026',
          startDate: '2026-10-01',
          endDate: '2026-10-15',
          adminIds: ['admin1']
        }) 
      };

      dbDocGetMock
        .mockResolvedValueOnce({ exists: true, data: () => ({ tourName: 'Awesome Japan Tour' }) }) // Tour mock
        .mockResolvedValueOnce({ exists: true, data: () => ({ email: 'admin@example.com' }) }); // Admin mock
      
      await onTripCreated.run({ data: snap, params: { tripId: 'trip_123' } } as any);

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: 'New Trip Created: Awesome Japan Tour - Japan',
          html: expect.stringContaining('Awesome Japan Tour'),
          icalEvent: expect.objectContaining({
            method: 'request',
            content: expect.any(String)
          })
        })
      );
    });
  });

  describe('checkUpcomingTripsCron', () => {
    // ── Helper: build the snapshot the cron receives from Firestore ──────────

    /**
     * Builds a trip snapshot for the cron job.
     * startDate defaults to a date exactly 7 days from today (T-7 window).
     */
    function buildTripSnapshotWithDate(startDate: string, overrides: Record<string, unknown> = {}) {
      return {
        docs: [
          {
            id: 'trip123',
            data: () => ({
              destination: 'Japan',
              documents: [],
              coordinatorId: 'coord456',
              adminIds: ['admin1'],
              startDate,
              ...overrides,
            }),
          },
        ],
      };
    }

    it('should query Firestore using a date-range window (tomorrow to +3 months)', async () => {
      // The cron calls .where().where().get() — verify the two where constraints are applied
      dbWhereMock.mockReturnThis();
      dbGetMock.mockResolvedValue({ docs: [] });

      await checkUpcomingTripsCron.run({ data: {} } as any);

      // dbWhereMock should have been called at least twice: startDate >= and startDate <=
      expect(dbWhereMock).toHaveBeenCalledWith('startDate', '>=', expect.any(String));
      expect(dbWhereMock).toHaveBeenCalledWith('startDate', '<=', expect.any(String));
    });

    it('should send a missing-documents email and push to assigned admins when trip starts in 7 days with no docs', async () => {
      // Compute the date exactly 7 days from now
      const date7DaysFromNow = new Date();
      date7DaysFromNow.setDate(date7DaysFromNow.getDate() + 7);
      const startDate = date7DaysFromNow.toISOString().split('T')[0];

      dbWhereMock.mockReturnThis();
      dbGetMock.mockResolvedValue(buildTripSnapshotWithDate(startDate));
      dbDocGetMock
        .mockResolvedValueOnce({ exists: true, data: () => ({ fcmToken: 'adminToken', email: 'admin@test.com' }) }); // admin

      await checkUpcomingTripsCron.run({ data: {} } as any);

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@test.com',
          subject: expect.stringContaining('URGENT: Missing Documents'),
          html: expect.stringContaining('starts in 7 days')
        })
      );
      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['adminToken'],
          notification: expect.objectContaining({
            title: 'URGENT: Missing Documents',
          }),
          data: expect.objectContaining({
            link: expect.stringContaining('/admin/trips/trip123'),
            url: expect.stringContaining('/admin/trips/trip123'),
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }),
        })
      );

      expect(batchSetMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'URGENT: Missing Documents',
          read: false,
        })
      );
    });

    it('should send unpaid-documents push to assigned admins when trip is 1-3 days away', async () => {
      // Use a date 2 days from now (within the T-1 to T-3 window)
      const date2DaysFromNow = new Date();
      date2DaysFromNow.setDate(date2DaysFromNow.getDate() + 2);
      const startDate = date2DaysFromNow.toISOString().split('T')[0];

      dbWhereMock.mockReturnThis();
      dbGetMock.mockResolvedValue(
        buildTripSnapshotWithDate(startDate, {
          documents: [{ id: 'doc1', paymentStatus: 'TO_BE_PAID' }],
        })
      );
      dbDocGetMock.mockResolvedValueOnce({
        exists: true,
        data: () => ({ fcmToken: 'urgentToken', email: 'admin@test.com' }),
      });

      await checkUpcomingTripsCron.run({ data: {} } as any);

      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['urgentToken'],
          notification: expect.objectContaining({
            title: 'URGENT: Unpaid Documents',
            body: expect.stringContaining('Japan'),
          }),
          data: expect.objectContaining({
            link: expect.stringContaining('/admin/trips/trip123'),
            url: expect.stringContaining('/admin/trips/trip123'),
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }),
        })
      );

      expect(batchSetMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'URGENT: Unpaid Documents',
          read: false,
        })
      );
    });

    it('should send hotel verification email and push to assigned admins when hotelBookedBy is set at exactly 1 month prior', async () => {
      // Build a startDate exactly 1 month from today
      const startDate1Month = new Date();
      startDate1Month.setMonth(startDate1Month.getMonth() + 1);
      const startDate = startDate1Month.toISOString().split('T')[0];

      dbGetMock.mockResolvedValue(
        buildTripSnapshotWithDate(startDate, {
          documents: [],
          hotelBookedBy: 'hotelAdmin1',
          hotelId: 'hotel1',
          code: 'JP-001',
          adminIds: ['admin1']
        })
      );

      dbDocGetMock
        // hotelBookedBy admin doc
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ name: 'Hotel', surname: 'Booker' }),
        })
        // hotel doc
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ name: 'Grand Hyatt Tokyo' }),
        })
        // admin1 doc
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ fcmToken: 'adminToken', email: 'admin@test.com' }),
        });

      await checkUpcomingTripsCron.run({ data: {} } as any);

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@test.com',
          subject: expect.stringContaining('Reminder: Double Check Hotel Booking'),
          html: expect.stringContaining('Grand Hyatt Tokyo'),
        })
      );
      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['adminToken'],
          notification: expect.objectContaining({
            title: 'Hotel Verification Reminder',
            body: expect.stringContaining('Hotel Booker'),
          }),
          data: expect.objectContaining({
            link: expect.stringContaining('/admin/trips/trip123'),
            url: expect.stringContaining('/admin/trips/trip123'),
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }),
        })
      );

      expect(batchSetMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Hotel Verification Reminder',
          read: false,
        })
      );
    });

    it('should NOT send hotel verification when hotelBookedBy is not set', async () => {
      const startDate1Month = new Date();
      startDate1Month.setMonth(startDate1Month.getMonth() + 1);
      const startDate = startDate1Month.toISOString().split('T')[0];

      dbGetMock.mockResolvedValue(
        buildTripSnapshotWithDate(startDate, {
          documents: [],
          // No hotelBookedBy
          code: 'JP-001',
        })
      );

      await checkUpcomingTripsCron.run({ data: {} } as any);

      expect(sendMock).not.toHaveBeenCalled();
      expect(sendEachForMulticastMock).not.toHaveBeenCalled();
      expect(sendMailMock).not.toHaveBeenCalled();
    });
  });

  describe('onTripDeleted', () => {
    it('should delete files from storage', async () => {
      const snap = { data: () => ({}) };
      await onTripDeleted.run({ data: snap, params: { tripId: '123' } } as any);
      
      expect(deleteFilesMock).toHaveBeenCalledWith({
        prefix: 'trips/123/documents/'
      });
    });
  });

  describe('deleteOldNotificationsCron', () => {
    it('should delete notifications older than 30 days and read notifications older than 7 days using batch', async () => {
      const now = Date.now();
      const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      const mockAdminsSnapshot = {
        docs: [
          {
            ref: {
              collection: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  docs: [
                    {
                      ref: 'docRef1',
                      data: () => ({ read: false, createdAt: { toMillis: () => thirtyOneDaysAgo } })
                    },
                    {
                      ref: 'docRef2',
                      data: () => ({ read: true, createdAt: { toMillis: () => eightDaysAgo } })
                    },
                    {
                      ref: 'docRef3',
                      data: () => ({ read: false, createdAt: { toMillis: () => eightDaysAgo } })
                    },
                    {
                      ref: 'docRef4',
                      data: () => ({ read: true, createdAt: { toMillis: () => twoDaysAgo } })
                    }
                  ]
                })
              }))
            }
          }
        ]
      };

      dbGetMock.mockResolvedValueOnce(mockAdminsSnapshot);

      await deleteOldNotificationsCron.run({ data: {} } as any);

      // docRef1 is > 30 days old. docRef2 is read and > 7 days old. docRef3 is unread and < 30 days old. docRef4 is read and < 7 days old.
      expect(batchDeleteMock).toHaveBeenCalledTimes(2);
      expect(batchDeleteMock).toHaveBeenCalledWith('docRef1');
      expect(batchDeleteMock).toHaveBeenCalledWith('docRef2');
      expect(batchCommitMock).toHaveBeenCalledTimes(1);
    });

    it('should not process batches if no notifications are old enough', async () => {
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      const mockAdminsSnapshot = {
        docs: [
          {
            ref: {
              collection: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  docs: [
                    {
                      ref: 'docRef1',
                      data: () => ({ read: false, createdAt: { toMillis: () => twoDaysAgo } })
                    }
                  ]
                })
              }))
            }
          }
        ]
      };

      dbGetMock.mockResolvedValueOnce(mockAdminsSnapshot);

      await deleteOldNotificationsCron.run({ data: {} } as any);

      expect(batchDeleteMock).not.toHaveBeenCalled();
      expect(batchCommitMock).not.toHaveBeenCalled();
    });
  });

// Test file for Firebase Functions

const dbGetMock = jest.fn();
const dbWhereMock = jest.fn().mockReturnThis();
const dbDocGetMock = jest.fn();
const sendEachForMulticastMock = jest.fn();
const sendMock = jest.fn();
const deleteFilesMock = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn((_colName) => {
      return {
        doc: jest.fn(() => ({ get: dbDocGetMock })),
        where: dbWhereMock,
        get: dbGetMock,
      };
    })
  })),
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
      
      await onTripDocumentUploaded.run({ data: change, params: { tripId: '123' } } as any);
      
      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
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
      dbWhereMock.mockReturnThis();
      
      await onDocumentStatusChanged.run({ data: change, params: { tripId: '123' } } as any);

      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['superToken1'],
          notification: expect.objectContaining({
            title: 'Payment Completed'
          }),
          webpush: expect.objectContaining({
            fcmOptions: {
              link: expect.stringContaining('/admin/trips/123')
            }
          })
        })
      );
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
      dbWhereMock.mockReturnThis();
      
      await onTripCreated.run({ data: snap, params: { tripId: 'trip_123' } } as any);

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'super@example.com',
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

    it('should send a missing-documents email to coordinator when trip starts in 7 days with no docs', async () => {
      // Compute the date exactly 7 days from now
      const date7DaysFromNow = new Date();
      date7DaysFromNow.setDate(date7DaysFromNow.getDate() + 7);
      const startDate = date7DaysFromNow.toISOString().split('T')[0];

      dbWhereMock.mockReturnThis();
      dbGetMock.mockResolvedValue(buildTripSnapshotWithDate(startDate));
      dbDocGetMock
        .mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Luigi', surname: 'Verdi', email: 'luigi@test.com' }) }); // coordinator

      await checkUpcomingTripsCron.run({ data: {} } as any);

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'luigi@test.com',
          subject: expect.stringContaining('URGENT: Missing Documents'),
          html: expect.stringContaining('starts in 7 days')
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
        })
      );
    });

    it('should send hotel verification email and push when hotelBookedBy is set at exactly 1 month prior', async () => {
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
        })
      );

      // hotelBookedBy admin doc
      dbDocGetMock
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ fcmToken: 'hotelToken', email: 'hotel@test.com' }),
        })
        // hotel doc
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ name: 'Grand Hyatt Tokyo' }),
        });

      await checkUpcomingTripsCron.run({ data: {} } as any);

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'hotel@test.com',
          subject: expect.stringContaining('Reminder: Double Check Hotel Booking'),
          html: expect.stringContaining('Grand Hyatt Tokyo'),
        })
      );
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'hotelToken',
          notification: expect.objectContaining({
            title: 'Hotel Verification Reminder',
          }),
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

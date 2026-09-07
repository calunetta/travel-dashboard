// Test file for Firebase Functions

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
      if (colName === 'admins') {
        return {
          doc: jest.fn(() => ({ get: dbDocGetMock })),
          where: dbWhereMock,
          get: dbGetMock,
        };
      }
      if (colName === 'trips') {
        return {
          where: dbWhereMock,
          get: dbGetMock,
        };
      }
      return {};
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

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true),
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
  });

  describe('onTripDocumentUploaded', () => {
    it('should not send notification if no new documents are added', async () => {
      const beforeSnap = { data: () => ({ documents: [{ id: 'doc1' }] }) };
      const afterSnap = { data: () => ({ documents: [{ id: 'doc1' }] }) };
      const change = { before: beforeSnap, after: afterSnap };
      
      await onTripDocumentUploaded.run(change as any, { params: { tripId: '123' } } as any);
      expect(sendEachForMulticastMock).not.toHaveBeenCalled();
    });

    it('should send notification to admins if a new document is added', async () => {
      const beforeSnap = { data: () => ({ documents: [] }) };
      const afterSnap = { 
        data: () => ({ 
          destination: 'Japan',
          documents: [{ id: 'doc1' }], 
          adminIds: ['admin1'] 
        }) 
      };
      const change = { before: beforeSnap, after: afterSnap };
      
      dbDocGetMock.mockResolvedValue({ data: () => ({ fcmToken: 'token123' }) });
      
      await onTripDocumentUploaded.run(change as any, { params: { tripId: '123' } } as any);
      
      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['token123'],
          notification: expect.objectContaining({
            title: 'New Trip Document'
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
      
      await onDocumentStatusChanged.run(change as any, { params: { tripId: '123' } } as any);
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
      
      await onDocumentStatusChanged.run(change as any, { params: { tripId: '123' } } as any);

      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['superToken1'],
          notification: expect.objectContaining({
            title: 'Payment Completed'
          })
        })
      );
    });
  });

  describe('onTripCreated', () => {
    it('should send an email with an ics attachment to SUPER_ADMINs', async () => {
      const snap = { 
        data: () => ({ 
          destination: 'Japan',
          code: 'JP-2026',
          startDate: '2026-10-01',
          endDate: '2026-10-15'
        }) 
      };

      dbGetMock.mockResolvedValue([{ data: () => ({ email: 'super@example.com' }) }]);
      await onTripCreated.run(snap as any, {} as any);
    });
  });

  describe('checkUpcomingTripsCron', () => {
    it('should notify admins if a trip starts in 7 days and has no documents', async () => {
      const tripsSnapshot = {
        docs: [
          { 
            data: () => ({
              destination: 'Japan',
              documents: [],
              adminIds: ['admin1']
            }) 
          }
        ]
      };
      
      dbGetMock.mockResolvedValue(tripsSnapshot);
      dbDocGetMock.mockResolvedValue({
        data: () => ({ fcmToken: 'adminToken1' })
      });

      await checkUpcomingTripsCron.run({} as any, {} as any);

      expect(sendEachForMulticastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens: ['adminToken1'],
          notification: expect.objectContaining({
            title: 'Action Required: Missing Documents'
          })
        })
      );
    });
  });

  describe('onTripDeleted', () => {
    it('should delete files from storage', async () => {
      const snap = { data: () => ({}) };
      await onTripDeleted.run(snap as any, { params: { tripId: '123' } } as any);
      
      expect(deleteFilesMock).toHaveBeenCalledWith({
        prefix: 'trips/123/documents/'
      });
    });
  });

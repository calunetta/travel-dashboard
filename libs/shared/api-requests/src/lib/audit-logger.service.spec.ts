import { TestBed } from '@angular/core/testing';
import { AuditLoggerService } from './audit-logger.service';
import { FIRESTORE_TOKEN } from 'shared-models';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-server-timestamp'),
}));

import * as firestore from 'firebase/firestore';

describe('AuditLoggerService', () => {
  let service: AuditLoggerService;
  const mockFirestore = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuditLoggerService,
        { provide: FIRESTORE_TOKEN, useValue: mockFirestore }
      ]
    });
    service = TestBed.inject(AuditLoggerService);
    jest.clearAllMocks();
  });

  it('should write an audit log', async () => {
    (firestore.addDoc as jest.Mock).mockResolvedValueOnce({ id: 'new-log-id' });

    await service.logAction('DELETE_TRIP', 'trips', 'trip-123', 'admin-1', { foo: 'bar' });

    expect(firestore.addDoc).toHaveBeenCalledWith(
      undefined, // col returns undefined here
      expect.objectContaining({
        action: 'DELETE_TRIP',
        collectionName: 'trips',
        documentId: 'trip-123',
        performedBy: 'admin-1',
        metadata: { foo: 'bar' },
        createdAt: 'mock-server-timestamp'
      })
    );
  });
});

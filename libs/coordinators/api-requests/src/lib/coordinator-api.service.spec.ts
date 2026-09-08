import { TestBed } from '@angular/core/testing';
import { CoordinatorApiService } from './coordinator-api.service';
import { FIRESTORE_TOKEN, FirestoreId } from 'shared-models';
import { Candidacy, CandidacyStatus, AgePreference, AssignmentType } from 'coordinators-models';

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-server-timestamp'),
}));

import * as firestore from 'firebase/firestore';

describe('CoordinatorApiService', () => {
  let service: CoordinatorApiService;
  const mockFirestore = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CoordinatorApiService,
        { provide: FIRESTORE_TOKEN, useValue: mockFirestore }
      ]
    });
    service = TestBed.inject(CoordinatorApiService);
    jest.clearAllMocks();
  });

  describe('upsertCoordinatorFromCsv', () => {
    it('should create a new coordinator if email does not exist', async () => {
      (firestore.getDocs as jest.Mock).mockResolvedValueOnce({ empty: true });
      (firestore.addDoc as jest.Mock).mockResolvedValueOnce({ id: 'new-coord-id' });

      const result = await service.upsertCoordinatorFromCsv('John', 'Doe', 'john@test.com', '123');

      expect(result).toBe('new-coord-id');
      expect(firestore.addDoc).toHaveBeenCalledWith(
        undefined, // col returns undefined in this mocked setup without full impl, we just check args
        expect.objectContaining({
          name: 'John',
          surname: 'Doe',
          email: 'john@test.com',
          phone: '123'
        })
      );
      expect(firestore.updateDoc).not.toHaveBeenCalled();
    });

    it('should patch existing coordinator only for missing fields', async () => {
      const mockExistingRef = {};
      (firestore.getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            ref: mockExistingRef,
            data: () => ({ name: 'John', email: 'john@test.com' }) // surname and phone are missing
          }
        ]
      });

      const result = await service.upsertCoordinatorFromCsv('John', 'Doe', 'john@test.com', '123');

      expect(result).toBe(undefined); // Since existingRef.id is mocked undefined
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        mockExistingRef,
        expect.objectContaining({
          surname: 'Doe',
          phone: '123',
          updatedAt: 'mock-server-timestamp'
        })
      );
      // Ensure 'name' is NOT in the update payload because it already exists
      const updateCallArgs = (firestore.updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateCallArgs.name).toBeUndefined();
    });
  });
});

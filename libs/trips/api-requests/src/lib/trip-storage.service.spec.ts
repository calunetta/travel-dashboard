// ─────────────────────────────────────────────────────────────────────────────
// TripStorageService Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

import { TestBed } from '@angular/core/testing';
import { TripStorageService, MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPE } from './trip-storage.service';
import { FIREBASE_STORAGE_TOKEN } from 'shared-models';

// Mock the firebase/storage module
jest.mock('firebase/storage', () => ({
  ref: jest.fn().mockReturnValue({ _location: { path: 'mock-path' } }),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

import * as firebaseStorage from 'firebase/storage';

describe('TripStorageService', () => {
  let service: TripStorageService;
  const mockStorage = { _app: { name: 'mock-app' } };

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        TripStorageService,
        { provide: FIREBASE_STORAGE_TOKEN, useValue: mockStorage },
      ],
    });

    service = TestBed.inject(TripStorageService);
  });

  // ── validate() ─────────────────────────────────────────────────────────────

  describe('validate()', () => {
    it('should return null for a valid PDF within size limit', () => {
      const file = new File(['pdf content'], 'test.pdf', { type: ACCEPTED_MIME_TYPE });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1 MB

      expect(service.validate(file)).toBeNull();
    });

    it('should return an error for a non-PDF file', () => {
      const file = new File(['content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const result = service.validate(file);
      expect(result).toBe('Only PDF files are accepted.');
    });

    it('should return an error for a file exceeding 20 MB', () => {
      const file = new File(['pdf content'], 'big.pdf', { type: ACCEPTED_MIME_TYPE });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE_BYTES + 1 });
      const result = service.validate(file);
      expect(result).toBe('File size must not exceed 20 MB.');
    });

    it('should accept exactly 20 MB (boundary value)', () => {
      const file = new File(['pdf content'], 'exact.pdf', { type: ACCEPTED_MIME_TYPE });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE_BYTES });
      expect(service.validate(file)).toBeNull();
    });

    it('should reject a file disguised as PDF with wrong type', () => {
      const file = new File(['content'], 'evil.pdf', { type: 'text/html' });
      expect(service.validate(file)).toBe('Only PDF files are accepted.');
    });
  });

  // ── uploadDocument() ────────────────────────────────────────────────────────

  describe('uploadDocument()', () => {
    it('should call ref() with the correct storage path', (done) => {
      const mockOn = jest.fn().mockImplementation((event, onProgress, onError, onComplete) => {
        // Simulate immediate completion
        onProgress({ bytesTransferred: 100, totalBytes: 100 });
        onComplete();
        return jest.fn(); // unsubscribe fn
      });

      const mockUploadTask = {
        on: mockOn,
        cancel: jest.fn(),
        snapshot: {
          ref: {},
          totalBytes: 100,
          bytesTransferred: 100,
        },
      };

      (firebaseStorage.uploadBytesResumable as jest.Mock).mockReturnValue(mockUploadTask);
      (firebaseStorage.getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/file.pdf');

      const file = new File(['pdf'], 'test.pdf', { type: ACCEPTED_MIME_TYPE });
      const tripId = 'trip-123' as import('shared-models').FirestoreId;
      const docId = 'doc-uuid-456';

      service.uploadDocument(tripId, file, docId).subscribe({
        next: (progress) => {
          if (progress.downloadUrl) {
            expect(progress.percentage).toBe(100);
            expect(progress.downloadUrl).toBe('https://example.com/file.pdf');

            // Verify storage path construction
            expect(firebaseStorage.ref).toHaveBeenCalledWith(
              mockStorage,
              `trips/${tripId}/documents/${docId}.pdf`
            );
            done();
          }
        },
        error: done.fail,
      });
    });

    it('should emit error if upload fails', (done) => {
      const uploadError = new Error('Upload failed');

      const mockOn = jest.fn().mockImplementation((event, onProgress, onError) => {
        onError(uploadError);
        return jest.fn();
      });

      const mockUploadTask = {
        on: mockOn,
        cancel: jest.fn(),
        snapshot: { ref: {}, totalBytes: 100, bytesTransferred: 0 },
      };

      (firebaseStorage.uploadBytesResumable as jest.Mock).mockReturnValue(mockUploadTask);

      const file = new File(['pdf'], 'test.pdf', { type: ACCEPTED_MIME_TYPE });

      service.uploadDocument('trip-123' as import('shared-models').FirestoreId, file, 'doc-id').subscribe({
        next: () => { return; },
        error: (err) => {
          expect(err).toBe(uploadError);
          done();
        },
      });
    });
  });

  // ── deleteDocument() ────────────────────────────────────────────────────────

  describe('deleteDocument()', () => {
    it('should call deleteObject with the correct path', async () => {
      (firebaseStorage.deleteObject as jest.Mock).mockResolvedValue(undefined);

      const tripId = 'trip-123' as import('shared-models').FirestoreId;
      const docId = 'doc-uuid-456';

      await service.deleteDocument(tripId, docId);

      expect(firebaseStorage.ref).toHaveBeenCalledWith(
        mockStorage,
        `trips/${tripId}/documents/${docId}.pdf`
      );
      expect(firebaseStorage.deleteObject).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from Firebase Storage', async () => {
      const deleteError = new Error('Object not found');
      (firebaseStorage.deleteObject as jest.Mock).mockRejectedValue(deleteError);

      await expect(
        service.deleteDocument('trip-123' as import('shared-models').FirestoreId, 'doc-id')
      ).rejects.toThrow('Object not found');
    });
  });
});

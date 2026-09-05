// ─────────────────────────────────────────────────────────────────────────────
// TRIP STORAGE SERVICE — Firebase Storage CRUD for Trip Documents
//
// Handles uploading and deleting PDF files from Firebase Storage.
// Files are stored at: trips/{tripId}/documents/{uuid}.pdf
//
// CONSTRAINTS:
//   - Only PDF files are accepted (enforced client-side and by Storage rules).
//   - Max file size: 20 MB (enforced client-side).
//   - All uploads return a download URL for Firestore document records.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
  type StorageReference,
} from 'firebase/storage';
import { Observable } from 'rxjs';
import { FIREBASE_STORAGE_TOKEN } from 'shared-models';
import type { FirestoreId } from 'shared-models';

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const ACCEPTED_MIME_TYPE = 'application/pdf';
export const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Progress snapshot emitted during an upload. */
export interface UploadProgress {
  /** Bytes transferred so far. */
  readonly bytesTransferred: number;
  /** Total bytes to transfer. */
  readonly totalBytes: number;
  /** Upload progress as a percentage (0–100). */
  readonly percentage: number;
  /** Only set when the upload is complete. */
  readonly downloadUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class TripStorageService {
  private readonly storage = inject(FIREBASE_STORAGE_TOKEN);

  /**
   * Validates that the file is a PDF and within the size limit.
   * Returns a validation error string if invalid, or null if valid.
   */
  validate(file: File): string | null {
    if (file.type !== ACCEPTED_MIME_TYPE) {
      return 'Only PDF files are accepted.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'File size must not exceed 20 MB.';
    }
    return null;
  }

  /**
   * Uploads a PDF file to Firebase Storage for the given trip.
   *
   * The observable emits progress updates and, on completion, the final
   * snapshot includes the `downloadUrl`. The observable completes after
   * the download URL is resolved.
   *
   * @param tripId - The Firestore ID of the trip.
   * @param file   - The File object to upload (must be a PDF).
   * @param docId  - The UUID to use as the file name (caller-generated for idempotency).
   */
  uploadDocument(
    tripId: FirestoreId,
    file: File,
    docId: string
  ): Observable<UploadProgress> {
    const path = `trips/${tripId}/documents/${docId}.pdf`;
    const storageRef: StorageReference = ref(this.storage, path);
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, {
      contentType: ACCEPTED_MIME_TYPE,
    });

    return new Observable<UploadProgress>((observer) => {
      const unsubscribe = uploadTask.on(
        'state_changed',
        (snapshot) => {
          observer.next({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            ),
          });
        },
        (error) => observer.error(error),
        () => {
          // Upload complete — resolve the download URL
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadUrl) => {
              observer.next({
                bytesTransferred: uploadTask.snapshot.totalBytes,
                totalBytes: uploadTask.snapshot.totalBytes,
                percentage: 100,
                downloadUrl,
              });
              observer.complete();
            })
            .catch((err) => observer.error(err));
        }
      );

      // Teardown: cancel the upload if the Observable is unsubscribed
      return () => {
        unsubscribe();
        uploadTask.cancel();
      };
    });
  }

  /**
   * Deletes a document from Firebase Storage.
   *
   * @param tripId - The Firestore ID of the trip.
   * @param docId  - The document UUID (file name without .pdf extension).
   */
  async deleteDocument(tripId: FirestoreId, docId: string): Promise<void> {
    const path = `trips/${tripId}/documents/${docId}.pdf`;
    const storageRef = ref(this.storage, path);
    await deleteObject(storageRef);
  }

  /**
   * Validates that the file is an accepted image format and within the size limit.
   * Returns a validation error string if invalid, or null if valid.
   */
  validateImageReceipt(file: File): string | null {
    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WebP images are accepted for receipts.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'File size must not exceed 20 MB.';
    }
    return null;
  }

  /**
   * Uploads an image receipt to Firebase Storage for the given trip.
   * Returns the Firebase Storage download URL.
   *
   * @param tripId - The Firestore ID of the trip.
   * @param file   - The File object to upload (must be an image).
   */
  async uploadReceipt(tripId: FirestoreId, file: File): Promise<string> {
    const path = `trips/${tripId}/receipts/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, path);
    const snapshot = await uploadBytesResumable(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
}

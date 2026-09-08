import { Injectable, inject } from '@angular/core';
import { collection, addDoc, serverTimestamp, type DocumentReference } from 'firebase/firestore';
import { FIRESTORE_TOKEN } from 'shared-models';
import type { AuditLogAction, AuditLogFirestoreDocument } from 'shared-models';

const AUDIT_LOGS_COLLECTION = 'audit_logs';

@Injectable({ providedIn: 'root' })
export class AuditLoggerService {
  private readonly firestore = inject(FIRESTORE_TOKEN);

  /**
   * Logs an administrative action to the audit_logs collection.
   * This is a silent operation and does not throw errors to the caller if it fails,
   * to ensure core business logic isn't blocked by a logging failure.
   */
  async logAction(
    action: AuditLogAction,
    collectionName: string,
    documentId: string,
    performedByUid: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const col = collection(this.firestore, AUDIT_LOGS_COLLECTION);
      const logData: AuditLogFirestoreDocument = {
        action,
        collectionName,
        documentId,
        performedBy: performedByUid,
        metadata,
        createdAt: serverTimestamp() as any, // type assertion for the timestamp
      };

      await addDoc(col, logData);
    } catch (e) {
      console.error('AuditLoggerService: Failed to write audit log', e);
    }
  }
}

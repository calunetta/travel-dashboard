import type { FirestoreId, ISODateString, FirestoreTimestamp } from './primitives.types';

export type AuditLogAction = 'DELETE_TRIP' | 'MANUAL_HOTEL_COST_OVERRIDE' | 'DELETE_COORDINATOR' | 'OTHER';

export interface AuditLog {
  readonly id: FirestoreId;
  readonly action: AuditLogAction;
  readonly collectionName: string;
  readonly documentId: FirestoreId;
  readonly performedBy: FirestoreId; // Admin ID
  readonly metadata?: Record<string, any>;
  readonly createdAt: ISODateString;
}

export interface AuditLogFirestoreDocument {
  readonly action: string;
  readonly collectionName: string;
  readonly documentId: string;
  readonly performedBy: string;
  readonly metadata?: Record<string, any>;
  readonly createdAt: FirestoreTimestamp;
}

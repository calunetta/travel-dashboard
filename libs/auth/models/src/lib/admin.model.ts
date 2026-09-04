// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / APP RESPONSIBLE MODELS
// CRITICAL: This collection is READ-ONLY from the app.
//           All writes must be done via Firebase Console / Admin SDK only.
// ─────────────────────────────────────────────────────────────────────────────

import type { FirestoreId, FirestoreTimestamp } from 'shared-models';

/**
 * Admin user stored in the Firestore `admins` collection.
 * Document ID = Firebase Auth UID.
 * This interface is READ-ONLY from the client.
 */
export interface Admin {
  readonly id: FirestoreId;
  readonly name: string;
  readonly surname: string;
  readonly email: string;
  readonly phone: string;
}

/**
 * Raw Firestore document shape for an admin.
 * Matches the Firestore document structure exactly.
 */
export interface AdminDocument {
  readonly name: string;
  readonly surname: string;
  readonly email: string;
  readonly phone: string;
  readonly createdAt?: FirestoreTimestamp;
}

/**
 * The authenticated Firebase user enriched with admin verification status.
 */
export interface AuthenticatedUser {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly photoURL: string | null;
  /** True only if uid matches a document in the read-only admins collection. */
  readonly isAdmin: boolean;
  readonly adminProfile: Admin | null;
}

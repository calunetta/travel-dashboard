// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVE TYPES
// Re-exported from shared/models. All domains depend on these.
// ─────────────────────────────────────────────────────────────────────────────

import type { Timestamp } from 'firebase/firestore';

/** Firestore server timestamp — used in all document interfaces. */
export type FirestoreTimestamp = Timestamp;

/** ISO 8601 date string e.g. "2025-07-14" */
export type ISODateString = string;

/** Opaque branded type for Firestore document IDs. */
export type FirestoreId = string & { readonly _brand: 'FirestoreId' };

/** Generic paginated API response wrapper. */
export interface PaginatedResponse<T> {
  readonly data: ReadonlyArray<T>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Generic operation result — used by services to signal success/failure. */
export type OperationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/** Sorting direction. */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/** Generic filter/sort query params for Firestore collection reads. */
export interface CollectionQuery {
  readonly orderBy?: string;
  readonly direction?: SortDirection;
  readonly limit?: number;
}

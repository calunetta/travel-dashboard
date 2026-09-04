import type { FirestoreId, FirestoreTimestamp, ISODateString } from 'shared-models';

/**
 * Core Tour domain model.
 */
export interface Tour {
  readonly id: FirestoreId;
  readonly country: string;
  readonly tourWeRoadCode: string;
  readonly tourName: string;
  readonly tourLength: number;
  readonly adminIds: ReadonlyArray<FirestoreId>;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/**
 * Raw Firestore document structure for a Tour.
 */
export interface TourFirestoreDocument {
  readonly country: string;
  readonly tourWeRoadCode: string;
  readonly tourName: string;
  readonly tourLength: number;
  readonly adminIds: ReadonlyArray<string>;
  readonly createdAt: FirestoreTimestamp;
  readonly updatedAt: FirestoreTimestamp;
}

/** Payload to create a new tour. Omits server-generated fields. */
export type CreateTourPayload = Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload to update an existing tour. All fields optional except id. */
export type UpdateTourPayload = Partial<Omit<Tour, 'id' | 'createdAt'>> & { readonly id: FirestoreId };

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATOR DOMAIN MODELS
// ─────────────────────────────────────────────────────────────────────────────

import type { FirestoreId, FirestoreTimestamp, ISODateString } from 'shared-models';

// ── Enums ────────────────────────────────────────────────────────────────────

/** Age preference bracket for coordinators. */
export enum AgePreference {
  YOUNG = '18-25',
  ADULT = '25-35',
  SENIOR = '35-49',
}

/** Assignment type — drives the automatic candidacy cleanup logic. */
export enum AssignmentType {
  /**
   * First-come first-serve.
   * Automatically removes the coordinator from all OTHER pending candidacies.
   */
  AUTOMATIC = 'AUTOMATIC',
  /**
   * Manually assigned by an admin.
   * Does NOT remove the coordinator from other candidacies.
   * Visually tagged as "Already has a shift".
   */
  MANUAL = 'MANUAL',
}

/** Coordinator candidacy status. */
export enum CandidacyStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

// ── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Core Coordinator domain model.
 * Coordinators apply for trips via the public candidacy form.
 */
export interface Coordinator {
  readonly id: FirestoreId;
  readonly name: string;
  readonly surname: string;
  readonly email: string;
  /** WhatsApp-compatible phone number with country code e.g. "+393331234567" */
  readonly phone: string;
  readonly agePreference: AgePreference;
  readonly notes: string;
  /** Post-trip feedback left by admins. */
  readonly feedback: string;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/**
 * Raw Firestore document structure for a Coordinator.
 */
export interface CoordinatorFirestoreDocument {
  readonly name: string;
  readonly surname: string;
  readonly email: string;
  readonly phone: string;
  readonly agePreference: string;
  readonly notes: string;
  readonly feedback: string;
  readonly createdAt: FirestoreTimestamp;
  readonly updatedAt: FirestoreTimestamp;
}

/**
 * A candidacy submitted by a coordinator for one or more trips.
 * Stored in the `candidacies` Firestore collection.
 * UPSERT logic: same email/phone → overwrite existing document.
 */
export interface Candidacy {
  readonly id: FirestoreId;
  readonly coordinatorId: FirestoreId | null;
  readonly tripIds: ReadonlyArray<FirestoreId>;
  readonly name: string;
  readonly surname: string;
  readonly agePreference: AgePreference;
  /** WhatsApp number — used to generate wa.me deep links. */
  readonly whatsapp: string;
  readonly email: string;
  readonly notes: string;
  readonly status: CandidacyStatus;
  readonly submittedAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/**
 * Raw Firestore document structure for a Candidacy.
 */
export interface CandidacyFirestoreDocument {
  readonly coordinatorId: string | null;
  readonly tripIds: ReadonlyArray<string>;
  readonly name: string;
  readonly surname: string;
  readonly agePreference: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly notes: string;
  readonly status: string;
  readonly submittedAt: FirestoreTimestamp;
  readonly updatedAt: FirestoreTimestamp;
}

/**
 * Assignment of a coordinator to a specific trip.
 * Stored as a sub-collection: trips/{tripId}/assignments/{assignmentId}
 */
export interface TripAssignment {
  readonly id: FirestoreId;
  readonly tripId: FirestoreId;
  readonly coordinatorId: FirestoreId;
  readonly assignedById: FirestoreId;
  readonly assignmentType: AssignmentType;
  readonly assignedAt: ISODateString;
  /** Optional date for display: "Already has a shift on {date}" */
  readonly conflictingTripDate: ISODateString | null;
}

/**
 * Public candidacy form submission payload.
 * Used by the public (unauthenticated) area.
 */
export interface CandidacyFormPayload {
  readonly tripIds: ReadonlyArray<FirestoreId>;
  readonly name: string;
  readonly surname: string;
  readonly agePreference: AgePreference;
  readonly whatsapp: string;
  readonly email: string;
  readonly notes: string;
}

/** Payload to update a coordinator's info or post-trip feedback. */
export type UpdateCoordinatorPayload = Partial<
  Omit<Coordinator, 'id' | 'createdAt'>
> & { readonly id: FirestoreId };

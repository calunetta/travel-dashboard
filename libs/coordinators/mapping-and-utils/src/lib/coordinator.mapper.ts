// ─────────────────────────────────────────────────────────────────────────────
// COORDINATOR MAPPER — Firestore Document ↔ Domain Model
// ─────────────────────────────────────────────────────────────────────────────

import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import type {
  Coordinator,
  CoordinatorFirestoreDocument,
  Candidacy,
  CandidacyFirestoreDocument,
  CandidacyFormPayload,
} from 'coordinators-models';
import { AgePreference, CandidacyStatus } from 'coordinators-models';
import type { FirestoreId } from 'shared-models';
import { timestampToIso } from 'shared-mapping-and-utils';
import { isAgePreference, isCandidacyStatus } from 'shared-mapping-and-utils';

// ─── Coordinator: Firestore → Domain ─────────────────────────────────────────

/**
 * Maps a Firestore DocumentSnapshot to the Coordinator domain model.
 */
export function mapSnapshotToCoordinator(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): Coordinator | null {
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Partial<CoordinatorFirestoreDocument>;
  const id = snapshot.id as FirestoreId;

  return {
    id,
    name: data.name ?? '',
    surname: data.surname ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    agePreference: isAgePreference(data.agePreference)
      ? data.agePreference
      : AgePreference.ADULT,
    notes: data.notes ?? '',
    feedback: data.feedback ?? '',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

// ─── Candidacy: Firestore → Domain ───────────────────────────────────────────

/**
 * Maps a Firestore DocumentSnapshot to the Candidacy domain model.
 */
export function mapSnapshotToCandidacy(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): Candidacy | null {
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Partial<CandidacyFirestoreDocument>;
  const id = snapshot.id as FirestoreId;

  return {
    id,
    coordinatorId: (data.coordinatorId as FirestoreId | null) ?? null,
    tripIds: Array.isArray(data.tripIds)
      ? (data.tripIds as FirestoreId[])
      : [],
    name: data.name ?? '',
    surname: data.surname ?? '',
    agePreference: isAgePreference(data.agePreference)
      ? data.agePreference
      : AgePreference.ADULT,
    whatsapp: data.whatsapp ?? '',
    email: data.email ?? '',
    notes: data.notes ?? '',
    status: isCandidacyStatus(data.status) ? data.status : CandidacyStatus.PENDING,
    submittedAt: timestampToIso(data.submittedAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

// ─── Candidacy: Form Payload → Firestore ─────────────────────────────────────

/**
 * Maps a public candidacy form submission to a Firestore write object.
 * Used by the PUBLIC (unauthenticated) area.
 * Adds serverTimestamp and sets initial status to PENDING.
 */
export function mapCandidacyFormToFirestore(
  payload: CandidacyFormPayload
): Omit<CandidacyFirestoreDocument, 'coordinatorId' | 'submittedAt' | 'updatedAt'> & {
  coordinatorId: null;
  status: CandidacyStatus;
  submittedAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
} {
  return {
    coordinatorId: null,
    tripIds: [...payload.tripIds],
    name: payload.name.trim(),
    surname: payload.surname.trim(),
    agePreference: payload.agePreference,
    whatsapp: payload.whatsapp.trim(),
    email: payload.email.trim().toLowerCase(),
    notes: payload.notes.trim(),
    status: CandidacyStatus.PENDING,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// ─── Coordinator: Create from Candidacy ───────────────────────────────────────

/**
 * Creates a Firestore coordinator document from an accepted candidacy.
 * Used when converting a candidacy into a full coordinator record on assignment.
 */
export function mapCandidacyToCoordinatorFirestore(
  candidacy: Candidacy
): Omit<CoordinatorFirestoreDocument, 'createdAt' | 'updatedAt'> & {
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
} {
  return {
    name: candidacy.name,
    surname: candidacy.surname,
    email: candidacy.email,
    phone: candidacy.whatsapp,
    agePreference: candidacy.agePreference,
    notes: candidacy.notes,
    feedback: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

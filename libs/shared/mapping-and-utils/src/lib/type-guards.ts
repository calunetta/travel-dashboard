// ─────────────────────────────────────────────────────────────────────────────
// RUNTIME TYPE GUARDS
// Used for defensive programming — validate external data at runtime.
// ─────────────────────────────────────────────────────────────────────────────

import { RoomType, TripStatus } from 'trips-models';
import { AgePreference, AssignmentType, CandidacyStatus } from 'coordinators-models';
import { CountryCode } from 'hotels-models';
import type { WeRoadTour, WeRoadPaginatedToursResponse } from 'shared-models';

// ─── Primitive Guards ─────────────────────────────────────────────────────────

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isFirestoreId(value: unknown): value is FirestoreId {
  return isNonEmptyString(value);
}

// ─── Enum Guards ──────────────────────────────────────────────────────────────

export function isRoomType(value: unknown): value is RoomType {
  return isString(value) && Object.values(RoomType).includes(value as RoomType);
}

export function isTripStatus(value: unknown): value is TripStatus {
  return isString(value) && Object.values(TripStatus).includes(value as TripStatus);
}

export function isAgePreference(value: unknown): value is AgePreference {
  return isString(value) && Object.values(AgePreference).includes(value as AgePreference);
}

export function isAssignmentType(value: unknown): value is AssignmentType {
  return isString(value) && Object.values(AssignmentType).includes(value as AssignmentType);
}

export function isCandidacyStatus(value: unknown): value is CandidacyStatus {
  return isString(value) && Object.values(CandidacyStatus).includes(value as CandidacyStatus);
}

export function isCountryCode(value: unknown): value is CountryCode {
  return isString(value) && Object.values(CountryCode).includes(value as CountryCode);
}

// ─── Firestore Document Guards ───────────────────────────────────────────────

/**
 * Runtime guard for a Firestore Trip document snapshot.
 * Validates only required structural fields — optional fields are not checked.
 */
export function isTripFirestoreDocument(value: unknown): value is {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: 8;
  status: string;
  roomComposition: Record<string, number>;
} {
  if (!isNonNullObject(value)) return false;
  if (!isNonEmptyString(value['title'])) return false;
  if (!isNonEmptyString(value['destination'])) return false;
  if (!isNonEmptyString(value['startDate'])) return false;
  if (!isNonEmptyString(value['endDate'])) return false;
  if (value['durationDays'] !== 8) return false;
  if (!isTripStatus(value['status'])) return false;
  if (!isNonNullObject(value['roomComposition'])) return false;
  return true;
}

/**
 * Runtime guard for a Firestore Hotel document snapshot.
 */
export function isHotelFirestoreDocument(value: unknown): value is {
  name: string;
  destination: string;
  billingData: Record<string, unknown>;
  pricingRanges: unknown[];
} {
  if (!isNonNullObject(value)) return false;
  if (!isNonEmptyString(value['name'])) return false;
  if (!isNonEmptyString(value['destination'])) return false;
  if (!isNonNullObject(value['billingData'])) return false;
  if (!Array.isArray(value['pricingRanges'])) return false;
  return true;
}

/**
 * Runtime guard for a Firestore Coordinator document.
 */
export function isCoordinatorFirestoreDocument(value: unknown): value is {
  name: string;
  surname: string;
  email: string;
  phone: string;
  agePreference: string;
} {
  if (!isNonNullObject(value)) return false;
  if (!isNonEmptyString(value['name'])) return false;
  if (!isNonEmptyString(value['surname'])) return false;
  if (!isNonEmptyString(value['email'])) return false;
  if (!isNonEmptyString(value['phone'])) return false;
  if (!isAgePreference(value['agePreference'])) return false;
  return true;
}

/**
 * Runtime guard for a Candidacy Firestore document.
 */
export function isCandidacyFirestoreDocument(value: unknown): value is {
  name: string;
  surname: string;
  email: string;
  whatsapp: string;
  agePreference: string;
  tripIds: string[];
  status: string;
} {
  if (!isNonNullObject(value)) return false;
  if (!isNonEmptyString(value['name'])) return false;
  if (!isNonEmptyString(value['surname'])) return false;
  if (!isNonEmptyString(value['email'])) return false;
  if (!isNonEmptyString(value['whatsapp'])) return false;
  if (!isAgePreference(value['agePreference'])) return false;
  if (!Array.isArray(value['tripIds'])) return false;
  if (!isCandidacyStatus(value['status'])) return false;
  return true;
}

// ─── WeRoad API Guards ────────────────────────────────────────────────────────

/**
 * Runtime guard for a single WeRoad Tour API response object.
 */
export function isWeRoadTour(value: unknown): value is WeRoadTour {
  if (!isNonNullObject(value)) return false;
  if (!isNonEmptyString(value['id'])) return false;
  if (!isNonEmptyString(value['slug'])) return false;
  if (!isNonNullObject(value['groupInfo'])) return false;
  if (!isBoolean((value['groupInfo'] as Record<string, unknown>)['hasPax'])) return false;
  return true;
}

/**
 * Runtime guard for the WeRoad paginated response envelope.
 */
export function isWeRoadPaginatedToursResponse(value: unknown): value is WeRoadPaginatedToursResponse {
  if (!isNonNullObject(value)) return false;
  if (!Array.isArray(value['data'])) return false;
  if (!isNonNullObject(value['meta'])) return false;
  return true;
}

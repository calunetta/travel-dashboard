// ─────────────────────────────────────────────────────────────────────────────
// TRIP MAPPER — Firestore Document ↔ Domain Model
// ─────────────────────────────────────────────────────────────────────────────

import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import type {
  Trip,
  TripFirestoreDocument,
  CreateTripPayload,
  RoomComposition,
} from 'trips-models';
import { RoomType, DEFAULT_ROOM_COMPOSITION } from 'trips-models';
import type { FirestoreId } from 'shared-models';
import { timestampToIso } from 'shared-mapping-and-utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toRoomComposition(raw: Record<string, unknown>): RoomComposition {
  const parse = (key: string): number => {
    const v = raw[key];
    return typeof v === 'number' && !isNaN(v) ? v : 0;
  };
  return {
    [RoomType.SINGLE]: parse('SINGLE'),
    [RoomType.DOUBLE]: parse('DOUBLE'),
    [RoomType.TRIPLE]: parse('TRIPLE'),
    [RoomType.QUAD]: parse('QUAD'),
    [RoomType.EXTRA_BED]: parse('EXTRA_BED'),
  };
}

// ─── Firestore → Domain ───────────────────────────────────────────────────────

/**
 * Maps a Firestore DocumentSnapshot to the Trip domain model.
 * Returns `null` if the snapshot doesn't exist.
 */
export function mapSnapshotToTrip(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): Trip | null {
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Partial<TripFirestoreDocument>;
  const id = snapshot.id as FirestoreId;

  const roomCompositionRaw = data.roomComposition ?? {};
  const documents = Array.isArray(data.documents) ? data.documents : [];

  return {
    id,
    destination: data.destination ?? '',
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
    durationDays: 8,
    notes: data.notes ?? '',
    roomComposition: toRoomComposition(roomCompositionRaw as Record<string, unknown>),
    coordinatorId: (data.coordinatorId as FirestoreId | null) ?? null,
    hotelId: (data.hotelId as FirestoreId | null) ?? null,
    hotelBookerId: (data.hotelBookerId as FirestoreId | null) ?? null,
    facebookGroupUrl: data.facebookGroupUrl ?? null,
    weRoadTourSlug: data.weRoadTourSlug ?? null,
    documents: documents.map((d) => ({
      id: d.id as FirestoreId,
      name: d.name,
      url: d.url,
      uploadedAt: d.uploadedAt,
    })),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

// ─── Domain → Firestore ───────────────────────────────────────────────────────

/**
 * Maps a CreateTripPayload to a Firestore write object.
 * Adds serverTimestamp for both createdAt and updatedAt.
 */
export function mapCreatePayloadToFirestore(
  payload: CreateTripPayload
): Omit<TripFirestoreDocument, 'createdAt' | 'updatedAt'> & {
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
} {
  return {
    destination: payload.destination,
    startDate: payload.startDate,
    endDate: payload.endDate,
    durationDays: 8,
    notes: payload.notes,
    roomComposition: {
      SINGLE: payload.roomComposition[RoomType.SINGLE],
      DOUBLE: payload.roomComposition[RoomType.DOUBLE],
      TRIPLE: payload.roomComposition[RoomType.TRIPLE],
      QUAD: payload.roomComposition[RoomType.QUAD],
      EXTRA_BED: payload.roomComposition[RoomType.EXTRA_BED],
    },
    coordinatorId: payload.coordinatorId,
    hotelId: payload.hotelId,
    hotelBookerId: payload.hotelBookerId,
    facebookGroupUrl: payload.facebookGroupUrl,
    weRoadTourSlug: payload.weRoadTourSlug,
    documents: payload.documents.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      uploadedAt: d.uploadedAt,
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Maps an update payload to a Firestore partial update object.
 * Always sets updatedAt to serverTimestamp.
 */
export function mapUpdatePayloadToFirestore(
  payload: Partial<Trip>
): Partial<TripFirestoreDocument> & { updatedAt: ReturnType<typeof serverTimestamp> } {
  const update: Record<string, unknown> = {};

  if (payload.destination !== undefined) update['destination'] = payload.destination;
  if (payload.startDate !== undefined) update['startDate'] = payload.startDate;
  if (payload.endDate !== undefined) update['endDate'] = payload.endDate;
  if (payload.notes !== undefined) update['notes'] = payload.notes;
  if (payload.roomComposition !== undefined) {
    update['roomComposition'] = {
      SINGLE: payload.roomComposition[RoomType.SINGLE],
      DOUBLE: payload.roomComposition[RoomType.DOUBLE],
      TRIPLE: payload.roomComposition[RoomType.TRIPLE],
      QUAD: payload.roomComposition[RoomType.QUAD],
      EXTRA_BED: payload.roomComposition[RoomType.EXTRA_BED],
    };
  }
  if (payload.coordinatorId !== undefined) update['coordinatorId'] = payload.coordinatorId;
  if (payload.hotelId !== undefined) update['hotelId'] = payload.hotelId;
  if (payload.hotelBookerId !== undefined) update['hotelBookerId'] = payload.hotelBookerId;
  if (payload.facebookGroupUrl !== undefined) update['facebookGroupUrl'] = payload.facebookGroupUrl;
  if (payload.weRoadTourSlug !== undefined) update['weRoadTourSlug'] = payload.weRoadTourSlug;
  if (payload.documents !== undefined) {
    update['documents'] = payload.documents.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      uploadedAt: d.uploadedAt,
    }));
  }

  return {
    ...update,
    updatedAt: serverTimestamp(),
  } as Partial<TripFirestoreDocument> & { updatedAt: ReturnType<typeof serverTimestamp> };
}

/**
 * Creates a default empty trip payload for use in creation forms.
 */
export function createDefaultTripPayload(): CreateTripPayload {
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  return {
    destination: '',
    startDate: today,
    endDate,
    durationDays: 8,
    notes: '',
    roomComposition: { ...DEFAULT_ROOM_COMPOSITION },
    coordinatorId: null,
    hotelId: null,
    hotelBookerId: null,
    facebookGroupUrl: null,
    weRoadTourSlug: null,
    documents: [],
  };
}

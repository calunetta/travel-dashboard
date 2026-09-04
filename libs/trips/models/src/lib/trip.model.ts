// ─────────────────────────────────────────────────────────────────────────────
// TRIP DOMAIN MODELS
// ─────────────────────────────────────────────────────────────────────────────

import type { FirestoreId, FirestoreTimestamp, ISODateString } from 'shared-models';

// ── Enums ────────────────────────────────────────────────────────────────────

/** Room types available in a trip's room composition. */
export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  TRIPLE = 'TRIPLE',
  QUAD = 'QUAD',
  EXTRA_BED = 'EXTRA_BED',
}

/** Trip status lifecycle. */
export enum TripStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FULL = 'FULL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Describes how many rooms of each type are in the trip.
 * Default composition: 8 doubles.
 */
export interface RoomComposition {
  readonly [RoomType.SINGLE]: number;
  readonly [RoomType.DOUBLE]: number;
  readonly [RoomType.TRIPLE]: number;
  readonly [RoomType.QUAD]: number;
  readonly [RoomType.EXTRA_BED]: number;
}

/** Default room composition: 8 double rooms. */
export const DEFAULT_ROOM_COMPOSITION: Readonly<RoomComposition> = {
  [RoomType.SINGLE]: 0,
  [RoomType.DOUBLE]: 8,
  [RoomType.TRIPLE]: 0,
  [RoomType.QUAD]: 0,
  [RoomType.EXTRA_BED]: 0,
} as const;

/** A document attached to a trip (PDF, contract, etc.). */
export interface TripDocument {
  readonly id: FirestoreId;
  readonly name: string;
  readonly url: string;
  readonly uploadedAt: ISODateString;
}

/**
 * Core Trip domain model.
 * Duration is always 8 days by business rule.
 */
export interface Trip {
  readonly id: FirestoreId;
  readonly title: string;
  readonly destination: string;
  readonly startDate: ISODateString;
  readonly endDate: ISODateString;
  /** Fixed at 8 days per business rule. */
  readonly durationDays: 8;
  readonly notes: string;
  readonly status: TripStatus;
  readonly roomComposition: RoomComposition;
  readonly coordinatorId: FirestoreId | null;
  readonly hotelId: FirestoreId | null;
  readonly hotelBookerId: FirestoreId | null;
  /** Clickable Facebook group link, sourced from the WeRoad external API. */
  readonly facebookGroupUrl: string | null;
  /** Raw URL from WeRoad API */
  readonly weRoadTourSlug: string | null;
  readonly documents: ReadonlyArray<TripDocument>;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/**
 * Raw Firestore document structure for a Trip.
 * Field names match exactly what is stored in Firestore.
 */
export interface TripFirestoreDocument {
  readonly title: string;
  readonly destination: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly durationDays: 8;
  readonly notes: string;
  readonly status: string;
  readonly roomComposition: {
    readonly SINGLE: number;
    readonly DOUBLE: number;
    readonly TRIPLE: number;
    readonly QUAD: number;
    readonly EXTRA_BED: number;
  };
  readonly coordinatorId: string | null;
  readonly hotelId: string | null;
  readonly hotelBookerId: string | null;
  readonly facebookGroupUrl: string | null;
  readonly weRoadTourSlug: string | null;
  readonly documents: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly url: string;
    readonly uploadedAt: string;
  }>;
  readonly createdAt: FirestoreTimestamp;
  readonly updatedAt: FirestoreTimestamp;
}

/** Payload to create a new trip. Omits server-generated fields. */
export type CreateTripPayload = Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload to update an existing trip. All fields optional except id. */
export type UpdateTripPayload = Partial<Omit<Trip, 'id' | 'createdAt'>> & { readonly id: FirestoreId };

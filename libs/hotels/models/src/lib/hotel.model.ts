// ─────────────────────────────────────────────────────────────────────────────
// HOTEL DOMAIN MODELS
// ─────────────────────────────────────────────────────────────────────────────

import type { FirestoreId, FirestoreTimestamp, ISODateString } from 'shared-models';
import type { RoomType } from 'trips-models';

// ── Enums ────────────────────────────────────────────────────────────────────

/** Country codes (ISO 3166-1 alpha-2). */
export enum CountryCode {
  IT = 'IT',
  ES = 'ES',
  FR = 'FR',
  DE = 'DE',
  GR = 'GR',
  PT = 'PT',
  HR = 'HR',
  MT = 'MT',
  MV = 'MV', // Maldives
  TH = 'TH',
  ID = 'ID',
  MA = 'MA',
  EG = 'EG',
  OTHER = 'OTHER',
}

// ── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Complete billing data for a hotel supplier.
 * Used for invoice generation and payment processing.
 */
export interface HotelBillingData {
  readonly supplierName: string;
  readonly beneficiary: string;
  readonly address: string;
  readonly postalCode: string;
  readonly city: string;
  readonly country: CountryCode;
  readonly taxCode: string;
  readonly phone: string;
  readonly email: string;
  readonly accountNumber: string;
  readonly swiftCode: string;
}

/**
 * Pricing for a specific room type within a date range.
 */
export interface RoomPriceEntry {
  /** Room type this price applies to. */
  readonly roomType: RoomType;
  /** Price per room per night in EUR (cents to avoid float issues). */
  readonly pricePerNightCents: number;
}

/**
 * A date range with room pricing — allows configuring different
 * prices per month or seasonal period.
 */
export interface DateRangePricing {
  readonly id: FirestoreId;
  /** Inclusive start of the date range (ISO date). */
  readonly fromDate: ISODateString;
  /** Inclusive end of the date range (ISO date). */
  readonly toDate: ISODateString;
  /** Label e.g. "Summer 2025", "Low Season" */
  readonly label: string;
  readonly prices: ReadonlyArray<RoomPriceEntry>;
}

/**
 * Core Hotel domain model.
 */
export interface Hotel {
  readonly id: FirestoreId;
  readonly name: string;
  readonly destination: string;
  readonly billingData: HotelBillingData;
  /** Dynamic pricing configuration — multiple ranges per hotel. */
  readonly pricingRanges: ReadonlyArray<DateRangePricing>;
  readonly notes: string;
  readonly tourId: FirestoreId;
  readonly adminIds: ReadonlyArray<FirestoreId>;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/**
 * Raw Firestore document structure for a Hotel.
 */
export interface HotelFirestoreDocument {
  readonly name: string;
  readonly destination: string;
  readonly billingData: {
    readonly supplierName: string;
    readonly beneficiary: string;
    readonly address: string;
    readonly postalCode: string;
    readonly city: string;
    readonly country: string;
    readonly taxCode: string;
    readonly phone: string;
    readonly email: string;
    readonly accountNumber: string;
    readonly swiftCode: string;
  };
  readonly pricingRanges: ReadonlyArray<{
    readonly id: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly label: string;
    readonly prices: ReadonlyArray<{
      readonly roomType: string;
      readonly pricePerNightCents: number;
    }>;
  }>;
  readonly notes: string;
  readonly tourId: string;
  readonly adminIds: ReadonlyArray<string>;
  readonly createdAt: FirestoreTimestamp;
  readonly updatedAt: FirestoreTimestamp;
}

/** Payload to create a new hotel. */
export type CreateHotelPayload = Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload to update an existing hotel. */
export type UpdateHotelPayload = Partial<Omit<Hotel, 'id' | 'createdAt'>> & { readonly id: FirestoreId };

/**
 * Calculated hotel cost for a trip.
 * Returned by the cost calculation utility function.
 */
export interface HotelCostCalculation {
  readonly hotelId: FirestoreId;
  readonly tripId: FirestoreId;
  readonly appliedPricingRange: DateRangePricing | null;
  /** Breakdown per room type */
  readonly costBreakdown: ReadonlyArray<{
    readonly roomType: RoomType;
    readonly quantity: number;
    readonly pricePerNightCents: number;
    readonly totalCents: number;
  }>;
  /** Total for all nights */
  readonly grandTotalCents: number;
  /** Convenience: grandTotalCents / 100 */
  readonly grandTotalEur: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL MAPPER — Firestore Document ↔ Domain Model
// ─────────────────────────────────────────────────────────────────────────────

import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import type { Hotel, HotelFirestoreDocument, CreateHotelPayload, DateRangePricing } from 'hotels-models';
import { CountryCode } from 'hotels-models';
import { RoomType } from 'trips-models';
import type { FirestoreId } from 'shared-models';
import { timestampToIso } from 'shared-mapping-and-utils';
import { isCountryCode, isRoomType } from 'shared-mapping-and-utils';

// ─── Firestore → Domain ───────────────────────────────────────────────────────

/**
 * Maps a Firestore DocumentSnapshot to the Hotel domain model.
 */
export function mapSnapshotToHotel(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot
): Hotel | null {
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Partial<HotelFirestoreDocument>;
  const id = snapshot.id as FirestoreId;

  const rawBilling = data.billingData ?? {};
  const rawRanges = Array.isArray(data.pricingRanges) ? data.pricingRanges : [];

  const pricingRanges: ReadonlyArray<DateRangePricing> = rawRanges.map((range) => ({
    id: (range.id ?? '') as FirestoreId,
    fromDate: range.fromDate ?? '',
    toDate: range.toDate ?? '',
    label: range.label ?? '',
    prices: Array.isArray(range.prices)
      ? range.prices.map((p: any) => ({
          roomType: isRoomType(p.roomType) ? p.roomType : RoomType.DOUBLE,
          pricePerNightCents: typeof p.pricePerNightCents === 'number' ? p.pricePerNightCents : 0,
        }))
      : [],
  }));

  return {
    id,
    name: data.name ?? '',
    destination: data.destination ?? '',
    billingData: {
      supplierName: (rawBilling as Record<string, unknown>)['supplierName'] as string ?? '',
      beneficiary: (rawBilling as Record<string, unknown>)['beneficiary'] as string ?? '',
      address: (rawBilling as Record<string, unknown>)['address'] as string ?? '',
      postalCode: (rawBilling as Record<string, unknown>)['postalCode'] as string ?? '',
      city: (rawBilling as Record<string, unknown>)['city'] as string ?? '',
      country: isCountryCode((rawBilling as Record<string, unknown>)['country'])
        ? ((rawBilling as Record<string, unknown>)['country'] as CountryCode)
        : CountryCode.OTHER,
      taxCode: (rawBilling as Record<string, unknown>)['taxCode'] as string ?? '',
      phone: (rawBilling as Record<string, unknown>)['phone'] as string ?? '',
      email: (rawBilling as Record<string, unknown>)['email'] as string ?? '',
      accountNumber: (rawBilling as Record<string, unknown>)['accountNumber'] as string ?? '',
      swiftCode: (rawBilling as Record<string, unknown>)['swiftCode'] as string ?? '',
    },
    pricingRanges,
    notes: data.notes ?? '',
    tourId: typeof data.tourId === 'string' ? data.tourId as FirestoreId : '' as FirestoreId,
    adminIds: Array.isArray(data.adminIds) ? (data.adminIds as FirestoreId[]) : [],
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

// ─── Domain → Firestore ───────────────────────────────────────────────────────

/**
 * Maps a CreateHotelPayload to a Firestore write object.
 */
export function mapCreateHotelToFirestore(
  payload: CreateHotelPayload
): Omit<HotelFirestoreDocument, 'createdAt' | 'updatedAt'> & {
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
} {
  return {
    name: payload.name,
    destination: payload.destination,
    billingData: {
      supplierName: payload.billingData.supplierName,
      beneficiary: payload.billingData.beneficiary,
      address: payload.billingData.address,
      postalCode: payload.billingData.postalCode,
      city: payload.billingData.city,
      country: payload.billingData.country,
      taxCode: payload.billingData.taxCode,
      phone: payload.billingData.phone,
      email: payload.billingData.email,
      accountNumber: payload.billingData.accountNumber,
      swiftCode: payload.billingData.swiftCode,
    },
    pricingRanges: payload.pricingRanges.map((range) => ({
      id: range.id,
      fromDate: range.fromDate,
      toDate: range.toDate,
      label: range.label,
      prices: range.prices.map((p) => ({
        roomType: p.roomType,
        pricePerNightCents: p.pricePerNightCents,
      })),
    })),
    notes: payload.notes,
    tourId: payload.tourId,
    adminIds: payload.adminIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

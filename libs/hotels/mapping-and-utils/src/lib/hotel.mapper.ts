// ─────────────────────────────────────────────────────────────────────────────
// HOTEL MAPPER — Firestore Document ↔ Domain Model
// ─────────────────────────────────────────────────────────────────────────────

import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import type { Hotel, HotelFirestoreDocument, CreateHotelPayload, DateRangePricing } from 'hotels-models';
import { RoomType } from 'trips-models';
import type { FirestoreId } from 'shared-models';
import { timestampToIso } from 'shared-mapping-and-utils';
import { isRoomType } from 'shared-mapping-and-utils';

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

  const rawBilling = data.billingData;
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
    billingData: rawBilling ? {
      supplierName: (rawBilling as Record<string, unknown>)['supplierName'] as string | undefined,
      beneficiary: (rawBilling as Record<string, unknown>)['beneficiary'] as string | undefined,
      address: (rawBilling as Record<string, unknown>)['address'] as string | undefined,
      postalCode: (rawBilling as Record<string, unknown>)['postalCode'] as string | undefined,
      city: (rawBilling as Record<string, unknown>)['city'] as string | undefined,
      taxCode: (rawBilling as Record<string, unknown>)['taxCode'] as string | undefined,
      phone: (rawBilling as Record<string, unknown>)['phone'] as string | undefined,
      email: (rawBilling as Record<string, unknown>)['email'] as string | undefined,
      accountNumber: (rawBilling as Record<string, unknown>)['accountNumber'] as string | undefined,
      swiftCode: (rawBilling as Record<string, unknown>)['swiftCode'] as string | undefined,
    } : undefined,
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
    billingData: payload.billingData ? {
      supplierName: payload.billingData.supplierName,
      beneficiary: payload.billingData.beneficiary,
      address: payload.billingData.address,
      postalCode: payload.billingData.postalCode,
      city: payload.billingData.city,
      taxCode: payload.billingData.taxCode,
      phone: payload.billingData.phone,
      email: payload.billingData.email,
      accountNumber: payload.billingData.accountNumber,
      swiftCode: payload.billingData.swiftCode,
    } : undefined,
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

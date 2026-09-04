// ─────────────────────────────────────────────────────────────────────────────
// HOTEL COST CALCULATOR
// Computes the hotel cost for a given trip based on dynamic pricing ranges.
// ─────────────────────────────────────────────────────────────────────────────

import type { Hotel, HotelCostCalculation, DateRangePricing } from 'hotels-models';
import type { Trip } from 'trips-models';
import { RoomType } from 'trips-models';
import type { FirestoreId } from 'shared-models';
import { isDateInRange, calculateNights } from 'shared-mapping-and-utils';

/**
 * Finds the best matching DateRangePricing for a given date.
 * Returns the FIRST matching range (ordered as stored).
 * If no range matches, returns null (no pricing configured for that period).
 */
function findMatchingPricingRange(
  pricingRanges: ReadonlyArray<DateRangePricing>,
  referenceDate: string
): DateRangePricing | null {
  return pricingRanges.find((range) =>
    isDateInRange(referenceDate, range.fromDate, range.toDate)
  ) ?? null;
}

/**
 * Calculates the full hotel cost for a given trip.
 *
 * Algorithm:
 * 1. Find the pricing range matching the trip's startDate
 * 2. For each room type in the room composition, look up the price
 * 3. Cost = price × quantity × nights
 * 4. Sum all room costs
 *
 * @param hotel - The hotel to calculate costs for
 * @param trip - The trip to calculate costs for
 * @returns HotelCostCalculation with full breakdown
 */
export function calculateHotelCost(hotel: Hotel, trip: Trip): HotelCostCalculation {
  const nights = calculateNights(trip.startDate, trip.endDate);
  const matchedRange = findMatchingPricingRange(hotel.pricingRanges, trip.startDate);

  if (!matchedRange) {
    return {
      hotelId: hotel.id,
      tripId: trip.id,
      appliedPricingRange: null,
      costBreakdown: [],
      grandTotalCents: 0,
      grandTotalEur: 0,
    };
  }

  const priceMap = new Map<RoomType, number>(
    matchedRange.prices.map((p) => [p.roomType, p.pricePerNightCents])
  );

  const roomTypes = [
    RoomType.SINGLE,
    RoomType.DOUBLE,
    RoomType.TRIPLE,
    RoomType.QUAD,
    RoomType.EXTRA_BED,
  ] as const;

  const costBreakdown = roomTypes
    .filter((rt) => trip.roomComposition[rt] > 0)
    .map((rt) => {
      const quantity = trip.roomComposition[rt];
      const pricePerNightCents = priceMap.get(rt) ?? 0;
      const totalCents = pricePerNightCents * quantity * nights;
      return { roomType: rt, quantity, pricePerNightCents, totalCents };
    });

  const grandTotalCents = costBreakdown.reduce((sum, row) => sum + row.totalCents, 0);

  return {
    hotelId: hotel.id,
    tripId: trip.id,
    appliedPricingRange: matchedRange,
    costBreakdown,
    grandTotalCents,
    grandTotalEur: grandTotalCents / 100,
  };
}

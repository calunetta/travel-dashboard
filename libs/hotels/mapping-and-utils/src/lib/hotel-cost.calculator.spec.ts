import { calculateHotelCost } from './hotel-cost.calculator';
import { Hotel, CountryCode } from 'hotels-models';
import { Trip, TripStatus, RoomType } from 'trips-models';
import { FirestoreId, ISODateString } from 'shared-models';

describe('Hotel Cost Calculator', () => {
  let mockHotel: Hotel;
  let mockTrip: Trip;

  beforeEach(() => {
    mockHotel = {
      id: 'h1' as FirestoreId,
      name: 'Test Hotel',
      destination: 'Rome',
      notes: '',
      billingData: {
        supplierName: 'Test Hotel SRL',
        taxCode: '12345678901',
        email: 'test@pec.it',
        swiftCode: 'ABCDEF1',
        address: 'Via Roma 1',
        city: 'Rome',
        postalCode: '00100',
        country: CountryCode.IT,
        beneficiary: '',
        phone: '',
        accountNumber: '',
      },
      pricingRanges: [
        {
          id: 'range-1' as FirestoreId,
          label: 'Summer Rate',
          fromDate: '2026-06-01' as ISODateString,
          toDate: '2026-08-31' as ISODateString,
          prices: [
            { roomType: RoomType.SINGLE, pricePerNightCents: 10000 }, // €100
            { roomType: RoomType.DOUBLE, pricePerNightCents: 15000 }, // €150
          ],
        },
        {
          id: 'range-2' as FirestoreId,
          label: 'Winter Rate',
          fromDate: '2026-12-01' as ISODateString,
          toDate: '2026-12-31' as ISODateString,
          prices: [
            { roomType: RoomType.DOUBLE, pricePerNightCents: 12000 }, // €120
          ],
        },
      ],
    } as unknown as Hotel;

    mockTrip = {
      id: 't1' as FirestoreId,
      title: 'Rome Trip',
      destination: 'Rome',
      startDate: '2026-06-10' as ISODateString,
      endDate: '2026-06-17' as ISODateString,
      status: TripStatus.PUBLISHED,
      notes: '',
      hotelBookerId: null,
      weRoadTourSlug: null,
      weroadTripId: 'we-road-trip-id',
      durationDays: 8,
      assignedRoomsCount: 6,
      totalRoomsCount: 6,
      coordinatorId: null,
      hotelId: 'h1' as FirestoreId,
      roomComposition: {
        [RoomType.SINGLE]: 2,
        [RoomType.DOUBLE]: 4,
        [RoomType.TRIPLE]: 0,
        [RoomType.QUAD]: 0,
        [RoomType.EXTRA_BED]: 0,
      },
    } as unknown as Trip;
  });

  it('should correctly calculate the cost based on matching date range', () => {
    // 7 nights trip
    // Single: 2 rooms * €100 = €200 / night * 7 = €1400 (140000 cents)
    // Double: 4 rooms * €150 = €600 / night * 7 = €4200 (420000 cents)
    // Grand Total: €5600 (560000 cents)
    
    const result = calculateHotelCost(mockHotel, mockTrip);

    expect(result.hotelId).toBe('h1');
    expect(result.tripId).toBe('t1');
    expect(result.appliedPricingRange?.id).toBe('range-1');
    
    expect(result.costBreakdown).toHaveLength(2);
    expect(result.costBreakdown[0]).toEqual({
      roomType: RoomType.SINGLE,
      quantity: 2,
      pricePerNightCents: 10000,
      totalCents: 140000,
    });
    expect(result.costBreakdown[1]).toEqual({
      roomType: RoomType.DOUBLE,
      quantity: 4,
      pricePerNightCents: 15000,
      totalCents: 420000,
    });
    
    expect(result.grandTotalCents).toBe(560000);
    expect(result.grandTotalEur).toBe(5600);
  });

  it('should fallback to 0 cents and ignore room if price is missing in the range', () => {
    // Trip in December
    const decTrip = {
      ...mockTrip,
      startDate: '2026-12-10' as ISODateString,
      endDate: '2026-12-17' as ISODateString,
    };
    
    // Winter range has NO SINGLE ROOM pricing, but we request 2 singles
    // Expected behavior: single room price defaults to 0
    
    const result = calculateHotelCost(mockHotel, decTrip);

    expect(result.appliedPricingRange?.id).toBe('range-2');
    
    const singleRow = result.costBreakdown.find((r) => r.roomType === RoomType.SINGLE);
    expect(singleRow).toBeDefined();
    expect(singleRow?.pricePerNightCents).toBe(0);
    expect(singleRow?.totalCents).toBe(0);

    const doubleRow = result.costBreakdown.find((r) => r.roomType === RoomType.DOUBLE);
    expect(doubleRow?.pricePerNightCents).toBe(12000); // 120 * 4 * 7 nights = 336000
    expect(doubleRow?.totalCents).toBe(336000);

    expect(result.grandTotalCents).toBe(336000);
  });

  it('should return 0 totals if no pricing range matches', () => {
    // Trip in November (no pricing range configured)
    const novTrip = {
      ...mockTrip,
      startDate: '2026-11-10' as ISODateString,
      endDate: '2026-11-17' as ISODateString,
    };
    
    const result = calculateHotelCost(mockHotel, novTrip);

    expect(result.appliedPricingRange).toBeNull();
    expect(result.costBreakdown).toHaveLength(0);
    expect(result.grandTotalCents).toBe(0);
    expect(result.grandTotalEur).toBe(0);
  });

});

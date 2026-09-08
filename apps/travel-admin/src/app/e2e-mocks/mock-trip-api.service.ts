import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Trip, CreateTripPayload, UpdateTripPayload } from 'trips-models';
import { FirestoreId } from 'shared-models';

@Injectable({ providedIn: 'root' })
export class MockTripApiService {
  private state = new BehaviorSubject<Trip[]>([
    {
      id: 'trip123' as FirestoreId,
      destination: 'Japan',
      code: 'JP-2026',
      startDate: '2026-05-01',
      endDate: '2026-05-15',
      durationDays: 8,
      notes: '',
      roomComposition: { SINGLE: 0, DOUBLE: 8, TRIPLE: 0, QUAD: 0, EXTRA_BED: 0 },
      tourId: 'tour123' as FirestoreId,
      coordinatorId: null,
      adminIds: ['mock-admin-uid' as FirestoreId],
      checklist: [
        {
          id: 'default-1',
          task: 'Confirm Hotel',
          isCompleted: false
        }
      ],
      documents: [],
      hotelId: null,
      facebookGroupUrl: null,
      manualHotelCost: null,
      hotelBookerId: null,
      hotelBookedBy: null,
      hotelBookingMethod: null,
      hotelBookingReceiptUrl: null,
      weRoadTourSlug: 'JP-2026',
      nationality: 'IT' as any,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    }
  ]);

  getAll$(): Observable<ReadonlyArray<Trip>> {
    return this.state.asObservable();
  }

  getById$(id: string): Observable<Trip | null> {
    return this.state.pipe(
      map(trips => trips.find(t => t.id === id) ?? null)
    );
  }

  getAvailableTripsByTourId$(tourId: string): Observable<ReadonlyArray<Trip>> {
    return this.state.pipe(
      map(trips => trips.filter(t => t.tourId === tourId && !t.coordinatorId))
    );
  }

  async create(payload: CreateTripPayload): Promise<FirestoreId> {
    const id = `trip-${Date.now()}` as FirestoreId;
    const newTrip: Trip = {
      id,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    this.state.next([...this.state.getValue(), newTrip]);
    return id;
  }

  async update(payload: UpdateTripPayload): Promise<void> {
    const current = this.state.getValue();
    const updated = current.map(t => {
      if (t.id === payload.id) {
        return { ...t, ...payload, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    this.state.next(updated as any);
  }

  async delete(id: FirestoreId): Promise<void> {
    const current = this.state.getValue();
    this.state.next(current.filter(t => t.id !== id));
  }

  async deleteMany(ids: FirestoreId[]): Promise<void> {
    const current = this.state.getValue();
    this.state.next(current.filter(t => !ids.includes(t.id)));
  }

  async assignCoordinator(tripId: FirestoreId, coordinatorId: FirestoreId | null): Promise<void> {
    await this.update({ id: tripId, coordinatorId } as any);
  }

  async assignHotel(tripId: FirestoreId, hotelId: FirestoreId | null): Promise<void> {
    await this.update({ id: tripId, hotelId } as any);
  }

  async syncFacebookGroupUrl(tripId: FirestoreId, facebookGroupUrl: string | null): Promise<void> {
    await this.update({ id: tripId, facebookGroupUrl } as any);
  }

  async addDocument(): Promise<void> {
    await Promise.resolve();
  }
  async removeDocument(): Promise<void> {
    await Promise.resolve();
  }
  async toggleDocumentPaymentStatus(): Promise<void> {
    await Promise.resolve();
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Tour, CreateTourPayload, UpdateTourPayload } from 'tours-models';
import { FirestoreId, Nationality } from 'shared-models';

@Injectable({ providedIn: 'root' })
export class MockTourApiService {
  private state = new BehaviorSubject<Tour[]>([
    {
      id: 'tour123' as FirestoreId,
      country: 'Japan',
      tourWeRoadCode: 'mock-tour-code',
      tourName: 'Japan Express',
      tourLength: 14,
      nationalities: ['IT' as Nationality],
      adminIds: ['mock-admin-uid' as FirestoreId],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    }
  ]);

  getAll$(): Observable<Tour[]> {
    return this.state.asObservable();
  }

  getById$(id: string): Observable<Tour | null> {
    return this.state.pipe(
      map(tours => tours.find(t => t.id === id) ?? null)
    );
  }

  getByWeRoadCode$(tourWeRoadCode: string): Observable<Tour | null> {
    return this.state.pipe(
      map(tours => tours.find(t => t.tourWeRoadCode === tourWeRoadCode) ?? null)
    );
  }

  async create(payload: CreateTourPayload): Promise<string> {
    const id = `tour-${Date.now()}`;
    const newTour: Tour = {
      id: id as FirestoreId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    this.state.next([...this.state.getValue(), newTour]);
    return id;
  }

  async update(payload: UpdateTourPayload): Promise<void> {
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
}

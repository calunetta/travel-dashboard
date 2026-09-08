import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Hotel } from 'hotels-models';
import { FirestoreId } from 'shared-models';

@Injectable({ providedIn: 'root' })
export class MockHotelApiService {
  private state = new BehaviorSubject<Hotel[]>([]);

  getAll$(): Observable<ReadonlyArray<Hotel>> {
    return this.state.asObservable();
  }

  getById$(id: string): Observable<Hotel | null> {
    return this.state.pipe(
      map(hotels => hotels.find(h => h.id === id) ?? null)
    );
  }
}

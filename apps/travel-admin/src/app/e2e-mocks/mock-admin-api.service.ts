import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Admin } from 'auth-models';

@Injectable({ providedIn: 'root' })
export class MockAdminApiService {
  private state = new BehaviorSubject<Admin[]>([]);

  getAll$(): Observable<ReadonlyArray<Admin>> {
    return this.state.asObservable();
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Admin } from 'auth-models';
import { FirestoreId, InAppNotification } from 'shared-models';

@Injectable({ providedIn: 'root' })
export class MockAdminApiService {
  private state = new BehaviorSubject<Admin[]>([]);

  getAll$(): Observable<ReadonlyArray<Admin>> {
    return this.state.asObservable();
  }

  getNotifications$(adminId: FirestoreId): Observable<ReadonlyArray<InAppNotification>> {
    return of([]);
  }

  async updateFcmToken(adminId: FirestoreId, fcmToken: string): Promise<void> {
    // mock implementation
  }

  async markNotificationAsRead(adminId: FirestoreId, notificationId: FirestoreId): Promise<void> {
    // mock implementation
  }
}

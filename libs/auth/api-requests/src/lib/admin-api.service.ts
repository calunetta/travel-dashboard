// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API SERVICE — Read-only access to the `admins` Firestore collection.
//
// CRITICAL: This collection is NEVER writable from the client.
//           Used ONLY by SUPER_ADMINs to fetch the list of all admins for
//           the trip assignment feature.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, limit } from 'firebase/firestore';
import { Observable, shareReplay } from 'rxjs';
import { FIRESTORE_TOKEN } from 'shared-models';
import type { Admin, AdminDocument } from 'auth-models';
import type { FirestoreId, InAppNotification } from 'shared-models';

const ADMINS_COLLECTION = 'admins';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly firestore = inject(FIRESTORE_TOKEN);

  private allAdmins$?: Observable<ReadonlyArray<Admin>>;

  /**
   * Returns a real-time Observable of ALL admin profiles, ordered by surname.
   * This method is intended ONLY for SUPER_ADMIN users.
   * The component is responsible for verifying the isSuperAdmin signal before
   * rendering UI that calls this method.
   * Cached using shareReplay to prevent duplicate listeners.
   */
  getAll$(): Observable<ReadonlyArray<Admin>> {
    if (!this.allAdmins$) {
      this.allAdmins$ = new Observable<ReadonlyArray<Admin>>((observer) => {
        const col = collection(this.firestore, ADMINS_COLLECTION);
        const q = query(col, orderBy('surname', 'asc'));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const admins = snapshot.docs.map((docSnap) => {
              const data = docSnap.data() as AdminDocument;
              const admin: Admin = {
                id: docSnap.id as FirestoreId,
                name: data.name ?? '',
                surname: data.surname ?? '',
                email: data.email ?? '',
                phone: data.phone ?? '',
                role: data.role ?? 'ADMIN',
                fcmToken: data.fcmToken,
              };
              return admin;
            });
            observer.next(admins);
          },
          (err) => observer.error(err)
        );

        return () => unsubscribe();
      }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.allAdmins$;
  }

  /**
   * Updates the FCM token for the currently authenticated admin.
   */
  async updateFcmToken(adminId: FirestoreId, fcmToken: string): Promise<void> {
    const adminRef = doc(this.firestore, ADMINS_COLLECTION, adminId);
    await updateDoc(adminRef, { fcmToken });
  }

  /**
   * Returns a real-time Observable of the latest 50 notifications for the admin.
   */
  getNotifications$(adminId: FirestoreId): Observable<ReadonlyArray<InAppNotification>> {
    return new Observable<ReadonlyArray<InAppNotification>>((observer) => {
      const col = collection(this.firestore, ADMINS_COLLECTION, adminId, 'notifications');
      const q = query(col, orderBy('createdAt', 'desc'), limit(50));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifications = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id as FirestoreId,
              title: data['title'] ?? '',
              body: data['body'] ?? '',
              link: data['link'] ?? '',
              read: data['read'] ?? false,
              createdAt: data['createdAt'],
            } as InAppNotification;
          });
          observer.next(notifications);
        },
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  /**
   * Marks a specific notification as read.
   */
  async markNotificationAsRead(adminId: FirestoreId, notificationId: FirestoreId): Promise<void> {
    const docRef = doc(this.firestore, ADMINS_COLLECTION, adminId, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  }
}

import { Injectable, inject } from '@angular/core';
import { collection, doc, setDoc, query, where, serverTimestamp, type DocumentReference } from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';
import { onSnapshot } from 'firebase/firestore';
import { FIRESTORE_TOKEN } from 'shared-models';
import { FirebaseAuthService } from 'auth-api-requests';
import type { Tour, CreateTourPayload, UpdateTourPayload, TourFirestoreDocument } from 'tours-models';
import type { FirestoreId } from 'shared-models';
import { timestampToIso } from 'shared-mapping-and-utils';

@Injectable({ providedIn: 'root' })
export class TourApiService {
  private readonly firestore = inject(FIRESTORE_TOKEN);
  private readonly auth = inject(FirebaseAuthService);
  private readonly collectionName = 'tours';

  /**
   * Get all tours where the current admin is in the adminIds array.
   */
  getAll$(): Observable<Tour[]> {
    return new Observable<Tour[]>((observer) => {
      const collRef = collection(this.firestore, this.collectionName);
      const q = query(collRef, where('adminIds', 'array-contains', this.auth.currentUser()?.uid ?? ''));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => this.mapSnapshotToTour({ id: doc.id, ...doc.data() }));
        observer.next(docs);
      }, (err) => observer.error(err));

      return () => unsubscribe();
    });
  }

  getById$(id: string): Observable<Tour | null> {
    return new Observable<Tour | null>((observer) => {
      const docRef = doc(this.firestore, `${this.collectionName}/${id}`);

      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        observer.next(snapshot.exists() ? this.mapSnapshotToTour({ id: snapshot.id, ...snapshot.data() }) : null);
      }, (err) => observer.error(err));

      return () => unsubscribe();
    });
  }

  async create(payload: CreateTourPayload): Promise<string> {
    const collRef = collection(this.firestore, this.collectionName);
    const newDocRef = doc(collRef);

    const firestoreData: Omit<TourFirestoreDocument, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
      country: payload.country,
      tourWeRoadCode: payload.tourWeRoadCode,
      tourName: payload.tourName,
      tourLength: payload.tourLength,
      adminIds: [this.auth.currentUser()?.uid ?? ''],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, firestoreData);
    return newDocRef.id;
  }

  async update(payload: UpdateTourPayload): Promise<void> {
    const docRef = doc(this.firestore, `${this.collectionName}/${payload.id}`);

    const updateData: Record<string, any> = {};
    if (payload.country !== undefined) updateData['country'] = payload.country;
    if (payload.tourWeRoadCode !== undefined) updateData['tourWeRoadCode'] = payload.tourWeRoadCode;
    if (payload.tourName !== undefined) updateData['tourName'] = payload.tourName;
    if (payload.tourLength !== undefined) updateData['tourLength'] = payload.tourLength;
    if (payload.adminIds !== undefined) updateData['adminIds'] = payload.adminIds as unknown as string[];

    await setDoc(docRef, { ...updateData, updatedAt: serverTimestamp() }, { merge: true });
  }

  private mapSnapshotToTour(data: any): Tour {
    return {
      id: data.id as FirestoreId,
      country: data.country ?? '',
      tourWeRoadCode: data.tourWeRoadCode ?? '',
      tourName: data.tourName ?? '',
      tourLength: data.tourLength ?? 0,
      adminIds: Array.isArray(data.adminIds) ? data.adminIds : [],
      createdAt: data.createdAt ? timestampToIso(data.createdAt) : '',
      updatedAt: data.updatedAt ? timestampToIso(data.updatedAt) : '',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIP API SERVICE — Firestore CRUD + Real-Time Listeners
//
// All reads return Observables backed by Firestore onSnapshot listeners
// (real-time updates). Writes are async/Promise-based.
//
// Collection: `trips`
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  type DocumentReference,
} from 'firebase/firestore';
import { Observable, shareReplay } from 'rxjs';
import { FirebaseAuthService } from 'auth-api-requests';
import { FIRESTORE_TOKEN } from 'shared-models';
import type { FirestoreId } from 'shared-models';
import type { Trip, CreateTripPayload, UpdateTripPayload } from 'trips-models';
import {
  mapSnapshotToTrip,
  mapCreatePayloadToFirestore,
  mapUpdatePayloadToFirestore,
} from 'trips-mapping-and-utils';

const TRIPS_COLLECTION = 'trips';

@Injectable({ providedIn: 'root' })
export class TripApiService {
  private readonly firestore = inject(FIRESTORE_TOKEN);
  private readonly auth = inject(FirebaseAuthService);

  // ── Real-Time Reads ────────────────────────────────────────────────────────

  private allTrips$?: Observable<ReadonlyArray<Trip>>;

  /**
   * Returns a real-time Observable of all trips, ordered by startDate ascending.
   * The Observable emits a new array every time the Firestore collection changes.
   * Automatically unsubscribes when the Observable is unsubscribed.
   * Cached using shareReplay to prevent multiple simultaneous snapshot listeners.
   */
  getAll$(): Observable<ReadonlyArray<Trip>> {
    if (!this.allTrips$) {
      this.allTrips$ = new Observable<ReadonlyArray<Trip>>((observer) => {
      const col = collection(this.firestore, TRIPS_COLLECTION);
      const q = query(
        col, 
        where('adminIds', 'array-contains', this.auth.currentUser()?.uid ?? ''),
        orderBy('startDate', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const trips = snapshot.docs
            .map((docSnap) => mapSnapshotToTrip(docSnap))
            .filter((t): t is Trip => t !== null);
          observer.next(trips);
        },
        (err) => observer.error(err)
      );

      // Return teardown logic for RxJS unsubscription.
      return () => unsubscribe();
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.allTrips$;
  }

  /**
   * Returns a real-time Observable for a single trip by ID.
   * Emits null if the document does not exist.
   */
  getById$(tripId: FirestoreId): Observable<Trip | null> {
    return new Observable<Trip | null>((observer) => {
      const docRef = doc(this.firestore, TRIPS_COLLECTION, tripId);

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          observer.next(mapSnapshotToTrip(snapshot));
        },
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    });
  }

  // ── Writes ─────────────────────────────────────────────────────────────────

  /**
   * Creates a new trip document.
   * @returns The new Firestore document ID.
   */
  async create(payload: CreateTripPayload): Promise<FirestoreId> {
    const col = collection(this.firestore, TRIPS_COLLECTION);
    const firestoreData = mapCreatePayloadToFirestore(payload);
    const docRef: DocumentReference = await addDoc(col, firestoreData);
    return docRef.id as FirestoreId;
  }

  /**
   * Updates an existing trip document (partial update).
   * Always sets updatedAt to serverTimestamp.
   */
  async update(payload: UpdateTripPayload): Promise<void> {
    const { id, ...rest } = payload;
    const docRef = doc(this.firestore, TRIPS_COLLECTION, id);
    const firestoreData = mapUpdatePayloadToFirestore(rest);
    await updateDoc(docRef, firestoreData as Record<string, any>);
  }

  /**
   * Deletes a trip document permanently.
   * Does NOT cascade to the `assignments` sub-collection — handled by backend.
   */
  async delete(tripId: FirestoreId): Promise<void> {
    const docRef = doc(this.firestore, TRIPS_COLLECTION, tripId);
    await deleteDoc(docRef);
  }

  /**
   * Assigns or removes a coordinator from a trip.
   * Uses partial update so only coordinatorId is touched.
   */
  async assignCoordinator(
    tripId: FirestoreId,
    coordinatorId: FirestoreId | null
  ): Promise<void> {
    const docRef = doc(this.firestore, TRIPS_COLLECTION, tripId);
    const firestoreData = mapUpdatePayloadToFirestore({ coordinatorId });
    await updateDoc(docRef, firestoreData as Record<string, any>);
  }

  /**
   * Assigns or removes a hotel from a trip.
   */
  async assignHotel(tripId: FirestoreId, hotelId: FirestoreId | null): Promise<void> {
    const docRef = doc(this.firestore, TRIPS_COLLECTION, tripId);
    const firestoreData = mapUpdatePayloadToFirestore({ hotelId });
    await updateDoc(docRef, firestoreData as Record<string, any>);
  }

  /**
   * Syncs Facebook group URL from WeRoad API onto a trip.
   */
  async syncFacebookGroupUrl(
    tripId: FirestoreId,
    facebookGroupUrl: string | null
  ): Promise<void> {
    const docRef = doc(this.firestore, TRIPS_COLLECTION, tripId);
    const firestoreData = mapUpdatePayloadToFirestore({ facebookGroupUrl });
    await updateDoc(docRef, firestoreData as Record<string, any>);
  }
}

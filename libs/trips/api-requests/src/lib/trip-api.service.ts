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
  arrayUnion,
  arrayRemove,
  type DocumentReference,
} from 'firebase/firestore';
import { Observable, shareReplay } from 'rxjs';
import { serverTimestamp } from 'firebase/firestore';
import { FirebaseAuthService } from 'auth-api-requests';
import { AuditLoggerService } from 'shared-api-requests';
import { FIRESTORE_TOKEN } from 'shared-models';
import type { FirestoreId } from 'shared-models';
import type { Trip, CreateTripPayload, UpdateTripPayload, TripDocument } from 'trips-models';
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
  private readonly auditLogger = inject(AuditLoggerService);

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



  getAvailableTripsByTourId$(tourId: FirestoreId): Observable<ReadonlyArray<Trip>> {
    return new Observable<ReadonlyArray<Trip>>((observer) => {
      const col = collection(this.firestore, TRIPS_COLLECTION);
      const q = query(
        col,
        where('tourId', '==', tourId),
        where('coordinatorId', '==', null)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const trips = snapshot.docs
            .map((docSnap) => mapSnapshotToTrip(docSnap))
            .filter((t): t is Trip => t !== null);
          // Sort client-side to avoid needing a composite index
          trips.sort((a, b) => a.startDate.localeCompare(b.startDate));
          observer.next(trips);
        },
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
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
    
    if (payload.manualHotelCost !== undefined) {
      this.auditLogger.logAction(
        'MANUAL_HOTEL_COST_OVERRIDE',
        TRIPS_COLLECTION,
        id,
        this.auth.currentUser()?.uid ?? 'unknown',
        { newCost: payload.manualHotelCost }
      );
    }
  }

  /**
   * Deletes a trip document permanently.
   * Does NOT cascade to the `assignments` sub-collection — handled by backend.
   */
  async delete(tripId: FirestoreId): Promise<void> {
    const docRef = doc(this.firestore, TRIPS_COLLECTION, tripId);
    await deleteDoc(docRef);
    
    this.auditLogger.logAction(
      'DELETE_TRIP',
      TRIPS_COLLECTION,
      tripId,
      this.auth.currentUser()?.uid ?? 'unknown'
    );
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

  // ── Document Management ───────────────────────────────────────────────────

  /**
   * Appends a document entry to a trip's documents array using arrayUnion.
   * This is an atomic operation — safe for concurrent writes.
   */
  async addDocument(tripId: FirestoreId, document: TripDocument): Promise<void> {
    const docRef = doc(this.firestore, TRIPS_COLLECTION, tripId);
    await updateDoc(docRef, {
      documents: arrayUnion({
        id: document.id,
        name: document.name,
        url: document.url,
        uploadedAt: document.uploadedAt,
        paymentStatus: document.paymentStatus,
      }),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Removes a document entry from a trip's documents array using arrayRemove.
   * Matches by the exact object shape — the document must have been fetched
   * from Firestore to guarantee a match.
   */
  async removeDocument(tripId: FirestoreId, document: TripDocument): Promise<void> {
    const docRef = doc(this.firestore, TRIPS_COLLECTION, tripId);
    await updateDoc(docRef, {
      documents: arrayRemove({
        id: document.id,
        name: document.name,
        url: document.url,
        uploadedAt: document.uploadedAt,
        paymentStatus: document.paymentStatus,
      }),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Toggles the paymentStatus of a specific document within a trip.
   * Performs a read-then-write: fetches the latest documents array,
   * replaces the target document's paymentStatus, and writes the full array.
   */
  async toggleDocumentPaymentStatus(
    tripId: FirestoreId,
    documentId: string,
    currentDocuments: ReadonlyArray<TripDocument>
  ): Promise<void> {
    const updatedDocuments = currentDocuments.map((d) =>
      d.id === documentId
        ? { ...d, paymentStatus: d.paymentStatus === 'PAID' ? 'TO_BE_PAID' as const : 'PAID' as const }
        : d
    );
    await updateDoc(doc(this.firestore, TRIPS_COLLECTION, tripId), {
      documents: updatedDocuments,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Permanently deletes multiple trip documents in a single batch.
   */
  async deleteMany(tripIds: FirestoreId[]): Promise<void> {
    const { writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(this.firestore);
    
    tripIds.forEach(id => {
      batch.delete(doc(this.firestore, TRIPS_COLLECTION, id));
    });
    
    await batch.commit();
  }
}

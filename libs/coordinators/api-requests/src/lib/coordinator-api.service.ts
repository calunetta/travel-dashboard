// ─────────────────────────────────────────────────────────────────────────────
// COORDINATOR API SERVICE — Firestore CRUD + Assignment Logic
//
// Collections:
//   - `coordinators` — coordinator profiles
//   - `candidacies`  — public form submissions
//   - `trips/{tripId}/assignments` — trip assignment sub-collection
//
// UPSERT logic for candidacies:
//   Same email → overwrite existing document (idempotent re-submissions)
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { FIRESTORE_TOKEN } from 'shared-models';
import type { FirestoreId } from 'shared-models';
import type {
  Coordinator,
  Candidacy,
  CandidacyFormPayload,
  TripAssignment,
  UpdateCoordinatorPayload,
} from 'coordinators-models';
import { AssignmentType, CandidacyStatus } from 'coordinators-models';
import {
  mapSnapshotToCoordinator,
  mapSnapshotToCandidacy,
  mapCandidacyFormToFirestore,
  mapCandidacyToCoordinatorFirestore,
} from 'coordinators-mapping-and-utils';
import { timestampToIso } from 'shared-mapping-and-utils';

const COORDINATORS_COLLECTION = 'coordinators';
const CANDIDACIES_COLLECTION = 'candidacies';
const ASSIGNMENTS_SUBCOLLECTION = 'assignments';

@Injectable({ providedIn: 'root' })
export class CoordinatorApiService {
  private readonly firestore = inject(FIRESTORE_TOKEN);

  // ── Coordinators — Real-Time Reads ────────────────────────────────────────

  /**
   * Returns a real-time Observable of all coordinators, ordered by surname.
   */
  getAll$(): Observable<ReadonlyArray<Coordinator>> {
    return new Observable<ReadonlyArray<Coordinator>>((observer) => {
      const col = collection(this.firestore, COORDINATORS_COLLECTION);
      const q = query(col, orderBy('surname', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const coordinators = snapshot.docs
            .map((docSnap) => mapSnapshotToCoordinator(docSnap))
            .filter((c): c is Coordinator => c !== null);
          observer.next(coordinators);
        },
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Returns a real-time Observable for a single coordinator.
   */
  getById$(coordinatorId: FirestoreId): Observable<Coordinator | null> {
    return new Observable<Coordinator | null>((observer) => {
      const docRef = doc(this.firestore, COORDINATORS_COLLECTION, coordinatorId);

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => observer.next(mapSnapshotToCoordinator(snapshot)),
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    });
  }

  // ── Coordinators — Writes ─────────────────────────────────────────────────

  /**
   * Updates a coordinator's info or adds post-trip feedback.
   */
  async update(payload: UpdateCoordinatorPayload): Promise<void> {
    const { id, ...rest } = payload;
    const docRef = doc(this.firestore, COORDINATORS_COLLECTION, id);
    const update: Record<string, unknown> = { updatedAt: serverTimestamp() };

    if (rest.name !== undefined) update['name'] = rest.name;
    if (rest.surname !== undefined) update['surname'] = rest.surname;
    if (rest.email !== undefined) update['email'] = rest.email;
    if (rest.phone !== undefined) update['phone'] = rest.phone;
    if (rest.agePreference !== undefined) update['agePreference'] = rest.agePreference;
    if (rest.notes !== undefined) update['notes'] = rest.notes;
    if (rest.feedback !== undefined) update['feedback'] = rest.feedback;

    await updateDoc(docRef, update);
  }

  /**
   * Deletes a coordinator profile.
   */
  async delete(coordinatorId: FirestoreId): Promise<void> {
    const docRef = doc(this.firestore, COORDINATORS_COLLECTION, coordinatorId);
    await deleteDoc(docRef);
  }

  // ── Candidacies — Real-Time Reads ────────────────────────────────────────

  /**
   * Returns a real-time Observable of all candidacies (admin view).
   * Ordered by submittedAt descending (newest first).
   */
  getAllCandidacies$(): Observable<ReadonlyArray<Candidacy>> {
    return new Observable<ReadonlyArray<Candidacy>>((observer) => {
      const col = collection(this.firestore, CANDIDACIES_COLLECTION);
      const q = query(col, orderBy('submittedAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const candidacies = snapshot.docs
            .map((docSnap) => mapSnapshotToCandidacy(docSnap))
            .filter((c): c is Candidacy => c !== null);
          observer.next(candidacies);
        },
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Returns a real-time Observable of pending candidacies for a specific trip.
   */
  getCandidaciesForTrip$(tripId: FirestoreId): Observable<ReadonlyArray<Candidacy>> {
    return new Observable<ReadonlyArray<Candidacy>>((observer) => {
      const col = collection(this.firestore, CANDIDACIES_COLLECTION);
      const q = query(
        col,
        where('tripIds', 'array-contains', tripId),
        where('status', '==', CandidacyStatus.PENDING),
        orderBy('submittedAt', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const candidacies = snapshot.docs
            .map((docSnap) => mapSnapshotToCandidacy(docSnap))
            .filter((c): c is Candidacy => c !== null);
          observer.next(candidacies);
        },
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    });
  }

  // ── Candidacies — Writes ──────────────────────────────────────────────────

  /**
   * Submits a public coordinator candidacy form.
   *
   * UPSERT logic:
   * - If a candidacy with the same email already exists → overwrite it.
   * - Otherwise → create a new document.
   *
   * @returns The candidacy document ID.
   */
  async submitCandidacy(payload: CandidacyFormPayload): Promise<FirestoreId> {
    const col = collection(this.firestore, CANDIDACIES_COLLECTION);
    const firestoreData = mapCandidacyFormToFirestore(payload);

    // Check for existing candidacy by email (upsert).
    const existingQuery = query(
      col,
      where('email', '==', payload.email.trim().toLowerCase()),
      limit(1)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      // Update existing candidacy — preserve coordinatorId if set.
      const existingDoc = existingSnapshot.docs[0];
      await setDoc(
        existingDoc.ref,
        {
          ...firestoreData,
          coordinatorId: existingDoc.data()['coordinatorId'] ?? null,
        },
        { merge: false }
      );
      return existingDoc.id as FirestoreId;
    }

    // Create new candidacy.
    const docRef: DocumentReference = await addDoc(col, firestoreData);
    return docRef.id as FirestoreId;
  }

  /**
   * Updates the status of a candidacy (e.g., PENDING → ASSIGNED or REJECTED).
   */
  async updateCandidacyStatus(
    candidacyId: FirestoreId,
    status: CandidacyStatus
  ): Promise<void> {
    const docRef = doc(this.firestore, CANDIDACIES_COLLECTION, candidacyId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  // ── Assignment Logic ──────────────────────────────────────────────────────

  /**
   * Assigns a coordinator to a trip.
   *
   * AssignmentType.AUTOMATIC:
   *   → Marks the candidacy as ASSIGNED
   *   → Marks ALL OTHER pending candidacies from the same coordinator as WITHDRAWN
   *   → Creates/updates the coordinator profile from candidacy data
   *
   * AssignmentType.MANUAL:
   *   → Creates the assignment record only
   *   → Does NOT touch other candidacies
   *   → Visually tagged "Already has a shift" in the UI
   *
   * @param tripId - The trip being assigned
   * @param candidacy - The candidacy being accepted
   * @param assignedById - The admin's UID making the assignment
   * @param type - AUTOMATIC or MANUAL
   */
  async assignCoordinatorToTrip(
    tripId: FirestoreId,
    candidacy: Candidacy,
    assignedById: FirestoreId,
    type: AssignmentType
  ): Promise<FirestoreId> {
    // 1. Upsert coordinator profile from candidacy data.
    const coordinatorId = await this.#upsertCoordinatorFromCandidacy(candidacy);

    // 2. Create the trip assignment sub-document.
    const assignmentsCol = collection(
      this.firestore,
      `trips/${tripId}/${ASSIGNMENTS_SUBCOLLECTION}`
    );
    const assignment: Omit<TripAssignment, 'id'> & { assignedAt: ReturnType<typeof serverTimestamp> } = {
      tripId,
      coordinatorId,
      assignedById,
      assignmentType: type,
      conflictingTripDate: null,
      assignedAt: serverTimestamp() as unknown as string, // Will be resolved by Firestore
    };
    const assignmentRef: DocumentReference = await addDoc(assignmentsCol, assignment);

    // 3. Update the accepted candidacy to ASSIGNED and link the coordinatorId.
    const candidacyRef = doc(this.firestore, CANDIDACIES_COLLECTION, candidacy.id);
    await updateDoc(candidacyRef, {
      status: CandidacyStatus.ASSIGNED,
      coordinatorId,
      updatedAt: serverTimestamp(),
    });

    // 4. For AUTOMATIC assignments: withdraw all OTHER pending candidacies
    //    from the same coordinator (matched by email).
    if (type === AssignmentType.AUTOMATIC) {
      await this.#withdrawOtherCandidacies(candidacy.id, candidacy.email);
    }

    return assignmentRef.id as FirestoreId;
  }

  /**
   * Returns all assignments for a given trip (one-time read).
   */
  getAssignmentsForTrip$(tripId: FirestoreId): Observable<ReadonlyArray<TripAssignment>> {
    return new Observable<ReadonlyArray<TripAssignment>>((observer) => {
      const assignmentsCol = collection(
        this.firestore,
        `trips/${tripId}/${ASSIGNMENTS_SUBCOLLECTION}`
      );

      const unsubscribe = onSnapshot(
        assignmentsCol,
        (snapshot) => {
          const assignments: TripAssignment[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id as FirestoreId,
              tripId: data['tripId'] as FirestoreId,
              coordinatorId: data['coordinatorId'] as FirestoreId,
              assignedById: data['assignedById'] as FirestoreId,
              assignmentType: data['assignmentType'] as AssignmentType,
              assignedAt: timestampToIso(data['assignedAt']),
              conflictingTripDate: (data['conflictingTripDate'] as string | null) ?? null,
            };
          });
          observer.next(assignments);
        },
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    });
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Creates or updates a coordinator profile from a candidacy submission.
   * Matches by email — if found, updates; if not found, creates.
   * Returns the coordinator's Firestore document ID.
   */
  async #upsertCoordinatorFromCandidacy(candidacy: Candidacy): Promise<FirestoreId> {
    const col = collection(this.firestore, COORDINATORS_COLLECTION);

    // Check if coordinator already exists by email.
    const q = query(col, where('email', '==', candidacy.email), limit(1));
    const snapshot = await getDocs(q);

    const firestoreData = mapCandidacyToCoordinatorFirestore(candidacy);

    if (!snapshot.empty) {
      const existingRef = snapshot.docs[0].ref;
      await updateDoc(existingRef, {
        name: firestoreData.name,
        surname: firestoreData.surname,
        phone: firestoreData.phone,
        agePreference: firestoreData.agePreference,
        notes: firestoreData.notes,
        updatedAt: serverTimestamp(),
      });
      return existingRef.id as FirestoreId;
    }

    const newRef: DocumentReference = await addDoc(col, firestoreData);
    return newRef.id as FirestoreId;
  }

  /**
   * Withdraws all PENDING candidacies from a coordinator (matched by email)
   * EXCEPT the one that was just accepted.
   * Used by the AUTOMATIC assignment flow.
   */
  async #withdrawOtherCandidacies(
    acceptedCandidacyId: FirestoreId,
    coordinatorEmail: string
  ): Promise<void> {
    const col = collection(this.firestore, CANDIDACIES_COLLECTION);
    const q = query(
      col,
      where('email', '==', coordinatorEmail.toLowerCase()),
      where('status', '==', CandidacyStatus.PENDING)
    );
    const snapshot = await getDocs(q);

    const withdrawals = snapshot.docs
      .filter((d) => d.id !== acceptedCandidacyId)
      .map((d) =>
        updateDoc(d.ref, {
          status: CandidacyStatus.WITHDRAWN,
          updatedAt: serverTimestamp(),
        })
      );

    await Promise.all(withdrawals);
  }
}

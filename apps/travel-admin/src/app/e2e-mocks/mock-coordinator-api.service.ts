import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Coordinator, Candidacy, TripAssignment, AssignmentType, CandidacyStatus, CandidacyFormPayload, UpdateCoordinatorPayload, AgePreference } from 'coordinators-models';
import { FirestoreId, Nationality } from 'shared-models';

@Injectable({ providedIn: 'root' })
export class MockCoordinatorApiService {
  private coordinators = new BehaviorSubject<Coordinator[]>([]);
  private candidacies = new BehaviorSubject<Candidacy[]>([
    {
      id: 'cand123' as FirestoreId,
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario@example.com',
      whatsapp: '+39123456',
      agePreference: AgePreference.ADULT,
      nationality: 'IT' as Nationality,
      tripIds: ['trip123' as FirestoreId],
      status: CandidacyStatus.PENDING,
      notes: '',
      coordinatorId: null,
      submittedAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
  ]);
  private assignments = new BehaviorSubject<TripAssignment[]>([]);

  getAll$(): Observable<ReadonlyArray<Coordinator>> {
    return this.coordinators.asObservable();
  }

  getById$(coordinatorId: FirestoreId): Observable<Coordinator | null> {
    return this.coordinators.pipe(
      map(c => c.find(x => x.id === coordinatorId) ?? null)
    );
  }

  async update(payload: UpdateCoordinatorPayload): Promise<void> {
    const current = this.coordinators.getValue();
    const updated = current.map(c => c.id === payload.id ? { ...c, ...payload, updatedAt: new Date().toISOString() } : c);
    this.coordinators.next(updated as any);
  }

  async delete(coordinatorId: FirestoreId): Promise<void> {
    const current = this.coordinators.getValue();
    this.coordinators.next(current.filter(c => c.id !== coordinatorId));
  }

  getCandidaciesByStatus$(status: CandidacyStatus | 'ALL'): Observable<ReadonlyArray<Candidacy>> {
    return this.candidacies.pipe(
      map(c => status === 'ALL' ? c : c.filter(x => x.status === status))
    );
  }

  getCandidaciesForTrip$(tripId: FirestoreId): Observable<ReadonlyArray<Candidacy>> {
    return this.candidacies.pipe(
      map(c => c.filter(x => x.tripIds.includes(tripId) && x.status === CandidacyStatus.PENDING))
    );
  }

  async submitCandidacy(payload: CandidacyFormPayload): Promise<FirestoreId> {
    const id = `cand-${Date.now()}` as FirestoreId;
    const newCand: Candidacy = {
      id,
      ...payload,
      status: CandidacyStatus.PENDING,
      coordinatorId: null,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    this.candidacies.next([...this.candidacies.getValue(), newCand]);
    return id;
  }

  async updateCandidacyStatus(candidacyId: FirestoreId, status: CandidacyStatus): Promise<void> {
    const current = this.candidacies.getValue();
    const updated = current.map(c => c.id === candidacyId ? { ...c, status, updatedAt: new Date().toISOString() } : c);
    this.candidacies.next(updated);
  }

  async assignCoordinatorToTrip(
    tripId: FirestoreId,
    candidacy: Candidacy,
    assignedById: FirestoreId,
    type: AssignmentType
  ): Promise<FirestoreId> {
    const assignmentId = `assign-${Date.now()}` as FirestoreId;
    const newAssignment: TripAssignment = {
      id: assignmentId,
      tripId,
      coordinatorId: 'mock-coord-123' as FirestoreId,
      assignedById,
      assignmentType: type,
      conflictingTripDate: null,
      assignedAt: new Date().toISOString()
    };
    this.assignments.next([...this.assignments.getValue(), newAssignment]);

    await this.updateCandidacyStatus(candidacy.id, CandidacyStatus.ASSIGNED);

    if (type === AssignmentType.AUTOMATIC) {
      const current = this.candidacies.getValue();
      const updated = current.map(c =>
        (c.email === candidacy.email && c.status === CandidacyStatus.PENDING)
          ? { ...c, status: CandidacyStatus.WITHDRAWN }
          : c
      );
      this.candidacies.next(updated);
    }
    return assignmentId;
  }

  getAssignmentsForTrip$(tripId: FirestoreId): Observable<ReadonlyArray<TripAssignment>> {
    return this.assignments.pipe(
      map(a => a.filter(x => x.tripId === tripId))
    );
  }

  async upsertCoordinatorFromCsv(name: string, surname: string, email: string, phone: string): Promise<FirestoreId> {
    return 'mock-coord-csv' as FirestoreId;
  }

  async deleteManyCoordinators(): Promise<void> {
    await Promise.resolve();
  }
  async deleteCandidacy(): Promise<void> {
    await Promise.resolve();
  }
  async deleteManyCandidacies(): Promise<void> {
    await Promise.resolve();
  }
}

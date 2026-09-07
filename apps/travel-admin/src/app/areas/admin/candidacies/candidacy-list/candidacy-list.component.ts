import { Component, ChangeDetectionStrategy, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { CoordinatorApiService } from 'coordinators-api-requests';
import { TripApiService } from 'trips-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import { Candidacy, CandidacyStatus, AssignmentType, Coordinator } from 'coordinators-models';
import { FirestoreId } from 'shared-models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { combineLatest, map, BehaviorSubject, switchMap } from 'rxjs';
import { Trip } from 'trips-models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatchmakingPreviewDialogComponent, MatchmakingResult } from './matchmaking-preview-dialog.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

interface CandidacyViewModel extends Candidacy {
  tripDetails: { destination: string, code: string }[];
}

@Component({
  selector: 'tha-candidacy-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    MatCheckboxModule,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <div class="tha-flex-row tha-mb-6" style="justify-content: space-between; align-items: center;">
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">Candidacies</h1>
        <div class="tha-flex-row tha-gap-4">
          <button 
            *ngIf="isSuperAdmin() && selection.selected.length > 0"
            mat-flat-button 
            color="warn" 
            (click)="deleteSelected()"
          >
            <mat-icon>delete</mat-icon> Delete Selected ({{ selection.selected.length }})
          </button>
          <button mat-flat-button color="accent" *ngIf="isSuperAdmin()" (click)="runMatchmaking()">
            <mat-icon>flash_on</mat-icon>
            Run Automatic Assignment
          </button>
        </div>
      </div>

      <div class="tha-card tha-shadow-sm tha-p-0">
        <div class="tha-p-4 tha-grid-2" style="border-bottom: 1px solid var(--tha-border); gap: var(--tha-spacing-4);">
          <mat-form-field appearance="outline" class="tha-full-width" style="margin-bottom: -1.25em;">
            <mat-label>Search candidacies</mat-label>
            <input matInput (keyup)="applySearchFilter($event)" placeholder="e.g. Mario Rossi" #input>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="tha-full-width" style="margin-bottom: -1.25em;">
            <mat-label>Filter by Status</mat-label>
            <mat-select (selectionChange)="applyStatusFilter($event.value)" [value]="currentStatus">
              <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div style="overflow-x: auto;">
        <div style="overflow-x: auto;">
          <table mat-table [dataSource]="dataSource" matSort class="tha-full-width">
            
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef style="width: 50px;">
                <mat-checkbox 
                  *ngIf="isSuperAdmin()"
                  (change)="$event ? toggleAllRows() : null"
                  [checked]="selection.hasValue() && isAllSelected()"
                  [indeterminate]="selection.hasValue() && !isAllSelected()"
                  color="primary"
                >
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let candidacy">
                <mat-checkbox 
                  *ngIf="isSuperAdmin()"
                  (click)="$event.stopPropagation()"
                  (change)="$event ? selection.toggle(candidacy) : null"
                  [checked]="selection.isSelected(candidacy)"
                  color="primary"
                >
                </mat-checkbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Applicant </th>
              <td mat-cell *matCellDef="let candidacy">
                <span class="tha-font-bold">{{ candidacy.name }} {{ candidacy.surname }}</span>
                <div class="tha-text-xs tha-text-muted">{{ candidacy.email }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="trips">
              <th mat-header-cell *matHeaderCellDef> Applied Trips </th>
              <td mat-cell *matCellDef="let candidacy">
                <div class="tha-flex-wrap tha-gap-1" style="display: flex;">
                  <span class="tha-chip tha-chip-sm tha-chip-primary" *ngFor="let trip of candidacy.tripDetails">
                    {{ trip.destination }} ({{ trip.code }})
                  </span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="submittedAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Submitted </th>
              <td mat-cell *matCellDef="let candidacy" class="tha-text-sm"> {{ candidacy.submittedAt | date:'medium' }} </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
              <td mat-cell *matCellDef="let candidacy">
                <tha-status-badge [status]="candidacy.status"></tha-status-badge>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let candidacy" style="text-align: right;">
                <button mat-icon-button [matMenuTriggerFor]="menu" [disabled]="candidacy.status !== 'PENDING'" color="primary">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <!-- For simplicity in this demo, if there are multiple trips, we assign to the first one. In reality we'd prompt for which trip. -->
                  <button mat-menu-item (click)="assign(candidacy, 'AUTOMATIC')">
                    <mat-icon class="tha-text-success">flash_on</mat-icon>
                    <span>Automatic Assign</span>
                  </button>
                  <button mat-menu-item (click)="assign(candidacy, 'MANUAL')">
                    <mat-icon class="tha-text-primary">person_add</mat-icon>
                    <span>Manual Assign</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="reject(candidacy)">
                    <mat-icon class="tha-text-error">close</mat-icon>
                    <span>Reject Candidacy</span>
                  </button>
                  <mat-divider *ngIf="isSuperAdmin()"></mat-divider>
                  <button *ngIf="isSuperAdmin()" mat-menu-item (click)="deleteSingle(candidacy, $event)" class="tha-text-error">
                    <mat-icon class="tha-text-error">delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="tha-table-row-hover"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell tha-empty-state-cell" colspan="6">
                <div class="tha-empty-state">
                  <mat-icon class="tha-empty-icon">assignment</mat-icon>
                  <h3 class="tha-empty-title">No candidacies found</h3>
                  <p class="tha-empty-subtitle">There are currently no candidacies matching your criteria.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" aria-label="Select page of candidacies"></mat-paginator>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .tha-table-row-hover:hover {
        background-color: var(--tha-surface-variant);
      }
    `,
  ],
})
export class CandidacyListComponent implements AfterViewInit {
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly tripApi = inject(TripApiService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly isSuperAdmin = this.authService.isSuperAdmin;
  readonly statuses = Object.values(CandidacyStatus);
  protected displayedColumns: string[] = ['name', 'trips', 'submittedAt', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<CandidacyViewModel>();
  readonly selection = new SelectionModel<CandidacyViewModel>(true, []);

  private currentSearch = '';
  protected currentStatus = CandidacyStatus.PENDING;
  private readonly statusSubject = new BehaviorSubject<CandidacyStatus | 'ALL'>(CandidacyStatus.PENDING);
  private allTrips: Trip[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    this.statusSubject.pipe(
      switchMap((status) => combineLatest([
        this.coordinatorApi.getCandidaciesByStatus$(status, 500),
        this.tripApi.getAll$(),
      ]))
    )
      .pipe(
        map(([candidacies, trips]) => {
          this.allTrips = [...trips];
          return candidacies.map((c) => {
            const tripDetails = c.tripIds.map((tid) => {
              const trip = trips.find((t) => t.id === tid);
              return {
                destination: trip?.destination ?? 'Unknown Trip',
                code: trip?.code ?? 'N/A'
              };
            });
            return {
              ...c,
              tripDetails
            } as CandidacyViewModel;
          });
        })
      )
      .subscribe((data) => {
        this.dataSource.data = data;
      });

    // Custom filter logic ONLY for text search now, since status is handled by backend
    this.dataSource.filterPredicate = (data: CandidacyViewModel, filter: string) => {
      if (!filter) return true;
      const dataStr = `${data.name} ${data.surname} ${data.email}`.toLowerCase();
      return dataStr.includes(filter);
    };
    this.updateFilter();
  }

  ngAfterViewInit() {
    if (this.isSuperAdmin()) {
      this.displayedColumns = ['select', ...this.displayedColumns];
    }
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applySearchFilter(event: Event) {
    this.currentSearch = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.updateFilter();
  }

  applyStatusFilter(status: CandidacyStatus | 'ALL') {
    this.currentStatus = status as any;
    this.statusSubject.next(status);
    this.updateFilter();
  }

  private updateFilter() {
    this.dataSource.filter = this.currentSearch;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  runMatchmaking() {
    const pendingCandidacies = this.dataSource.data.filter(c => c.status === CandidacyStatus.PENDING);
    // Sort oldest first (FCFS)
    pendingCandidacies.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    const matches: MatchmakingResult[] = [];
    const usedTripIds = new Set<string>();

    for (const candidacy of pendingCandidacies) {
      for (const tripId of candidacy.tripIds) {
        if (usedTripIds.has(tripId)) continue;

        const trip = this.allTrips.find(t => t.id === tripId);
        if (!trip) continue;

        if (trip.coordinatorId) continue;

        if (trip.nationality === candidacy.nationality) {
          // Match found
          matches.push({
            candidacyId: candidacy.id,
            candidacy: candidacy,
            coordinatorName: `${candidacy.name} ${candidacy.surname}`,
            coordinatorPhone: candidacy.whatsapp,
            tripId: trip.id,
            destination: trip.destination,
            tripCode: trip.code || 'N/A'
          });
          usedTripIds.add(trip.id);
          break; // Move to the next candidacy
        }
      }
    }

    this.dialog.open(MatchmakingPreviewDialogComponent, {
      data: matches,
      width: '600px'
    });
  }

  async reject(candidacy: Candidacy) {
    if (confirm(`Reject candidacy for ${candidacy.name}?`)) {
      try {
        await this.coordinatorApi.updateCandidacyStatus(candidacy.id, CandidacyStatus.REJECTED);
        this.snackBar.open('Candidacy rejected', 'Close', { duration: 3000 });
      } catch (err) {
        this.snackBar.open('Failed to reject candidacy', 'Close', { duration: 3000 });
      }
    }
  }

  async assign(candidacy: Candidacy, typeStr: string) {
    const type = typeStr === 'AUTOMATIC' ? AssignmentType.AUTOMATIC : AssignmentType.MANUAL;

    // In this basic demo, if they applied to multiple trips, we just take the first one.
    // A robust system would ask which trip to assign to.
    const tripId = candidacy.tripIds[0];
    if (!tripId) {
      this.snackBar.open('No trips selected in this candidacy', 'Close', { duration: 3000 });
      return;
    }

    const trip = this.allTrips.find(t => t.id === tripId);
    if (!trip) {
      this.snackBar.open('Trip not found', 'Close', { duration: 3000 });
      return;
    }

    if (type === AssignmentType.AUTOMATIC && candidacy.nationality !== trip.nationality) {
      this.snackBar.open(`Nationality mismatch: Candidacy (${candidacy.nationality}) vs Trip (${trip.nationality})`, 'Close', { duration: 5000 });
      return;
    }

    const adminId = this.authService.currentUser()?.uid as FirestoreId;
    if (!adminId) return;

    try {
      // Create assignment and upsert coordinator
      await this.coordinatorApi.assignCoordinatorToTrip(tripId, candidacy, adminId, type);

      // Update the Trip document to reflect the newly assigned coordinator
      // In a robust implementation we might need to look up the coordinator ID first if they existed,
      // but assignCoordinatorToTrip returns it? The API does return the new coordinatorId.
      // Wait, let's look at `assignCoordinatorToTrip` again. It returns `assignmentRef.id`. We need the coordinatorId.
      // Actually we can just wait for the Candidacy to be updated to ASSIGNED and see its `coordinatorId`... 
      // But we need to update the trip now. Let's do a trick: find the coordinator by email.

      const coordinators = await new Promise<Coordinator[]>((resolve) => {
        const sub = this.coordinatorApi.getAll$().subscribe(c => {
          resolve([...c]);
          sub.unsubscribe();
        });
      });
      const coordinator = coordinators.find(c => c.email === candidacy.email);
      if (coordinator) {
        await this.tripApi.update({
          id: tripId,
          coordinatorId: coordinator.id
        });
      }

      this.snackBar.open(`Coordinator assigned successfully (${typeStr})`, 'Close', { duration: 3000 });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Failed to assign coordinator', 'Close', { duration: 3000 });
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.filteredData);
  }

  async deleteSingle(candidacy: CandidacyViewModel, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Candidacy',
        message: `Are you sure you want to delete the candidacy for "${candidacy.name} ${candidacy.surname}"? This action cannot be undone.`,
        dangerous: true,
        confirmLabel: 'Delete'
      } as ConfirmDialogData
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await this.coordinatorApi.deleteCandidacy(candidacy.id);
        this.selection.deselect(candidacy);
        this.snackBar.open('Candidacy deleted successfully', 'Close', { duration: 3000 });
      } catch (err) {
        console.error(err);
        this.snackBar.open('Failed to delete candidacy', 'Close', { duration: 3000 });
      }
    }
  }

  async deleteSelected() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Multiple Candidacies',
        message: `Are you sure you want to delete ${this.selection.selected.length} candidacies? This action cannot be undone.`,
        dangerous: true,
        confirmLabel: 'Delete All'
      } as ConfirmDialogData
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        const ids = this.selection.selected.map(c => c.id);
        await this.coordinatorApi.deleteManyCandidacies(ids);
        this.selection.clear();
        this.snackBar.open(`Successfully deleted ${ids.length} candidacies`, 'Close', { duration: 3000 });
      } catch (err) {
        console.error(err);
        this.snackBar.open('Failed to batch delete candidacies', 'Close', { duration: 3000 });
      }
    }
  }
}

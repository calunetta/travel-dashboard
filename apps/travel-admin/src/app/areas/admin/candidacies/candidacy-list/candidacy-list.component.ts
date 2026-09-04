import { Component, ChangeDetectionStrategy, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { combineLatest, map } from 'rxjs';
import { Trip } from 'trips-models';

interface CandidacyViewModel extends Candidacy {
  tripNames: string[];
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
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <div class="tha-flex-row tha-mb-6" style="justify-content: space-between; align-items: center;">
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">Candidacies</h1>
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
            <mat-select (selectionChange)="applyStatusFilter($event.value)" value="ALL">
              <mat-option value="ALL">All Statuses</mat-option>
              <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div style="overflow-x: auto;">
          <table mat-table [dataSource]="dataSource" matSort class="tha-full-width">
            
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
                <div class="tha-text-sm" *ngFor="let tripName of candidacy.tripNames">
                  • {{ tripName }}
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
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="tha-table-row-hover"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell tha-p-4 tha-text-center tha-text-muted" colspan="5">
                No candidacies found matching the filter.
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

  readonly statuses = Object.values(CandidacyStatus);
  readonly displayedColumns: string[] = ['name', 'trips', 'submittedAt', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<CandidacyViewModel>();

  private currentSearch = '';
  private currentStatus = 'ALL';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    combineLatest([
      this.coordinatorApi.getAllCandidacies$(),
      this.tripApi.getAll$(),
    ])
      .pipe(
        map(([candidacies, trips]) => {
          return candidacies.map((c) => {
            const tripNames = c.tripIds.map(
              (tid) => trips.find((t) => t.id === tid)?.destination ?? 'Unknown Trip'
            );
            return {
              ...c,
              tripNames,
            } as CandidacyViewModel;
          });
        })
      )
      .subscribe((viewModels) => {
        this.dataSource.data = viewModels;
      });

    this.dataSource.filterPredicate = (data: CandidacyViewModel, filter: string) => {
      const parts = filter.split('|||');
      const search = parts[0];
      const statusFilter = parts[1];
      
      let searchMatch = true;
      if (search) {
        const dataStr = `${data.name} ${data.surname} ${data.email}`.toLowerCase();
        searchMatch = dataStr.indexOf(search) !== -1;
      }
      
      let statusMatch = true;
      if (statusFilter && statusFilter !== 'ALL') {
        statusMatch = data.status === statusFilter;
      }
      
      return searchMatch && statusMatch;
    };
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applySearchFilter(event: Event) {
    this.currentSearch = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.updateFilter();
  }
  
  applyStatusFilter(status: string) {
    this.currentStatus = status;
    this.updateFilter();
  }
  
  private updateFilter() {
    this.dataSource.filter = `${this.currentSearch}|||${this.currentStatus}`;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
}

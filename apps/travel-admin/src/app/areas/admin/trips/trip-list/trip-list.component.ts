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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

import { Router } from '@angular/router';
import { CsvImportDialogComponent } from '../csv-import-dialog/csv-import-dialog.component';
import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { AdminApiService } from 'auth-api-requests';
import { TourApiService } from 'tours-api-requests';
import { Trip } from 'trips-models';
import { Nationality } from 'shared-models';
import { combineLatest, map, firstValueFrom, startWith } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FirebaseAuthService } from 'auth-api-requests';
import { calculateHotelCost } from 'hotels-mapping-and-utils';

/** View model that combines trip data with joined hotel and coordinator names for display. */
interface TripViewModel extends Trip {
  coordinatorName: string | null;
  hotelName: string | null;
  hotelCostEur: number | null;
}

@Component({
  selector: 'tha-trip-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatCheckboxModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <div class="tha-flex-row tha-mb-6" style="justify-content: space-between; align-items: center;">
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">Trips</h1>
        <div class="tha-flex-row tha-gap-4">
          <button 
            *ngIf="isSuperAdmin() && selection.selected.length > 0"
            mat-flat-button 
            color="warn" 
            (click)="deleteSelected()"
          >
            <mat-icon>delete</mat-icon> Delete Selected ({{ selection.selected.length }})
          </button>
          <button mat-stroked-button color="primary" (click)="openBatchImport()">
            <mat-icon>upload_file</mat-icon> Batch Import (CSV)
          </button>
          <button mat-flat-button color="primary" routerLink="/admin/trips/new">
            <mat-icon>add</mat-icon> New Trip
          </button>
        </div>
      </div>

      <div class="tha-card tha-shadow-sm tha-p-0">
        <div class="tha-p-4 tha-flex-row tha-gap-4" [formGroup]="filterForm" style="border-bottom: 1px solid var(--tha-border); flex-wrap: wrap; align-items: baseline;">
          
          <mat-form-field appearance="outline" style="width: 150px;">
            <mat-label>Date Start</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="dateStart">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width: 200px;">
            <mat-label>Booked By</mat-label>
            <mat-select formControlName="bookedBy">
              <mat-option [value]="null">All Admins</mat-option>
              @for (admin of availableHotelBookers$ | async; track admin.id) {
                <mat-option [value]="admin.id">
                  {{ admin.name }} {{ admin.surname }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width: 200px;">
            <mat-label>Tour</mat-label>
            <mat-select formControlName="tourId">
              <mat-option [value]="null">All Tours</mat-option>
              @for (tour of tours$ | async; track tour.id) {
                <mat-option [value]="tour.id">
                  {{ tour.tourWeRoadCode }} ({{ tour.tourName }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width: 150px;">
            <mat-label>Nationality</mat-label>
            <mat-select formControlName="nationality">
              <mat-option [value]="null">All Nationalities</mat-option>
              @for (nat of nationalities; track nat) {
                <mat-option [value]="nat">
                  {{ nat }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" style="flex: 1; min-width: 200px;">
            <mat-label>Search trips</mat-label>
            <input matInput formControlName="search" placeholder="e.g. Bali">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

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
              <td mat-cell *matCellDef="let trip">
                <mat-checkbox 
                  *ngIf="isSuperAdmin()"
                  (click)="$event.stopPropagation()"
                  (change)="$event ? selection.toggle(trip) : null"
                  [checked]="selection.isSelected(trip)"
                  color="primary"
                >
                </mat-checkbox>
              </td>
            </ng-container>

            <!-- Destination Column -->
            <ng-container matColumnDef="destination">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Destination </th>
              <td mat-cell *matCellDef="let trip">
                <span class="tha-font-bold">{{ trip.destination }}</span>
                <div class="tha-text-xs tha-text-muted">{{ trip.weRoadTourSlug ?? 'No WeRoad mapping' }}</div>
              </td>
            </ng-container>


            <!-- Dates Column -->
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef> Dates </th>
              <td mat-cell *matCellDef="let trip">
                {{ trip.startDate | date:'dd/MM/yyyy' }} <br/> <span class="tha-text-xs tha-text-muted">to {{ trip.endDate | date:'dd/MM/yyyy' }} ({{ trip.durationDays }} days)</span>
              </td>
            </ng-container>

            <!-- Coordinator Column -->
            <ng-container matColumnDef="coordinator">
              <th mat-header-cell *matHeaderCellDef> Coordinator </th>
              <td mat-cell *matCellDef="let trip">
                <div class="tha-flex-row" style="align-items: center; gap: 4px;">
                  @if (trip.coordinatorName) {
                    <mat-icon class="tha-text-success" style="font-size: 16px; width: 16px; height: 16px;">check_circle</mat-icon>
                    <span class="tha-text-sm">{{ trip.coordinatorName }}</span>
                  } @else {
                    <mat-icon class="tha-text-muted" style="font-size: 16px; width: 16px; height: 16px;">cancel</mat-icon>
                    <span class="tha-text-sm tha-text-muted">Unassigned</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Hotel Column -->
            <ng-container matColumnDef="hotel">
              <th mat-header-cell *matHeaderCellDef> Hotel </th>
              <td mat-cell *matCellDef="let trip">
                <div class="tha-flex-col tha-gap-1">
                  <div class="tha-flex-row" style="align-items: center; gap: 4px;">
                    @if (trip.hotelName) {
                      <mat-icon class="tha-text-success" style="font-size: 16px; width: 16px; height: 16px;">check_circle</mat-icon>
                      <span class="tha-text-sm">{{ trip.hotelName }}</span>
                    } @else {
                      <mat-icon class="tha-text-muted" style="font-size: 16px; width: 16px; height: 16px;">cancel</mat-icon>
                      <span class="tha-text-sm tha-text-muted">Unassigned</span>
                    }
                  </div>
                  @if (trip.hotelCostEur !== null) {
                    <span class="tha-text-xs tha-text-muted tha-ml-5">
                      €{{ trip.hotelCostEur | number:'1.2-2' }}
                      <span *ngIf="trip.manualHotelCost !== null" title="Manual override">*</span>
                    </span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="width: 50px; text-align: right;"></th>
              <td mat-cell *matCellDef="let trip" style="text-align: right;">
                <button 
                  *ngIf="isSuperAdmin()"
                  mat-icon-button 
                  [matMenuTriggerFor]="menu" 
                  (click)="$event.stopPropagation()"
                >
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="deleteSingle(trip, $event)" class="tha-text-error">
                    <mat-icon class="tha-text-error">delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>



            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                class="tha-table-row-hover tha-clickable-row"
                (click)="navigateToTrip(row.id)">
            </tr>

            <!-- Row shown when there is no matching data. -->
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell tha-empty-state-cell" colspan="6">
                <div class="tha-empty-state">
                  <mat-icon class="tha-empty-icon">flight_takeoff</mat-icon>
                  <h3 class="tha-empty-title">No trips found</h3>
                  <p class="tha-empty-subtitle">There are currently no trips matching your criteria. Create one to get started.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" aria-label="Select page of trips"></mat-paginator>
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
      .tha-clickable-row {
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
    `,
  ],
})
export class TripListComponent implements AfterViewInit {
  private readonly tripApi = inject(TripApiService);
  private readonly hotelApi = inject(HotelApiService);
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly tourApi = inject(TourApiService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSuperAdmin = this.authService.isSuperAdmin;
  displayedColumns: string[] = ['destination', 'dates', 'coordinator', 'hotel'];
  readonly dataSource = new MatTableDataSource<TripViewModel>();
  readonly selection = new SelectionModel<TripViewModel>(true, []);

  readonly nationalities = Object.values(Nationality);

  readonly filterForm = new FormGroup({
    search: new FormControl<string>(''),
    dateStart: new FormControl<Date | null>(null),
    bookedBy: new FormControl<string | null>(null),
    tourId: new FormControl<string | null>(null),
    nationality: new FormControl<Nationality | null>(null),
  });

  readonly availableHotelBookers$ = this.adminApi.getAll$().pipe(
    map(admins => admins.filter(admin => admin.role === 'SUPER_ADMIN' || admin.role === 'ADMIN'))
  );

  readonly tours$ = this.tourApi.getAll$();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    // Combine trips, hotels, and coordinators to resolve names
    combineLatest([
      this.tripApi.getAll$(),
      this.hotelApi.getAll$(),
      this.coordinatorApi.getAll$(),
      this.filterForm.valueChanges.pipe(startWith(this.filterForm.value))
    ])
      .pipe(
        map(([trips, hotels, coordinators, filters]) => {
          return trips.filter(trip => {
            if (filters.tourId && trip.tourId !== filters.tourId) return false;
            if (filters.nationality && trip.nationality !== filters.nationality) return false;
            if (filters.bookedBy && trip.hotelBookedBy !== filters.bookedBy) return false;
            if (filters.dateStart) {
              const filterDate = filters.dateStart;
              const tzOffset = filterDate.getTimezoneOffset() * 60000;
              const formattedDate = (new Date(filterDate.getTime() - tzOffset)).toISOString().split('T')[0];
              if (trip.startDate !== formattedDate) return false;
            }
            if (filters.search) {
              const hotel = hotels.find((h) => h.id === trip.hotelId);
              const coordinator = coordinators.find((c) => c.id === trip.coordinatorId);
              const searchStr = `${trip.destination} ${hotel?.name ?? ''} ${coordinator?.name ?? ''} ${coordinator?.surname ?? ''} ${trip.weRoadTourSlug ?? ''}`.toLowerCase();
              if (searchStr.indexOf(filters.search.toLowerCase()) === -1) return false;
            }
            return true;
          }).map((trip) => {
            const hotel = hotels.find((h) => h.id === trip.hotelId);
            const coordinator = coordinators.find((c) => c.id === trip.coordinatorId);
            
            let hotelCostEur: number | null = null;
            if (trip.manualHotelCost !== null) {
              hotelCostEur = trip.manualHotelCost;
            } else if (hotel) {
              hotelCostEur = calculateHotelCost(hotel, trip).grandTotalEur;
            }
            
            return {
              ...trip,
              hotelName: hotel ? hotel.name : null,
              coordinatorName: coordinator ? `${coordinator.name} ${coordinator.surname}` : null,
              hotelCostEur
            } as TripViewModel;
          });
        })
      )
      .subscribe((viewModels) => {
        this.dataSource.data = viewModels;
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      });
  }

  ngAfterViewInit() {
    if (this.isSuperAdmin()) {
      this.displayedColumns = ['select', ...this.displayedColumns, 'actions'];
    }
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
  navigateToTrip(tripId: string) {
    this.router.navigate(['/admin/trips', tripId]);
  }

  openBatchImport() {
    this.dialog.open(CsvImportDialogComponent, {
      width: '800px',
      disableClose: true // don't close randomly if clicking outside while importing
    });
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

  async deleteSingle(trip: TripViewModel, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Trip',
        message: `Are you sure you want to delete the trip to "${trip.destination}"? This action cannot be undone.`,
        dangerous: true,
        confirmLabel: 'Delete'
      } as ConfirmDialogData
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await this.tripApi.delete(trip.id);
        this.selection.deselect(trip);
        this.snackBar.open('Trip deleted successfully', 'Close', { duration: 3000 });
      } catch (err) {
        console.error(err);
        this.snackBar.open('Failed to delete trip', 'Close', { duration: 3000 });
      }
    }
  }

  async deleteSelected() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Multiple Trips',
        message: `Are you sure you want to delete ${this.selection.selected.length} trips? This action cannot be undone.`,
        dangerous: true,
        confirmLabel: 'Delete All'
      } as ConfirmDialogData
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        const ids = this.selection.selected.map(t => t.id);
        await this.tripApi.deleteMany(ids);
        this.selection.clear();
        this.snackBar.open(`Successfully deleted ${ids.length} trips`, 'Close', { duration: 3000 });
      } catch (err) {
        console.error(err);
        this.snackBar.open('Failed to batch delete trips', 'Close', { duration: 3000 });
      }
    }
  }
}

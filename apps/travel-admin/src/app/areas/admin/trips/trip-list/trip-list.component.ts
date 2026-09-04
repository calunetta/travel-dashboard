import { Component, ChangeDetectionStrategy, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { Trip } from 'trips-models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Observable, combineLatest, map } from 'rxjs';

/** View model that combines trip data with joined hotel and coordinator names for display. */
interface TripViewModel extends Trip {
  coordinatorName: string | null;
  hotelName: string | null;
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
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <div class="tha-flex-row tha-mb-6" style="justify-content: space-between; align-items: center;">
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">Trips</h1>
        <button mat-flat-button color="primary" routerLink="/admin/trips/new">
          <mat-icon>add</mat-icon> New Trip
        </button>
      </div>

      <div class="tha-card tha-shadow-sm tha-p-0">
        <div class="tha-p-4" style="border-bottom: 1px solid var(--tha-border);">
          <mat-form-field appearance="outline" class="tha-full-width" style="margin-bottom: -1.25em;">
            <mat-label>Search trips</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="e.g. Bali" #input>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <div style="overflow-x: auto;">
          <table mat-table [dataSource]="dataSource" matSort class="tha-full-width">
            
            <!-- Title Column -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Title </th>
              <td mat-cell *matCellDef="let trip">
                <span class="tha-font-bold">{{ trip.title }}</span>
                <div class="tha-text-xs tha-text-muted">{{ trip.weRoadTourSlug ?? 'No WeRoad mapping' }}</div>
              </td>
            </ng-container>

            <!-- Destination Column -->
            <ng-container matColumnDef="destination">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Destination </th>
              <td mat-cell *matCellDef="let trip"> {{ trip.destination }} </td>
            </ng-container>

            <!-- Dates Column -->
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef> Dates </th>
              <td mat-cell *matCellDef="let trip">
                {{ trip.startDate }} <br/> <span class="tha-text-xs tha-text-muted">to {{ trip.endDate }} ({{ trip.durationDays }} days)</span>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
              <td mat-cell *matCellDef="let trip">
                <tha-status-badge [status]="trip.status"></tha-status-badge>
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
                <div class="tha-flex-row" style="align-items: center; gap: 4px;">
                  @if (trip.hotelName) {
                    <mat-icon class="tha-text-success" style="font-size: 16px; width: 16px; height: 16px;">check_circle</mat-icon>
                    <span class="tha-text-sm">{{ trip.hotelName }}</span>
                  } @else {
                    <mat-icon class="tha-text-muted" style="font-size: 16px; width: 16px; height: 16px;">cancel</mat-icon>
                    <span class="tha-text-sm tha-text-muted">Unassigned</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let trip" style="text-align: right;">
                <button mat-icon-button color="primary" [routerLink]="['/admin/trips', trip.id]" aria-label="View Details" title="View Details">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="tha-table-row-hover"></tr>

            <!-- Row shown when there is no matching data. -->
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell tha-p-4 tha-text-center tha-text-muted" colspan="7">
                No trips found matching the filter.
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
    `,
  ],
})
export class TripListComponent implements AfterViewInit {
  private readonly tripApi = inject(TripApiService);
  private readonly hotelApi = inject(HotelApiService);
  private readonly coordinatorApi = inject(CoordinatorApiService);

  readonly displayedColumns: string[] = ['title', 'destination', 'dates', 'status', 'coordinator', 'hotel', 'actions'];
  readonly dataSource = new MatTableDataSource<TripViewModel>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    // Combine trips, hotels, and coordinators to resolve names
    combineLatest([
      this.tripApi.getAll$(),
      this.hotelApi.getAll$(),
      this.coordinatorApi.getAll$(),
    ])
      .pipe(
        map(([trips, hotels, coordinators]) => {
          return trips.map((trip) => {
            const hotel = hotels.find((h) => h.id === trip.hotelId);
            const coordinator = coordinators.find((c) => c.id === trip.coordinatorId);
            
            return {
              ...trip,
              hotelName: hotel ? hotel.name : null,
              coordinatorName: coordinator ? `${coordinator.name} ${coordinator.surname}` : null,
            } as TripViewModel;
          });
        })
      )
      .subscribe((viewModels) => {
        this.dataSource.data = viewModels;
      });
      
    // Custom filter predicate to search across resolved names too
    this.dataSource.filterPredicate = (data: TripViewModel, filter: string) => {
      const dataStr = `${data.title} ${data.destination} ${data.status} ${data.hotelName ?? ''} ${data.coordinatorName ?? ''} ${data.weRoadTourSlug ?? ''}`.toLowerCase();
      return dataStr.indexOf(filter) !== -1;
    };
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

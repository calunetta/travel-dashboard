import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { TripStatus } from 'trips-models';
import { CandidacyStatus } from 'coordinators-models';

@Component({
  selector: 'tha-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <h1 class="tha-text-3xl tha-font-bold tha-mb-6">Dashboard</h1>
      
      <div class="tha-grid-4 tha-mb-8">
        <!-- Active Trips -->
        <mat-card class="tha-card tha-shadow-sm">
          <mat-card-header class="tha-flex-row" style="align-items: center; justify-content: space-between;">
            <div class="tha-flex-row" style="align-items: center; gap: 8px;">
              <mat-icon color="primary">flight_takeoff</mat-icon>
              <mat-card-title class="tha-text-lg">Active Trips</mat-card-title>
            </div>
            <div class="tha-text-3xl tha-font-bold">
              {{ activeTripsCount() ?? '-' }}
            </div>
          </mat-card-header>
          <mat-card-actions align="end">
            <button mat-button color="primary" routerLink="/admin/trips">Manage</button>
          </mat-card-actions>
        </mat-card>

        <!-- Pending Candidacies -->
        <mat-card class="tha-card tha-shadow-sm">
          <mat-card-header class="tha-flex-row" style="align-items: center; justify-content: space-between;">
            <div class="tha-flex-row" style="align-items: center; gap: 8px;">
              <mat-icon style="color: var(--tha-warning);">assignment_late</mat-icon>
              <mat-card-title class="tha-text-lg">Pending Candidacies</mat-card-title>
            </div>
            <div class="tha-text-3xl tha-font-bold">
              {{ pendingCandidaciesCount() ?? '-' }}
            </div>
          </mat-card-header>
          <mat-card-actions align="end">
            <button mat-button color="primary" routerLink="/admin/candidacies">Review</button>
          </mat-card-actions>
        </mat-card>

        <!-- Registered Coordinators -->
        <mat-card class="tha-card tha-shadow-sm">
          <mat-card-header class="tha-flex-row" style="align-items: center; justify-content: space-between;">
            <div class="tha-flex-row" style="align-items: center; gap: 8px;">
              <mat-icon style="color: var(--tha-success);">group</mat-icon>
              <mat-card-title class="tha-text-lg">Coordinators</mat-card-title>
            </div>
            <div class="tha-text-3xl tha-font-bold">
              {{ coordinatorsCount() ?? '-' }}
            </div>
          </mat-card-header>
          <mat-card-actions align="end">
            <button mat-button color="primary" routerLink="/admin/coordinators">View All</button>
          </mat-card-actions>
        </mat-card>

        <!-- Registered Hotels -->
        <mat-card class="tha-card tha-shadow-sm">
          <mat-card-header class="tha-flex-row" style="align-items: center; justify-content: space-between;">
            <div class="tha-flex-row" style="align-items: center; gap: 8px;">
              <mat-icon style="color: #9c27b0;">hotel</mat-icon>
              <mat-card-title class="tha-text-lg">Hotels</mat-card-title>
            </div>
            <div class="tha-text-3xl tha-font-bold">
              {{ hotelsCount() ?? '-' }}
            </div>
          </mat-card-header>
          <mat-card-actions align="end">
            <button mat-button color="primary" routerLink="/admin/hotels">View All</button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <h2 class="tha-text-xl tha-font-bold tha-mb-4">Quick Actions</h2>
      <div class="tha-grid-4">
        <button mat-flat-button color="primary" class="tha-full-width" style="height: 60px;" routerLink="/admin/trips/new">
          <mat-icon>add</mat-icon> Create New Trip
        </button>
        <button mat-stroked-button color="primary" class="tha-full-width" style="height: 60px;" routerLink="/admin/hotels/new">
          <mat-icon>add_business</mat-icon> Add Hotel
        </button>
        <button mat-stroked-button class="tha-full-width" style="height: 60px;" routerLink="/admin/calendar">
          <mat-icon>calendar_month</mat-icon> View Calendar
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly tripApi = inject(TripApiService);
  private readonly hotelApi = inject(HotelApiService);
  private readonly coordinatorApi = inject(CoordinatorApiService);

  readonly activeTripsCount = toSignal(
    this.tripApi.getAll$().pipe(
      map(trips => trips.filter(t => t.status === TripStatus.PUBLISHED || t.status === TripStatus.FULL).length)
    ),
    { initialValue: null }
  );

  readonly hotelsCount = toSignal(
    this.hotelApi.getAll$().pipe(map(hotels => hotels.length)),
    { initialValue: null }
  );

  readonly coordinatorsCount = toSignal(
    this.coordinatorApi.getAll$().pipe(map(c => c.length)),
    { initialValue: null }
  );

  readonly pendingCandidaciesCount = toSignal(
    this.coordinatorApi.getAllCandidacies$().pipe(
      map(candidacies => candidacies.filter(c => c.status === CandidacyStatus.PENDING).length)
    ),
    { initialValue: null }
  );
}

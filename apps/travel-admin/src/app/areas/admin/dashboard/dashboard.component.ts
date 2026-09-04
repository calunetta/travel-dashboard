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
        <mat-card class="tha-card tha-shadow-sm tha-transition-normal" style="padding: var(--tha-spacing-4); cursor: pointer;" routerLink="/admin/trips">
          <div class="tha-flex-row" style="justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="tha-text-sm tha-text-muted tha-font-medium tha-mb-2" style="text-transform: uppercase; letter-spacing: 0.5px;">Active Trips</div>
              <div class="tha-text-4xl tha-font-bold">{{ activeTripsCount() ?? '-' }}</div>
            </div>
            <div style="padding: var(--tha-spacing-3); background: rgba(var(--tha-primary-500-rgb, 63, 123, 217), 0.1); border-radius: var(--tha-radius-full);">
              <mat-icon color="primary" style="font-size: 28px; width: 28px; height: 28px;">flight_takeoff</mat-icon>
            </div>
          </div>
        </mat-card>

        <!-- Pending Candidacies -->
        <mat-card class="tha-card tha-shadow-sm tha-transition-normal" style="padding: var(--tha-spacing-4); cursor: pointer;" routerLink="/admin/candidacies">
          <div class="tha-flex-row" style="justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="tha-text-sm tha-text-muted tha-font-medium tha-mb-2" style="text-transform: uppercase; letter-spacing: 0.5px;">Pending Candidacies</div>
              <div class="tha-text-4xl tha-font-bold">{{ pendingCandidaciesCount() ?? '-' }}</div>
            </div>
            <div style="padding: var(--tha-spacing-3); background: rgba(245, 124, 0, 0.1); border-radius: var(--tha-radius-full);">
              <mat-icon style="color: var(--tha-warning); font-size: 28px; width: 28px; height: 28px;">assignment_late</mat-icon>
            </div>
          </div>
        </mat-card>

        <!-- Registered Coordinators -->
        <mat-card class="tha-card tha-shadow-sm tha-transition-normal" style="padding: var(--tha-spacing-4); cursor: pointer;" routerLink="/admin/coordinators">
          <div class="tha-flex-row" style="justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="tha-text-sm tha-text-muted tha-font-medium tha-mb-2" style="text-transform: uppercase; letter-spacing: 0.5px;">Coordinators</div>
              <div class="tha-text-4xl tha-font-bold">{{ coordinatorsCount() ?? '-' }}</div>
            </div>
            <div style="padding: var(--tha-spacing-3); background: rgba(46, 125, 50, 0.1); border-radius: var(--tha-radius-full);">
              <mat-icon style="color: var(--tha-success); font-size: 28px; width: 28px; height: 28px;">group</mat-icon>
            </div>
          </div>
        </mat-card>

        <!-- Registered Hotels -->
        <mat-card class="tha-card tha-shadow-sm tha-transition-normal" style="padding: var(--tha-spacing-4); cursor: pointer;" routerLink="/admin/hotels">
          <div class="tha-flex-row" style="justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="tha-text-sm tha-text-muted tha-font-medium tha-mb-2" style="text-transform: uppercase; letter-spacing: 0.5px;">Hotels</div>
              <div class="tha-text-4xl tha-font-bold">{{ hotelsCount() ?? '-' }}</div>
            </div>
            <div style="padding: var(--tha-spacing-3); background: rgba(156, 39, 176, 0.1); border-radius: var(--tha-radius-full);">
              <mat-icon style="color: #9c27b0; font-size: 28px; width: 28px; height: 28px;">hotel</mat-icon>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <h2 class="tha-text-xl tha-font-bold tha-mb-4">Quick Actions</h2>
      <div class="tha-grid-4">
        <button mat-flat-button color="primary" class="tha-full-width" style="height: 56px; border-radius: var(--tha-radius-md);" routerLink="/admin/trips/new">
          <mat-icon>add</mat-icon> Create New Trip
        </button>
        <button mat-stroked-button color="primary" class="tha-full-width" style="height: 56px; border-radius: var(--tha-radius-md);" routerLink="/admin/hotels/new">
          <mat-icon>add_business</mat-icon> Add Hotel
        </button>
        <button mat-stroked-button class="tha-full-width" style="height: 56px; border-radius: var(--tha-radius-md);" routerLink="/admin/calendar">
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

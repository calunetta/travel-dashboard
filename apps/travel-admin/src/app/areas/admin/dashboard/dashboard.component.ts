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
import { CandidacyStatus } from 'coordinators-models';

@Component({
  selector: 'tha-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in dashboard-page">
      <h1 class="tha-text-3xl tha-font-bold tha-mb-6">Dashboard</h1>
      
      <div class="tha-grid-4 tha-mb-8">
        <!-- Active Trips -->
        <mat-card class="dashboard-card tha-transition-normal" routerLink="/admin/trips">
          <div class="card-content tha-flex-row">
            <div class="card-text">
              <div class="card-label">Active Trips</div>
              <div class="card-value">{{ activeTripsCount() ?? '-' }}</div>
            </div>
            <div class="icon-container primary-icon">
              <mat-icon>flight_takeoff</mat-icon>
            </div>
          </div>
        </mat-card>

        <!-- Pending Candidacies -->
        <mat-card class="dashboard-card tha-transition-normal" routerLink="/admin/candidacies">
          <div class="card-content tha-flex-row">
            <div class="card-text">
              <div class="card-label">Pending Candidacies</div>
              <div class="card-value">{{ pendingCandidaciesCount() ?? '-' }}</div>
            </div>
            <div class="icon-container warning-icon">
              <mat-icon>assignment_late</mat-icon>
            </div>
          </div>
        </mat-card>

        <!-- Registered Coordinators -->
        <mat-card class="dashboard-card tha-transition-normal" routerLink="/admin/coordinators">
          <div class="card-content tha-flex-row">
            <div class="card-text">
              <div class="card-label">Coordinators</div>
              <div class="card-value">{{ coordinatorsCount() ?? '-' }}</div>
            </div>
            <div class="icon-container success-icon">
              <mat-icon>group</mat-icon>
            </div>
          </div>
        </mat-card>

        <!-- Registered Hotels -->
        <mat-card class="dashboard-card tha-transition-normal" routerLink="/admin/hotels">
          <div class="card-content tha-flex-row">
            <div class="card-text">
              <div class="card-label">Hotels</div>
              <div class="card-value">{{ hotelsCount() ?? '-' }}</div>
            </div>
            <div class="icon-container info-icon">
              <mat-icon>hotel</mat-icon>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <h2 class="tha-text-xl tha-font-bold tha-mb-4">Quick Actions</h2>
      <div class="tha-grid-4">
        <button mat-flat-button color="primary" class="quick-action-btn primary-btn" routerLink="/admin/trips/new">
          <mat-icon>add</mat-icon> Create New Trip
        </button>
        <button mat-stroked-button color="primary" class="quick-action-btn secondary-btn" routerLink="/admin/hotels/new">
          <mat-icon>add_business</mat-icon> Add Hotel
        </button>
        <button mat-stroked-button class="quick-action-btn secondary-btn" routerLink="/admin/calendar">
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
      .dashboard-page {
        padding-bottom: 2rem;
      }
      .dashboard-card {
        cursor: pointer;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--tha-radius-lg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .dashboard-card:hover {
        transform: translateY(-4px);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }
      .card-content {
        padding: var(--tha-spacing-5);
        justify-content: space-between;
        align-items: center;
      }
      .card-text {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .card-label {
        font-size: 0.85rem;
        color: var(--tha-text-muted);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 0.5rem;
      }
      .card-value {
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1;
        color: var(--tha-text);
      }
      .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--tha-spacing-3);
        border-radius: var(--tha-radius-full);
      }
      .icon-container mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .primary-icon {
        background: rgba(var(--tha-primary-500-rgb, 63, 123, 217), 0.1);
        color: var(--tha-primary);
      }
      .warning-icon {
        background: rgba(245, 124, 0, 0.1);
        color: var(--tha-warning);
      }
      .success-icon {
        background: rgba(46, 125, 50, 0.1);
        color: var(--tha-success);
      }
      .info-icon {
        background: rgba(156, 39, 176, 0.1);
        color: #9c27b0;
      }
      .quick-action-btn {
        height: 56px;
        border-radius: var(--tha-radius-md);
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        letter-spacing: 0.5px;
        transition: all 0.2s ease-in-out;
      }
      .quick-action-btn mat-icon {
        margin-right: 8px;
      }
      .primary-btn {
        box-shadow: 0 4px 12px rgba(var(--tha-primary-500-rgb, 63, 123, 217), 0.3);
      }
      .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(var(--tha-primary-500-rgb, 63, 123, 217), 0.4);
      }
      .secondary-btn {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
      .secondary-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2) !important;
        transform: translateY(-2px);
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
      map(trips => {
        const now = new Date();
        return trips.filter(t => new Date(t.endDate) >= now).length;
      })
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

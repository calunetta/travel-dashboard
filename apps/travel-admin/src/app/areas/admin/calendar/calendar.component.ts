import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { Trip } from 'trips-models';

@Component({
  selector: 'tha-trip-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="tha-font-bold">{{ data.trip.destination }}</h2>
    <mat-dialog-content>
      <div class="tha-flex-col tha-gap-4 tha-py-4">
        <div class="tha-flex-row" style="align-items: center; gap: 8px;">
          <mat-icon color="primary">date_range</mat-icon>
          <span>{{ data.trip.startDate }} — {{ data.trip.endDate }} ({{ data.trip.durationDays }} days)</span>
        </div>
        
        <div class="tha-flex-row" style="align-items: center; gap: 8px;">
          <mat-icon color="accent">group</mat-icon>
          <span *ngIf="data.coordinatorName">{{ data.coordinatorName }}</span>
          <span *ngIf="!data.coordinatorName" class="tha-text-muted tha-italic">No Coordinator Assigned</span>
        </div>

        <div class="tha-flex-row" style="align-items: center; gap: 8px;">
          <mat-icon color="accent">hotel</mat-icon>
          <span *ngIf="data.hotelName">{{ data.hotelName }}</span>
          <span *ngIf="!data.hotelName" class="tha-text-muted tha-italic">No Hotel Assigned</span>
        </div>
        
        <div *ngIf="data.trip.notes" class="tha-mt-2">
          <strong>Notes:</strong>
          <p class="tha-text-muted">{{ data.trip.notes }}</p>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <button mat-flat-button color="primary" (click)="goToTrip()">Go to Trip Details</button>
    </mat-dialog-actions>
  `
})
export class TripDialogComponent {
  readonly data = inject(MAT_DIALOG_DATA) as { trip: Trip, hotelName: string | null, coordinatorName: string | null };
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef);

  goToTrip() {
    this.router.navigate(['/admin/trips', this.data.trip.id]);
    this.dialogRef.close();
  }
}


interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  trips: Trip[];
}

@Component({
  selector: 'tha-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatRippleModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in tha-full-height tha-flex-col">
      <!-- Header -->
      <div class="tha-flex-row tha-mb-6" style="justify-content: space-between; align-items: center; flex-shrink: 0;">
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">Trip Calendar</h1>
        
        <div class="tha-flex-row" style="align-items: center; gap: var(--tha-spacing-4);">
          <button mat-icon-button (click)="previousMonth()">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span class="tha-text-xl tha-font-bold" style="min-width: 150px; text-align: center;">
            {{ currentMonthName() }} {{ currentYear() }}
          </span>
          <button mat-icon-button (click)="nextMonth()">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <button mat-stroked-button (click)="today()">Today</button>
        </div>
      </div>

      <!-- Calendar Grid -->
      <mat-card class="tha-card tha-shadow-sm tha-flex-1 tha-p-0 tha-flex-col" style="overflow: hidden;">
        
        <!-- Days of week header -->
        <div class="calendar-header-row tha-surface-variant-bg tha-text-sm tha-font-bold tha-text-muted">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        <!-- Days Grid -->
        <div class="calendar-grid tha-flex-1">
          <div *ngFor="let day of calendarDays()" 
               class="calendar-day" 
               [class.out-of-month]="!day.isCurrentMonth"
               [class.is-today]="isToday(day.date)">
            
            <div class="day-number">{{ day.date.getDate() }}</div>
            
            <div class="trips-container">
              <div *ngFor="let trip of day.trips" 
                 class="trip-pill" 
                 [style.background-color]="getTripColor(trip.id)"
                 [style.color]="getTripTextColor(trip.id)"
                 (click)="openTripDialog(trip)"
                 (keydown.enter)="openTripDialog(trip)"
                 (keydown.space)="openTripDialog(trip)"
                 tabindex="0"
                 matRipple
                 [title]="trip.destination + ' (' + trip.startDate + ')'">
                <span class="trip-pill-text">{{ trip.destination }}</span>
              </div>
            </div>

          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .calendar-header-row {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--tha-border);
      }
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-auto-rows: minmax(100px, 1fr);
        overflow-y: auto;
      }
      .calendar-day {
        border-right: 1px solid var(--tha-border);
        border-bottom: 1px solid var(--tha-border);
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: var(--tha-surface);
      }
      .calendar-day:nth-child(7n) {
        border-right: none;
      }
      .calendar-day.out-of-month {
        background: var(--tha-surface-variant);
        opacity: 0.5;
      }
      .day-number {
        font-weight: 600;
        font-size: 14px;
        align-self: flex-end;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      .calendar-day.is-today .day-number {
        background: var(--tha-primary);
        color: white;
      }
      .trips-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow-y: auto;
        flex: 1;
      }
      .trip-pill {
        border-radius: 4px;
        text-decoration: none;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        display: block;
      }
      .trip-pill:hover {
        background: rgba(var(--tha-primary-rgb), 0.3);
      }
    `,
  ],
})
export class CalendarComponent {
  private readonly tripApi = inject(TripApiService);
  private readonly hotelApi = inject(HotelApiService);
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly dialog = inject(MatDialog);
  
  private readonly currentDate = signal(new Date());

  readonly currentMonthName = computed(() => {
    return this.currentDate().toLocaleString('default', { month: 'long' });
  });

  readonly currentYear = computed(() => {
    return this.currentDate().getFullYear();
  });

  // Load all trips (in a real app we'd filter by month)
  private readonly allTrips = toSignal(this.tripApi.getAll$(), { initialValue: [] });

  readonly calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const trips = this.allTrips();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get ISO day of week for the 1st of the month (1=Mon, 7=Sun)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Sunday

    const days: CalendarDay[] = [];

    // Previous month filler days
    const prevMonthDays = firstDayOfWeek - 1;
    for (let i = prevMonthDays; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        trips: this.getTripsForDate(d, trips),
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        trips: this.getTripsForDate(d, trips),
      });
    }

    // Next month filler days (to complete the grid, usually up to 35 or 42 cells total)
    const totalCells = days.length > 35 ? 42 : 35;
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        trips: this.getTripsForDate(d, trips),
      });
    }

    return days;
  });

  private getTripsForDate(date: Date, trips: ReadonlyArray<Trip>): Trip[] {
    const targetTime = date.getTime();
    return trips.filter((t) => {
      // Check if date falls within trip start/end bounds
      // Note: we set hours to 0 to ignore time parts in comparison
      const start = new Date(t.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(t.endDate);
      end.setHours(23,59,59,999);
      
      return targetTime >= start.getTime() && targetTime <= end.getTime();
    });
  }

  previousMonth() {
    const curr = this.currentDate();
    this.currentDate.set(new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
  }

  nextMonth() {
    const curr = this.currentDate();
    this.currentDate.set(new Date(curr.getFullYear(), curr.getMonth() + 1, 1));
  }

  today() {
    this.currentDate.set(new Date());
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  getTripColor(tripId: string): string {
    let hash = 0;
    for (let i = 0; i < tripId.length; i++) {
      hash = tripId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 25%)`;
  }
  
  getTripTextColor(tripId: string): string {
    let hash = 0;
    for (let i = 0; i < tripId.length; i++) {
      hash = tripId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 80%, 85%)`;
  }

  async openTripDialog(trip: Trip) {
    let hotelName: string | null = null;
    let coordinatorName: string | null = null;

    if (trip.hotelId) {
      try {
        const hotel = await firstValueFrom(this.hotelApi.getById$(trip.hotelId));
        if (hotel) hotelName = hotel.name;
      } catch (e) {
        console.error('Failed to load hotel', e);
      }
    }

    if (trip.coordinatorId) {
      try {
        const coord = await firstValueFrom(this.coordinatorApi.getById$(trip.coordinatorId));
        if (coord) coordinatorName = `${coord.name} ${coord.surname}`;
      } catch (e) {
        console.error('Failed to load coordinator', e);
      }
    }

    this.dialog.open(TripDialogComponent, {
      data: { trip, hotelName, coordinatorName },
      width: '400px'
    });
  }
}

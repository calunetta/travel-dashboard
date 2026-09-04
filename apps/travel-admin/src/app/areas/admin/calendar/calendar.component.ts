import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

import { TripApiService } from 'trips-api-requests';
import { Trip, TripStatus } from 'trips-models';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  trips: Trip[];
}

@Component({
  selector: 'tha-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatRippleModule],
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
              <a *ngFor="let trip of day.trips" 
                 class="trip-pill" 
                 [routerLink]="['/admin/trips', trip.id]"
                 matRipple
                 [title]="trip.title + ' (' + trip.destination + ')'">
                <span class="trip-pill-text">{{ trip.title }}</span>
              </a>
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
        background: var(--tha-primary-light);
        color: var(--tha-primary-dark);
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
      // Exclude cancelled trips from calendar maybe? Or just show all? Let's exclude cancelled.
      if (t.status === TripStatus.CANCELLED) return false;

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
}

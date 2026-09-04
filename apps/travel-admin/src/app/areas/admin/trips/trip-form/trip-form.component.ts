import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { CreateTripPayload, UpdateTripPayload, DEFAULT_ROOM_COMPOSITION } from 'trips-models';
import { FirestoreId } from 'shared-models';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
  selector: 'tha-trip-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in" style="max-width: 800px; margin: 0 auto;">
      <div class="tha-flex-row tha-flex-center tha-mb-6" style="justify-content: flex-start;">
        <button mat-icon-button routerLink="/admin/trips" aria-label="Back to Trips">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">{{ isEditMode ? 'Edit Trip' : 'Create New Trip' }}</h1>
      </div>

      <mat-card class="tha-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="tha-flex-col tha-gap-4">
            
            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Destination</mat-label>
                <input matInput formControlName="destination" placeholder="e.g. Bali, Indonesia" />
                <mat-error *ngIf="form.get('destination')?.hasError('required')">Destination is required.</mat-error>
              </mat-form-field>
            </div>

            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="form.get('startDate')?.hasError('required')">Start Date is required.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>End Date (Auto-calculated 8 days)</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate" readonly />
                <mat-datepicker-toggle matIconSuffix [for]="endPicker" disabled></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
            </div>
            
            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Assign Hotel (Optional)</mat-label>
                <mat-select formControlName="hotelId">
                  <mat-option [value]="null">-- None --</mat-option>
                  <mat-option *ngFor="let h of hotels$ | async" [value]="h.id">{{ h.name }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Assign Coordinator (Optional)</mat-label>
                <mat-select formControlName="coordinatorId">
                  <mat-option [value]="null">-- None --</mat-option>
                  <mat-option *ngFor="let c of coordinators$ | async" [value]="c.id">{{ c.name }} {{ c.surname }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>WeRoad Tour Slug (Optional)</mat-label>
                <input matInput formControlName="weRoadTourSlug" placeholder="e.g. bali-express" />
                <mat-hint>Links to WeRoad API for fetching fb group url</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="tha-full-width">
                <mat-label>Facebook Group URL (Optional)</mat-label>
                <input matInput formControlName="facebookGroupUrl" placeholder="https://facebook.com/groups/..." />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="tha-full-width">
              <mat-label>Notes (Optional)</mat-label>
              <textarea matInput formControlName="notes" rows="4" placeholder="Internal notes about this trip..."></textarea>
            </mat-form-field>

            <div class="tha-flex-end tha-mt-4">
              <button mat-stroked-button type="button" routerLink="/admin/trips" class="tha-mr-2">Cancel</button>
              <button 
                mat-flat-button 
                color="primary" 
                type="submit" 
                [disabled]="form.invalid || submitting"
              >
                {{ isEditMode ? 'Save Changes' : 'Create Trip' }}
              </button>
            </div>

          </form>
        </mat-card-content>
      </mat-card>
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
export class TripFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly tripApi = inject(TripApiService);
  private readonly hotelApi = inject(HotelApiService);
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  
  readonly hotels$ = this.hotelApi.getAll$();
  readonly coordinators$ = this.coordinatorApi.getAll$();
  
  isEditMode = false;
  tripId: FirestoreId | null = null;
  submitting = false;

  private sub = new Subscription();

  readonly form = this.fb.group({
    destination: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    hotelId: [null as FirestoreId | null],
    coordinatorId: [null as FirestoreId | null],
    notes: [''],
    weRoadTourSlug: [''],
    facebookGroupUrl: [''],
  });

  ngOnInit(): void {
    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.tripId = id as FirestoreId;
      this.loadTrip(this.tripId);
    }

    // Auto-calculate endDate (start + 7 days) to enforce 8-day duration
    this.sub.add(
      this.form.get('startDate')?.valueChanges.subscribe((startDate) => {
        if (startDate) {
          const end = new Date(startDate);
          end.setDate(end.getDate() + 7);
          this.form.patchValue({ endDate: end }, { emitEvent: false });
        } else {
          this.form.patchValue({ endDate: null }, { emitEvent: false });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private async loadTrip(id: FirestoreId): Promise<void> {
    try {
      const trip = await firstValueFrom(this.tripApi.getById$(id));
      if (trip) {
        this.form.patchValue({
          destination: trip.destination,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          hotelId: trip.hotelId,
          coordinatorId: trip.coordinatorId,
          notes: trip.notes,
          weRoadTourSlug: trip.weRoadTourSlug,
          facebookGroupUrl: trip.facebookGroupUrl,
        });
      }
    } catch (err) {
      console.error('Failed to load trip', err);
      this.snackBar.open('Failed to load trip details.', 'Close', { duration: 3000 });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formVal = this.form.getRawValue();

    // Format dates to ISO yyyy-mm-dd
    const formatDate = (date: Date): string => {
      const offset = date.getTimezoneOffset()
      const d = new Date(date.getTime() - (offset*60*1000))
      return d.toISOString().split('T')[0]
    };

    try {
      if (this.isEditMode && this.tripId) {
        const payload: UpdateTripPayload = {
          id: this.tripId,
          destination: formVal.destination!,
          startDate: formatDate(formVal.startDate!),
          endDate: formatDate(formVal.endDate!),
          hotelId: formVal.hotelId ?? null,
          coordinatorId: formVal.coordinatorId ?? null,
          notes: formVal.notes ?? '',
          weRoadTourSlug: formVal.weRoadTourSlug ?? null,
          facebookGroupUrl: formVal.facebookGroupUrl ?? null,
        };
        await this.tripApi.update(payload);
        this.snackBar.open('Trip updated successfully', 'Close', { duration: 3000 });
      } else {
        const payload: CreateTripPayload = {
          destination: formVal.destination!,
          startDate: formatDate(formVal.startDate!),
          endDate: formatDate(formVal.endDate!),
          durationDays: 8,
          hotelId: formVal.hotelId ?? null,
          coordinatorId: formVal.coordinatorId ?? null,
          notes: formVal.notes ?? '',
          weRoadTourSlug: formVal.weRoadTourSlug ?? null,
          facebookGroupUrl: formVal.facebookGroupUrl ?? null,
          roomComposition: DEFAULT_ROOM_COMPOSITION,
          hotelBookerId: null,
          documents: [],
        };
        const newId = await this.tripApi.create(payload);
        this.snackBar.open('Trip created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/trips', newId]);
        return; // Don't redirect to list, go to detail view
      }
      this.router.navigate(['/admin/trips']);
    } catch (err) {
      console.error('Failed to save trip', err);
      this.snackBar.open('Failed to save trip. Please check your connection.', 'Close', { duration: 5000 });
    } finally {
      this.submitting = false;
    }
  }
}

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, map } from 'rxjs';

import { TripApiService } from 'trips-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { TripStatus } from 'trips-models';
import { AgePreference, CandidacyFormPayload } from 'coordinators-models';
import type { FirestoreId } from 'shared-models';

@Component({
  selector: 'tha-candidacy-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in" style="max-width: 600px; margin: 0 auto;">
      <mat-card class="tha-card">
        <mat-card-header class="tha-mb-6">
          <mat-card-title class="tha-text-2xl tha-font-bold">Apply as Coordinator</mat-card-title>
          <mat-card-subtitle>Select the trips you are available for and provide your details.</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Loading state for trips -->
          <div *ngIf="tripsLoading() && !availableTrips()" class="tha-flex-center tha-p-8">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <form *ngIf="availableTrips() as trips" [formGroup]="form" (ngSubmit)="onSubmit()" class="tha-flex-col tha-gap-4">
            
            <div *ngIf="trips.length === 0" class="tha-p-4" style="background: var(--tha-warning-bg); color: var(--tha-warning); border-radius: var(--tha-radius-md);">
              <mat-icon style="vertical-align: middle; margin-right: 8px;">warning</mat-icon>
              <span>There are currently no published trips available for assignment.</span>
            </div>

            <!-- Trip Selection -->
            <mat-form-field appearance="outline" class="tha-full-width" *ngIf="trips.length > 0">
              <mat-label>Available Trips</mat-label>
              <mat-select formControlName="tripIds" multiple>
                <mat-option *ngFor="let trip of trips" [value]="trip.id">
                  {{ trip.title }} ({{ trip.startDate }} - {{ trip.endDate }})
                </mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('tripIds')?.hasError('required')">
                Please select at least one trip.
              </mat-error>
            </mat-form-field>

            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g. Mario" />
                <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="surname" placeholder="e.g. Rossi" />
                <mat-error *ngIf="form.get('surname')?.hasError('required')">Surname is required.</mat-error>
              </mat-form-field>
            </div>

            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="e.g. mario@example.com" />
                <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required.</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email address.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>WhatsApp Phone</mat-label>
                <input matInput type="tel" formControlName="whatsapp" placeholder="e.g. +393331234567" />
                <mat-error *ngIf="form.get('whatsapp')?.hasError('required')">Phone is required.</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="tha-full-width">
              <mat-label>Age Preference</mat-label>
              <mat-select formControlName="agePreference">
                <mat-option *ngFor="let age of agePreferences" [value]="age">
                  {{ age }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('agePreference')?.hasError('required')">Please select an age preference.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="tha-full-width">
              <mat-label>Notes / Cover Letter (Optional)</mat-label>
              <textarea matInput formControlName="notes" rows="4" placeholder="Tell us why you are a great fit..."></textarea>
            </mat-form-field>

            <div class="tha-flex-end tha-mt-4">
              <button 
                mat-flat-button 
                color="primary" 
                type="submit" 
                [disabled]="form.invalid || submitting() || trips.length === 0"
                style="min-width: 150px;"
              >
                <span *ngIf="!submitting()">Submit Candidacy</span>
                <mat-spinner *ngIf="submitting()" diameter="20" color="accent"></mat-spinner>
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
export class CandidacyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly tripApi = inject(TripApiService);
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly agePreferences = Object.values(AgePreference);

  // Observable of only PUBLISHED trips
  private readonly publishedTrips$ = this.tripApi.getAll$().pipe(
    map((trips) => trips.filter((t) => t.status === TripStatus.PUBLISHED))
  );

  // Expose to template as signals
  readonly availableTrips = toSignal(this.publishedTrips$, { initialValue: null });
  readonly tripsLoading = toSignal(
    new BehaviorSubject<boolean>(true).asObservable() // Simple mock for loading state until first emit
  );

  private readonly _submitting = new BehaviorSubject<boolean>(false);
  readonly submitting = toSignal(this._submitting.asObservable(), { initialValue: false });

  readonly form = this.fb.group({
    tripIds: [[] as FirestoreId[], [Validators.required, Validators.minLength(1)]],
    name: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    whatsapp: ['', Validators.required],
    agePreference: [AgePreference.ADULT, Validators.required],
    notes: [''],
  });

  // We rely on toSignal for trips, so no explicit subscribe needed for reading.


  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this._submitting.next(true);

    try {
      const formValue = this.form.getRawValue();
      const payload: CandidacyFormPayload = {
        tripIds: formValue.tripIds as FirestoreId[],
        name: formValue.name ?? '',
        surname: formValue.surname ?? '',
        email: formValue.email ?? '',
        whatsapp: formValue.whatsapp ?? '',
        agePreference: formValue.agePreference as AgePreference,
        notes: formValue.notes ?? '',
      };

      await this.coordinatorApi.submitCandidacy(payload);
      this.router.navigate(['/public/success']);
    } catch (err) {
      console.error('Failed to submit candidacy', err);
      this.snackBar.open('An error occurred while submitting your candidacy.', 'Close', {
        duration: 5000,
        panelClass: ['tha-error-snackbar'],
      });
    } finally {
      this._submitting.next(false);
    }
  }
}

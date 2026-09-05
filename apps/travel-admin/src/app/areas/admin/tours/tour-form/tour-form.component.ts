import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
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

import { TourApiService } from 'tours-api-requests';
import { AdminApiService, FirebaseAuthService } from 'auth-api-requests';
import type { CreateTourPayload, UpdateTourPayload } from 'tours-models';
import { FirestoreId, Nationality } from 'shared-models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'tha-tour-form',
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in" style="max-width: 800px; margin: 0 auto;">
      <div class="tha-flex-row tha-flex-col-sm tha-mb-6" style="gap: var(--tha-spacing-4);">
        <button mat-icon-button routerLink="/admin/tours" aria-label="Back to Tours">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">{{ isEditMode ? 'Edit Tour' : 'Create New Tour' }}</h1>
      </div>

      <mat-card class="tha-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="tha-flex-col tha-gap-4">
            
            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Tour Code</mat-label>
                <input matInput formControlName="tourWeRoadCode" placeholder="e.g. BALI" />
                <mat-error *ngIf="form.get('tourWeRoadCode')?.hasError('required')">Code is required.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tour Name</mat-label>
                <input matInput formControlName="tourName" placeholder="e.g. Bali Express" />
                <mat-error *ngIf="form.get('tourName')?.hasError('required')">Name is required.</mat-error>
              </mat-form-field>
            </div>

            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Country / Destination</mat-label>
                <input matInput formControlName="country" placeholder="e.g. Indonesia" />
                <mat-error *ngIf="form.get('country')?.hasError('required')">Country is required.</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Tour Length (Days)</mat-label>
                <input matInput type="number" formControlName="tourLength" />
                <mat-error *ngIf="form.get('tourLength')?.hasError('required')">Length is required.</mat-error>
                <mat-error *ngIf="form.get('tourLength')?.hasError('min')">Must be at least 1 day.</mat-error>
              </mat-form-field>
            </div>

            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Available Nationalities</mat-label>
                <mat-select formControlName="nationalities" multiple>
                  <mat-option *ngFor="let nat of availableNationalities" [value]="nat">
                    {{ nat }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('nationalities')?.hasError('required')">Required.</mat-error>
              </mat-form-field>
            </div>

            <mat-card class="tha-card tha-mt-4" style="border: 1px solid rgba(var(--tha-primary-rgb), 0.3); background: rgba(var(--tha-primary-rgb), 0.04);">
              <mat-card-header>
                <mat-icon mat-card-avatar style="color: var(--tha-primary);">admin_panel_settings</mat-icon>
                <mat-card-title style="font-size: 1rem;">Assign Tour Admins <span style="font-size: 0.75rem; opacity: 0.7;">(SUPER_ADMIN only)</span></mat-card-title>
                <mat-card-subtitle>Select which admins can manage this tour and its trips/hotels.</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content class="tha-pt-4">
                <mat-form-field appearance="outline" class="tha-full-width">
                  <mat-label>Assigned Admins</mat-label>
                  <mat-select formControlName="adminIds" multiple>
                    <mat-option *ngFor="let admin of allAdmins$ | async" [value]="admin.id">
                      {{ admin.name }} {{ admin.surname }} 
                      <span *ngIf="admin.role === 'SUPER_ADMIN'" style="font-size: 0.75rem; opacity: 0.6;">(Super Admin)</span>
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="form.get('adminIds')?.hasError('required')">At least one admin must be assigned.</mat-error>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <div class="tha-flex-end tha-mt-4">
              <button mat-stroked-button type="button" routerLink="/admin/tours" class="tha-mr-2">Cancel</button>
              <button 
                mat-flat-button 
                color="primary" 
                type="submit" 
                [disabled]="form.invalid || submitting"
              >
                {{ isEditMode ? 'Save Changes' : 'Create Tour' }}
              </button>
            </div>

          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TourFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tourApi = inject(TourApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly allAdmins$ = this.adminApi.getAll$();

  isEditMode = false;
  tourId: FirestoreId | null = null;
  submitting = false;

  readonly form = this.fb.group({
    tourWeRoadCode: ['', Validators.required],
    tourName: ['', Validators.required],
    country: ['', Validators.required],
    tourLength: [8, [Validators.required, Validators.min(1)]],
    nationalities: [[] as Nationality[], Validators.required],
    adminIds: [[] as FirestoreId[], Validators.required],
  });

  readonly availableNationalities: Nationality[] = [
    Nationality.IT, 
    Nationality.ES, 
    Nationality.UK, 
    Nationality.DE, 
    Nationality.FR
  ];

  ngOnInit(): void {
    // SECURITY: Only SUPER_ADMINs can access this route
    if (!this.authService.isSuperAdmin()) {
      this.snackBar.open('Unauthorized access.', 'Close', { duration: 3000 });
      this.router.navigate(['/admin/tours']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.tourId = id as FirestoreId;
      this.loadTour(this.tourId);
    } else {
      // By default, assign the creator to the tour
      const currentUid = this.authService.currentUser()?.uid;
      if (currentUid) {
        this.form.patchValue({ adminIds: [currentUid as FirestoreId] });
      }
    }
  }

  private async loadTour(id: FirestoreId): Promise<void> {
    try {
      const tour = await firstValueFrom(this.tourApi.getById$(id));
      if (tour) {
        this.form.patchValue({
          tourWeRoadCode: tour.tourWeRoadCode,
          tourName: tour.tourName,
          country: tour.country,
          tourLength: tour.tourLength,
          nationalities: (tour.nationalities || []) as Nationality[],
          adminIds: tour.adminIds as FirestoreId[],
        });
      }
    } catch (err) {
      console.error('Failed to load tour', err);
      this.snackBar.open('Failed to load tour details.', 'Close', { duration: 3000 });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formVal = this.form.getRawValue();

    try {
      if (this.isEditMode && this.tourId) {
        const payload: UpdateTourPayload = {
          id: this.tourId,
          tourWeRoadCode: formVal.tourWeRoadCode!,
          tourName: formVal.tourName!,
          country: formVal.country!,
          tourLength: formVal.tourLength!,
          nationalities: formVal.nationalities as readonly Nationality[],
          adminIds: formVal.adminIds as readonly FirestoreId[],
        };
        await this.tourApi.update(payload);
        this.snackBar.open('Tour updated successfully', 'Close', { duration: 3000 });
      } else {
        const payload: CreateTourPayload = {
          tourWeRoadCode: formVal.tourWeRoadCode!,
          tourName: formVal.tourName!,
          country: formVal.country!,
          tourLength: formVal.tourLength!,
          nationalities: formVal.nationalities as readonly Nationality[],
          adminIds: formVal.adminIds as readonly FirestoreId[],
        };
        await this.tourApi.create(payload);
        this.snackBar.open('Tour created successfully', 'Close', { duration: 3000 });
      }
      this.router.navigate(['/admin/tours']);
    } catch (err) {
      console.error('Failed to save tour', err);
      this.snackBar.open('Failed to save tour. Please check your connection.', 'Close', { duration: 5000 });
    } finally {
      this.submitting = false;
    }
  }
}

import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TripApiService, TripStorageService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { TourApiService } from 'tours-api-requests';
import { AdminApiService, FirebaseAuthService } from 'auth-api-requests';
import { TripCodeGenerator } from 'trips-mapping-and-utils';
import { CreateTripPayload, UpdateTripPayload, DEFAULT_ROOM_COMPOSITION } from 'trips-models';
import type { Tour } from 'tours-models';
import type { Admin } from 'auth-models';
import { FirestoreId, Nationality, FIREBASE_STORAGE_TOKEN } from 'shared-models';

import { Subscription, firstValueFrom, combineLatest } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

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
    MatChipsModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <div class="tha-flex-row tha-flex-col-sm tha-mb-6" style="gap: var(--tha-spacing-4);">
        <button mat-icon-button routerLink="/admin/trips" aria-label="Back to Trips">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">{{ isEditMode ? 'Edit Trip' : 'Create New Trip' }}</h1>
      </div>

      <mat-card class="tha-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="tha-flex-col tha-gap-4">
            
            <div class="tha-grid-3">
              <mat-form-field appearance="outline">
                <mat-label>Select Tour</mat-label>
                <mat-select formControlName="tourId">
                  <mat-option [value]="null">-- None --</mat-option>
                  <mat-option *ngFor="let t of tours$ | async" [value]="t.id">{{ t.tourName }} ({{ t.tourWeRoadCode }})</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('tourId')?.hasError('required')">Tour is required.</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Destination (Auto-fills from Tour)</mat-label>
                <input matInput formControlName="destination" placeholder="e.g. Bali, Indonesia" />
                <mat-error *ngIf="form.get('destination')?.hasError('required')">Destination is required.</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Nationality</mat-label>
                <mat-select formControlName="nationality">
                  <mat-option *ngFor="let nat of availableNationalities" [value]="nat">{{ nat }}</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('nationality')?.hasError('required')">Nationality is required.</mat-error>
              </mat-form-field>
            </div>

            <div class="tha-grid-4">
              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="form.get('startDate')?.hasError('required')">Start Date is required.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>End Date (Auto-calculated)</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate" readonly />
                <mat-datepicker-toggle matIconSuffix [for]="endPicker" disabled></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>

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
            
            <mat-card class="tha-mb-4" style="background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.05);">
              <mat-card-header>
                <mat-card-title style="font-size: 1rem;">Hotel Booking Details (Optional)</mat-card-title>
              </mat-card-header>
              <mat-card-content class="tha-pt-4 tha-grid-2">
                <mat-form-field appearance="outline">
                  <mat-label>Booked By</mat-label>
                  <mat-select formControlName="hotelBookedBy">
                    <mat-option [value]="null">-- None --</mat-option>
                    <mat-option *ngFor="let admin of availableHotelBookers$ | async" [value]="admin.id">
                      {{ admin.name }} {{ admin.surname }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Booking Method</mat-label>
                  <input matInput formControlName="hotelBookingMethod" placeholder="e.g. Credit Card, Booking.com" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Manual Hotel Cost (€)</mat-label>
                  <input matInput type="number" formControlName="manualHotelCost" placeholder="e.g. 500" />
                  <mat-hint>Overrides calculated cost</mat-hint>
                </mat-form-field>
                <div class="tha-flex-col tha-mt-2 tha-full-width" style="grid-column: span 2;">
                  <span class="tha-text-sm tha-font-bold tha-mb-2">Booking Receipt (Image)</span>
                  <input type="file" accept="image/*" (change)="onReceiptSelected($event)" #receiptInput style="display: none;" />
                  <div class="tha-flex-row tha-items-center tha-gap-4">
                    <button *ngIf="isEditing()" mat-stroked-button type="button" (click)="receiptInput.click()">
                      <mat-icon>upload_file</mat-icon> Select Image
                    </button>
                    <span class="tha-text-xs tha-text-muted">{{ selectedReceiptFile ? selectedReceiptFile.name : (form.get('hotelBookingReceiptUrl')?.value ? 'Receipt already uploaded' : 'No file selected') }}</span>
                    <a *ngIf="form.get('hotelBookingReceiptUrl')?.value && !selectedReceiptFile" [href]="form.get('hotelBookingReceiptUrl')?.value" target="_blank" class="tha-text-primary tha-text-xs tha-flex-row tha-items-center">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">open_in_new</mat-icon> View Existing
                    </a>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- SUPER_ADMIN only: Assign admins to trip -->
            <mat-card *ngIf="isSuperAdmin()" class="tha-card" style="border: 1px solid rgba(var(--tha-primary-rgb), 0.3); background: rgba(var(--tha-primary-rgb), 0.04);">
              <mat-card-header>
                <mat-icon mat-card-avatar style="color: var(--tha-primary);">admin_panel_settings</mat-icon>
                <mat-card-title style="font-size: 1rem;">Assign Admins to Trip <span style="font-size: 0.75rem; opacity: 0.7;">(SUPER_ADMIN only)</span></mat-card-title>
                <mat-card-subtitle>Select which admins can manage this trip. Defaults to the Tour's admin list.</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content class="tha-pt-4">
                <mat-form-field appearance="outline" class="tha-full-width">
                  <mat-label>Assigned Admins</mat-label>
                  <mat-select formControlName="assignedAdminIds" multiple>
                    <mat-option *ngFor="let admin of allAdmins$ | async" [value]="admin.id">
                      {{ admin.name }} {{ admin.surname }} 
                      <span *ngIf="admin.role === 'SUPER_ADMIN'" style="font-size: 0.75rem; opacity: 0.6;">(Super Admin)</span>
                    </mat-option>
                  </mat-select>
                  <mat-hint>If empty, the trip inherits the Tour's admins.</mat-hint>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

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
              <button mat-stroked-button type="button" routerLink="/admin/trips" class="tha-mr-2">
                {{ isEditing() ? 'Cancel' : 'Back' }}
              </button>
              
              <button 
                *ngIf="isEditMode && !isEditing()"
                mat-flat-button 
                color="primary" 
                type="button" 
                (click)="enableEditMode()"
              >
                Edit
              </button>

              <button 
                *ngIf="isEditing()"
                mat-flat-button 
                color="primary" 
                type="submit" 
                [disabled]="form.invalid || submitting"
              >
                {{ isEditMode ? 'Save' : 'Create Trip' }}
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
  private readonly tourApi = inject(TourApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tripStorage = inject(TripStorageService);
  private readonly storage = inject(FIREBASE_STORAGE_TOKEN);

  readonly hotels$ = this.hotelApi.getAll$();
  readonly coordinators$ = this.coordinatorApi.getAll$();
  readonly tours$ = this.tourApi.getAll$();
  readonly allAdmins$ = this.adminApi.getAll$();

  /** Exposed signal for the template to conditionally show the admin assignment panel. */
  readonly isSuperAdmin = this.authService.isSuperAdmin;

  toursCache: Tour[] = [];
  adminsCache: Admin[] = [];
  availableNationalities: Nationality[] = [];
  selectedReceiptFile: File | null = null;

  isEditMode = false;
  isEditing = signal(true);
  tripId: FirestoreId | null = null;
  submitting = false;

  private sub = new Subscription();

  readonly form = this.fb.group({
    tourId: [null as FirestoreId | null, Validators.required],
    destination: [{ value: '', disabled: true }, Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [{ value: null as Date | null, disabled: true }, Validators.required],
    nationality: [null as Nationality | null, Validators.required],
    hotelId: [null as FirestoreId | null],
    coordinatorId: [null as FirestoreId | null],
    hotelBookedBy: [''],
    hotelBookingMethod: [''],
    manualHotelCost: [null as number | null],
    hotelBookingReceiptUrl: [''],
    notes: [''],
    weRoadTourSlug: [''],
    facebookGroupUrl: [''],
    /** SUPER_ADMIN only: explicitly assign a subset of admins to this trip. */
    assignedAdminIds: [[] as FirestoreId[]],
  });

  readonly availableHotelBookers$ = combineLatest([
    this.form.get('tourId')!.valueChanges.pipe(startWith(this.form.get('tourId')!.value)),
    this.form.get('assignedAdminIds')!.valueChanges.pipe(startWith(this.form.get('assignedAdminIds')!.value)),
    this.allAdmins$
  ]).pipe(
    map(([tourId, assignedAdminIds, allAdmins]) => {
      const selectedTour = this.toursCache.find(t => t.id === tourId);
      const adminIds = (this.isSuperAdmin() && assignedAdminIds && assignedAdminIds.length > 0)
        ? assignedAdminIds
        : (selectedTour ? selectedTour.adminIds : []);
      
      return (allAdmins as Admin[]).filter(admin => adminIds.includes(admin.id));
    })
  );

  ngOnInit(): void {
    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.isEditing.set(false);
      this.form.disable();
      this.tripId = id as FirestoreId;
      this.loadTrip(this.tripId);
    }

    // Cache tours & admins for quick lookup
    this.sub.add(this.tours$.subscribe(tours => this.toursCache = tours as Tour[]));
    this.sub.add(this.allAdmins$.subscribe(admins => this.adminsCache = admins as Admin[]));

    // Pre-select tour if passed in queryParams
    const tourIdParam = this.route.snapshot.queryParamMap.get('tourId');
    if (tourIdParam && !this.isEditMode) {
      this.form.patchValue({ tourId: tourIdParam as FirestoreId });
    }

    this.sub.add(
      combineLatest([
        this.form.get('tourId')!.valueChanges.pipe(startWith(this.form.get('tourId')!.value)),
        this.form.get('startDate')!.valueChanges.pipe(startWith(this.form.get('startDate')!.value))
      ]).subscribe(([tourId, startDate]) => {
        if (tourId) {
          const tour = this.toursCache.find(t => t.id === tourId);
          if (tour) {
            this.form.patchValue({ destination: tour.country }, { emitEvent: false });
            this.availableNationalities = [...tour.nationalities];
            // If current nationality is not in available, reset it
            const currentNat = this.form.get('nationality')?.value;
            if (currentNat && !this.availableNationalities.includes(currentNat)) {
              this.form.patchValue({ nationality: null }, { emitEvent: false });
            } else if (!currentNat && this.availableNationalities.length === 1) {
              this.form.patchValue({ nationality: this.availableNationalities[0] }, { emitEvent: false });
            }

            if (startDate && tour.tourLength) {
              const end = new Date(startDate);
              end.setDate(end.getDate() + tour.tourLength - 1);
              this.form.patchValue({ endDate: end }, { emitEvent: false });
            } else {
              this.form.patchValue({ endDate: null }, { emitEvent: false });
            }

            // For SUPER_ADMINs, auto-populate the admin selector with the tour's admins.
            if (this.isSuperAdmin() && !this.isEditMode) {
              this.form.patchValue({ assignedAdminIds: [...tour.adminIds] as FirestoreId[] }, { emitEvent: false });
            }
          }
        } else {
          this.availableNationalities = [];
          this.form.patchValue({ destination: '', endDate: null, nationality: null }, { emitEvent: false });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  enableEditMode(): void {
    this.isEditing.set(true);
    this.form.enable();
    this.form.get('destination')?.disable();
    this.form.get('endDate')?.disable();
  }

  private async loadTrip(id: FirestoreId): Promise<void> {
    try {
      const trip = await firstValueFrom(this.tripApi.getById$(id));
      if (trip) {
        this.form.patchValue({
          tourId: trip.tourId,
          destination: trip.destination,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          nationality: trip.nationality,
          hotelId: trip.hotelId,
          coordinatorId: trip.coordinatorId,
          hotelBookedBy: trip.hotelBookedBy,
          hotelBookingMethod: trip.hotelBookingMethod,
          manualHotelCost: trip.manualHotelCost,
          hotelBookingReceiptUrl: trip.hotelBookingReceiptUrl,
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
      const offset = date.getTimezoneOffset();
      const d = new Date(date.getTime() - (offset * 60 * 1000));
      return d.toISOString().split('T')[0];
    };

    try {
      // 1. Upload receipt if exists
      let receiptUrl = formVal.hotelBookingReceiptUrl;
      if (this.selectedReceiptFile) {
        const validationError = this.tripStorage.validateImageReceipt(this.selectedReceiptFile);
        if (validationError) {
          this.snackBar.open(validationError, 'Close', { duration: 5000 });
          this.submitting = false;
          return;
        }

        // Use temp ID if creating a new trip
        const targetTripId = this.tripId || ('pending_creation' as FirestoreId);
        receiptUrl = await this.tripStorage.uploadReceipt(targetTripId, this.selectedReceiptFile);
      }

      const selectedTour = this.toursCache.find(t => t.id === formVal.tourId);

      // Determine adminIds:
      // - SUPER_ADMINs can explicitly override with selected admins.
      // - Standard admins inherit the tour's adminIds (denormalization).
      const adminIds: ReadonlyArray<FirestoreId> =
        this.isSuperAdmin() && formVal.assignedAdminIds && formVal.assignedAdminIds.length > 0
          ? formVal.assignedAdminIds
          : (selectedTour ? selectedTour.adminIds : []);

      if (this.isEditMode && this.tripId) {
        const payload: UpdateTripPayload = {
          id: this.tripId,
          tourId: formVal.tourId!,
          destination: formVal.destination!,
          startDate: formatDate(formVal.startDate!),
          endDate: formatDate(formVal.endDate!),
          nationality: formVal.nationality!,
          hotelId: formVal.hotelId ?? null,
          coordinatorId: formVal.coordinatorId ?? null,
          hotelBookedBy: formVal.hotelBookedBy ?? null,
          hotelBookingMethod: formVal.hotelBookingMethod ?? null,
          manualHotelCost: formVal.manualHotelCost ?? null,
          hotelBookingReceiptUrl: receiptUrl ?? null,
          notes: formVal.notes ?? '',
          weRoadTourSlug: formVal.weRoadTourSlug ?? null,
          facebookGroupUrl: formVal.facebookGroupUrl ?? null,
        };
        await this.tripApi.update(payload);
        this.snackBar.open('Trip updated successfully', 'Close', { duration: 3000 });
        this.isEditing.set(false);
        this.form.disable();
      } else {
        const allTrips = await firstValueFrom(this.tripApi.getAll$());
        const existingCodes = allTrips.map(t => t.code).filter(Boolean);
        const generatedCode = selectedTour
          ? TripCodeGenerator.generateCode(selectedTour.tourWeRoadCode, formatDate(formVal.startDate!), existingCodes)
          : '';

        const payload: CreateTripPayload = {
          tourId: formVal.tourId!,
          destination: formVal.destination!,
          startDate: formatDate(formVal.startDate!),
          endDate: formatDate(formVal.endDate!),
          nationality: formVal.nationality!,
          code: generatedCode,
          durationDays: 8,
          hotelId: formVal.hotelId ?? null,
          coordinatorId: formVal.coordinatorId ?? null,
          hotelBookedBy: formVal.hotelBookedBy ?? null,
          hotelBookingMethod: formVal.hotelBookingMethod ?? null,
          manualHotelCost: formVal.manualHotelCost ?? null,
          hotelBookingReceiptUrl: receiptUrl ?? null,
          notes: formVal.notes ?? '',
          weRoadTourSlug: formVal.weRoadTourSlug ?? null,
          facebookGroupUrl: formVal.facebookGroupUrl ?? null,
          adminIds,
          roomComposition: DEFAULT_ROOM_COMPOSITION,
          hotelBookerId: null,
          documents: [],
          checklist: [
            { id: 'default-1', task: 'Confirm Hotel', isCompleted: false },
            { id: 'default-2', task: 'Send Briefing Email', isCompleted: false },
            { id: 'default-3', task: 'Book Transfers', isCompleted: false }
          ],
        };
        const newId = await this.tripApi.create(payload);
        this.snackBar.open('Trip created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/trips', newId]);
        return; // Go to detail view, not list
      }
      this.router.navigate(['/admin/trips']);
    } catch (err) {
      console.error('Failed to save trip', err);
      this.snackBar.open('Failed to save trip. Please check your connection.', 'Close', { duration: 5000 });
    } finally {
      this.submitting = false;
    }
  }

  onReceiptSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedReceiptFile = file;
    }
  }
}

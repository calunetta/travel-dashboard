import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

import { HotelApiService } from 'hotels-api-requests';
import { TourApiService } from 'tours-api-requests';
import { CountryCode, CreateHotelPayload, UpdateHotelPayload, HotelBillingData } from 'hotels-models';
import type { Tour } from 'tours-models';
import { RoomType } from 'trips-models';
import { FirestoreId } from 'shared-models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'tha-hotel-form',
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
    MatDividerModule,
    MatExpansionModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in" style="max-width: 900px; margin: 0 auto;">
      <div class="tha-flex-row tha-mb-6" style="align-items: center; gap: var(--tha-spacing-4);">
        <button mat-icon-button routerLink="/admin/hotels" aria-label="Back to Hotels">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">{{ isEditMode ? 'Edit Hotel' : 'Create New Hotel' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="tha-flex-col tha-gap-6">
        
        <!-- General Info -->
        <mat-card class="tha-card tha-shadow-sm">
          <mat-card-header>
            <mat-card-title>General Information</mat-card-title>
          </mat-card-header>
          <mat-card-content class="tha-pt-4">
            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Select Tour</mat-label>
                <mat-select formControlName="tourId">
                  <mat-option [value]="null">-- None --</mat-option>
                  <mat-option *ngFor="let t of tours$ | async" [value]="t.id">{{ t.tourName }} ({{ t.tourWeRoadCode }})</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('tourId')?.hasError('required')">Tour is required.</mat-error>
              </mat-form-field>
            </div>
            
            <div class="tha-grid-2 tha-mt-4">
              <mat-form-field appearance="outline">
                <mat-label>Hotel Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g. Grand Resort" />
                <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Destination</mat-label>
                <input matInput formControlName="destination" placeholder="e.g. Bali" />
                <mat-error *ngIf="form.get('destination')?.hasError('required')">Destination is required.</mat-error>
              </mat-form-field>
            </div>
            
            <mat-form-field appearance="outline" class="tha-full-width tha-mt-4">
              <mat-label>Internal Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Billing Data -->
        <mat-card class="tha-card tha-shadow-sm" formGroupName="billingData">
          <mat-card-header>
            <mat-card-title>Billing Information</mat-card-title>
          </mat-card-header>
          <mat-card-content class="tha-pt-4">
            <div class="tha-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Supplier Name</mat-label>
                <input matInput formControlName="supplierName" />
                <mat-error *ngIf="form.get('billingData.supplierName')?.hasError('required')">Required.</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Beneficiary</mat-label>
                <input matInput formControlName="beneficiary" />
                <mat-error *ngIf="form.get('billingData.beneficiary')?.hasError('required')">Required.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tax Code / VAT</mat-label>
                <input matInput formControlName="taxCode" />
                <mat-error *ngIf="form.get('billingData.taxCode')?.hasError('required')">Required.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Country</mat-label>
                <mat-select formControlName="country">
                  <mat-option *ngFor="let c of countries" [value]="c">{{ c }}</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('billingData.country')?.hasError('required')">Required.</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Postal Code</mat-label>
                <input matInput formControlName="postalCode" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="tha-full-width tha-mt-2">
              <mat-label>Address</mat-label>
              <input matInput formControlName="address" />
            </mat-form-field>

            <div class="tha-grid-2 tha-mt-2">
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Account Number / IBAN</mat-label>
                <input matInput formControlName="accountNumber" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>SWIFT Code</mat-label>
                <input matInput formControlName="swiftCode" />
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Pricing Ranges -->
        <mat-card class="tha-card tha-shadow-sm">
          <mat-card-header class="tha-flex-row" style="align-items: center; justify-content: space-between; width: 100%;">
            <mat-card-title>Dynamic Pricing Configurations</mat-card-title>
            <button mat-flat-button color="primary" type="button" (click)="addPricingRange()">
              <mat-icon>add</mat-icon> Add Period
            </button>
          </mat-card-header>
          <mat-card-content class="tha-pt-4">
            <div formArrayName="pricingRanges">
              <div *ngIf="pricingRanges.length === 0" class="tha-text-center tha-text-muted tha-p-4">
                No pricing periods configured. Click "Add Period" to define prices.
              </div>

              <mat-expansion-panel *ngFor="let rangeCtrl of pricingRanges.controls; let i = index" [formGroupName]="i" class="tha-mb-4" expanded="true">
                <mat-expansion-panel-header>
                  <mat-panel-title class="tha-font-bold">
                    {{ rangeCtrl.get('label')?.value || 'New Pricing Period' }}
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="tha-grid-3 tha-mt-4">
                  <mat-form-field appearance="outline">
                    <mat-label>Period Label</mat-label>
                    <input matInput formControlName="label" placeholder="e.g. High Season 2025" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>From Date</mat-label>
                    <input matInput [matDatepicker]="fromPicker" formControlName="fromDate" />
                    <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
                    <mat-datepicker #fromPicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>To Date</mat-label>
                    <input matInput [matDatepicker]="toPicker" formControlName="toDate" />
                    <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
                    <mat-datepicker #toPicker></mat-datepicker>
                  </mat-form-field>
                </div>

                <mat-divider class="tha-my-4"></mat-divider>
                <h4 class="tha-font-bold tha-mb-4">Prices per Night (EUR)</h4>

                <!-- Nested FormArray for Prices -->
                <div formArrayName="prices" class="tha-grid-5">
                  <div *ngFor="let priceCtrl of getPrices(i).controls; let j = index" [formGroupName]="j">
                    <mat-form-field appearance="outline">
                      <mat-label>{{ priceCtrl.get('roomType')?.value }}</mat-label>
                      <input matInput type="number" formControlName="priceEur" />
                      <mat-icon matSuffix class="tha-text-muted tha-text-sm">euro</mat-icon>
                    </mat-form-field>
                  </div>
                </div>

                <div class="tha-flex-end tha-mt-2">
                  <button mat-button color="warn" type="button" (click)="removePricingRange(i)">
                    <mat-icon>delete</mat-icon> Remove Period
                  </button>
                </div>
              </mat-expansion-panel>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="tha-flex-end tha-mt-4 tha-mb-8">
          <button mat-stroked-button type="button" routerLink="/admin/hotels" class="tha-mr-2">Cancel</button>
          <button 
            mat-flat-button 
            color="primary" 
            type="submit" 
            [disabled]="form.invalid || submitting"
          >
            {{ isEditMode ? 'Save Changes' : 'Create Hotel' }}
          </button>
        </div>

      </form>
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
export class HotelFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly hotelApi = inject(HotelApiService);
  private readonly tourApi = inject(TourApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly tours$ = this.tourApi.getAll$();
  toursCache: Tour[] = [];

  readonly countries = Object.values(CountryCode);
  
  isEditMode = false;
  hotelId: FirestoreId | null = null;
  submitting = false;

  readonly form = this.fb.group({
    tourId: [null as FirestoreId | null, Validators.required],
    name: ['', Validators.required],
    destination: ['', Validators.required],
    notes: [''],
    billingData: this.fb.group({
      supplierName: ['', Validators.required],
      beneficiary: ['', Validators.required],
      address: ['', Validators.required],
      postalCode: ['', Validators.required],
      city: ['', Validators.required],
      country: [CountryCode.IT, Validators.required],
      taxCode: ['', Validators.required],
      phone: [''],
      email: ['', Validators.email],
      accountNumber: ['', Validators.required],
      swiftCode: ['', Validators.required],
    }),
    pricingRanges: this.fb.array([]),
  });

  get pricingRanges(): FormArray {
    return this.form.get('pricingRanges') as FormArray;
  }

  getPrices(rangeIndex: number): FormArray {
    return this.pricingRanges.at(rangeIndex).get('prices') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.hotelId = id as FirestoreId;
      this.loadHotel(this.hotelId);
    }
    
    this.tours$.subscribe(tours => this.toursCache = tours as Tour[]);
  }

  addPricingRange() {
    const rangeGroup = this.fb.group({
      id: [crypto.randomUUID()],
      label: ['', Validators.required],
      fromDate: [null as Date | null, Validators.required],
      toDate: [null as Date | null, Validators.required],
      prices: this.fb.array([
        this.createPriceEntry(RoomType.SINGLE),
        this.createPriceEntry(RoomType.DOUBLE),
        this.createPriceEntry(RoomType.TRIPLE),
        this.createPriceEntry(RoomType.QUAD),
        this.createPriceEntry(RoomType.EXTRA_BED),
      ]),
    });
    this.pricingRanges.push(rangeGroup);
  }

  createPriceEntry(roomType: RoomType) {
    return this.fb.group({
      roomType: [roomType],
      priceEur: [0, [Validators.required, Validators.min(0)]],
    });
  }

  removePricingRange(index: number) {
    this.pricingRanges.removeAt(index);
  }

  private async loadHotel(id: FirestoreId): Promise<void> {
    try {
      const hotel = await firstValueFrom(this.hotelApi.getById$(id));
      if (hotel) {
        this.form.patchValue({
          tourId: hotel.tourId,
          name: hotel.name,
          destination: hotel.destination,
          notes: hotel.notes,
          billingData: hotel.billingData,
        });

        // Load pricing ranges
        hotel.pricingRanges.forEach(range => {
          const pricesArr = this.fb.array(
            range.prices.map(p => this.fb.group({
              roomType: [p.roomType],
              priceEur: [p.pricePerNightCents / 100, [Validators.required, Validators.min(0)]]
            }))
          );
          
          this.pricingRanges.push(this.fb.group({
            id: [range.id],
            label: [range.label, Validators.required],
            fromDate: [new Date(range.fromDate), Validators.required],
            toDate: [new Date(range.toDate), Validators.required],
            prices: pricesArr
          }));
        });
      }
    } catch (err) {
      console.error('Failed to load hotel', err);
      this.snackBar.open('Failed to load hotel details.', 'Close', { duration: 3000 });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formVal = this.form.getRawValue();

    const formatDate = (date: Date): string => {
      const offset = date.getTimezoneOffset()
      const d = new Date(date.getTime() - (offset*60*1000))
      return d.toISOString().split('T')[0]
    };

    // Map UI prices (EUR) back to cents
    const pricingRangesArray = (formVal.pricingRanges ?? []) as any[];
    const formattedPricingRanges = pricingRangesArray.map((r: {
      id?: string;
      label?: string;
      fromDate?: Date | null;
      toDate?: Date | null;
      prices?: { roomType?: string | null; priceEur?: number | null }[];
    }) => ({
      id: (r.id ?? '') as FirestoreId,
      label: r.label as string,
      fromDate: formatDate(r.fromDate as Date),
      toDate: formatDate(r.toDate as Date),
      prices: (r.prices ?? []).map((p) => ({
        roomType: p.roomType as RoomType,
        pricePerNightCents: Math.round((p.priceEur ?? 0) * 100),
      })),
    }));

    try {
      if (this.isEditMode && this.hotelId) {
        const payload: UpdateHotelPayload = {
          id: this.hotelId,
          name: formVal.name!,
          destination: formVal.destination!,
          notes: formVal.notes || '',
          billingData: formVal.billingData as unknown as HotelBillingData,
          pricingRanges: formattedPricingRanges,
        };
        await this.hotelApi.update(payload);
        this.snackBar.open('Hotel updated successfully', 'Close', { duration: 3000 });
      } else {
        const selectedTour = this.toursCache.find(t => t.id === formVal.tourId);
        const adminIds = selectedTour ? selectedTour.adminIds : [];

        const payload: CreateHotelPayload = {
          name: formVal.name!,
          destination: formVal.destination!,
          notes: formVal.notes ?? '',
          billingData: formVal.billingData as unknown as HotelBillingData,
          pricingRanges: formattedPricingRanges,
          adminIds: adminIds,
          tourId: formVal.tourId!,
        };
        await this.hotelApi.create(payload);
        this.snackBar.open('Hotel created successfully', 'Close', { duration: 3000 });
      }
      this.router.navigate(['/admin/hotels']);
    } catch (err) {
      console.error('Failed to save hotel', err);
      this.snackBar.open('Failed to save hotel. Please check your connection.', 'Close', { duration: 5000 });
    } finally {
      this.submitting = false;
    }
  }
}

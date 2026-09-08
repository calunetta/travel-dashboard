import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { parse } from 'csv-parse/browser/esm/sync';

import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { TourApiService } from 'tours-api-requests';
import { Nationality, FirestoreId } from 'shared-models';
import { firstValueFrom, shareReplay } from 'rxjs';
import { DEFAULT_ROOM_COMPOSITION, CreateTripPayload } from 'trips-models';
import { TripCodeGenerator } from 'trips-mapping-and-utils';

interface CsvRow {
  weRoadTourSlug: string;
  startDate: string;
  endDate: string;
  coordinator: string;
  coordinatorNumber: string;
  coordinatorEmail: string;
  notes: string;
  hotel: string;
  bookedBy: string;
  nationality: string;
}

interface ParsedRow {
  raw: CsvRow;
  isValid: boolean;
  errors: string[];
  payload?: CreateTripPayload;
  hotelName?: string;
  coordinatorName?: string;
}

const TEMPLATE_HEADERS = [
  'weRoadTourSlug',
  'start date',
  'end date',
  'coordinator',
  'coordinator number',
  'coordinator email',
  'notes',
  'hotel',
  'booked by',
  'nationality'
];

@Component({
  selector: 'tha-csv-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="tha-font-bold">Batch Import Trips</h2>
    <mat-dialog-content>
      <div class="tha-flex-col tha-gap-4 tha-py-4">
        
        <!-- Info & Template Download -->
        <div class="tha-flex-row" style="justify-content: space-between; align-items: center;">
          <p class="tha-text-muted tha-text-sm tha-mb-0">
            Upload a CSV file to batch create trips. The file must contain specific headers.
          </p>
          <button mat-stroked-button color="primary" (click)="downloadTemplate()">
            <mat-icon>download</mat-icon> Template
          </button>
        </div>

        <!-- File Upload Area -->
        <div class="tha-card tha-surface-variant-bg tha-p-6 tha-text-center" 
             style="border: 2px dashed var(--tha-border); border-radius: 8px;"
             *ngIf="!isImporting()">
          <mat-icon class="tha-text-primary tha-mb-2" style="transform: scale(2);">upload_file</mat-icon>
          <h3 class="tha-font-bold tha-text-lg">Select CSV File</h3>
          <p class="tha-text-muted tha-text-sm tha-mb-4">Max 500 rows per import</p>
          
          <input type="file" #fileInput hidden accept=".csv" (change)="onFileSelected($event)" />
          <button mat-flat-button color="primary" (click)="fileInput.click()">Browse File</button>
        </div>

        <!-- Error Alert -->
        <div *ngIf="globalError()" class="tha-card tha-p-4" style="background: rgba(var(--tha-error-rgb), 0.1); border-left: 4px solid var(--tha-error);">
          <div class="tha-flex-row tha-gap-2" style="align-items: center;">
            <mat-icon color="warn">error</mat-icon>
            <span class="tha-font-bold tha-text-error">{{ globalError() }}</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div *ngIf="isImporting()" class="tha-mt-4">
          <div class="tha-flex-row tha-mb-2" style="justify-content: space-between;">
            <span class="tha-font-bold">Importing...</span>
            <span class="tha-text-primary tha-font-bold">{{ importedCount() }} / {{ validRowsCount() }}</span>
          </div>
          <mat-progress-bar mode="determinate" [value]="importProgress()"></mat-progress-bar>
        </div>

        <!-- Preview Table -->
        <div *ngIf="parsedRows().length > 0 && !isImporting()" class="tha-mt-4">
          <h3 class="tha-font-bold tha-mb-2">Preview ({{ validRowsCount() }} valid, {{ invalidRowsCount() }} invalid)</h3>
          
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--tha-border); border-radius: 8px;">
            <table mat-table [dataSource]="parsedRows()" class="tha-full-width">
              
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <mat-icon *ngIf="row.isValid" class="tha-text-success">check_circle</mat-icon>
                  <mat-icon *ngIf="!row.isValid" color="warn" [title]="row.errors.join(', ')">error</mat-icon>
                </td>
              </ng-container>

              <ng-container matColumnDef="destination">
                <th mat-header-cell *matHeaderCellDef>Destination</th>
                <td mat-cell *matCellDef="let row">
                  <span *ngIf="row.isValid" class="tha-font-bold">{{ row.payload?.destination }}</span>
                  <span *ngIf="!row.isValid" class="tha-text-muted">{{ row.raw.weRoadTourSlug }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="dates">
                <th mat-header-cell *matHeaderCellDef>Dates</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.raw.startDate }} <br/>
                  <span class="tha-text-xs tha-text-muted">to {{ row.payload?.endDate || row.raw.endDate }}</span>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="details">
                <th mat-header-cell *matHeaderCellDef>Linked Details</th>
                <td mat-cell *matCellDef="let row" class="tha-text-xs tha-text-muted">
                  <div *ngIf="row.hotelName">🏨 {{ row.hotelName }}</div>
                  <div *ngIf="row.coordinatorName">👤 {{ row.coordinatorName }}</div>
                  <div *ngIf="!row.isValid && row.errors.length > 0" class="tha-text-error">
                    {{ row.errors[0] }}
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['status', 'destination', 'dates', 'details']; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: ['status', 'destination', 'dates', 'details'];"
                  [style.background]="!row.isValid ? 'rgba(var(--tha-error-rgb), 0.05)' : ''">
              </tr>
            </table>
          </div>
        </div>

      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isImporting()">Cancel</button>
      <button mat-flat-button color="primary" 
              [disabled]="validRowsCount() === 0 || isImporting()"
              (click)="startImport()">
        Import {{ validRowsCount() }} Trips
      </button>
    </mat-dialog-actions>
  `
})
export class CsvImportDialogComponent {
  private readonly tripApi = inject(TripApiService);
  private readonly tourApi = inject(TourApiService);
  private readonly hotelApi = inject(HotelApiService);
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly snackBar = inject(MatSnackBar);

  readonly parsedRows = signal<ParsedRow[]>([]);
  readonly globalError = signal<string | null>(null);
  readonly isImporting = signal(false);
  readonly importedCount = signal(0);

  readonly validRowsCount = computed(() => this.parsedRows().filter(r => r.isValid).length);
  readonly invalidRowsCount = computed(() => this.parsedRows().filter(r => !r.isValid).length);
  readonly importProgress = computed(() => {
    if (this.validRowsCount() === 0) return 0;
    return (this.importedCount() / this.validRowsCount()) * 100;
  });

  downloadTemplate() {
    const csvContent = "data:text/csv;charset=utf-8," + TEMPLATE_HEADERS.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "trips_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.globalError.set(null);
    this.parsedRows.set([]);

    try {
      const text = await file.text();
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!records || records.length === 0) {
        this.globalError.set('The CSV file is empty.');
        return;
      }

      // Check headers (case insensitive)
      const headers = Object.keys(records[0]).map(h => h.toLowerCase());
      const missingHeaders = TEMPLATE_HEADERS.filter(th => !headers.includes(th.toLowerCase()));
      if (missingHeaders.length > 0) {
        this.globalError.set(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      await this.validateAndMapRecords(records);
    } catch (e: any) {
      this.globalError.set(`Failed to parse CSV: ${e.message}`);
    }
  }

  private async validateAndMapRecords(records: any[]) {
    // Pre-fetch caches for fast resolution
    const tours = await firstValueFrom(this.tourApi.getAll$().pipe(shareReplay(1)));
    const hotels = await firstValueFrom(this.hotelApi.getAll$().pipe(shareReplay(1)));

    const parsed: ParsedRow[] = [];

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const errors: string[] = [];

      // Map raw headers to our interface (handling case variations)
      const getField = (fieldName: string) => {
        const key = Object.keys(raw).find(k => k.toLowerCase() === fieldName.toLowerCase());
        return key ? raw[key] : '';
      };

      const row: CsvRow = {
        weRoadTourSlug: getField('weroadtourslug'),
        startDate: getField('start date'),
        endDate: getField('end date'),
        coordinator: getField('coordinator'),
        coordinatorNumber: getField('coordinator number'),
        coordinatorEmail: getField('coordinator email'),
        notes: getField('notes'),
        hotel: getField('hotel'),
        bookedBy: getField('booked by'),
        nationality: getField('nationality'),
      };

      // 1. Validate required basic fields
      if (!row.weRoadTourSlug) errors.push('weRoadTourSlug is required');
      if (!row.startDate) errors.push('start date is required');
      if (!row.nationality) errors.push('nationality is required');

      // Check Nationality valid enum
      const natUpper = row.nationality.toUpperCase();
      if (!Object.values(Nationality).includes(natUpper as Nationality)) {
        errors.push(`Invalid nationality: ${row.nationality}`);
      }

      // 2. Resolve Tour
      const tour = tours.find(t =>
        t.tourWeRoadCode === row.weRoadTourSlug &&
        t.nationalities.includes(natUpper as Nationality)
      );

      if (!tour) {
        errors.push(`Tour not found for slug ${row.weRoadTourSlug} and nationality ${natUpper}`);
      }

      // 3. Resolve End Date
      let resolvedEndDate = row.endDate;
      if (!resolvedEndDate && tour && row.startDate) {
        try {
          const start = new Date(row.startDate);
          start.setDate(start.getDate() + tour.tourLength);
          resolvedEndDate = start.toISOString().split('T')[0];
        } catch {
          errors.push('Invalid start date format');
        }
      } else if (!resolvedEndDate) {
        errors.push('Could not derive end date');
      }

      // 4. Resolve Hotel
      let hotelId: FirestoreId | null = null;
      let hotelName: string | undefined;
      if (row.hotel) {
        const hotel = hotels.find(h => h.name.toLowerCase() === row.hotel.toLowerCase());
        if (hotel) {
          hotelId = hotel.id as FirestoreId;
          hotelName = hotel.name;
        } else {
          errors.push(`Hotel not found: ${row.hotel}`);
        }
      }

      if (row.coordinatorEmail && !row.coordinator) {
        errors.push('Coordinator name is required if email is provided');
      }

      let payload: CreateTripPayload | undefined;

      if (errors.length === 0 && tour) {
        payload = {
          destination: tour.country,
          startDate: row.startDate,
          endDate: resolvedEndDate,
          code: TripCodeGenerator.generateCode(tour.tourWeRoadCode, row.startDate, []),
          durationDays: tour.tourLength,
          notes: row.notes + (row.bookedBy ? ` (Booked by: ${row.bookedBy})` : ''),
          roomComposition: DEFAULT_ROOM_COMPOSITION,
          coordinatorId: null, // Set during import phase
          hotelId,
          hotelBookerId: null,
          hotelBookedBy: null,
          hotelBookingMethod: null,
          hotelBookingReceiptUrl: null,
          manualHotelCost: null,
          facebookGroupUrl: null,

          weRoadTourSlug: tour.tourWeRoadCode,
          nationality: natUpper as Nationality,
          documents: [],
          tourId: tour.id,
          adminIds: tour.adminIds, // Denormalize
          checklist: [
            { id: 'default-1', task: 'Confirm Hotel', isCompleted: false },
            { id: 'default-2', task: 'Send Briefing Email', isCompleted: false },
            { id: 'default-3', task: 'Book Transfers', isCompleted: false }
          ],
        };
      }

      parsed.push({
        raw: row,
        isValid: errors.length === 0,
        errors,
        payload,
        hotelName,
        coordinatorName: row.coordinator || undefined
      });
    }

    this.parsedRows.set(parsed);
  }

  async startImport() {
    const validRows = this.parsedRows().filter(r => r.isValid && r.payload);
    if (validRows.length === 0) return;

    this.isImporting.set(true);
    this.importedCount.set(0);

    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      try {
        let coordinatorId: FirestoreId | null = null;

        // Upsert Coordinator if email provided
        if (row.raw.coordinatorEmail && row.raw.coordinator) {
          coordinatorId = (await this.coordinatorApi.upsertCoordinatorFromCsv(
            row.raw.coordinator,
            '', // Surname not separately provided in CSV
            row.raw.coordinatorEmail,
            row.raw.coordinatorNumber || ''
          )) as FirestoreId;
        }

        const finalPayload: CreateTripPayload = {
          ...row.payload!,
          coordinatorId
        };

        await this.tripApi.create(finalPayload);

        successCount++;
        this.importedCount.set(successCount);
      } catch (e) {
        console.error('Failed to import row', row, e);
        failCount++;
      }
    }

    this.isImporting.set(false);

    if (failCount > 0) {
      this.snackBar.open(`Import completed: ${successCount} successful, ${failCount} failed.`, 'Close', { duration: 5000 });
    } else {
      this.snackBar.open(`Successfully imported ${successCount} trips!`, 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    }
  }
}

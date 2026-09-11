import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';

import { parse } from 'csv-parse/browser/esm/sync';

import { HotelApiService } from 'hotels-api-requests';
import { TourApiService } from 'tours-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import { FirestoreId } from 'shared-models';
import { CreateHotelPayload } from 'hotels-models';
import { toSignal } from '@angular/core/rxjs-interop';

interface ParsedHotelRow {
  raw: Record<string, string>;
  isValid: boolean;
  errors: string[];
  payload?: CreateHotelPayload;
  supplierName?: string;
  city?: string;
}

const TEMPLATE_HEADERS = [
  'Supplier name',
  'Beneficiary',
  'Address',
  'Supplier posta code',
  'Supplier city',
  'Supplier tax code',
  'Supplier telephone number',
  'Supplier email',
  'Swift code',
  'Account number'
];

@Component({
  selector: 'tha-csv-import-hotel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="tha-font-bold">Batch Import Hotels</h2>
    <mat-dialog-content>
      <div class="tha-flex-col tha-gap-4 tha-py-4">
        
        <!-- Info & Template Download -->
        <div class="tha-flex-row" style="justify-content: space-between; align-items: center;">
          <p class="tha-text-muted tha-text-sm tha-mb-0">
            Upload a CSV file to batch create hotels. You must select a Tour first.
          </p>
          <button mat-stroked-button color="primary" (click)="downloadTemplate()">
            <mat-icon>download</mat-icon> Template
          </button>
        </div>

        <!-- Tour Selection -->
        <mat-form-field appearance="outline" class="tha-full-width tha-mt-2">
          <mat-label>Target Tour</mat-label>
          <mat-select [(ngModel)]="selectedTourId" (selectionChange)="onTourChange()">
            <mat-option *ngFor="let tour of tours()" [value]="tour.id">
              {{ tour.tourName }} ({{ tour.tourWeRoadCode }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- File Upload Area -->
        <div class="tha-card tha-surface-variant-bg tha-p-6 tha-text-center" 
             style="border: 2px dashed var(--tha-border); border-radius: 8px;"
             *ngIf="!isImporting()"
             [class.tha-disabled]="!selectedTourId()">
          <mat-icon class="tha-text-primary tha-mb-2" style="transform: scale(2);">upload_file</mat-icon>
          <h3 class="tha-font-bold tha-text-lg">Select CSV File</h3>
          <p class="tha-text-muted tha-text-sm tha-mb-4">Max 500 rows per import</p>
          
          <input type="file" #fileInput hidden accept=".csv,.xlsx" (change)="onFileSelected($event)" [disabled]="!selectedTourId()" />
          <button mat-flat-button color="primary" (click)="fileInput.click()" [disabled]="!selectedTourId()">Browse File</button>
          
          <p *ngIf="!selectedTourId()" class="tha-text-xs tha-text-error tha-mt-2">Please select a Tour above before uploading.</p>
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

              <ng-container matColumnDef="hotelName">
                <th mat-header-cell *matHeaderCellDef>Hotel Name</th>
                <td mat-cell *matCellDef="let row">
                  <span class="tha-font-bold">{{ row.supplierName || 'Unknown' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="city">
                <th mat-header-cell *matHeaderCellDef>City / Destination</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.city || '-' }}
                </td>
              </ng-container>
              
              <ng-container matColumnDef="details">
                <th mat-header-cell *matHeaderCellDef>Details</th>
                <td mat-cell *matCellDef="let row" class="tha-text-xs tha-text-muted">
                  <div *ngIf="!row.isValid && row.errors.length > 0" class="tha-text-error">
                    {{ row.errors[0] }}
                  </div>
                  <div *ngIf="row.isValid">Valid record</div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['status', 'hotelName', 'city', 'details']; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: ['status', 'hotelName', 'city', 'details'];"
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
              [disabled]="validRowsCount() === 0 || isImporting() || !selectedTourId()"
              (click)="startImport()">
        Import {{ validRowsCount() }} Hotels
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .tha-disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  `]
})
export class CsvImportHotelDialogComponent {
  private readonly hotelApi = inject(HotelApiService);
  private readonly tourApi = inject(TourApiService);
  private readonly auth = inject(FirebaseAuthService);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly snackBar = inject(MatSnackBar);

  readonly tours = toSignal(this.tourApi.getAll$(), { initialValue: [] });
  readonly selectedTourId = signal<FirestoreId | null>(null);

  readonly parsedRows = signal<ParsedHotelRow[]>([]);
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
    link.setAttribute("download", "hotels_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onTourChange() {
    // If they change the tour after uploading, re-validate to update the payloads with the new tour ID
    if (this.parsedRows().length > 0) {
      const currentRows = this.parsedRows();
      const newRows = currentRows.map(row => {
        if (row.payload) {
          row.payload = { ...row.payload, tourId: this.selectedTourId() as FirestoreId };
        }
        return row;
      });
      this.parsedRows.set(newRows);
    }
  }

  async onFileSelected(event: Event) {
    this.globalError.set(null);
    this.parsedRows.set([]);
    
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      this.globalError.set('Only .csv files are supported.');
      return;
    }

    try {
      const text = await file.text();
      this.parseCsv(text);
    } catch (err) {
      console.error('Failed to read file:', err);
      this.globalError.set('Failed to read the file.');
    }
  }

  private parseCsv(csvText: string) {
    try {
      const rawRecords: Record<string, string>[] = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });

      if (rawRecords.length === 0) {
        this.globalError.set('The CSV file is empty or has no valid rows.');
        return;
      }

      if (rawRecords.length > 500) {
        this.globalError.set('Maximum 500 rows allowed per import.');
        return;
      }

      const tourId = this.selectedTourId();
      if (!tourId) {
        this.globalError.set('Please select a tour first.');
        return;
      }

      const currentUser = this.auth.currentUser();
      if (!currentUser || !currentUser.uid) {
        this.globalError.set('User authentication missing.');
        return;
      }

      const adminId = currentUser.uid as FirestoreId;

      const parsed = rawRecords.map(r => {
        const getCol = (key: string) => {
           const match = Object.keys(r).find(k => k.toLowerCase() === key.toLowerCase());
           return match ? r[match] : '';
        };

        const supplierName = getCol('Supplier name') || '';
        const beneficiary = getCol('Beneficiary') || '';
        const address = getCol('Address') || '';
        const postalCode = getCol('Supplier posta code') || '';
        const city = getCol('Supplier city') || '';
        const taxCode = getCol('Supplier tax code') || '';
        const phone = getCol('Supplier telephone number') || '';
        const email = getCol('Supplier email') || '';
        const swiftCode = getCol('Swift code') || '';
        const accountNumber = getCol('Account number') || '';

        const errors: string[] = [];
        if (!supplierName) errors.push('Missing Supplier name');
        if (!city) errors.push('Missing Supplier city');

        const isValid = errors.length === 0;

        let payload: CreateHotelPayload | undefined;
        if (isValid) {
          payload = {
            name: supplierName,
            billingData: {
              supplierName,
              beneficiary,
              address,
              postalCode,
              city,
              taxCode,
              phone,
              email,
              accountNumber,
              swiftCode,
            },
            pricingRanges: [],
            notes: '',
            tourId,
            adminIds: [adminId],
          };
        }

        return {
          raw: r,
          isValid,
          errors,
          payload,
          supplierName,
          city,
        } as ParsedHotelRow;
      });

      this.parsedRows.set(parsed);

    } catch (err: any) {
      console.error('CSV Parsing Error:', err);
      this.globalError.set('Failed to parse CSV: ' + (err.message || 'Unknown error'));
    }
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
        await this.hotelApi.create(row.payload!);
        successCount++;
        this.importedCount.set(successCount);
      } catch (e) {
        console.error('Failed to import hotel', row.payload?.name, e);
        failCount++;
      }
    }

    this.isImporting.set(false);

    if (failCount > 0) {
      this.snackBar.open(`Import completed: ${successCount} successful, ${failCount} failed.`, 'Close', { duration: 5000 });
    } else {
      this.snackBar.open(`Successfully imported ${successCount} hotels!`, 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    }
  }
}

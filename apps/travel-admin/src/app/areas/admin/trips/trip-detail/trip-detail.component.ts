import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { toSignal } from '@angular/core/rxjs-interop';

import { TripApiService, TripStorageService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { FirestoreId } from 'shared-models';
import { TripDocument } from 'trips-models';
import { switchMap, shareReplay } from 'rxjs';
import { RoomType } from 'trips-models';
import { calculateHotelCost } from 'hotels-mapping-and-utils';
import { buildWhatsAppUrl } from 'shared-mapping-and-utils';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'tha-trip-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatListModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in" *ngIf="trip() as t; else loading">
      <!-- Header -->
      <div class="tha-flex-row tha-flex-col-sm tha-mb-6" style="justify-content: space-between; gap: var(--tha-spacing-4);">
        <div class="tha-flex-row" style="align-items: center; gap: var(--tha-spacing-4);">
          <button mat-icon-button routerLink="/admin/trips" aria-label="Back to Trips">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <div class="tha-flex-row" style="align-items: center; gap: 1rem;">
              <h1 class="tha-text-3xl tha-font-bold tha-mb-2">{{ t.destination }}</h1>
              <span
                *ngIf="t.code"
                style="font-size: 0.75rem; font-weight: 700; background: rgba(var(--tha-primary-rgb), 0.12); color: var(--tha-primary); padding: 3px 10px; border-radius: 20px; letter-spacing: 1px;"
              >{{ t.code }}</span>
            </div>
            <div class="tha-flex-row" style="gap: 8px; align-items: center;">
              <mat-icon class="tha-text-primary">calendar_month</mat-icon>
              {{ t.startDate | date:'dd/MM/yyyy' }} to {{ t.endDate | date:'dd/MM/yyyy' }} ({{ t.durationDays }} days)
            </div>
          </div>
        </div>
        <div class="tha-flex-row tha-gap-2">
          <button mat-stroked-button color="primary" [routerLink]="['/admin/trips', t.id, 'edit']">
            <mat-icon>edit</mat-icon> Edit Trip
          </button>
        </div>
      </div>

      <div class="tha-grid-2" style="gap: var(--tha-spacing-6);">
        <!-- Left Column: Overview -->
        <div class="tha-flex-col tha-gap-6">
          <mat-card class="tha-card tha-shadow-sm">
            <mat-card-header>
              <mat-card-title>Overview</mat-card-title>
            </mat-card-header>
            <mat-card-content class="tha-pt-4">
              <h3 class="tha-text-lg tha-font-bold tha-mb-4">Details</h3>
              <p><strong>Notes:</strong><br/> {{ t.notes || 'No notes provided.' }}</p>
              
              <div class="tha-mt-6" *ngIf="t.facebookGroupUrl">
                <p><strong>Facebook Group:</strong></p>
                <a [href]="t.facebookGroupUrl" target="_blank" mat-flat-button color="primary" style="margin-top: 8px;">
                  <mat-icon>groups</mat-icon> Open Facebook Group
                </a>
              </div>
              
              <div class="tha-mt-6" *ngIf="t.weRoadTourSlug">
                <p><strong>WeRoad Link:</strong></p>
                <a [href]="'https://www.weroad.it/viaggi/' + t.weRoadTourSlug" target="_blank" mat-stroked-button style="margin-top: 8px;">
                  <mat-icon>public</mat-icon> View on WeRoad
                </a>
              </div>
              <mat-divider class="tha-my-6"></mat-divider>

              <h3 class="tha-text-lg tha-font-bold tha-mb-4">Assignments</h3>
              
              <mat-card class="tha-mb-4" style="box-shadow: none; border: 1px solid var(--tha-border);">
                <mat-card-header>
                  <mat-icon mat-card-avatar color="primary">group</mat-icon>
                  <mat-card-title>Coordinator</mat-card-title>
                  <mat-card-subtitle>{{ coordinator()?.name ? coordinator()?.name + ' ' + coordinator()?.surname : 'Unassigned' }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content *ngIf="t.coordinatorId && coordinator()?.phone" class="tha-pt-4">
                  <a
                    [href]="buildWhatsAppUrl(coordinator()!.phone, 'Hi ' + coordinator()!.name + '! Just a quick message regarding your upcoming trip to ' + t.destination + ' (Code: ' + t.code + ').')"
                    target="_blank"
                    mat-flat-button
                    style="background-color: #25D366; color: white;"
                    aria-label="Message coordinator on WhatsApp"
                  >
                    <mat-icon>chat</mat-icon> Message on WhatsApp
                  </a>
                </mat-card-content>
                <mat-card-actions *ngIf="t.coordinatorId" align="end">
                  <button mat-button color="primary" [routerLink]="['/admin/coordinators', t.coordinatorId]">View Profile</button>
                </mat-card-actions>
              </mat-card>

              <mat-card style="box-shadow: none; border: 1px solid var(--tha-border);">
                <mat-card-header>
                  <mat-icon mat-card-avatar style="color: #9c27b0;">hotel</mat-icon>
                  <mat-card-title>Hotel</mat-card-title>
                  <mat-card-subtitle>
                    {{ hotel()?.name ?? 'Unassigned' }}
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content *ngIf="t.hotelId" class="tha-pt-4">
                  <div *ngIf="t.manualHotelCost !== null; else autoCost">
                    <p class="tha-text-sm tha-font-bold">Hotel Cost (Manual Override):</p>
                    <p class="tha-text-xl tha-text-primary">€{{ t.manualHotelCost | number:'1.2-2' }}</p>
                  </div>
                  <ng-template #autoCost>
                    <div *ngIf="hotelCost() as cost">
                      <p class="tha-text-sm tha-font-bold">Calculated Hotel Cost:</p>
                      <p class="tha-text-xl tha-text-primary">€{{ cost.grandTotalEur | number:'1.2-2' }}</p>
                      <p class="tha-text-xs tha-text-muted" *ngIf="cost.appliedPricingRange">
                        Based on pricing range: {{ cost.appliedPricingRange.fromDate | date:'shortDate' }} - {{ cost.appliedPricingRange.toDate | date:'shortDate' }}
                      </p>
                      <p class="tha-text-xs tha-text-muted tha-mt-1" *ngIf="!cost.appliedPricingRange && cost.hotelId">
                        No matching pricing range found for this trip's dates.
                      </p>
                    </div>
                  </ng-template>
                </mat-card-content>
                <mat-card-actions *ngIf="t.hotelId" align="end">
                  <button mat-button color="primary" [routerLink]="['/admin/hotels', t.hotelId, 'edit']">View Hotel</button>
                </mat-card-actions>
              </mat-card>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Right Column: Rooms & Documents -->
        <div class="tha-flex-col tha-gap-6">
          <!-- Room Composition -->
          <mat-card class="tha-card tha-shadow-sm">
            <mat-card-header>
              <mat-card-title>Room Composition</mat-card-title>
            </mat-card-header>
            <mat-card-content class="tha-pt-4">
              <p class="tha-text-muted tha-mb-6">Adjust the number of rooms needed for this trip. This determines the hotel cost calculation.</p>
              
              <div class="tha-grid-4 tha-gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Single Rooms</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="rooms.SINGLE" (change)="saveRooms()" />
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Double Rooms</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="rooms.DOUBLE" (change)="saveRooms()" />
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Triple Rooms</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="rooms.TRIPLE" (change)="saveRooms()" />
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Quad Rooms</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="rooms.QUAD" (change)="saveRooms()" />
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Extra Beds</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="rooms.EXTRA_BED" (change)="saveRooms()" />
              </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Operational Kanban / Checklist -->
          <mat-card class="tha-card tha-shadow-sm">
            <mat-card-header>
              <mat-card-title>Operational Kanban</mat-card-title>
            </mat-card-header>
            <mat-card-content class="tha-pt-4">
              <div class="tha-flex-col tha-gap-2">
                <mat-checkbox 
                  *ngFor="let item of t.checklist" 
                  [checked]="item.isCompleted"
                  (change)="toggleChecklistItem(t.id, item, t.checklist)">
                  {{ item.task }}
                </mat-checkbox>
                <div *ngIf="!t.checklist || t.checklist.length === 0" class="tha-text-muted tha-text-sm">
                  No checklist items available.
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Documents -->
          <mat-card class="tha-card tha-shadow-sm">
            <mat-card-header>
              <mat-card-title>Documents ({{ t.documents.length }})</mat-card-title>
            </mat-card-header>
            <mat-card-content class="tha-pt-4">
            <!-- Upload Header -->
            <div class="tha-flex-row tha-flex-col-sm tha-mb-4" style="justify-content: space-between; gap: var(--tha-spacing-4);">
              <div>
                <h3 class="tha-text-lg tha-font-bold tha-mb-1">Trip Documents</h3>
                <p class="tha-text-xs tha-text-muted">PDF only · Max 20 MB per file</p>
              </div>
              <div class="tha-flex-row tha-flex-col-sm tha-gap-2">
                <!-- Hidden file input -->
                <input
                  #fileInput
                  type="file"
                  accept="application/pdf"
                  style="display: none;"
                  (change)="onFileSelected($event, t.id)"
                />
                <button
                  mat-flat-button
                  color="primary"
                  (click)="fileInput.click()"
                  [disabled]="uploading()"
                  aria-label="Upload PDF document"
                >
                  <mat-icon>upload_file</mat-icon>
                  {{ uploading() ? 'Uploading...' : 'Upload PDF' }}
                </button>
              </div>
            </div>

            <!-- Upload Progress -->
            <div *ngIf="uploading()" class="tha-mb-4">
              <p class="tha-text-sm tha-text-muted tha-mb-1">Uploading {{ uploadingFileName() }}…</p>
              <mat-progress-bar mode="determinate" [value]="uploadProgress()"></mat-progress-bar>
              <p class="tha-text-xs tha-text-muted tha-mt-1">{{ uploadProgress() }}%</p>
            </div>

            <!-- Empty State -->
            @if (t.documents.length === 0 && !uploading()) {
              <div class="tha-text-center tha-p-8 tha-text-muted" style="border: 2px dashed var(--tha-border); border-radius: var(--tha-radius-md);">
                <mat-icon style="font-size: 48px; width: 48px; height: 48px; opacity: 0.4;">description</mat-icon>
                <p class="tha-mt-4">No documents uploaded for this trip yet.</p>
                <p class="tha-text-xs">Click "Upload PDF" to add hotel invoices, contracts, or other files.</p>
              </div>
            }

            <!-- Document List -->
            @if (t.documents.length > 0) {
              <div class="tha-flex-col tha-gap-3">
                <mat-card
                  *ngFor="let doc of t.documents"
                  style="box-shadow: none; border: 1px solid var(--tha-border);"
                >
                  <mat-card-content style="padding: 12px 16px;">
                    <div class="tha-flex-row tha-flex-col-sm" style="gap: 12px;">
                      <!-- Left: icon + info -->
                      <div class="tha-flex-row" style="align-items: center; gap: 12px; flex: 1; min-width: 0;">
                        <mat-icon style="color: var(--tha-primary); flex-shrink: 0;">picture_as_pdf</mat-icon>
                        <div style="min-width: 0;">
                          <p class="tha-font-bold tha-text-sm" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ doc.name }}</p>
                          <p class="tha-text-xs tha-text-muted">Uploaded {{ doc.uploadedAt | date:'dd MMM yyyy, HH:mm' }}</p>
                        </div>
                      </div>

                      <!-- Middle: payment status chip -->
                      <div style="flex-shrink: 0;">
                        <button
                          mat-stroked-button
                          [color]="doc.paymentStatus === 'PAID' ? 'primary' : 'warn'"
                          (click)="togglePaymentStatus(t.id, doc.id, t.documents)"
                          [matTooltip]="doc.paymentStatus === 'PAID' ? 'Mark as To Be Paid' : 'Mark as Paid'"
                          style="font-size: 0.75rem; min-width: 120px;"
                        >
                          <mat-icon>{{ doc.paymentStatus === 'PAID' ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                          {{ doc.paymentStatus === 'PAID' ? 'Paid' : 'To Be Paid' }}
                        </button>
                      </div>

                      <!-- Right: action buttons -->
                      <div class="tha-flex-row tha-gap-1" style="flex-shrink: 0;">
                        <a
                          mat-icon-button
                          [href]="doc.url"
                          target="_blank"
                          aria-label="Download document"
                          matTooltip="Download / View"
                        >
                          <mat-icon>download</mat-icon>
                        </a>
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="deleteDocument(t.id, doc)"
                          [disabled]="deletingDocId() === doc.id"
                          aria-label="Delete document"
                          matTooltip="Delete document"
                        >
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            }
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="tha-flex-center tha-full-height tha-p-8">
        <mat-spinner></mat-spinner>
      </div>
    </ng-template>
  `,
  styles: [

    `
      :host {
        display: block;
      }
    `,
  ],
})
export class TripDetailComponent implements OnInit {
  private readonly tripApi = inject(TripApiService);
  private readonly tripStorage = inject(TripStorageService);
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly hotelApi = inject(HotelApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  protected readonly buildWhatsAppUrl = buildWhatsAppUrl;

  private readonly tripId = this.route.snapshot.paramMap.get('id') as FirestoreId;

  // Real-time trip data
  private readonly trip$ = this.tripApi.getById$(this.tripId).pipe(shareReplay(1));
  readonly trip = toSignal(this.trip$, { initialValue: null });

  // Resolve assigned coordinator
  private readonly coordinator$ = this.trip$.pipe(
    switchMap((trip) => {
      if (!trip || !trip.coordinatorId) return [null];
      return this.coordinatorApi.getById$(trip.coordinatorId);
    })
  );
  readonly coordinator = toSignal(this.coordinator$, { initialValue: null });

  // Resolve assigned hotel
  private readonly hotel$ = this.trip$.pipe(
    switchMap((trip) => {
      if (!trip || !trip.hotelId) return [null];
      return this.hotelApi.getById$(trip.hotelId);
    })
  );
  readonly hotel = toSignal(this.hotel$, { initialValue: null });

  readonly hotelCost = computed(() => {
    const h = this.hotel();
    const t = this.trip();
    if (h && t) {
      return calculateHotelCost(h, t);
    }
    return null;
  });

  // Upload state
  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly uploadingFileName = signal('');
  readonly deletingDocId = signal<string | null>(null);

  // Local state for room composition edits
  rooms = {
    [RoomType.SINGLE]: 0,
    [RoomType.DOUBLE]: 0,
    [RoomType.TRIPLE]: 0,
    [RoomType.QUAD]: 0,
    [RoomType.EXTRA_BED]: 0,
  };

  ngOnInit() {
    this.trip$.subscribe((trip) => {
      if (trip) {
        this.rooms = { ...trip.roomComposition };
      }
    });
  }

  async saveRooms() {
    if (!this.tripId) return;
    try {
      await this.tripApi.update({
        id: this.tripId,
        roomComposition: { ...this.rooms },
      });
    } catch (e) {
      console.error('Failed to update room composition', e);
    }
  }

  // ── Document Upload ─────────────────────────────────────────────────────────

  onFileSelected(event: Event, tripId: FirestoreId): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected after an error
    input.value = '';

    const validationError = this.tripStorage.validate(file);
    if (validationError) {
      this.snackBar.open(validationError, 'Close', { duration: 4000 });
      return;
    }

    this.startUpload(tripId, file);
  }

  private startUpload(tripId: FirestoreId, file: File): void {
    const docId = crypto.randomUUID();
    const now = new Date().toISOString();

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadingFileName.set(file.name);

    this.tripStorage.uploadDocument(tripId, file, docId).subscribe({
      next: (progress) => {
        this.uploadProgress.set(progress.percentage);

        if (progress.downloadUrl) {
          // Upload complete — persist the document record to Firestore
          const document: TripDocument = {
            id: docId as FirestoreId,
            name: file.name,
            url: progress.downloadUrl,
            uploadedAt: now,
            paymentStatus: 'TO_BE_PAID',
          };

          this.tripApi.addDocument(tripId, document)
            .then(() => {
              this.snackBar.open(`"${file.name}" uploaded successfully.`, 'Close', { duration: 3000 });
            })
            .catch((err: unknown) => {
              console.error('Failed to save document to Firestore', err);
              this.snackBar.open('Upload succeeded but failed to save record. Please retry.', 'Close', { duration: 5000 });
            })
            .finally(() => {
              this.uploading.set(false);
              this.uploadProgress.set(0);
              this.uploadingFileName.set('');
              this.cdr.markForCheck();
            });
        }
      },
      error: (err: unknown) => {
        console.error('Upload failed', err);
        this.snackBar.open('Upload failed. Please try again.', 'Close', { duration: 4000 });
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.uploadingFileName.set('');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Document Delete ─────────────────────────────────────────────────────────

  async deleteDocument(
    tripId: FirestoreId,
    document: TripDocument
  ): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Document',
        message: `Are you sure you want to delete "${document.name}"? The file will be permanently removed from storage.`,
        dangerous: true,
        confirmLabel: 'Delete',
      } as ConfirmDialogData,
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    this.deletingDocId.set(document.id);
    try {
      // Delete from Storage first, then remove the Firestore record
      await this.tripStorage.deleteDocument(tripId, document.id);
      await this.tripApi.removeDocument(tripId, document);
      this.snackBar.open(`"${document.name}" deleted.`, 'Close', { duration: 3000 });
    } catch (err: unknown) {
      console.error('Failed to delete document', err);
      this.snackBar.open('Failed to delete document. Please try again.', 'Close', { duration: 4000 });
    } finally {
      this.deletingDocId.set(null);
    }
  }

  // ── Payment Status Toggle ───────────────────────────────────────────────────

  async togglePaymentStatus(
    tripId: FirestoreId,
    documentId: string,
    currentDocuments: ReadonlyArray<TripDocument>
  ): Promise<void> {
    try {
      await this.tripApi.toggleDocumentPaymentStatus(tripId, documentId, currentDocuments);
    } catch (err: unknown) {
      console.error('Failed to toggle payment status', err);
      this.snackBar.open('Failed to update payment status.', 'Close', { duration: 3000 });
    }
  }

  // ── Checklist Toggle ────────────────────────────────────────────────────────

  async toggleChecklistItem(
    tripId: FirestoreId,
    item: { id: string; task: string; isCompleted: boolean },
    currentChecklist: ReadonlyArray<{ id: string; task: string; isCompleted: boolean }>
  ): Promise<void> {
    try {
      const updatedChecklist = currentChecklist.map((c) =>
        c.id === item.id ? { ...c, isCompleted: !c.isCompleted } : c
      );
      await this.tripApi.update({
        id: tripId,
        checklist: updatedChecklist,
      });
    } catch (err: unknown) {
      console.error('Failed to toggle checklist item', err);
      this.snackBar.open('Failed to update checklist.', 'Close', { duration: 3000 });
    }
  }
}

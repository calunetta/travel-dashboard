import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { toSignal } from '@angular/core/rxjs-interop';

import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { FirestoreId } from 'shared-models';
import { Trip } from 'trips-models';
import { switchMap, map, shareReplay } from 'rxjs';
import { RoomType } from 'trips-models';

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
    MatTabsModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in" *ngIf="trip() as t; else loading">
      <!-- Header -->
      <div class="tha-flex-row tha-mb-6" style="align-items: center; justify-content: space-between;">
        <div class="tha-flex-row" style="align-items: center; gap: var(--tha-spacing-4);">
          <button mat-icon-button routerLink="/admin/trips" aria-label="Back to Trips">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <div class="tha-flex-row" style="align-items: center; justify-content: space-between; gap: 1rem;">
              <div>
                <h1 class="tha-text-3xl tha-font-bold tha-mb-2">{{ t.destination }}</h1>
              </div>
            </div>
            <div class="tha-text-sm tha-text-muted tha-mt-1">
              {{ t.startDate }} to {{ t.endDate }} ({{ t.durationDays }} days)
            </div>
          </div>
        </div>
        <div class="tha-flex-row tha-gap-2">
          <button mat-stroked-button color="primary" [routerLink]="['/admin/trips', t.id, 'edit']">
            <mat-icon>edit</mat-icon> Edit Trip
          </button>
        </div>
      </div>

      <mat-tab-group animationDuration="0ms" class="tha-card tha-shadow-sm" style="background: var(--tha-surface);">
        <!-- Overview Tab -->
        <mat-tab label="Overview">
          <div class="tha-p-6 tha-grid-2" style="gap: var(--tha-spacing-8);">
            <!-- Left Col -->
            <div>
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
            </div>

            <!-- Right Col -->
            <div>
              <h3 class="tha-text-lg tha-font-bold tha-mb-4">Assignments</h3>
              
              <mat-card class="tha-mb-4" style="box-shadow: none; border: 1px solid var(--tha-border);">
                <mat-card-header>
                  <mat-icon matCardAvatar color="primary">group</mat-icon>
                  <mat-card-title>Coordinator</mat-card-title>
                  <mat-card-subtitle>{{ coordinator()?.name ? coordinator()?.name + ' ' + coordinator()?.surname : 'Unassigned' }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-actions *ngIf="t.coordinatorId" align="end">
                  <button mat-button color="primary" [routerLink]="['/admin/coordinators', t.coordinatorId]">View Profile</button>
                </mat-card-actions>
              </mat-card>

              <mat-card style="box-shadow: none; border: 1px solid var(--tha-border);">
                <mat-card-header>
                  <mat-icon matCardAvatar style="color: #9c27b0;">hotel</mat-icon>
                  <mat-card-title>Hotel</mat-card-title>
                  <mat-card-subtitle>{{ hotel()?.name ?? 'Unassigned' }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-actions *ngIf="t.hotelId" align="end">
                  <button mat-button color="primary" [routerLink]="['/admin/hotels', t.hotelId, 'edit']">View Hotel</button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Room Composition Tab -->
        <mat-tab label="Room Composition">
          <div class="tha-p-6">
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
          </div>
        </mat-tab>

        <!-- Documents Tab -->
        <mat-tab label="Documents">
          <div class="tha-p-6">
            <div class="tha-flex-row tha-mb-4" style="justify-content: space-between; align-items: center;">
              <h3 class="tha-text-lg tha-font-bold">Trip Documents</h3>
              <button mat-stroked-button color="primary">
                <mat-icon>upload_file</mat-icon> Upload Document
              </button>
            </div>

            @if (t.documents.length === 0) {
              <div class="tha-text-center tha-p-8 tha-text-muted" style="border: 2px dashed var(--tha-border); border-radius: var(--tha-radius-md);">
                No documents uploaded for this trip yet.
              </div>
            } @else {
              <mat-list>
                <mat-list-item *ngFor="let doc of t.documents">
                  <mat-icon matListItemIcon>description</mat-icon>
                  <span matListItemTitle>{{ doc.name }}</span>
                  <span matListItemLine class="tha-text-xs tha-text-muted">Uploaded {{ doc.uploadedAt }}</span>
                  <button mat-icon-button matListItemMeta color="primary">
                    <mat-icon>download</mat-icon>
                  </button>
                </mat-list-item>
              </mat-list>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
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
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly hotelApi = inject(HotelApiService);
  private readonly route = inject(ActivatedRoute);

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
}

import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';

import { CoordinatorApiService } from 'coordinators-api-requests';
import { TripApiService } from 'trips-api-requests';
import { FirestoreId } from 'shared-models';
import { shareReplay, switchMap, map } from 'rxjs';

@Component({
  selector: 'tha-coordinator-detail',
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
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in" *ngIf="coordinator() as c; else loading">
      <!-- Header -->
      <div class="tha-flex-row tha-mb-6" style="align-items: center; gap: var(--tha-spacing-4);">
        <button mat-icon-button routerLink="/admin/coordinators" aria-label="Back to Coordinators">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="tha-text-3xl tha-font-bold tha-mb-0">{{ c.name }} {{ c.surname }}</h1>
          <div class="tha-text-sm tha-text-muted tha-mt-1">
            {{ c.email }} | {{ c.phone }}
          </div>
        </div>
      </div>

      <mat-tab-group animationDuration="0ms" class="tha-card tha-shadow-sm" style="background: var(--tha-surface);">
        <!-- Profile Tab -->
        <mat-tab label="Profile">
          <div class="tha-p-6 tha-grid-2" style="gap: var(--tha-spacing-8);">
            
            <!-- Left Col: Details -->
            <div>
              <h3 class="tha-text-lg tha-font-bold tha-mb-4">Details</h3>
              
              <div class="tha-mb-4">
                <span class="tha-text-xs tha-text-muted">Age Preference</span>
                <div class="tha-font-bold">{{ c.agePreference }}</div>
              </div>

              <div class="tha-mb-4">
                <span class="tha-text-xs tha-text-muted">Joined</span>
                <div class="tha-font-bold">{{ c.createdAt | date }}</div>
              </div>

              <div class="tha-mb-6">
                <span class="tha-text-xs tha-text-muted">Public Notes</span>
                <p>{{ c.notes || 'No notes provided by coordinator.' }}</p>
              </div>

              <mat-divider class="tha-mb-6"></mat-divider>

              <h3 class="tha-text-lg tha-font-bold tha-mb-4">Contact</h3>
              <a [href]="getWhatsAppUrl(c.phone)" target="_blank" mat-flat-button style="background-color: #25D366; color: white;">
                <mat-icon>message</mat-icon> Message on WhatsApp
              </a>
            </div>

            <!-- Right Col: Feedback -->
            <div>
              <h3 class="tha-text-lg tha-font-bold tha-mb-4">Post-Trip Feedback</h3>
              <p class="tha-text-muted tha-text-sm tha-mb-4">
                Internal notes and performance feedback for this coordinator. Visible only to admins.
              </p>
              
              <mat-form-field appearance="outline" class="tha-full-width">
                <mat-label>Feedback</mat-label>
                <textarea matInput [(ngModel)]="feedback" rows="8" placeholder="Coordinator performance was..."></textarea>
              </mat-form-field>
              
              <div class="tha-flex-end">
                <button mat-flat-button color="primary" (click)="saveFeedback()" [disabled]="saving">
                  <mat-icon *ngIf="!saving">save</mat-icon>
                  <mat-spinner diameter="20" *ngIf="saving" class="tha-mr-2" style="display: inline-block; vertical-align: middle;"></mat-spinner>
                  {{ saving ? 'Saving...' : 'Save Feedback' }}
                </button>
              </div>
            </div>

          </div>
        </mat-tab>

        <!-- Assignments Tab -->
        <mat-tab label="Assignments">
          <div class="tha-p-6">
            <h3 class="tha-text-lg tha-font-bold tha-mb-4">Trip Assignments</h3>
            
            <div *ngIf="assignedTrips()?.length === 0" class="tha-text-muted tha-p-4 tha-text-center">
              No trips assigned to this coordinator.
            </div>

            <div class="tha-grid-3 tha-gap-4">
              <mat-card *ngFor="let trip of assignedTrips()" class="tha-shadow-sm" style="border: 1px solid var(--tha-border); box-shadow: none;">
                <mat-card-header>
                  <mat-icon matCardAvatar color="primary">flight</mat-icon>
                  <mat-card-title>{{ trip.title }}</mat-card-title>
                  <mat-card-subtitle>{{ trip.startDate }} to {{ trip.endDate }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-actions align="end">
                  <button mat-button color="primary" [routerLink]="['/admin/trips', trip.id]">View Trip</button>
                </mat-card-actions>
              </mat-card>
            </div>

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
export class CoordinatorDetailComponent implements OnInit {
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly tripApi = inject(TripApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  private readonly coordinatorId = this.route.snapshot.paramMap.get('id') as FirestoreId;

  private readonly coordinator$ = this.coordinatorApi.getById$(this.coordinatorId).pipe(shareReplay(1));
  readonly coordinator = toSignal(this.coordinator$, { initialValue: null });

  // Resolve assigned trips
  private readonly trips$ = this.tripApi.getAll$().pipe(
    map(trips => trips.filter(t => t.coordinatorId === this.coordinatorId))
  );
  readonly assignedTrips = toSignal(this.trips$, { initialValue: [] });

  feedback = '';
  saving = false;

  ngOnInit() {
    this.coordinator$.subscribe((c) => {
      if (c) {
        this.feedback = c.feedback || '';
      }
    });
  }

  getWhatsAppUrl(phone: string): string {
    // Remove all non-numeric characters except +
    const sanitized = phone.replace(/[^\d+]/g, '');
    return `https://wa.me/${sanitized}`;
  }

  async saveFeedback() {
    if (!this.coordinatorId) return;
    this.saving = true;
    try {
      await this.coordinatorApi.update({
        id: this.coordinatorId,
        feedback: this.feedback,
      });
      this.snackBar.open('Feedback saved successfully', 'Close', { duration: 3000 });
    } catch (e) {
      console.error('Failed to update feedback', e);
      this.snackBar.open('Failed to save feedback', 'Close', { duration: 3000 });
    } finally {
      this.saving = false;
    }
  }
}

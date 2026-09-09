import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { FirestoreId } from 'shared-models';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { TripApiService } from 'trips-api-requests';
import { MatSnackBar } from '@angular/material/snack-bar';
import { buildWhatsAppUrl } from 'shared-mapping-and-utils';
import { AssignmentType, Candidacy } from 'coordinators-models';
import { FirebaseAuthService } from 'auth-api-requests';

export interface MatchmakingResult {
  candidacyId: FirestoreId;
  candidacy: Candidacy;
  coordinatorName: string;
  coordinatorPhone: string;
  tripId: FirestoreId;
  destination: string;
  tripCode: string;
}

@Component({
  selector: 'tha-matchmaking-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Automatic Assignment Preview</h2>
    <mat-dialog-content class="tha-pt-4">
      <div *ngIf="matches.length === 0" class="tha-text-center tha-text-muted tha-p-4">
        No matches could be made based on First-Come-First-Serve and Nationality rules.
      </div>

      <mat-list *ngIf="matches.length > 0">
        <div mat-subheader>Matched Candidacies ({{ matches.length }})</div>
        <mat-list-item *ngFor="let match of matches" class="tha-mb-2">
          <mat-icon matListItemIcon class="tha-text-primary">person_add</mat-icon>
          <div matListItemTitle class="tha-font-bold">{{ match.coordinatorName }}</div>
          <div matListItemLine>Assigned to: {{ match.destination }} ({{ match.tripCode }})</div>
          
          <button mat-icon-button matListItemMeta (click)="openWhatsApp(match)" aria-label="Contact via WhatsApp" color="primary">
            <mat-icon>chat</mat-icon>
          </button>
        </mat-list-item>
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="matches.length === 0 || submitting" (click)="confirmAndSave()">
        Confirm & Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class MatchmakingPreviewDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<MatchmakingPreviewDialogComponent>);
  readonly matches: MatchmakingResult[] = inject(MAT_DIALOG_DATA);
  private readonly tripApi = inject(TripApiService);
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly snackBar = inject(MatSnackBar);

  submitting = false;

  openWhatsApp(match: MatchmakingResult): void {
    const message = `Hi ${match.coordinatorName}! Great news — you have been automatically assigned to the trip to ${match.destination} (Code: ${match.tripCode}). Please log in to your dashboard to review the details.`;
    const url = buildWhatsAppUrl(match.coordinatorPhone, message);
    window.open(url, '_blank');
  }

  async confirmAndSave(): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.snackBar.open('You must be logged in to assign coordinators.', 'Close', { duration: 3000 });
      return;
    }

    this.submitting = true;
    try {
      // Execute batch logic:
      // Since there's no single batch endpoint exposed, we will execute them sequentially for now, 
      // or we can use Promise.all. 
      // A full robust implementation would ideally use a backend Cloud Function, but as per requirements, we do it here.

      const updatePromises = this.matches.map(async (match) => {
        // 1. Accept candidacy -> this should ideally also reject other pending candidacies for the same person if required
        await this.coordinatorApi.assignCoordinatorToTrip(
          match.tripId,
          match.candidacy,
          currentUser.uid as FirestoreId,
          AssignmentType.AUTOMATIC
        );
      });

      await Promise.all(updatePromises);
      this.snackBar.open('Batch assignment completed successfully!', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Failed to confirm and save batch matches', error);
      this.snackBar.open('An error occurred while saving the matches.', 'Close', { duration: 5000 });
    } finally {
      this.submitting = false;
    }
  }
}

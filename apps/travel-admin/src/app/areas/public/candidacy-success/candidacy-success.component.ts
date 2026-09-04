import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'tha-candidacy-success',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-flex-center tha-full-height">
      <mat-card class="tha-card tha-animate-scale-in" style="max-width: 500px; text-align: center;">
        <mat-card-header class="tha-flex-center" style="display: flex; flex-direction: column;">
          <mat-icon
            style="font-size: 64px; width: 64px; height: 64px; color: var(--tha-success); margin-bottom: var(--tha-spacing-4);"
          >
            check_circle
          </mat-icon>
          <mat-card-title class="tha-text-2xl tha-font-bold tha-mb-2">
            Candidacy Submitted!
          </mat-card-title>
        </mat-card-header>
        <mat-card-content class="tha-mt-4">
          <p class="tha-text-base tha-text-muted">
            Thank you for applying. Your candidacy has been successfully received. We will review it
            and contact you shortly via WhatsApp or email.
          </p>
        </mat-card-content>
        <mat-card-actions class="tha-flex-center tha-mt-6">
          <a mat-flat-button color="primary" routerLink="/public">
            Submit Another Candidacy
          </a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class CandidacySuccessComponent {}

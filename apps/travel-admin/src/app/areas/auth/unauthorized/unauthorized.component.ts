import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FirebaseAuthService } from 'auth-api-requests';

@Component({
  selector: 'tha-unauthorized',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-flex-center" style="min-height: 100vh; background: var(--tha-surface-bg);">
      <mat-card class="tha-card tha-animate-scale-in" style="max-width: 460px; text-align: center; padding: var(--tha-spacing-8);">
        <mat-card-header style="display: flex; flex-direction: column; align-items: center; margin-bottom: var(--tha-spacing-4);">
          <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--tha-error); margin-bottom: var(--tha-spacing-4);">
            gpp_bad
          </mat-icon>
          <mat-card-title class="tha-text-2xl tha-font-bold">Access Denied</mat-card-title>
          <mat-card-subtitle class="tha-mt-2">
            Your account is not authorized to access the admin panel.
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="tha-mt-2">
          @if (email()) {
            <p class="tha-text-sm tha-text-muted">
              Signed in as: <strong>{{ email() }}</strong>
            </p>
          }
          <p class="tha-text-sm tha-text-muted tha-mt-2">
            Please contact your system administrator to request access.
          </p>
        </mat-card-content>

        <mat-card-actions style="display: flex; justify-content: center; gap: var(--tha-spacing-3); margin-top: var(--tha-spacing-6);">
          <button mat-stroked-button (click)="signOut()" id="unauthorized-sign-out-btn">
            <mat-icon>logout</mat-icon>
            Sign Out
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class UnauthorizedComponent {
  private readonly authService = inject(FirebaseAuthService);
  private readonly router = inject(Router);

  readonly email = this.authService.currentUser
    ? () => this.authService.currentUser()?.email ?? null
    : () => null;

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}

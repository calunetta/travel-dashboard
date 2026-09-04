import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { FirebaseAuthService } from 'auth-api-requests';

@Component({
  selector: 'tha-login',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-flex-center" style="min-height: 100vh; background: var(--tha-surface-bg);">
      <mat-card class="tha-card tha-animate-scale-in" style="max-width: 420px; width: 100%; text-align: center; padding: var(--tha-spacing-8);">
        <mat-card-header style="display: flex; flex-direction: column; align-items: center; margin-bottom: var(--tha-spacing-6);">
          <div style="font-size: 56px; margin-bottom: var(--tha-spacing-3);">✈️</div>
          <mat-card-title class="tha-text-2xl tha-font-bold">Travel Handling App</mat-card-title>
          <mat-card-subtitle class="tha-text-sm tha-text-muted tha-mt-2">
            Admin Portal — Sign in to continue
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (errorMessage()) {
            <div class="tha-mb-4"
              style="background: rgba(var(--tha-error-rgb), 0.12); color: var(--tha-error);
                     border-radius: var(--tha-radius-md); padding: var(--tha-spacing-3);">
              <mat-icon style="vertical-align: middle; margin-right: 6px; font-size: 18px; height: 18px; width: 18px;">error</mat-icon>
              {{ errorMessage() }}
            </div>
          }
        </mat-card-content>

        <mat-card-actions style="display: flex; justify-content: center; margin-top: var(--tha-spacing-4);">
          <button
            mat-flat-button
            color="primary"
            style="width: 100%; height: 48px; font-size: 16px; gap: 8px;"
            [disabled]="loading()"
            (click)="signIn()"
            id="google-sign-in-btn"
          >
            @if (loading()) {
              <mat-spinner diameter="20" color="accent"></mat-spinner>
              <span class="tha-ml-2">Signing in…</span>
            } @else {
              <mat-icon>login</mat-icon>
              <span>Sign in with Google</span>
            }
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class LoginComponent {
  private readonly authService = inject(FirebaseAuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async signIn(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.authService.signInWithGoogle();
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/unauthorized']);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      this.errorMessage.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}

import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from 'shared-ui';
import { FirebaseAuthService, AdminApiService } from 'auth-api-requests';
import { FIREBASE_MESSAGING_TOKEN, FirestoreId } from 'shared-models';
import { getToken } from 'firebase/messaging';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'tha-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="tha-full-height">
      <!-- Sidebar -->
      <mat-sidenav #sidenav [mode]="isMobile().matches ? 'over' : 'side'" [opened]="!isMobile().matches" 
                   class="tha-sidenav" style="width: 280px; background-color: var(--tha-sidebar-bg); color: var(--tha-sidebar-text);">
        <mat-toolbar style="background-color: transparent; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <mat-icon style="margin-right: 12px; color: var(--tha-primary-400);">admin_panel_settings</mat-icon>
          <span class="tha-font-bold" style="letter-spacing: 0.5px;">Admin Portal</span>
        </mat-toolbar>

        <mat-nav-list>
          <a mat-list-item routerLink="/admin/dashboard" routerLinkActive="tha-active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          
          <mat-divider></mat-divider>
          <div class="tha-text-xs tha-text-muted tha-font-bold tha-px-4 tha-pt-4 tha-pb-2" style="text-transform: uppercase;">Management</div>

          <a *ngIf="isSuperAdmin()" mat-list-item routerLink="/admin/tours" routerLinkActive="tha-active-link">
            <mat-icon matListItemIcon>map</mat-icon>
            <span matListItemTitle>Tours</span>
          </a>

          <a mat-list-item routerLink="/admin/trips" routerLinkActive="tha-active-link">
            <mat-icon matListItemIcon>flight</mat-icon>
            <span matListItemTitle>Trips</span>
          </a>
          
          <a mat-list-item routerLink="/admin/hotels" routerLinkActive="tha-active-link">
            <mat-icon matListItemIcon>hotel</mat-icon>
            <span matListItemTitle>Hotels</span>
          </a>

          <a mat-list-item routerLink="/admin/coordinators" routerLinkActive="tha-active-link">
            <mat-icon matListItemIcon>group</mat-icon>
            <span matListItemTitle>Coordinators</span>
          </a>

          <a mat-list-item routerLink="/admin/candidacies" routerLinkActive="tha-active-link">
            <mat-icon matListItemIcon>assignment</mat-icon>
            <span matListItemTitle>Candidacies</span>
          </a>
          
          <a mat-list-item routerLink="/admin/calendar" routerLinkActive="tha-active-link">
            <mat-icon matListItemIcon>calendar_month</mat-icon>
            <span matListItemTitle>Calendar</span>
          </a>

          <mat-divider></mat-divider>

          <a mat-list-item routerLink="/public" target="_blank">
            <mat-icon matListItemIcon>open_in_new</mat-icon>
            <span matListItemTitle>Public Form</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <!-- Main Content -->
      <mat-sidenav-content class="tha-flex-col tha-surface-bg">
        <!-- Header -->
        <mat-toolbar class="tha-shadow-sm" style="background-color: var(--tha-surface); z-index: var(--tha-z-sticky);">
          <button *ngIf="isMobile().matches" mat-icon-button (click)="sidenav.toggle()" aria-label="Toggle sidenav">
            <mat-icon>menu</mat-icon>
          </button>
          
          <div class="tha-flex-1"></div>
          
          <span class="tha-text-sm tha-text-muted tha-mr-4">
            <span
              *ngIf="isSuperAdmin()"
              style="font-size: 0.65rem; font-weight: 700; background: var(--tha-primary); color: #fff; padding: 2px 6px; border-radius: 4px; margin-right: 6px; letter-spacing: 0.5px;"
            >SUPER ADMIN</span>
            {{ userEmail() }}
          </span>

          <button mat-icon-button (click)="themeService.toggle()" aria-label="Toggle theme">
            <mat-icon>{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          
          <button mat-icon-button (click)="logout()" aria-label="Sign out">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>

        <!-- Router Outlet -->
        <main class="tha-flex-1 tha-p-6" style="overflow-y: auto;">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }
      .tha-active-link {
        background-color: rgba(var(--tha-primary-rgb), 0.1);
        color: var(--tha-primary);
        border-right: 4px solid var(--tha-primary);
      }
      .tha-active-link mat-icon {
        color: var(--tha-primary);
      }
    `,
  ],
})
export class AdminShellComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly adminApi = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly messaging = inject(FIREBASE_MESSAGING_TOKEN, { optional: true });

  constructor() {
    this.initNotifications();
  }

  private async initNotifications() {
    if (!this.messaging) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: (environment.firebase as any).vapidKey
        });
        
        const user = this.authService.currentUser();
        if (token && user) {
          await this.adminApi.updateFcmToken(user.uid as FirestoreId, token);
          console.log('FCM Token successfully saved.');
        }
      }
    } catch (error) {
      console.error('Failed to get FCM token', error);
    }
  }

  readonly isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait]),
    { initialValue: { matches: false, breakpoints: {} } }
  );

  readonly userEmail = this.authService.currentUser
    ? () => this.authService.currentUser()?.email ?? ''
    : () => '';

  readonly isSuperAdmin = this.authService.isSuperAdmin;

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}

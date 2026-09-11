import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { switchMap, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService } from 'shared-ui';
import { FirebaseAuthService, AdminApiService } from 'auth-api-requests';
import { FIREBASE_MESSAGING_TOKEN, FirestoreId, InAppNotification } from 'shared-models';
import { getToken } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

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
    MatBadgeModule,
    MatMenuModule,
    MatSnackBarModule,
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
          <div class="tha-text-xs tha-text-muted tha-font-bold tha-px-4 tha-pt-4 tha-pb-2" style="text-transform: uppercase;margin: 10px">Management</div>

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
          
          <span *ngIf="!isMobile().matches" class="tha-text-sm tha-text-muted tha-mr-4">
            <span
              *ngIf="isSuperAdmin()"
              style="font-size: 0.65rem; font-weight: 700; background: var(--tha-primary); color: #fff; padding: 2px 6px; border-radius: 4px; margin-right: 6px; letter-spacing: 0.5px;"
            >SUPER ADMIN</span>
            {{ userEmail() }}
          </span>

          <button *ngIf="deferredPrompt()" mat-icon-button (click)="installPwa()" aria-label="Install app" title="Install App" color="primary">
            <mat-icon>install_mobile</mat-icon>
          </button>

          <!-- Notifications Bell -->
          <button mat-icon-button [matMenuTriggerFor]="notificationsMenu" aria-label="Notifications" title="Notifications">
            <mat-icon [matBadge]="unreadCount()" [matBadgeHidden]="unreadCount() === 0" matBadgeColor="warn">
              notifications
            </mat-icon>
          </button>

          <mat-menu #notificationsMenu="matMenu" class="tha-notification-menu">
            <ng-template matMenuContent>
              <div class="tha-px-4 tha-py-2 tha-font-bold tha-text-sm" style="margin: 0 10px;border-bottom: 1px solid rgba(128,128,128,0.2);">Notifications</div>
              <div *ngIf="notifications().length === 0" class="tha-p-4 tha-text-muted tha-text-sm">
                No notifications
              </div>
              <button 
                *ngFor="let n of notifications()" 
                mat-menu-item 
                (click)="onNotificationClick(n)"
                style="white-space: normal; height: auto; min-height: 48px; padding: 12px 16px; border-bottom: 1px solid rgba(128,128,128,0.1);"
                [style.background]="n.read ? 'transparent' : 'rgba(var(--tha-primary-rgb), 0.05)'"
              >
                <div class="tha-flex tha-items-start">
                  <div *ngIf="!n.read" class="tha-mt-1 tha-mr-2" style="width: 8px; height: 8px; border-radius: 50%; background: var(--tha-primary);"></div>
                  <div class="tha-flex-1">
                    <div class="tha-text-sm" [class.tha-font-bold]="!n.read">{{ n.title }}</div>
                    <div class="tha-text-xs tha-text-muted" style="line-height: 1.4; margin-top: 2px;">{{ n.body }}</div>
                  </div>
                </div>
              </button>
            </ng-template>
          </mat-menu>

          <button *ngIf="!notificationsEnabled()" mat-icon-button (click)="enableNotifications()" aria-label="Enable notifications" title="Enable notifications" color="primary">
            <mat-icon>notifications_active</mat-icon>
          </button>

          <button mat-icon-button (click)="themeService.toggle()" aria-label="Toggle theme">
            <mat-icon>{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          
          <button mat-icon-button (click)="logout()" aria-label="Sign out">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>

        <!-- Router Outlet -->
        <main class="tha-flex-1" style="overflow-y: auto;">
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
        background-color: var(--tha-sidebar-active-bg);
        color: var(--tha-sidebar-active);
        border-right: 4px solid var(--tha-sidebar-active);
      }
      .tha-active-link mat-icon {
        color: var(--tha-sidebar-active);
      }
      ::ng-deep .tha-notification-menu {
        max-width: 350px;
        max-height: 400px;
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

  private readonly user$ = toObservable(this.authService.currentUser);
  
  readonly notifications = toSignal(
    this.user$.pipe(
      switchMap(user => {
        if (!user || !user.uid) return of([]);
        return this.adminApi.getNotifications$(user.uid as FirestoreId);
      })
    ),
    { initialValue: [] as ReadonlyArray<InAppNotification> }
  );

  readonly unreadCount = computed(() => {
    return (this.notifications() || []).filter(n => !n.read).length;
  });

  async onNotificationClick(n: InAppNotification) {
    const user = this.authService.currentUser();
    if (user && user.uid && !n.read) {
      await this.adminApi.markNotificationAsRead(user.uid as FirestoreId, n.id);
    }
    if (n.link) {
      try {
        const url = new URL(n.link);
        this.router.navigateByUrl(url.pathname);
      } catch (e) {
        // Fallback if link is not a full URL
        this.router.navigateByUrl(n.link);
      }
    }
  }

  readonly deferredPrompt = signal<any>(null);

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: Event) {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.deferredPrompt.set(e);
  }

  async installPwa() {
    const promptEvent = this.deferredPrompt();
    if (!promptEvent) return;

    // Show the install prompt
    promptEvent.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt.set(null);
  }

  private readonly snackBar = inject(MatSnackBar);

  // Expose signal for button visibility
  readonly notificationsEnabled = computed(() => {
    const user = this.authService.currentUser();
    const hasPermission = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
    return hasPermission && !!user?.adminProfile?.fcmToken;
  });

  async enableNotifications() {
    if (!this.messaging || typeof window === 'undefined' || !('Notification' in window)) {
      this.snackBar.open('Notifications are not supported in this browser.', 'Close', { duration: 3000 });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        const token = await getToken(this.messaging, {
          vapidKey: (environment.firebase as any).vapidKey,
          serviceWorkerRegistration: registration
        });

        const user = this.authService.currentUser();
        if (token && user) {
          await this.adminApi.updateFcmToken(user.uid as FirestoreId, token);
          this.snackBar.open('Notifications enabled successfully!', 'Close', { duration: 3000 });
          console.log('FCM Token successfully saved.');
        } else {
          this.snackBar.open('Failed to generate notification token.', 'Close', { duration: 3000 });
        }
      } else {
        this.snackBar.open('Notification permission denied by user.', 'Close', { duration: 3000 });
        console.warn('Notification permission denied by user.');
      }
    } catch (error) {
      console.error('Failed to get FCM token', error);
      this.snackBar.open('Error enabling notifications.', 'Close', { duration: 3000 });
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

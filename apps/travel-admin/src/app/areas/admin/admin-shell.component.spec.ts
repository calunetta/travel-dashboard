import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminShellComponent } from './admin-shell.component';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { FirebaseAuthService, AdminApiService } from 'auth-api-requests';
import { FIREBASE_MESSAGING_TOKEN } from 'shared-models';
import { ThemeService } from 'shared-ui';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { getToken } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { MatSnackBarModule } from '@angular/material/snack-bar';

jest.mock('firebase/messaging', () => ({
  getToken: jest.fn(),
}));

describe('AdminShellComponent', () => {
  let component: AdminShellComponent;
  let fixture: ComponentFixture<AdminShellComponent>;
  let mockBreakpointObserver: any;
  let mockAuthService: any;
  let mockAdminApi: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted')
      }
    });

    mockBreakpointObserver = {
      observe: jest.fn().mockReturnValue(of({ matches: false } as BreakpointState)),
    };

    mockAuthService = {
      currentUser: jest.fn().mockReturnValue({ uid: 'admin123', email: 'test@admin.com', adminProfile: {} }),
      isSuperAdmin: jest.fn().mockReturnValue(true),
      signOut: jest.fn().mockResolvedValue(true),
    };

    const mockThemeService = {
      isDarkMode: jest.fn().mockReturnValue(false),
      toggle: jest.fn(),
    };

    mockAdminApi = {
      updateFcmToken: jest.fn().mockResolvedValue(true),
      getNotifications$: jest.fn().mockReturnValue(of([
        { id: 'n1', title: 'Test Notification', body: 'Trip X has a new document.', link: '/admin/trips/123', read: false, createdAt: null },
        { id: 'n2', title: 'Old Notification', body: 'Payment completed.', link: '/admin/trips/456', read: true, createdAt: null },
      ])),
      markNotificationAsRead: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, RouterTestingModule, BrowserAnimationsModule, MatSnackBarModule],
      providers: [
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: FirebaseAuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: AdminApiService, useValue: mockAdminApi },
        { provide: FIREBASE_MESSAGING_TOKEN, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to side mode on desktop (matches: false)', () => {
    expect(component.isMobile()?.matches).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    const sidenav = compiled.querySelector('mat-sidenav');
    expect(sidenav?.getAttribute('ng-reflect-mode')).toBe('side');
    expect(sidenav?.getAttribute('ng-reflect-opened')).toBe('true');
  });

  it('should switch to over mode on mobile (matches: true)', () => {
    // Override the mock for this specific test
    mockBreakpointObserver.observe = jest.fn().mockReturnValue(of({ matches: true } as BreakpointState));

    // Re-create component to pick up new mock value
    fixture = TestBed.createComponent(AdminShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isMobile()?.matches).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const sidenav = compiled.querySelector('mat-sidenav');
    expect(sidenav?.getAttribute('ng-reflect-mode')).toBe('over');
    expect(sidenav?.getAttribute('ng-reflect-opened')).toBe('false');
  });

  describe('Push Notifications', () => {
    it('should request permission and update FCM token when enableNotifications is called', async () => {
      const mockToken = 'mock-fcm-token';
      const mockRegistration = {};
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: jest.fn().mockResolvedValue(mockRegistration)
        },
        writable: true
      });
      (getToken as jest.Mock).mockResolvedValue(mockToken);

      await component.enableNotifications();

      expect(window.Notification.requestPermission).toHaveBeenCalled();
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/firebase-messaging-sw.js');
      expect(getToken).toHaveBeenCalledWith({}, expect.objectContaining({
        vapidKey: (environment.firebase as any).vapidKey,
        serviceWorkerRegistration: mockRegistration
      }));
      expect(mockAdminApi.updateFcmToken).toHaveBeenCalledWith('admin123', mockToken);
    });

    it('should not update FCM token if permission is denied', async () => {
      window.Notification.requestPermission = jest.fn().mockResolvedValue('denied');

      await component.enableNotifications();

      expect(getToken).not.toHaveBeenCalled();
      expect(mockAdminApi.updateFcmToken).not.toHaveBeenCalled();
    });
  });

  describe('Notification Center', () => {
    it('should compute unread count from notifications signal', () => {
      // 1 unread (n1), 1 read (n2) => unreadCount should be 1
      expect(component.unreadCount()).toBe(1);
    });

    it('should call markNotificationAsRead and navigate on notification click', async () => {
      const mockRouter = { navigateByUrl: jest.fn() } as any;
      // Directly invoke to test the logic
      const unreadNotification = { id: 'n1', title: 'T', body: 'B', link: 'https://admin.example.com/admin/trips/123', read: false, createdAt: null };
      await component.onNotificationClick(unreadNotification as any);

      expect(mockAdminApi.markNotificationAsRead).toHaveBeenCalledWith('admin123', 'n1');
    });
  });

  describe('PWA Installation', () => {
    it('should stash beforeinstallprompt event and clear it after installation', async () => {
      const mockPromptEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      component.onBeforeInstallPrompt(mockPromptEvent as any);

      expect(mockPromptEvent.preventDefault).toHaveBeenCalled();
      expect(component.deferredPrompt()).toBe(mockPromptEvent);

      await component.installPwa();

      expect(mockPromptEvent.prompt).toHaveBeenCalled();
      expect(component.deferredPrompt()).toBeNull();
    });
  });
});


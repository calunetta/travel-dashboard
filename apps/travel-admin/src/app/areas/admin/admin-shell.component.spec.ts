import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminShellComponent } from './admin-shell.component';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { FirebaseAuthService, AdminApiService } from 'auth-api-requests';
import { FIREBASE_MESSAGING_TOKEN } from 'shared-models';
import { ThemeService } from 'shared-ui';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('AdminShellComponent', () => {
  let component: AdminShellComponent;
  let fixture: ComponentFixture<AdminShellComponent>;
  let mockBreakpointObserver: any;

  beforeEach(async () => {
    mockBreakpointObserver = {
      observe: jest.fn().mockReturnValue(of({ matches: false } as BreakpointState)),
    };

    const mockAuthService = {
      currentUser: jest.fn().mockReturnValue({ email: 'test@admin.com' }),
      isSuperAdmin: jest.fn().mockReturnValue(true),
      signOut: jest.fn().mockResolvedValue(true),
    };

    const mockThemeService = {
      isDarkMode: jest.fn().mockReturnValue(false),
      toggle: jest.fn(),
    };

      const mockAdminApi = {
        updateFcmToken: jest.fn().mockResolvedValue(true)
      };

      await TestBed.configureTestingModule({
        imports: [AdminShellComponent, RouterTestingModule, BrowserAnimationsModule],
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
});

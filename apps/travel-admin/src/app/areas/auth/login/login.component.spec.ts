import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FirebaseAuthService } from 'auth-api-requests';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jest.Mocked<any>;
  let routerMock: jest.Mocked<Router>;

  beforeEach(async () => {
    authServiceMock = {
      signInWithGoogle: jest.fn(),
      isAdmin: jest.fn(),
      isLoading: signal(false), // Simulate already loaded state for simplicity
    };

    routerMock = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: FirebaseAuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to dashboard if admin upon successful login', async () => {
    authServiceMock.signInWithGoogle.mockResolvedValue(undefined);
    authServiceMock.isAdmin.mockReturnValue(true);

    await component.signIn();

    expect(authServiceMock.signInWithGoogle).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    expect(component.loading()).toBe(false);
  });

  it('should navigate to unauthorized if non-admin upon successful login', async () => {
    authServiceMock.signInWithGoogle.mockResolvedValue(undefined);
    authServiceMock.isAdmin.mockReturnValue(false);

    await component.signIn();

    expect(authServiceMock.signInWithGoogle).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/unauthorized']);
    expect(component.loading()).toBe(false);
  });

  it('should display error message if login fails', async () => {
    const errorMsg = 'Google Sign-In Failed';
    authServiceMock.signInWithGoogle.mockRejectedValue(new Error(errorMsg));

    await component.signIn();

    expect(authServiceMock.signInWithGoogle).toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe(errorMsg);
    expect(component.loading()).toBe(false);
  });
});

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { FirebaseAuthService } from 'auth-api-requests';
import { signal } from '@angular/core';
import { runInInjectionContext, Injector } from '@angular/core';
import { Observable, isObservable } from 'rxjs';

describe('authGuard', () => {
  let routerMock: jest.Mocked<Router>;
  let authServiceMock: jest.Mocked<any>;
  let injector: Injector;

  beforeEach(() => {
    routerMock = {
      createUrlTree: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    authServiceMock = {
      isLoading: signal(false),
      isAuthenticated: jest.fn(),
      isAdmin: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: FirebaseAuthService, useValue: authServiceMock },
      ],
    });

    injector = TestBed.inject(Injector);
  });

  const runGuard = async () => {
    const result = runInInjectionContext(injector, () => authGuard({} as any, {} as any));
    if (isObservable(result)) {
      return new Promise((resolve) => {
        result.subscribe(resolve);
      });
    }
    return result;
  };

  it('should wait for isLoading to be false before executing', async () => {
    authServiceMock.isLoading.set(true);
    authServiceMock.isAuthenticated.mockReturnValue(true);
    authServiceMock.isAdmin.mockReturnValue(true);

    const promise = runGuard();
    
    // Simulate auth state resolving later
    setTimeout(() => {
      authServiceMock.isLoading.set(false);
    }, 10);

    const result = await promise;
    expect(result).toBe(true);
  });

  it('should redirect to /login if not authenticated', async () => {
    authServiceMock.isLoading.set(false);
    authServiceMock.isAuthenticated.mockReturnValue(false);
    const mockUrlTree = {} as UrlTree;
    routerMock.createUrlTree.mockReturnValue(mockUrlTree);

    const result = await runGuard();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(mockUrlTree);
  });

  it('should redirect to /unauthorized if authenticated but not admin', async () => {
    authServiceMock.isLoading.set(false);
    authServiceMock.isAuthenticated.mockReturnValue(true);
    authServiceMock.isAdmin.mockReturnValue(false);
    const mockUrlTree = {} as UrlTree;
    routerMock.createUrlTree.mockReturnValue(mockUrlTree);

    const result = await runGuard();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
    expect(result).toBe(mockUrlTree);
  });

  it('should return true if authenticated and admin', async () => {
    authServiceMock.isLoading.set(false);
    authServiceMock.isAuthenticated.mockReturnValue(true);
    authServiceMock.isAdmin.mockReturnValue(true);

    const result = await runGuard();
    expect(result).toBe(true);
  });
});

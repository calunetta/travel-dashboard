// ─────────────────────────────────────────────────────────────────────────────
// AUTH GUARD — Functional Route Guard (Angular 19)
//
// Protects admin routes: only allows access if the user is authenticated
// AND has admin status (verified via Firestore admins collection).
//
// Usage in routes:
//   { path: 'admin', canActivate: [authGuard], ... }
// ─────────────────────────────────────────────────────────────────────────────

import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { FirebaseAuthService } from 'auth-api-requests';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

/**
 * Functional route guard that:
 * 1. Waits for the auth state to finish loading (avoids redirect on first load)
 * 2. If unauthenticated → redirect to /login
 * 3. If authenticated but not an admin → redirect to /unauthorized
 * 4. If authenticated admin → allow access
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(FirebaseAuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter(isLoading => !isLoading),
    take(1),
    map(() => {
      if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login']);
      }
    
      if (!authService.isAdmin()) {
        return router.createUrlTree(['/unauthorized']);
      }
    
      return true;
    })
  );
};

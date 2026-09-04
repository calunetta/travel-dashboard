// ─────────────────────────────────────────────────────────────────────────────
// TRIP REMINDER SERVICE — Admin Automation
//
// Triggers the backend Cloud Function to schedule automated emails
// (1-week, 2-months, 6-months).
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FIREBASE_APP_TOKEN, type OperationResult } from 'shared-models';

@Injectable({ providedIn: 'root' })
export class TripReminderService {
  private readonly firebaseApp = inject(FIREBASE_APP_TOKEN);
  private readonly functions = getFunctions(this.firebaseApp);

  /**
   * Triggers the backend Cloud Function to schedule automated admin reminders.
   * Returns an Observable of OperationResult.
   */
  scheduleAdminReminders(): Observable<OperationResult<void>> {
    const callable = httpsCallable(this.functions, 'scheduleAdminReminders');
    
    return from(callable()).pipe(
      map(() => ({ success: true as const, data: undefined })),
      catchError((error: unknown) => {
        console.error('Failed to schedule admin reminders', error);
        return of({
          success: false as const,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      })
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION CONFIGURATION — Angular 19 Standalone Bootstrap
//
// Wires all providers: router, HTTP client, Firebase (App + Firestore + Auth),
// Angular Material animations, and injection tokens.
//
// ⚠️  Firebase is initialized using the environment.ts values.
//     Replace all YOUR_* placeholders in environment.ts BEFORE running the app.
// ─────────────────────────────────────────────────────────────────────────────

import {
  ApplicationConfig,
  provideZoneChangeDetection, isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// App
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import {
  FIREBASE_APP_TOKEN,
  FIRESTORE_TOKEN,
  FIREBASE_AUTH_TOKEN,
  FIREBASE_STORAGE_TOKEN,
  FIREBASE_MESSAGING_TOKEN,
} from 'shared-models';
import { provideServiceWorker } from '@angular/service-worker';

import { TripApiService } from 'trips-api-requests';
import { TourApiService } from 'tours-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { MockTripApiService } from './e2e-mocks/mock-trip-api.service';
import { MockTourApiService } from './e2e-mocks/mock-tour-api.service';
import { MockCoordinatorApiService } from './e2e-mocks/mock-coordinator-api.service';

import { HotelApiService } from 'hotels-api-requests';
import { MockHotelApiService } from './e2e-mocks/mock-hotel-api.service';
import { AdminApiService } from 'auth-api-requests';
import { MockAdminApiService } from './e2e-mocks/mock-admin-api.service';

const isCypress = typeof window !== 'undefined' && 
          ((window as any).Cypress || window.localStorage.getItem('bypassAuth') === 'true');

console.log('IS_CYPRESS EVALUATED TO:', isCypress);

export const appConfig: ApplicationConfig = {
  providers: [
    // ── Core ──────────────────────────────────────────────────────────────
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),

    ...(isCypress ? [
      { provide: TripApiService, useClass: MockTripApiService },
      { provide: TourApiService, useClass: MockTourApiService },
      { provide: CoordinatorApiService, useClass: MockCoordinatorApiService },
      { provide: HotelApiService, useClass: MockHotelApiService },
      { provide: AdminApiService, useClass: MockAdminApiService }
    ] : []),

    // ── Firebase ──────────────────────────────────────────────────────────
    {
      provide: FIREBASE_APP_TOKEN,
      useFactory: () => initializeApp(environment.firebase),
    },
    {
      provide: FIRESTORE_TOKEN,
      useFactory: () => getFirestore(initializeApp(environment.firebase)),
    },
    {
      provide: FIREBASE_AUTH_TOKEN,
      useFactory: () => getAuth(initializeApp(environment.firebase)),
    },
    {
      provide: FIREBASE_STORAGE_TOKEN,
      useFactory: () => getStorage(initializeApp(environment.firebase)),
    },
    {
      provide: FIREBASE_MESSAGING_TOKEN,
      useFactory: () => getMessaging(initializeApp(environment.firebase)),
    }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ],
};

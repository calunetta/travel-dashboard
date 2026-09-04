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
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// App
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import {
  FIREBASE_APP_TOKEN,
  FIRESTORE_TOKEN,
  FIREBASE_AUTH_TOKEN,
} from 'shared-models';

// ── Initialize Firebase (once, eagerly) ──────────────────────────────────────
// Firebase modular SDK requires explicit initialization before use.
// All services inject FIREBASE_APP_TOKEN / FIRESTORE_TOKEN / FIREBASE_AUTH_TOKEN
// instead of calling getFirestore() / getAuth() directly (enables test mocking).
const firebaseApp = initializeApp(environment.firebase);
const firestoreInstance = getFirestore(firebaseApp);
const authInstance = getAuth(firebaseApp);

export const appConfig: ApplicationConfig = {
  providers: [
    // ── Core ──────────────────────────────────────────────────────────────
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),

    // ── Firebase ──────────────────────────────────────────────────────────
    {
      provide: FIREBASE_APP_TOKEN,
      useValue: firebaseApp,
    },
    {
      provide: FIRESTORE_TOKEN,
      useValue: firestoreInstance,
    },
    {
      provide: FIREBASE_AUTH_TOKEN,
      useValue: authInstance,
    },
  ],
};

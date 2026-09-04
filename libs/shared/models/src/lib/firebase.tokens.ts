// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE INJECTION TOKENS
//
// Provides the Firebase app, Firestore, and Auth instances as Angular
// injection tokens. Use inject(FIRESTORE_TOKEN) in services instead of
// importing getFirestore() directly — enables mocking in tests.
//
// All tokens are initialized lazily via factory functions in app.config.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { InjectionToken } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

/** Injection token for the Firebase App instance. */
export const FIREBASE_APP_TOKEN = new InjectionToken<FirebaseApp>('FIREBASE_APP');

/** Injection token for the Firestore database instance. */
export const FIRESTORE_TOKEN = new InjectionToken<Firestore>('FIRESTORE');

/** Injection token for the Firebase Auth instance. */
export const FIREBASE_AUTH_TOKEN = new InjectionToken<Auth>('FIREBASE_AUTH');

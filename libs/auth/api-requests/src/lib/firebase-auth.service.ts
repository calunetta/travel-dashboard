// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE AUTH SERVICE
//
// Handles:
//   - Google Sign-In via popup
//   - Sign-Out
//   - Auth state as Angular Signal
//   - Admin verification (reads the read-only `admins` Firestore collection)
//
// Architecture: Uses inject(FIREBASE_AUTH_TOKEN) and inject(FIRESTORE_TOKEN)
// instead of direct Firebase imports — enables unit test mocking.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { FIREBASE_AUTH_TOKEN, FIRESTORE_TOKEN } from 'shared-models';
import type { Admin, AdminDocument, AuthenticatedUser } from 'auth-models';
import type { FirestoreId } from 'shared-models';

/** Firestore collection name for admins. Never changes. */
const ADMINS_COLLECTION = 'admins';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService implements OnDestroy {
  private readonly auth = inject(FIREBASE_AUTH_TOKEN);
  private readonly firestore = inject(FIRESTORE_TOKEN);

  // ── Internal state ─────────────────────────────────────────────────────────
  private readonly _currentUser = signal<AuthenticatedUser | null>(null);
  private readonly _isLoading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  private readonly _unsubscribeAuth: () => void;
  private _unsubscribeAdmin?: () => void;

  // ── Public Signals (read-only) ────────────────────────────────────────────
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.isAdmin === true);
  readonly isSuperAdmin = computed(
    () => this._currentUser()?.adminProfile?.role === 'SUPER_ADMIN'
  );
  readonly adminProfile = computed(() => this._currentUser()?.adminProfile ?? null);

  constructor() {
    // E2E Mocking Support: Set mock user synchronously before any components read it
    if (localStorage.getItem('bypassAuth') === 'true') {
      this._currentUser.set({
        uid: 'mock-admin-uid',
        email: 'admin@example.com',
        displayName: 'Mock Admin',
        photoURL: null,
        isAdmin: true,
        adminProfile: {
          id: 'mock-admin-uid' as FirestoreId,
          name: 'Mock',
          surname: 'Admin',
          email: 'admin@example.com',
          phone: '',
          role: 'SUPER_ADMIN',
          fcmToken: undefined
        }
      });
      this._isLoading.set(false);
      this._unsubscribeAuth = () => {};
      return;
    }

    // Subscribe to Firebase Auth state changes on service initialization.
    this._unsubscribeAuth = onAuthStateChanged(
      this.auth,
      (firebaseUser) => {
        this._error.set(null);
        
        if (this._unsubscribeAdmin) {
          this._unsubscribeAdmin();
          this._unsubscribeAdmin = undefined;
        }

        if (firebaseUser) {
          this._isLoading.set(true);
          const adminDocRef = doc(this.firestore, ADMINS_COLLECTION, firebaseUser.uid);
          
          this._unsubscribeAdmin = onSnapshot(adminDocRef, (adminSnapshot) => {
            let isAdmin = false;
            let adminProfile: Admin | null = null;

            if (adminSnapshot.exists()) {
              isAdmin = true;
              const data = adminSnapshot.data() as AdminDocument;
              adminProfile = {
                id: firebaseUser.uid as FirestoreId,
                name: data.name ?? '',
                surname: data.surname ?? '',
                email: data.email ?? firebaseUser.email ?? '',
                phone: data.phone ?? '',
                role: data.role ?? 'ADMIN',
                fcmToken: data.fcmToken,
              };
            }

            this._currentUser.set({
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              isAdmin,
              adminProfile,
            });
            this._isLoading.set(false);
          }, (err) => {
            console.error('Failed to read admin profile from Firestore:', err);
            this._currentUser.set({
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              isAdmin: false,
              adminProfile: null,
            });
            this._isLoading.set(false);
          });
        } else {
          this._currentUser.set(null);
          this._isLoading.set(false);
        }
      },
      (err) => {
        this._error.set(err.message);
        this._isLoading.set(false);
      }
    );
  }

  ngOnDestroy(): void {
    if (this._unsubscribeAdmin) {
      this._unsubscribeAdmin();
    }
    this._unsubscribeAuth();
  }

  // ── Public Methods ─────────────────────────────────────────────────────────

  /**
   * Initiates Google Sign-In via popup.
   * Throws if the popup is blocked or the user cancels.
   */
  async signInWithGoogle(): Promise<void> {
    this._error.set(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(this.auth, provider);
      // onAuthStateChanged will handle updating currentUser.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      this._error.set(message);
      throw err;
    }
  }

  /**
   * Signs the current user out.
   */
  async signOut(): Promise<void> {
    this._isLoading.set(true);
    try {
      await signOut(this.auth);
      this._currentUser.set(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-out failed';
      this._error.set(message);
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }
}

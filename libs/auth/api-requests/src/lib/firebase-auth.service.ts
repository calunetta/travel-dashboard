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
import { doc, getDoc } from 'firebase/firestore';
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

  // ── Public Signals (read-only) ────────────────────────────────────────────
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.isAdmin === true);
  readonly adminProfile = computed(() => this._currentUser()?.adminProfile ?? null);

  constructor() {
    // Subscribe to Firebase Auth state changes on service initialization.
    this._unsubscribeAuth = onAuthStateChanged(
      this.auth,
      async (firebaseUser) => {
        this._isLoading.set(true);
        this._error.set(null);
        try {
          if (firebaseUser) {
            const authenticated = await this.#buildAuthenticatedUser(firebaseUser);
            this._currentUser.set(authenticated);
          } else {
            this._currentUser.set(null);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Authentication error';
          this._error.set(message);
          this._currentUser.set(null);
        } finally {
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

  // ── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Builds the AuthenticatedUser by checking if the Firebase user's UID
   * exists in the READ-ONLY `admins` Firestore collection.
   *
   * The admin document is keyed by Firebase Auth UID.
   * This collection is NEVER writable from the app (enforced by Firestore rules).
   */
  async #buildAuthenticatedUser(firebaseUser: User): Promise<AuthenticatedUser> {
    let isAdmin = false;
    let adminProfile: Admin | null = null;

    try {
      const adminDocRef = doc(this.firestore, ADMINS_COLLECTION, firebaseUser.uid);
      const adminSnapshot = await getDoc(adminDocRef);

      if (adminSnapshot.exists()) {
        isAdmin = true;
        const data = adminSnapshot.data() as AdminDocument;
        adminProfile = {
          id: firebaseUser.uid as FirestoreId,
          name: data.name ?? '',
          surname: data.surname ?? '',
          email: data.email ?? firebaseUser.email ?? '',
          phone: data.phone ?? '',
        };
      }
    } catch (e) {
      console.error('Failed to read admin profile from Firestore:', e);
      // We catch this so the user is still authenticated (as non-admin)
      // rather than breaking the entire auth flow.
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isAdmin,
      adminProfile,
    };
  }
}

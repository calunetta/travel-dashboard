import { TestBed } from '@angular/core/testing';
import { FirebaseAuthService } from './firebase-auth.service';
import { FIREBASE_AUTH_TOKEN, FIRESTORE_TOKEN } from 'shared-models';
import * as auth from 'firebase/auth';
import * as firestore from 'firebase/firestore';

// Mock Firebase functions
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    setCustomParameters: jest.fn(),
  })),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('FirebaseAuthService', () => {
  let service: FirebaseAuthService;
  let mockAuth: any;
  let mockFirestore: any;
  let authStateCallback: (user: any) => void;

  beforeEach(() => {
    mockAuth = {};
    mockFirestore = {};

    (auth.onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
      authStateCallback = callback;
      return jest.fn(); // unsubscribe function
    });

    TestBed.configureTestingModule({
      providers: [
        FirebaseAuthService,
        { provide: FIREBASE_AUTH_TOKEN, useValue: mockAuth },
        { provide: FIRESTORE_TOKEN, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(FirebaseAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created and initially loading', () => {
    expect(service).toBeTruthy();
    // Initially, it might not be loading if the callback wasn't called,
    // but the constructor sets up the listener. Since the signal init is true,
    // we expect true.
    expect(service.isLoading()).toBe(true);
  });

  it('should handle unauthenticated user from onAuthStateChanged', async () => {
    await authStateCallback(null);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isAdmin()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('should handle authenticated non-admin user', async () => {
    const mockFirebaseUser = { uid: 'user123', email: 'test@weroad.it', displayName: 'Test User', photoURL: null };
    
    (firestore.getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    await authStateCallback(mockFirebaseUser);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.currentUser()?.adminProfile).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('should handle authenticated admin user', async () => {
    const mockFirebaseUser = { uid: 'admin123', email: 'admin@weroad.it', displayName: 'Admin User', photoURL: null };
    
    (firestore.getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: 'Admin', surname: 'User', email: 'admin@weroad.it', phone: '123' }),
    });

    await authStateCallback(mockFirebaseUser);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(service.currentUser()?.adminProfile?.name).toBe('Admin');
    expect(service.isLoading()).toBe(false);
  });

  it('should call signInWithPopup when signInWithGoogle is called', async () => {
    (auth.signInWithPopup as jest.Mock).mockResolvedValueOnce({});
    await service.signInWithGoogle();
    expect(auth.signInWithPopup).toHaveBeenCalled();
  });

  it('should call signOut from firebase when signOut is called', async () => {
    (auth.signOut as jest.Mock).mockResolvedValueOnce(undefined);
    await service.signOut();
    expect(auth.signOut).toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
  });

  // ── Regression Tests for Infinite Loading Bug ──

  it('should not infinitely load if signInWithPopup succeeds but onAuthStateChanged does not fire', async () => {
    // We already assert that service initially loads, but when signInWithPopup is called,
    // we ensure signInWithGoogle itself does not alter isLoading (which caused the bug).
    // Let's set isLoading to false first, simulating a user who is already on the page and loaded.
    await authStateCallback(null); 
    expect(service.isLoading()).toBe(false);

    (auth.signInWithPopup as jest.Mock).mockResolvedValueOnce({});
    
    // Call signInWithGoogle. It should NOT set isLoading to true and leave it stuck.
    await service.signInWithGoogle();
    
    // isLoading should remain false because onAuthStateChanged didn't fire, 
    // and signInWithGoogle no longer forcibly sets it to true without a finally block.
    expect(service.isLoading()).toBe(false);
  });

  it('should handle Firestore admin check failure gracefully and stop loading', async () => {
    const mockFirebaseUser = { uid: 'user123', email: 'test@weroad.it', displayName: 'Test User', photoURL: null };
    
    // Simulate Firestore throwing an error (e.g. permission denied)
    (firestore.getDoc as jest.Mock).mockRejectedValueOnce(new Error('Permission Denied'));

    // Trigger the auth state change
    await authStateCallback(mockFirebaseUser);

    // The service should catch the error internally in #buildAuthenticatedUser,
    // assign isAdmin = false, and update isLoading to false, preventing infinite load.
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.isLoading()).toBe(false);
  });
});

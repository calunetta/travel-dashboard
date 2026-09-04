// Mock firebase/auth to prevent fetch/Response ReferenceError in Jest
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

if (typeof global !== 'undefined' && !global.fetch) {
  global.fetch = jest.fn();
  global.Response = jest.fn();
  global.Request = jest.fn();
  global.Headers = jest.fn();
}

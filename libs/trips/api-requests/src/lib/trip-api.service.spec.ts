import { TestBed } from '@angular/core/testing';
import { TripApiService } from './trip-api.service';
import { FIRESTORE_TOKEN } from 'shared-models';
import { FirebaseAuthService } from 'auth-api-requests';
import * as firestore from 'firebase/firestore';

jest.mock('auth-api-requests', () => ({
  FirebaseAuthService: class MockAuthService {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

describe('TripApiService RBAC Filtering', () => {
  let service: TripApiService;
  let authServiceMock: any;
  let firestoreMock: any;

  beforeEach(() => {
    authServiceMock = {
      currentUser: jest.fn().mockReturnValue({ uid: 'test-admin-uid' }),
    };
    firestoreMock = {};

    TestBed.configureTestingModule({
      providers: [
        TripApiService,
        { provide: FIRESTORE_TOKEN, useValue: firestoreMock },
        { provide: FirebaseAuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(TripApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should filter trips by adminIds in getAll$', () => {
    // Setup the mock for where
    (firestore.where as jest.Mock).mockReturnValue('mock-where-clause');
    (firestore.orderBy as jest.Mock).mockReturnValue('mock-order-clause');
    (firestore.query as jest.Mock).mockReturnValue('mock-query');
    (firestore.collection as jest.Mock).mockReturnValue('mock-collection');
    
    // Call the method and subscribe to trigger execution
    service.getAll$().subscribe();
    
    // Expect `where` to have been called with the right arguments
    expect(firestore.where).toHaveBeenCalledWith(
      'adminIds',
      'array-contains',
      'test-admin-uid'
    );
    
    // Expect `query` to have been called with the collection and the where clause
    expect(firestore.query).toHaveBeenCalledWith(
      'mock-collection',
      'mock-where-clause',
      'mock-order-clause'
    );
  });
});

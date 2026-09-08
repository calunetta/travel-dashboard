import { TestBed } from '@angular/core/testing';
import { TourApiService } from './tour-api.service';
import { FirebaseAuthService } from 'auth-api-requests';
import { AuditLoggerService } from 'shared-api-requests';
import { FIRESTORE_TOKEN } from 'shared-models';

describe('TourApiService', () => {
  let service: TourApiService;
  let mockFirestore: any;
  let mockAuth: any;
  let mockAudit: any;

  beforeEach(() => {
    mockFirestore = {};
    mockAuth = {
      currentUser: jest.fn().mockReturnValue({ uid: 'mock-admin' }),
    };
    mockAudit = {
      logAction: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TourApiService,
        { provide: FIRESTORE_TOKEN, useValue: mockFirestore },
        { provide: FirebaseAuthService, useValue: mockAuth },
        { provide: AuditLoggerService, useValue: mockAudit },
      ],
    });
    service = TestBed.inject(TourApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Basic mock test to ensure DI works
  it('should have basic methods', () => {
    expect(service.getAll$).toBeDefined();
    expect(service.getById$).toBeDefined();
    expect(service.getByWeRoadCode$).toBeDefined();
    expect(service.create).toBeDefined();
    expect(service.update).toBeDefined();
    expect(service.delete).toBeDefined();
    expect(service.deleteMany).toBeDefined();
  });
});

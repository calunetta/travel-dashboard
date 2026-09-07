import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandidacyListComponent } from './candidacy-list.component';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { TripApiService } from 'trips-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { Nationality } from 'shared-models';
import { CandidacyStatus } from 'coordinators-models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CandidacyListComponent', () => {
  let component: CandidacyListComponent;
  let fixture: ComponentFixture<CandidacyListComponent>;

  let mockCoordinatorApi: any;
  let mockTripApi: any;
  let mockAuthService: any;
  let mockDialog: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockCoordinatorApi = {
      getCandidaciesByStatus$: jest.fn().mockReturnValue(of([
        {
          id: 'cand-1',
          name: 'John',
          surname: 'Doe',
          email: 'john@test.com',
          whatsapp: '123',
          nationality: Nationality.IT,
          status: CandidacyStatus.PENDING,
          tripIds: ['trip-1'],
          submittedAt: '2024-01-01T10:00:00.000Z'
        },
        {
          id: 'cand-2',
          name: 'Jane',
          surname: 'Doe',
          email: 'jane@test.com',
          whatsapp: '1234',
          nationality: Nationality.ES,
          status: CandidacyStatus.PENDING,
          tripIds: ['trip-1'],
          submittedAt: '2024-01-01T11:00:00.000Z'
        }
      ])),
      assignCoordinatorToTrip: jest.fn().mockResolvedValue('assignment-1')
    };

    mockTripApi = {
      getAll$: jest.fn().mockReturnValue(of([
        {
          id: 'trip-1',
          destination: 'Italy',
          nationality: Nationality.IT,
          coordinatorId: null
        }
      ])),
      update: jest.fn().mockResolvedValue(true)
    };

    mockAuthService = {
      isSuperAdmin: jest.fn().mockReturnValue(true),
      currentUser: jest.fn().mockReturnValue({ uid: 'admin-1' })
    };

    mockDialog = {
      open: jest.fn()
    };

    mockSnackBar = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CandidacyListComponent, NoopAnimationsModule, MatDialogModule, MatSnackBarModule],
    })
    .overrideComponent(CandidacyListComponent, {
      set: {
        providers: [
          { provide: CoordinatorApiService, useValue: mockCoordinatorApi },
          { provide: TripApiService, useValue: mockTripApi },
          { provide: FirebaseAuthService, useValue: mockAuthService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidacyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should run matchmaking matching FCFS and nationality', () => {
    component.runMatchmaking();

    expect(mockDialog.open).toHaveBeenCalled();
    const callArgs = mockDialog.open.mock.calls[0];
    const data = callArgs[1].data;

    expect(data.length).toBe(1);
    expect(data[0].candidacyId).toBe('cand-1'); // John Doe matched
    expect(data[0].tripId).toBe('trip-1');
  });

  it('should assign a coordinator automatically and fail if nationality mismatches', async () => {
    const invalidCandidacy = {
      id: 'cand-2',
      name: 'Jane',
      surname: 'Doe',
      email: 'jane@test.com',
      nationality: Nationality.ES,
      tripIds: ['trip-1']
    };

    await component.assign(invalidCandidacy as any, 'AUTOMATIC');

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Nationality mismatch: Candidacy (ES) vs Trip (IT)',
      'Close',
      { duration: 5000 }
    );
    expect(mockCoordinatorApi.assignCoordinatorToTrip).not.toHaveBeenCalled();
  });
});

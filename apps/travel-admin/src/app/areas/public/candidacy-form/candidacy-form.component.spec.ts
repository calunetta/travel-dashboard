import { TestBed } from '@angular/core/testing';
import { CandidacyFormComponent } from './candidacy-form.component';
import { TripApiService } from 'trips-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Nationality } from 'shared-models';
import { ActivatedRoute } from '@angular/router';

describe('CandidacyFormComponent', () => {
  let mockTripApi: any;
  let mockCoordApi: any;

  beforeEach(async () => {
    mockTripApi = {
      getAvailableTrips$: jest.fn().mockReturnValue(of([]))
    };
    mockCoordApi = {
      submitCandidacy: jest.fn().mockResolvedValue(undefined)
    };

    await TestBed.configureTestingModule({
      imports: [CandidacyFormComponent, BrowserAnimationsModule],
      providers: [
        { provide: TripApiService, useValue: mockTripApi },
        { provide: CoordinatorApiService, useValue: mockCoordApi },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();
  });

  it('should filter out trips with wrong nationality', () => {
    mockTripApi.getAvailableTrips$.mockReturnValue(of([
      { id: '1', destination: 'Bali', coordinatorId: null, nationality: Nationality.IT },
      { id: '3', destination: 'Peru', coordinatorId: null, nationality: Nationality.IT },
      { id: '4', destination: 'France', coordinatorId: null, nationality: Nationality.FR },
    ]));

    const fixture = TestBed.createComponent(CandidacyFormComponent);
    const component = fixture.componentInstance;
    
    // Trigger Angular lifecycle which executes toSignal
    fixture.detectChanges();

    const trips = component.availableTrips();
    expect(trips).toBeDefined();
    expect(trips!.length).toBe(2);
    expect(trips![0].id).toBe('1');
    expect(trips![1].id).toBe('3');
  });
});

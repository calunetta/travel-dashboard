import { TestBed } from '@angular/core/testing';
import { CandidacyFormComponent } from './candidacy-form.component';
import { TripApiService } from 'trips-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';

describe('CandidacyFormComponent', () => {
  let mockTripApi: any;
  let mockCoordApi: any;

  beforeEach(async () => {
    mockTripApi = {
      getAll$: jest.fn().mockReturnValue(of([]))
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

  it('should filter out trips that already have a coordinator assigned', () => {
    mockTripApi.getAll$.mockReturnValue(of([
      { id: '1', destination: 'Bali', coordinatorId: null },
      { id: '2', destination: 'Japan', coordinatorId: 'coord-123' },
      { id: '3', destination: 'Peru', coordinatorId: null },
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

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, BehaviorSubject } from 'rxjs';
import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { TourApiService } from 'tours-api-requests';
import { MatDialogModule } from '@angular/material/dialog';
import { Nationality } from 'shared-models';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;
  let mockTourApi: any;
  let mockTripApi: any;
  let toursSubject: BehaviorSubject<any[]>;

  beforeEach(async () => {
    toursSubject = new BehaviorSubject<any[]>([]);
    
    mockTourApi = {
      getAll$: jest.fn().mockReturnValue(toursSubject.asObservable())
    };

    mockTripApi = {
      getAll$: jest.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [CalendarComponent, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: TripApiService, useValue: mockTripApi },
        { provide: HotelApiService, useValue: { getById$: jest.fn() } },
        { provide: CoordinatorApiService, useValue: { getById$: jest.fn() } },
        { provide: TourApiService, useValue: mockTourApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    // Do not detectChanges yet so we can test the constructor/oninit behavior
  });

  it('should set default nationality to IT on initialization', () => {
    fixture.detectChanges();
    expect(component.selectedNationality()).toBe(Nationality.IT);
  });

  it('should select the first available tour on initialization once tours are loaded', fakeAsync(() => {
    expect(component.selectedTourId()).toBeNull();
    
    fixture.detectChanges();
    
    // Simulate tours loading
    toursSubject.next([
      { id: 'tour-1', tourWeRoadCode: 'T1' },
      { id: 'tour-2', tourWeRoadCode: 'T2' }
    ]);
    
    tick();
    
    expect(component.selectedTourId()).toBe('tour-1');
  }));
});

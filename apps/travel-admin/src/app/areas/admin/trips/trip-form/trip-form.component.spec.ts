import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TripFormComponent } from './trip-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { TourApiService } from 'tours-api-requests';
import { AdminApiService, FirebaseAuthService } from 'auth-api-requests';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FIREBASE_STORAGE_TOKEN } from 'shared-models';

describe('TripFormComponent', () => {
  let component: TripFormComponent;
  let fixture: ComponentFixture<TripFormComponent>;
  let mockTourApi: any;
  
  beforeEach(async () => {
    mockTourApi = {
      getAll$: jest.fn().mockReturnValue(of([
        {
          id: 'tour-1',
          country: 'Italy',
          nationalities: ['IT', 'ES'],
          tourLength: 8,
          adminIds: []
        }
      ]))
    };

    await TestBed.configureTestingModule({
      imports: [TripFormComponent, ReactiveFormsModule, NoopAnimationsModule, RouterTestingModule, MatSnackBarModule],
      providers: [
        { provide: TripApiService, useValue: { getById$: jest.fn().mockReturnValue(of(null)) } },
        { provide: HotelApiService, useValue: { getAll$: jest.fn().mockReturnValue(of([])) } },
        { provide: CoordinatorApiService, useValue: { getAll$: jest.fn().mockReturnValue(of([])) } },
        { provide: TourApiService, useValue: mockTourApi },
        { 
          provide: AdminApiService, 
          useValue: { 
            getAll$: jest.fn().mockReturnValue(of([
              { id: 'admin1', role: 'SUPER_ADMIN', name: 'Super' },
              { id: 'admin2', role: 'ADMIN', name: 'Admin' },
              { id: 'admin3', role: 'EDITOR', name: 'Editor' } // Editor role or just anything else
            ])) 
          } 
        },
        { provide: FirebaseAuthService, useValue: { isSuperAdmin: jest.fn().mockReturnValue(true) } },
        { provide: FIREBASE_STORAGE_TOKEN, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should dynamically update available nationalities when tour changes', fakeAsync(() => {
    // Initial state
    expect(component.availableNationalities).toEqual([]);

    // Select tour-1
    component.form.patchValue({ tourId: 'tour-1' as any });
    tick();

    expect(component.availableNationalities).toEqual(['IT', 'ES']);
    // Since there are multiple nationalities, it should NOT auto-select
    expect(component.form.get('nationality')?.value).toBeNull();
  }));

  it('should filter availableHotelBookers$ to SUPER_ADMIN and ADMIN roles', (done) => {
    component.availableHotelBookers$.subscribe(bookers => {
      expect(bookers.length).toBe(2);
      expect(bookers[0].id).toBe('admin1');
      expect(bookers[1].id).toBe('admin2');
      done();
    });
  });
});

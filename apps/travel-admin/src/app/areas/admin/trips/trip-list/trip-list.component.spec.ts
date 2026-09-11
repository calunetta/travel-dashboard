import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripListComponent } from './trip-list.component';
import { TripApiService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { FirebaseAuthService, AdminApiService } from 'auth-api-requests';
import { TourApiService } from 'tours-api-requests';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TripListComponent', () => {
  let component: TripListComponent;
  let fixture: ComponentFixture<TripListComponent>;

  let mockTripApi: any;
  let mockHotelApi: any;
  let mockCoordinatorApi: any;
  let mockAdminApi: any;
  let mockTourApi: any;
  let mockAuthService: any;
  let mockDialog: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockTripApi = {
      getAll$: jest.fn().mockReturnValue(of([
        { id: 'trip1', title: 'Trip 1', destination: 'Dest 1' },
        { id: 'trip2', title: 'Trip 2', destination: 'Dest 2' }
      ])),
      delete: jest.fn().mockResolvedValue(true),
      deleteMany: jest.fn().mockResolvedValue(true)
    };

    mockHotelApi = {
      getAll$: jest.fn().mockReturnValue(of([]))
    };

    mockCoordinatorApi = {
      getAll$: jest.fn().mockReturnValue(of([]))
    };

    mockAdminApi = {
      getAll$: jest.fn().mockReturnValue(of([]))
    };

    mockTourApi = {
      getAll$: jest.fn().mockReturnValue(of([]))
    };

    mockAuthService = {
      isSuperAdmin: jest.fn().mockReturnValue(true)
    };

    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(true)
      })
    };

    mockSnackBar = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TripListComponent, NoopAnimationsModule, MatDialogModule, MatSnackBarModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} }
      ]
    })
    .overrideComponent(TripListComponent, {
      set: {
        providers: [
          { provide: TripApiService, useValue: mockTripApi },
          { provide: HotelApiService, useValue: mockHotelApi },
          { provide: CoordinatorApiService, useValue: mockCoordinatorApi },
          { provide: AdminApiService, useValue: mockAdminApi },
          { provide: TourApiService, useValue: mockTourApi },
          { provide: FirebaseAuthService, useValue: mockAuthService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delete selected trips', async () => {
    component.selection.select({ id: 'trip1' } as any, { id: 'trip2' } as any);
    
    await component.deleteSelected();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockTripApi.deleteMany).toHaveBeenCalledWith(['trip1', 'trip2']);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Successfully deleted 2 trips', 'Close', { duration: 3000 });
  });

  it('should delete single trip', async () => {
    const ev = { stopPropagation: jest.fn() } as any;
    await component.deleteSingle({ id: 'trip1', title: 'Trip 1' } as any, ev);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockTripApi.delete).toHaveBeenCalledWith('trip1');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Trip deleted successfully', 'Close', { duration: 3000 });
  });
});

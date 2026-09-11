import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripDetailComponent } from './trip-detail.component';
import { TripApiService, TripStorageService } from 'trips-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('TripDetailComponent', () => {
  let component: TripDetailComponent;
  let fixture: ComponentFixture<TripDetailComponent>;

  let mockTripApi: any;
  let mockTripStorage: any;
  let mockHotelApi: any;
  let mockCoordinatorApi: any;
  let mockDialog: any;
  let mockSnackBar: any;

  const mockTrip = {
    id: 'trip1',
    destination: 'Bali',
    startDate: '2025-01-10',
    endDate: '2025-01-17',
    nationality: 'IT',
    tourId: 'tour1',
    hotelId: null,
    coordinatorId: null,
    documents: [],
    checklist: [],
    roomComposition: { SINGLE: 0, DOUBLE: 0, TRIPLE: 0, QUAD: 0, EXTRA_BED: 0 },
    adminIds: ['admin1'],
  };

  const mockDocument: any = {
    id: 'doc1',
    name: 'passport.pdf',
    url: 'https://storage.example.com/passport.pdf',
    type: 'PASSPORT',
    uploadedAt: null,
    paymentStatus: 'PENDING',
  };

  beforeEach(async () => {
    mockTripApi = {
      getById$: jest.fn().mockReturnValue(of(mockTrip)),
      update: jest.fn().mockResolvedValue(undefined),
      removeDocument: jest.fn().mockResolvedValue(undefined),
    };

    mockTripStorage = {
      validateDocument: jest.fn().mockReturnValue(null),
      uploadDocument: jest.fn().mockResolvedValue('https://storage.example.com/doc.pdf'),
      deleteDocument: jest.fn().mockResolvedValue(undefined),
    };

    mockHotelApi = { getById$: jest.fn().mockReturnValue(of(null)) };
    mockCoordinatorApi = { getById$: jest.fn().mockReturnValue(of(null)) };

    mockDialog = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of(true) }),
    };

    mockSnackBar = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [
        TripDetailComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        MatDialogModule,
        MatSnackBarModule,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'trip1' } } },
        },
      ],
    })
      .overrideComponent(TripDetailComponent, {
        set: {
          providers: [
            { provide: TripApiService, useValue: mockTripApi },
            { provide: TripStorageService, useValue: mockTripStorage },
            { provide: HotelApiService, useValue: mockHotelApi },
            { provide: CoordinatorApiService, useValue: mockCoordinatorApi },
            { provide: MatDialog, useValue: mockDialog },
            { provide: MatSnackBar, useValue: mockSnackBar },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TripDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('deleteDocument — confirm dialog guard', () => {
    it('should open a dangerous confirm dialog before deleting', async () => {
      await component.deleteDocument('trip1' as any, mockDocument);

      expect(mockDialog.open).toHaveBeenCalledTimes(1);
      const dialogData = mockDialog.open.mock.calls[0][1].data;
      expect(dialogData.dangerous).toBe(true);
      expect(dialogData.title).toContain('Delete');
      expect(dialogData.message).toContain('passport.pdf');
    });

    it('should delete from Storage then Firestore when user confirms', async () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

      await component.deleteDocument('trip1' as any, mockDocument);

      expect(mockTripStorage.deleteDocument).toHaveBeenCalledWith('trip1', 'doc1');
      expect(mockTripApi.removeDocument).toHaveBeenCalledWith('trip1', mockDocument);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        '"passport.pdf" deleted.',
        'Close',
        { duration: 3000 }
      );
    });

    it('should NOT delete when the user cancels the dialog', async () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of(false) });

      await component.deleteDocument('trip1' as any, mockDocument);

      expect(mockTripStorage.deleteDocument).not.toHaveBeenCalled();
      expect(mockTripApi.removeDocument).not.toHaveBeenCalled();
      expect(mockSnackBar.open).not.toHaveBeenCalled();
    });

    it('should show an error snackbar when deletion throws', async () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });
      mockTripStorage.deleteDocument.mockRejectedValue(new Error('Storage error'));

      await component.deleteDocument('trip1' as any, mockDocument);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to delete document. Please try again.',
        'Close',
        { duration: 4000 }
      );
    });

    it('should reset deletingDocId to null after completion', async () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

      await component.deleteDocument('trip1' as any, mockDocument);

      expect(component.deletingDocId()).toBeNull();
    });
  });
});

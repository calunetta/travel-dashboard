import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CsvImportHotelDialogComponent } from './csv-import-hotel-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FirebaseAuthService } from 'auth-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { TourApiService } from 'tours-api-requests';
import { of } from 'rxjs';
import { FirestoreId } from 'shared-models';

describe('CsvImportHotelDialogComponent', () => {
  let component: CsvImportHotelDialogComponent;
  let fixture: ComponentFixture<CsvImportHotelDialogComponent>;
  
  let mockDialogRef: any;
  let mockSnackBar: any;
  let mockAuthService: any;
  let mockHotelApi: any;
  let mockTourApi: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn()
    };
    mockSnackBar = {
      open: jest.fn()
    };
    mockAuthService = {
      currentUser: jest.fn().mockReturnValue({ uid: 'test-admin-id' })
    };
    mockHotelApi = {
      create: jest.fn().mockResolvedValue('new-hotel-id')
    };
    mockTourApi = {
      getAll$: jest.fn().mockReturnValue(of([{ id: 'tour-1', tourName: 'Test Tour', tourWeRoadCode: 'TEST-1' }]))
    };

    await TestBed.configureTestingModule({
      imports: [CsvImportHotelDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: FirebaseAuthService, useValue: mockAuthService },
        { provide: HotelApiService, useValue: mockHotelApi },
        { provide: TourApiService, useValue: mockTourApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CsvImportHotelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse a valid CSV string correctly', async () => {
    // Select a tour first
    component.selectedTourId.set('tour-1' as FirestoreId);

    const csvData = `Supplier name,Beneficiary,Address,Supplier posta code,Supplier city,Supplier tax code,Supplier telephone number,Supplier email,Swift code,Account number
Hotel Sunrise,Sunrise LLC,123 Beach Rd,10001,Miami,TAX123,555-1234,contact@sunrise.com,SWIFT1,ACC1
Hotel Sunset,Sunset Inc,456 Ocean Dr,10002,LA,TAX456,555-5678,contact@sunset.com,SWIFT2,ACC2`;

    const file = new File([csvData], 'test.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as any;

    await component.onFileSelected(event);

    expect(component.globalError()).toBeNull();
    expect(component.parsedRows().length).toBe(2);
    expect(component.validRowsCount()).toBe(2);
    expect(component.invalidRowsCount()).toBe(0);

    const firstRow = component.parsedRows()[0];
    expect(firstRow.isValid).toBe(true);
    expect(firstRow.payload?.name).toBe('Hotel Sunrise');
    expect(firstRow.payload?.tourId).toBe('tour-1');
  });

  it('should mark rows as invalid if missing required fields (e.g. Supplier name)', async () => {
    component.selectedTourId.set('tour-1' as FirestoreId);

    const csvData = `Supplier name,Beneficiary,Address,Supplier posta code,Supplier city,Supplier tax code,Supplier telephone number,Supplier email,Swift code,Account number
,Sunrise LLC,123 Beach Rd,10001,Miami,TAX123,555-1234,contact@sunrise.com,SWIFT1,ACC1`;

    const file = new File([csvData], 'test.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as any;

    await component.onFileSelected(event);

    expect(component.globalError()).toBeNull();
    expect(component.parsedRows().length).toBe(1);
    expect(component.validRowsCount()).toBe(0);
    expect(component.invalidRowsCount()).toBe(1);

    const firstRow = component.parsedRows()[0];
    expect(firstRow.isValid).toBe(false);
    expect(firstRow.errors).toContain('Missing Supplier name');
  });

  it('should call hotelApi.create when startImport is called for valid rows', fakeAsync(() => {
    component.selectedTourId.set('tour-1' as FirestoreId);
    component.parsedRows.set([
      {
        raw: {},
        isValid: true,
        errors: [],
        payload: {
          name: 'Hotel Valid',
          billingData: {} as any,
          pricingRanges: [],
          notes: '',
          tourId: 'tour-1' as FirestoreId,
          adminIds: ['test-admin-id' as FirestoreId]
        },
        supplierName: 'Hotel Valid',
        city: 'Miami'
      }
    ]);

    component.startImport();
    tick();

    expect(mockHotelApi.create).toHaveBeenCalledTimes(1);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Successfully imported 1 hotels!', 'Close', { duration: 3000 });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  }));

  it('should show an error snackbar if import fails', fakeAsync(() => {
    mockHotelApi.create.mockRejectedValueOnce(new Error('Firebase Error'));
    
    component.selectedTourId.set('tour-1' as FirestoreId);
    component.parsedRows.set([
      {
        raw: {},
        isValid: true,
        errors: [],
        payload: {
          name: 'Hotel Fail',
          billingData: {} as any,
          pricingRanges: [],
          notes: '',
          tourId: 'tour-1' as FirestoreId,
          adminIds: ['test-admin-id' as FirestoreId]
        },
        supplierName: 'Hotel Fail',
        city: 'Miami'
      }
    ]);

    component.startImport();
    tick();

    expect(mockHotelApi.create).toHaveBeenCalledTimes(1);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Import completed: 0 successful, 1 failed.', 'Close', { duration: 5000 });
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  }));
});

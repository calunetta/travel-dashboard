import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CsvImportDialogComponent } from './csv-import-dialog.component';
import { TripApiService } from 'trips-api-requests';
import { TourApiService } from 'tours-api-requests';
import { HotelApiService } from 'hotels-api-requests';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { AdminApiService } from 'auth-api-requests';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { Nationality } from 'shared-models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CsvImportDialogComponent', () => {
  let component: CsvImportDialogComponent;
  let fixture: ComponentFixture<CsvImportDialogComponent>;

  let mockTripApi: any;
  let mockTourApi: any;
  let mockHotelApi: any;
  let mockCoordinatorApi: any;
  let mockAdminApi: any;
  let mockDialogRef: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockTripApi = {
      create: jest.fn().mockResolvedValue('trip-123')
    };
    mockTourApi = {
      getAll$: jest.fn().mockReturnValue(of([
        {
          id: 'tour-123',
          tourWeRoadCode: 'tour-code',
          country: 'Italy',
          tourLength: 7,
          nationalities: [Nationality.IT],
          adminIds: []
        }
      ]))
    };
    mockHotelApi = {
      getAll$: jest.fn().mockReturnValue(of([
        {
          id: 'hotel-123',
          name: 'Grand Hotel'
        }
      ]))
    };
    mockCoordinatorApi = {
      upsertCoordinatorFromCsv: jest.fn().mockResolvedValue('coord-123')
    };
    mockAdminApi = {
      getAll$: jest.fn().mockReturnValue(of([
        { id: 'admin1', name: 'Admin', surname: 'Test', email: 'admin@test.com', role: 'ADMIN' }
      ]))
    };
    mockDialogRef = {
      close: jest.fn()
    };
    mockSnackBar = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CsvImportDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: TripApiService, useValue: mockTripApi },
        { provide: TourApiService, useValue: mockTourApi },
        { provide: HotelApiService, useValue: mockHotelApi },
        { provide: CoordinatorApiService, useValue: mockCoordinatorApi },
        { provide: AdminApiService, useValue: mockAdminApi },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CsvImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should download template', () => {
    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');
    
    component.downloadTemplate();
    
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should show error if file is empty', async () => {
    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue('');
    const event = { target: { files: [file] } } as unknown as Event;
    
    await component.onFileSelected(event);
    
    expect(component.globalError()).toBe('The CSV file is empty.');
  });

  it('should show error if required columns are missing', async () => {
    const csvData = 'weRoadTourSlug,start date\ntour-code,2024-01-01';
    const file = new File([csvData], 'missing_cols.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as unknown as Event;
    
    await component.onFileSelected(event);
    
    expect(component.globalError()).toContain('Missing required columns: end date');
  });

  it('should parse valid records and resolve tour and hotel', async () => {
    const csvData = `weRoadTourSlug,start date,end date,coordinator,coordinator number,coordinator email,notes,hotel,booked by,nationality
tour-code,2024-01-01,2024-01-08,Mario Rossi,123,mario@test.it,Test notes,Grand Hotel,Admin,IT`;
    const file = new File([csvData], 'valid.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as unknown as Event;
    
    await component.onFileSelected(event);
    
    expect(component.globalError()).toBeNull();
    const rows = component.parsedRows();
    expect(rows.length).toBe(1);
    expect(rows[0].isValid).toBe(true);
    expect(rows[0].payload?.destination).toBe('Italy');
    expect(rows[0].hotelName).toBe('Grand Hotel');
  });

  it('should handle invalid records (e.g. invalid nationality or missing tour)', async () => {
    const csvData = `weRoadTourSlug,start date,end date,coordinator,coordinator number,coordinator email,notes,hotel,booked by,nationality
invalid-code,2024-01-01,2024-01-08,,,,,,,INVALID`;
    const file = new File([csvData], 'invalid.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as unknown as Event;
    
    await component.onFileSelected(event);
    
    const rows = component.parsedRows();
    expect(rows.length).toBe(1);
    expect(rows[0].isValid).toBe(false);
    expect(rows[0].errors).toContain('Invalid nationality: INVALID');
    expect(rows[0].errors).toContain('Tour not found for slug invalid-code and nationality INVALID');
  });

  it('should normalize dates like dd/MM/yyyy successfully', async () => {
    const csvData = `weRoadTourSlug,start date,end date,coordinator,coordinator number,coordinator email,notes,hotel,booked by,nationality
tour-code,01/02/2027,08/02/2027,Mario Rossi,123,mario@test.it,Test notes,Grand Hotel,Admin,IT`;
    const file = new File([csvData], 'valid_dates.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as unknown as Event;
    
    await component.onFileSelected(event);
    
    expect(component.globalError()).toBeNull();
    const rows = component.parsedRows();
    expect(rows.length).toBe(1);
    expect(rows[0].isValid).toBe(true);
    expect(rows[0].payload?.startDate).toBe('2027-02-01');
    expect(rows[0].payload?.endDate).toBe('2027-02-08');
  });

  it('should flag rows with unparseable dates as invalid', async () => {
    const csvData = `weRoadTourSlug,start date,end date,coordinator,coordinator number,coordinator email,notes,hotel,booked by,nationality
tour-code,invalid,2027-02-08,Mario Rossi,123,mario@test.it,Test notes,Grand Hotel,Admin,IT`;
    const file = new File([csvData], 'invalid_dates.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as unknown as Event;
    
    await component.onFileSelected(event);
    
    const rows = component.parsedRows();
    expect(rows.length).toBe(1);
    expect(rows[0].isValid).toBe(false);
    expect(rows[0].errors).toContain('Invalid start date format');
  });

  it('should start import and create trips', fakeAsync(() => {
    const csvData = `weRoadTourSlug,start date,end date,coordinator,coordinator number,coordinator email,notes,hotel,booked by,nationality
tour-code,2024-01-01,2024-01-08,Mario Rossi,123,mario@test.it,Test notes,Grand Hotel,Admin,IT`;
    const file = new File([csvData], 'valid.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as unknown as Event;
    
    component.onFileSelected(event).then(() => {
      console.log(component.parsedRows()[0].errors); component.startImport();
    });
    tick();

    expect(mockCoordinatorApi.upsertCoordinatorFromCsv).toHaveBeenCalledWith('Mario', 'Rossi', 'mario@test.it', '123');
    expect(mockTripApi.create).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Successfully imported 1 trips!', 'Close', { duration: 3000 });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  }));

  it('should generate fallback email and handle missing phone when only coordinator name is provided', fakeAsync(() => {
    const csvData = `weRoadTourSlug,start date,end date,coordinator,coordinator number,coordinator email,notes,hotel,booked by,nationality
tour-code,2024-01-01,2024-01-08,Mario Rossi,,,Test notes,Grand Hotel,Admin,IT`;
    const file = new File([csvData], 'fallback.csv', { type: 'text/csv' });
    file.text = jest.fn().mockResolvedValue(csvData);
    const event = { target: { files: [file] } } as unknown as Event;
    
    component.onFileSelected(event).then(() => {
      component.startImport();
    });
    tick();

    expect(mockCoordinatorApi.upsertCoordinatorFromCsv).toHaveBeenCalledWith(
      'Mario',
      'Rossi',
      'mario.rossi@unknown-coordinator.com',
      ''
    );
    expect(mockTripApi.create).toHaveBeenCalled();
  }));
});

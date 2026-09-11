import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelListComponent } from './hotel-list.component';
import { HotelApiService } from 'hotels-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('HotelListComponent', () => {
  let component: HotelListComponent;
  let fixture: ComponentFixture<HotelListComponent>;

  let mockHotelApi: any;
  let mockAuthService: any;
  let mockDialog: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockHotelApi = {
      getAll$: jest.fn().mockReturnValue(of([
        { id: 'h1', name: 'Hotel 1', billingData: { supplierName: 'Supplier 1' }, pricingRanges: [] },
        { id: 'h2', name: 'Hotel 2', billingData: { supplierName: 'Supplier 2' }, pricingRanges: [] }
      ])),
      delete: jest.fn().mockResolvedValue(true),
      deleteMany: jest.fn().mockResolvedValue(true)
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
      imports: [HotelListComponent, NoopAnimationsModule, MatDialogModule, MatSnackBarModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} }
      ]
    })
    .overrideComponent(HotelListComponent, {
      set: {
        providers: [
          { provide: HotelApiService, useValue: mockHotelApi },
          { provide: FirebaseAuthService, useValue: mockAuthService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delete selected hotels', async () => {
    component.selection.select({ id: 'h1' } as any, { id: 'h2' } as any);
    
    await component.deleteSelected();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockHotelApi.deleteMany).toHaveBeenCalledWith(['h1', 'h2']);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Successfully deleted 2 hotels', 'Close', { duration: 3000 });
  });

  it('should delete single hotel', async () => {
    const ev = { stopPropagation: jest.fn() } as any;
    await component.deleteSingle({ id: 'h1', name: 'Hotel 1' } as any, ev);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockHotelApi.delete).toHaveBeenCalledWith('h1');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Hotel deleted successfully', 'Close', { duration: 3000 });
  });
});

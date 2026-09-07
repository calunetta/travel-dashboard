import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TourListComponent } from './tour-list.component';
import { TourApiService } from 'tours-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TourListComponent', () => {
  let component: TourListComponent;
  let fixture: ComponentFixture<TourListComponent>;

  let mockTourApi: any;
  let mockAuthService: any;
  let mockDialog: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockTourApi = {
      getAll$: jest.fn().mockReturnValue(of([
        { id: 't1', tourWeRoadCode: 'CODE1', tourName: 'Tour 1' },
        { id: 't2', tourWeRoadCode: 'CODE2', tourName: 'Tour 2' }
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
      imports: [TourListComponent, NoopAnimationsModule, MatDialogModule, MatSnackBarModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} }
      ]
    })
    .overrideComponent(TourListComponent, {
      set: {
        providers: [
          { provide: TourApiService, useValue: mockTourApi },
          { provide: FirebaseAuthService, useValue: mockAuthService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(TourListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delete selected tours', async () => {
    component.selection.select({ id: 't1' } as any, { id: 't2' } as any);
    
    await component.deleteSelected();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockTourApi.deleteMany).toHaveBeenCalledWith(['t1', 't2']);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Successfully deleted 2 tours', 'Close', { duration: 3000 });
  });

  it('should delete single tour', async () => {
    const ev = { stopPropagation: jest.fn() } as any;
    await component.deleteSingle({ id: 't1', tourName: 'Tour 1' } as any, ev);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockTourApi.delete).toHaveBeenCalledWith('t1');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Tour deleted successfully', 'Close', { duration: 3000 });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoordinatorListComponent } from './coordinator-list.component';
import { CoordinatorApiService } from 'coordinators-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CoordinatorListComponent', () => {
  let component: CoordinatorListComponent;
  let fixture: ComponentFixture<CoordinatorListComponent>;

  let mockCoordinatorApi: any;
  let mockAuthService: any;
  let mockDialog: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockCoordinatorApi = {
      getAll$: jest.fn().mockReturnValue(of([
        { id: 'c1', name: 'John', surname: 'Doe' },
        { id: 'c2', name: 'Jane', surname: 'Doe' }
      ])),
      delete: jest.fn().mockResolvedValue(true),
      deleteManyCoordinators: jest.fn().mockResolvedValue(true)
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
      imports: [CoordinatorListComponent, NoopAnimationsModule, MatDialogModule, MatSnackBarModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} }
      ]
    })
    .overrideComponent(CoordinatorListComponent, {
      set: {
        providers: [
          { provide: CoordinatorApiService, useValue: mockCoordinatorApi },
          { provide: FirebaseAuthService, useValue: mockAuthService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoordinatorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delete selected coordinators', async () => {
    component.selection.select({ id: 'c1' } as any, { id: 'c2' } as any);
    
    await component.deleteSelected();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockCoordinatorApi.deleteManyCoordinators).toHaveBeenCalledWith(['c1', 'c2']);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Successfully deleted 2 coordinators', 'Close', { duration: 3000 });
  });

  it('should delete single coordinator', async () => {
    const ev = { stopPropagation: jest.fn() } as any;
    await component.deleteSingle({ id: 'c1', name: 'John', surname: 'Doe' } as any, ev);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockCoordinatorApi.delete).toHaveBeenCalledWith('c1');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Coordinator deleted successfully', 'Close', { duration: 3000 });
  });
});

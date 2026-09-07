import { Component, ChangeDetectionStrategy, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { CoordinatorApiService } from 'coordinators-api-requests';
import { Coordinator } from 'coordinators-models';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FirebaseAuthService } from 'auth-api-requests';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'tha-coordinator-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <div class="tha-flex-row tha-mb-6" style="justify-content: space-between; align-items: center;">
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">Coordinators</h1>
        <div class="tha-flex-row tha-gap-4">
          <button 
            *ngIf="isSuperAdmin() && selection.selected.length > 0"
            mat-flat-button 
            color="warn" 
            (click)="deleteSelected()"
          >
            <mat-icon>delete</mat-icon> Delete Selected ({{ selection.selected.length }})
          </button>
        </div>
      </div>

      <div class="tha-card tha-shadow-sm tha-p-0">
        <div class="tha-p-4" style="border-bottom: 1px solid var(--tha-border);">
          <mat-form-field appearance="outline" class="tha-full-width" style="margin-bottom: -1.25em;">
            <mat-label>Search coordinators</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="e.g. Mario Rossi" #input>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <div style="overflow-x: auto;">
          <table mat-table [dataSource]="dataSource" matSort class="tha-full-width">
            
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef style="width: 50px;">
                <mat-checkbox 
                  *ngIf="isSuperAdmin()"
                  (change)="$event ? toggleAllRows() : null"
                  [checked]="selection.hasValue() && isAllSelected()"
                  [indeterminate]="selection.hasValue() && !isAllSelected()"
                  color="primary"
                >
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let coordinator">
                <mat-checkbox 
                  *ngIf="isSuperAdmin()"
                  (click)="$event.stopPropagation()"
                  (change)="$event ? selection.toggle(coordinator) : null"
                  [checked]="selection.isSelected(coordinator)"
                  color="primary"
                >
                </mat-checkbox>
              </td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Name </th>
              <td mat-cell *matCellDef="let coordinator" class="tha-font-bold"> 
                {{ coordinator.name }} {{ coordinator.surname }} 
              </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Email </th>
              <td mat-cell *matCellDef="let coordinator"> {{ coordinator.email }} </td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Phone </th>
              <td mat-cell *matCellDef="let coordinator"> {{ coordinator.phone }} </td>
            </ng-container>

            <ng-container matColumnDef="agePreference">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Age Preference </th>
              <td mat-cell *matCellDef="let coordinator">
                <span class="tha-text-xs tha-font-bold tha-text-primary" style="background-color: var(--tha-primary-light); padding: 4px 8px; border-radius: var(--tha-radius-sm);">
                  {{ coordinator.agePreference }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="width: 50px; text-align: right;"></th>
              <td mat-cell *matCellDef="let coordinator" style="text-align: right;">
                <button 
                  *ngIf="isSuperAdmin()"
                  mat-icon-button 
                  [matMenuTriggerFor]="menu" 
                  (click)="$event.stopPropagation()"
                >
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="deleteSingle(coordinator, $event)" class="tha-text-error">
                    <mat-icon class="tha-text-error">delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>



            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                class="tha-table-row-hover tha-clickable-row"
                (click)="navigateToCoordinator(row.id)">
            </tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell tha-empty-state-cell" colspan="6">
                <div class="tha-empty-state">
                  <mat-icon class="tha-empty-icon">person_off</mat-icon>
                  <h3 class="tha-empty-title">No coordinators found</h3>
                  <p class="tha-empty-subtitle">There are currently no coordinators matching your criteria.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" aria-label="Select page of coordinators"></mat-paginator>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .tha-table-row-hover:hover {
        background-color: var(--tha-surface-variant);
      }
      .tha-clickable-row {
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
    `,
  ],
})
export class CoordinatorListComponent implements AfterViewInit {
  private readonly coordinatorApi = inject(CoordinatorApiService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSuperAdmin = this.authService.isSuperAdmin;
  displayedColumns: string[] = ['name', 'email', 'phone', 'agePreference'];
  readonly dataSource = new MatTableDataSource<Coordinator>();
  readonly selection = new SelectionModel<Coordinator>(true, []);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    this.coordinatorApi.getAll$().subscribe((coordinators) => {
      this.dataSource.data = [...coordinators];
    });

    this.dataSource.filterPredicate = (data: Coordinator, filter: string) => {
      const searchStr = `${data.name} ${data.surname} ${data.email} ${data.phone}`.toLowerCase();
      return searchStr.indexOf(filter) !== -1;
    };
  }

  ngAfterViewInit() {
    if (this.isSuperAdmin()) {
      this.displayedColumns = ['select', ...this.displayedColumns, 'actions'];
    }
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  navigateToCoordinator(id: string) {
    this.router.navigate(['/admin/coordinators', id]);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.filteredData);
  }

  async deleteSingle(coordinator: Coordinator, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Coordinator',
        message: `Are you sure you want to delete "${coordinator.name} ${coordinator.surname}"? This action cannot be undone.`,
        dangerous: true,
        confirmLabel: 'Delete'
      } as ConfirmDialogData
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await this.coordinatorApi.delete(coordinator.id);
        this.selection.deselect(coordinator);
        this.snackBar.open('Coordinator deleted successfully', 'Close', { duration: 3000 });
      } catch (err) {
        console.error(err);
        this.snackBar.open('Failed to delete coordinator', 'Close', { duration: 3000 });
      }
    }
  }

  async deleteSelected() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Multiple Coordinators',
        message: `Are you sure you want to delete ${this.selection.selected.length} coordinators? This action cannot be undone.`,
        dangerous: true,
        confirmLabel: 'Delete All'
      } as ConfirmDialogData
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        const ids = this.selection.selected.map(c => c.id);
        await this.coordinatorApi.deleteManyCoordinators(ids);
        this.selection.clear();
        this.snackBar.open(`Successfully deleted ${ids.length} coordinators`, 'Close', { duration: 3000 });
      } catch (err) {
        console.error(err);
        this.snackBar.open('Failed to batch delete coordinators', 'Close', { duration: 3000 });
      }
    }
  }
}

import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { TourApiService } from 'tours-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import type { Tour } from 'tours-models';
import { Observable, firstValueFrom } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'tha-tour-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
    ClipboardModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <div class="tha-flex-row tha-flex-col-sm tha-mb-6" style="justify-content: space-between; gap: var(--tha-spacing-4);">
        <div>
          <h1 class="tha-text-3xl tha-font-bold tha-mb-2">Tours</h1>
          <p class="tha-text-muted">Manage available tours.</p>
        </div>
        
        <div class="tha-flex-row tha-gap-4">
          <!-- Bulk delete button for SUPER_ADMIN when items are selected -->
          <button 
            *ngIf="isSuperAdmin() && selection.selected.length > 0"
            mat-flat-button 
            color="warn" 
            (click)="deleteSelected()"
          >
            <mat-icon>delete</mat-icon> Delete Selected ({{ selection.selected.length }})
          </button>
          
          <!-- Only super admins can create tours -->
          <button 
            *ngIf="isSuperAdmin()"
            mat-flat-button 
            color="primary" 
            routerLink="new"
          >
            <mat-icon>add</mat-icon> Add Tour
          </button>
        </div>
      </div>

      <mat-card class="tha-card" style="padding: 0; overflow: hidden;">
        @if(tours$ | async; as tours) {
          <table mat-table [dataSource]="tours" class="tha-full-width">
            
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef style="width: 50px;">
                <mat-checkbox 
                  *ngIf="isSuperAdmin()"
                  (change)="$event ? toggleAllRows(tours) : null"
                  [checked]="selection.hasValue() && isAllSelected(tours)"
                  [indeterminate]="selection.hasValue() && !isAllSelected(tours)"
                  color="primary"
                >
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let t">
                <mat-checkbox 
                  *ngIf="isSuperAdmin()"
                  (click)="$event.stopPropagation()"
                  (change)="$event ? selection.toggle(t) : null"
                  [checked]="selection.isSelected(t)"
                  color="primary"
                >
                </mat-checkbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="tourWeRoadCode">
              <th mat-header-cell *matHeaderCellDef>Code</th>
              <td mat-cell *matCellDef="let t" class="tha-font-bold">{{ t.tourWeRoadCode }}</td>
            </ng-container>

            <ng-container matColumnDef="tourName">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let t">{{ t.tourName }}</td>
            </ng-container>

            <ng-container matColumnDef="country">
              <th mat-header-cell *matHeaderCellDef>Country</th>
              <td mat-cell *matCellDef="let t">{{ t.country }}</td>
            </ng-container>

            <ng-container matColumnDef="tourLength">
              <th mat-header-cell *matHeaderCellDef>Length</th>
              <td mat-cell *matCellDef="let t">{{ t.tourLength }} days</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="width: 140px; text-align: right;"></th>
              <td mat-cell *matCellDef="let t" style="text-align: right;">
                <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openPublicForm(t.tourWeRoadCode, $event)">
                    <mat-icon class="tha-text-primary">open_in_new</mat-icon>
                    <span>Open Public Form</span>
                  </button>
                  <button mat-menu-item (click)="copyPublicLink(t.tourWeRoadCode, $event)">
                    <mat-icon class="tha-text-muted">content_copy</mat-icon>
                    <span>Copy Link</span>
                  </button>
                  <button *ngIf="isSuperAdmin()" mat-menu-item [routerLink]="[t.id, 'edit']">
                    <mat-icon class="tha-text-muted">edit</mat-icon>
                    <span>Edit Tour</span>
                  </button>
                  <button *ngIf="isSuperAdmin()" mat-menu-item (click)="deleteSingle(t, $event)" class="tha-text-error">
                    <mat-icon class="tha-text-error">delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                class="tha-table-row-hover tha-clickable-row"
                (click)="navigateToTour(row.id)">
            </tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell tha-empty-state-cell" colspan="5">
                <div class="tha-empty-state">
                  <mat-icon class="tha-empty-icon">map</mat-icon>
                  <h3 class="tha-empty-title">No tours found</h3>
                  <p class="tha-empty-subtitle">There are currently no tours available. Create one to get started.</p>
                </div>
              </td>
            </tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TourListComponent implements OnInit {
  private readonly tourApi = inject(TourApiService);
  private readonly authService = inject(FirebaseAuthService);
  private readonly router = inject(Router);
  private readonly clipboard = inject(Clipboard);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly isSuperAdmin = this.authService.isSuperAdmin;
  displayedColumns = ['tourWeRoadCode', 'tourName', 'country', 'tourLength', 'actions'];

  tours$!: Observable<ReadonlyArray<Tour>>;
  selection = new SelectionModel<Tour>(true, []);

  ngOnInit() {
    this.tours$ = this.tourApi.getAll$();
    if (this.isSuperAdmin()) {
      this.displayedColumns = ['select', ...this.displayedColumns];
    }
  }

  navigateToTour(id: string) {
    this.router.navigate(['/admin/tours', id, 'edit']);
  }

  openPublicForm(tourWeRoadCode: string, event: Event) {
    event.stopPropagation();
    const url = `/${tourWeRoadCode}/public`;
    window.open(url, '_blank');
  }

  copyPublicLink(tourWeRoadCode: string, event: Event) {
    event.stopPropagation();
    const url = `${window.location.origin}/${tourWeRoadCode}/public`;
    const success = this.clipboard.copy(url);
    if (success) {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('Failed to copy link.', 'Close', { duration: 2000 });
    }
  }

  isAllSelected(tours: ReadonlyArray<Tour>) {
    const numSelected = this.selection.selected.length;
    const numRows = tours.length;
    return numSelected === numRows;
  }

  toggleAllRows(tours: ReadonlyArray<Tour>) {
    if (this.isAllSelected(tours)) {
      this.selection.clear();
      return;
    }
    this.selection.select(...tours);
  }

  async deleteSingle(tour: Tour, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Tour',
        message: `Are you sure you want to delete the tour "${tour.tourName}"? This action cannot be undone.`,
        dangerous: true,
        confirmLabel: 'Delete'
      } as ConfirmDialogData
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await this.tourApi.delete(tour.id);
        this.selection.deselect(tour);
        this.snackBar.open('Tour deleted successfully', 'Close', { duration: 3000 });
      } catch (err) {
        console.error(err);
        this.snackBar.open('Failed to delete tour', 'Close', { duration: 3000 });
      }
    }
  }

  async deleteSelected() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Multiple Tours',
        message: `Are you sure you want to delete ${this.selection.selected.length} tours? This action cannot be undone.`,
        dangerous: true,
        confirmLabel: 'Delete All'
      } as ConfirmDialogData
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        const ids = this.selection.selected.map(t => t.id);
        await this.tourApi.deleteMany(ids);
        this.selection.clear();
        this.snackBar.open(`Successfully deleted ${ids.length} tours`, 'Close', { duration: 3000 });
      } catch (err) {
        console.error(err);
        this.snackBar.open('Failed to batch delete tours', 'Close', { duration: 3000 });
      }
    }
  }
}

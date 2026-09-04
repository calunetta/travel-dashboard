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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-page tha-animate-fade-in">
      <div class="tha-flex-row tha-mb-6" style="justify-content: space-between; align-items: center;">
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">Coordinators</h1>
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



            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                class="tha-table-row-hover tha-clickable-row"
                (click)="navigateToCoordinator(row.id)">
            </tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell tha-p-4 tha-text-center tha-text-muted" colspan="5">
                No coordinators found matching the filter.
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
  private readonly router = inject(Router);

  readonly displayedColumns: string[] = ['name', 'email', 'phone', 'agePreference'];
  readonly dataSource = new MatTableDataSource<Coordinator>();

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
}

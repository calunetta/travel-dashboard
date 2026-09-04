import { Component, ChangeDetectionStrategy, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { HotelApiService } from 'hotels-api-requests';
import { Hotel } from 'hotels-models';

@Component({
  selector: 'tha-hotel-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
        <h1 class="tha-text-3xl tha-font-bold tha-mb-0">Hotels</h1>
        <button mat-flat-button color="primary" routerLink="/admin/hotels/new">
          <mat-icon>add</mat-icon> New Hotel
        </button>
      </div>

      <div class="tha-card tha-shadow-sm tha-p-0">
        <div class="tha-p-4" style="border-bottom: 1px solid var(--tha-border);">
          <mat-form-field appearance="outline" class="tha-full-width" style="margin-bottom: -1.25em;">
            <mat-label>Search hotels</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="e.g. Grand Resort" #input>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <div style="overflow-x: auto;">
          <table mat-table [dataSource]="dataSource" matSort class="tha-full-width">
            
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Name </th>
              <td mat-cell *matCellDef="let hotel" class="tha-font-bold"> {{ hotel.name }} </td>
            </ng-container>

            <ng-container matColumnDef="destination">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Destination </th>
              <td mat-cell *matCellDef="let hotel"> {{ hotel.destination }} </td>
            </ng-container>

            <ng-container matColumnDef="supplierName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Supplier </th>
              <td mat-cell *matCellDef="let hotel"> {{ hotel.billingData.supplierName }} </td>
            </ng-container>

            <ng-container matColumnDef="country">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Country </th>
              <td mat-cell *matCellDef="let hotel"> {{ hotel.billingData.country }} </td>
            </ng-container>

            <ng-container matColumnDef="pricingRanges">
              <th mat-header-cell *matHeaderCellDef> Configured Prices </th>
              <td mat-cell *matCellDef="let hotel">
                {{ hotel.pricingRanges.length }} range(s)
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let hotel" style="text-align: right;">
                <button mat-icon-button color="primary" [routerLink]="['/admin/hotels', hotel.id, 'edit']" aria-label="Edit Hotel" title="Edit Hotel">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="tha-table-row-hover"></tr>

            <!-- Row shown when there is no matching data. -->
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell tha-p-4 tha-text-center tha-text-muted" colspan="6">
                No hotels found matching the filter.
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" aria-label="Select page of hotels"></mat-paginator>
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
    `,
  ],
})
export class HotelListComponent implements AfterViewInit {
  private readonly hotelApi = inject(HotelApiService);

  readonly displayedColumns: string[] = ['name', 'destination', 'supplierName', 'country', 'pricingRanges', 'actions'];
  readonly dataSource = new MatTableDataSource<Hotel>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    this.hotelApi.getAll$().subscribe((hotels) => {
      this.dataSource.data = [...hotels];
    });

    this.dataSource.filterPredicate = (data: Hotel, filter: string) => {
      const searchStr = `${data.name} ${data.destination} ${data.billingData.supplierName} ${data.billingData.country}`.toLowerCase();
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
}

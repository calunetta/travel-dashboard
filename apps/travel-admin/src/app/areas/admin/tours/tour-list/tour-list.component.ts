import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TourApiService } from 'tours-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import type { Tour } from 'tours-models';
import { Observable } from 'rxjs';

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
              <th mat-header-cell *matHeaderCellDef style="width: 80px; text-align: right;"></th>
              <td mat-cell *matCellDef="let t" style="text-align: right;">
                <button 
                  *ngIf="isSuperAdmin()"
                  mat-icon-button 
                  [routerLink]="[t.id, 'edit']"
                  matTooltip="Edit Tour"
                >
                  <mat-icon class="tha-text-muted">edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="tha-table-row"></tr>
          </table>
        }
        
        <div 
          *ngIf="(tours$ | async)?.length === 0" 
          class="tha-flex-col tha-flex-center tha-p-8 tha-text-muted"
        >
          <mat-icon style="font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;">
            flight_takeoff
          </mat-icon>
          <p>No tours found.</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tha-table-row:hover { background: rgba(0,0,0,0.02); }
    .dark-theme .tha-table-row:hover { background: rgba(255,255,255,0.02); }
  `]
})
export class TourListComponent implements OnInit {
  private readonly tourApi = inject(TourApiService);
  private readonly authService = inject(FirebaseAuthService);

  readonly isSuperAdmin = this.authService.isSuperAdmin;
  readonly displayedColumns = ['tourWeRoadCode', 'tourName', 'country', 'tourLength', 'actions'];

  tours$!: Observable<ReadonlyArray<Tour>>;

  ngOnInit() {
    this.tours$ = this.tourApi.getAll$();
  }
}

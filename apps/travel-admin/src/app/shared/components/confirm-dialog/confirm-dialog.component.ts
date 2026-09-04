import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerous?: boolean;
}

@Component({
  selector: 'tha-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="tha-flex-row tha-gap-2" style="align-items: center;">
      @if (data.dangerous) {
        <mat-icon style="color: var(--tha-error);">warning</mat-icon>
      }
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p style="margin: 0; line-height: 1.6;">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="gap: var(--tha-spacing-2); padding-bottom: var(--tha-spacing-4);">
      <button mat-stroked-button [mat-dialog-close]="false" id="confirm-dialog-cancel">
        {{ data.cancelLabel ?? 'Cancel' }}
      </button>
      <button
        mat-flat-button
        [color]="data.dangerous ? 'warn' : 'primary'"
        [mat-dialog-close]="true"
        id="confirm-dialog-confirm"
      >
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}

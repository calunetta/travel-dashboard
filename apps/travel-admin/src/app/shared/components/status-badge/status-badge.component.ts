import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tha-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="tha-text-xs tha-font-bold"
      [ngClass]="badgeClass()"
      style="padding: 4px 8px; border-radius: var(--tha-radius-md); display: inline-block;"
    >
      {{ status() }}
    </span>
  `,
  styles: [
    `
      .status-draft {
        background-color: var(--tha-surface-variant);
        color: var(--tha-text);
      }
      .status-published {
        background-color: var(--tha-primary-light);
        color: var(--tha-primary-dark);
      }
      .status-full {
        background-color: var(--tha-warning-bg);
        color: var(--tha-warning);
      }
      .status-completed {
        background-color: var(--tha-success-bg);
        color: var(--tha-success);
      }
      .status-cancelled {
        background-color: var(--tha-error-bg);
        color: var(--tha-error);
      }
      .status-pending {
        background-color: var(--tha-warning-bg);
        color: var(--tha-warning);
      }
      .status-assigned {
        background-color: var(--tha-success-bg);
        color: var(--tha-success);
      }
      .status-rejected {
        background-color: var(--tha-error-bg);
        color: var(--tha-error);
      }
      .status-withdrawn {
        background-color: var(--tha-surface-variant);
        color: var(--tha-text-muted);
      }
      .status-unknown {
        background-color: var(--tha-surface-variant);
        color: var(--tha-text);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();

  badgeClass(): string {
    const s = this.status().toLowerCase();
    switch (s) {
      case 'draft':
        return 'status-draft';
      case 'published':
        return 'status-published';
      case 'full':
        return 'status-full';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'pending':
        return 'status-pending';
      case 'assigned':
        return 'status-assigned';
      case 'rejected':
        return 'status-rejected';
      case 'withdrawn':
        return 'status-withdrawn';
      default:
        return 'status-unknown';
    }
  }
}

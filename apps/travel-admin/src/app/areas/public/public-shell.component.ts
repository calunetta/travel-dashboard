import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from 'shared-ui';

@Component({
  selector: 'tha-public-shell',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tha-full-height tha-flex-col">
      <mat-toolbar color="primary" class="tha-shadow-sm" style="z-index: var(--tha-z-sticky)">
        <span class="tha-font-bold tha-text-xl">WeRoadX Operations</span>
        <span class="tha-flex-1"></span>
        <button mat-icon-button (click)="themeService.toggle()" aria-label="Toggle theme">
          <mat-icon>{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
      </mat-toolbar>

      <main class="tha-flex-1" style="overflow-y: auto; padding: var(--tha-spacing-6) 0;">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class PublicShellComponent {
  protected readonly themeService = inject(ThemeService);
}

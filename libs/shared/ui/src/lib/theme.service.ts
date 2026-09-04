// ─────────────────────────────────────────────────────────────────────────────
// THEME SERVICE — Light / Dark Mode Manager
//
// Manages the application's color scheme by toggling the `dark-theme` class
// on <body>. Persists user preference to localStorage.
// Uses Angular 19 Signals for reactive state.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

const STORAGE_KEY = 'tha-color-scheme';
const DARK_THEME_CLASS = 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  /** True when dark mode is active. */
  readonly isDarkMode = signal<boolean>(this.#loadInitialMode());

  /** CSS class string for template binding (e.g. [class]="themeClass()"). */
  readonly themeClass = computed(() => (this.isDarkMode() ? DARK_THEME_CLASS : ''));

  constructor() {
    // Apply theme class to <body> reactively whenever isDarkMode changes.
    effect(() => {
      this.#applyTheme(this.isDarkMode());
    });
  }

  /** Toggle between light and dark mode. */
  toggle(): void {
    this.isDarkMode.update((current) => !current);
    this.#persist(this.isDarkMode());
  }

  /** Explicitly set dark mode on or off. */
  setDarkMode(dark: boolean): void {
    this.isDarkMode.set(dark);
    this.#persist(dark);
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  #loadInitialMode(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'dark';
    }
    // Respect OS preference if no stored preference exists.
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  #applyTheme(dark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const body = this.document.body;
    if (dark) {
      body.classList.add(DARK_THEME_CLASS);
    } else {
      body.classList.remove(DARK_THEME_CLASS);
    }
  }

  #persist(dark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION ROUTES — Lazy-loaded areas
//
// Public area:  / (candidacy form, no auth required)
// Admin area:   /admin/** (requires authGuard)
// Auth:         /login, /unauthorized
// ─────────────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';
import { authGuard } from 'auth-features';

export const appRoutes: Routes = [
  // ── Default redirect ──────────────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full',
  },

  // ── Public Area — Coordinator Candidacy Form (no auth) ───────────────────
  {
    path: 'public',
    loadComponent: () =>
      import('./areas/public/public-shell.component').then(
        (m) => m.PublicShellComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./areas/public/candidacy-form/candidacy-form.component').then(
            (m) => m.CandidacyFormComponent
          ),
      },
      {
        path: 'success',
        loadComponent: () =>
          import('./areas/public/candidacy-success/candidacy-success.component').then(
            (m) => m.CandidacySuccessComponent
          ),
      },
    ],
  },

  // ── Login Page ────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./areas/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // ── Unauthorized Page ─────────────────────────────────────────────────────
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./areas/auth/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent
      ),
  },

  // ── Admin Area — Protected by authGuard ──────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./areas/admin/admin-shell.component').then(
        (m) => m.AdminShellComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./areas/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      // ── Trips ──────────────────────────────────────────────────────────
      {
        path: 'trips',
        loadComponent: () =>
          import('./areas/admin/trips/trip-list/trip-list.component').then(
            (m) => m.TripListComponent
          ),
      },
      {
        path: 'trips/new',
        loadComponent: () =>
          import('./areas/admin/trips/trip-form/trip-form.component').then(
            (m) => m.TripFormComponent
          ),
      },
      {
        path: 'trips/:id',
        loadComponent: () =>
          import('./areas/admin/trips/trip-detail/trip-detail.component').then(
            (m) => m.TripDetailComponent
          ),
      },
      {
        path: 'trips/:id/edit',
        loadComponent: () =>
          import('./areas/admin/trips/trip-form/trip-form.component').then(
            (m) => m.TripFormComponent
          ),
      },
      // ── Hotels ─────────────────────────────────────────────────────────
      {
        path: 'hotels',
        loadComponent: () =>
          import('./areas/admin/hotels/hotel-list/hotel-list.component').then(
            (m) => m.HotelListComponent
          ),
      },
      {
        path: 'hotels/new',
        loadComponent: () =>
          import('./areas/admin/hotels/hotel-form/hotel-form.component').then(
            (m) => m.HotelFormComponent
          ),
      },
      {
        path: 'hotels/:id/edit',
        loadComponent: () =>
          import('./areas/admin/hotels/hotel-form/hotel-form.component').then(
            (m) => m.HotelFormComponent
          ),
      },
      // ── Coordinators ───────────────────────────────────────────────────
      {
        path: 'coordinators',
        loadComponent: () =>
          import(
            './areas/admin/coordinators/coordinator-list/coordinator-list.component'
          ).then((m) => m.CoordinatorListComponent),
      },
      {
        path: 'coordinators/:id',
        loadComponent: () =>
          import(
            './areas/admin/coordinators/coordinator-detail/coordinator-detail.component'
          ).then((m) => m.CoordinatorDetailComponent),
      },
      // ── Candidacies ────────────────────────────────────────────────────
      {
        path: 'candidacies',
        loadComponent: () =>
          import(
            './areas/admin/candidacies/candidacy-list/candidacy-list.component'
          ).then((m) => m.CandidacyListComponent),
      },
      // ── Calendar View (Week) ───────────────────────────────────────────
      {
        path: 'calendar',
        loadComponent: () =>
          import('./areas/admin/calendar/calendar.component').then(
            (m) => m.CalendarComponent
          ),
      },
    ],
  },

  // ── Wildcard ──────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'public',
  },
];

# Travel Handling App — Development Tracker

> **Single Source of Truth** for all development steps, implemented features, and bug fixes.
> Before making ANY change, reference this file to understand the current application state.

---

## Project Metadata

| Key | Value |
|-----|-------|
| **Framework** | Angular 19 (Standalone Components, no NgModules) |
| **Monorepo** | Nx 20.8.4 |
| **Package Manager** | Yarn 1.22.22 |
| **Node Version** | v24.14.1 |
| **Backend** | Firebase (Firestore + Google Auth) |
| **UI Library** | Angular Material ~19.2.0 |
| **Styling** | SCSS (centralized, Light + Dark theme) |
| **Bundler** | Webpack (dev) |
| **Test Runner** | Jest (unit) + Cypress (E2E) |
| **External API** | WeRoad (`https://api-catalog.weroad.it`) |
| **Deployment** | Firebase Hosting (GitHub Pages ready) |

---

## Architecture

### Apps
- `apps/travel-admin` — Main Angular 19 standalone app
- `apps/travel-admin-e2e` — Cypress E2E tests

### Libraries (Domain-Driven)

| Library | Import Path | Purpose |
|---------|-------------|---------|
| `shared-models` | `@travel-handling-app/shared/models` | Global interfaces, enums, types |
| `shared-ui` | `@travel-handling-app/shared/ui` | Global dumb/presentational components |
| `shared-mapping-and-utils` | `@travel-handling-app/shared/mapping-and-utils` | Global utilities, type guards |
| `auth-models` | `@travel-handling-app/auth/models` | Auth interfaces & types |
| `auth-api-requests` | `@travel-handling-app/auth/api-requests` | Firebase Auth service |
| `auth-features` | `@travel-handling-app/auth/features` | Login page, auth guard |
| `trips-models` | `@travel-handling-app/trips/models` | Trip interfaces & enums |
| `trips-api-requests` | `@travel-handling-app/trips/api-requests` | Firestore trip CRUD service |
| `trips-mapping-and-utils` | `@travel-handling-app/trips/mapping-and-utils` | Trip mappers & utilities |
| `trips-ui` | `@travel-handling-app/trips/ui` | Trip presentational components |
| `trips-features` | `@travel-handling-app/trips/features` | Trip smart/container components |
| `hotels-models` | `@travel-handling-app/hotels/models` | Hotel interfaces & enums |
| `hotels-api-requests` | `@travel-handling-app/hotels/api-requests` | Firestore hotel CRUD service |
| `hotels-mapping-and-utils` | `@travel-handling-app/hotels/mapping-and-utils` | Hotel mappers & utilities |
| `hotels-ui` | `@travel-handling-app/hotels/ui` | Hotel presentational components |
| `hotels-features` | `@travel-handling-app/hotels/features` | Hotel smart/container components |
| `coordinators-models` | `@travel-handling-app/coordinators/models` | Coordinator interfaces & enums |
| `coordinators-api-requests` | `@travel-handling-app/coordinators/api-requests` | Firestore coordinator service |
| `coordinators-mapping-and-utils` | `@travel-handling-app/coordinators/mapping-and-utils` | Coordinator mappers & utilities |
| `coordinators-ui` | `@travel-handling-app/coordinators/ui` | Coordinator presentational components |
| `coordinators-features` | `@travel-handling-app/coordinators/features` | Coordinator smart/container components |

---

## Development Steps

### ✅ Step 1 — Nx Workspace, Firebase Setup & Tracker

**Status:** COMPLETED  
**Completed At:** 2026-09-03

#### What was done:

**1A — Nx Workspace Bootstrap**
- Created Nx 20.8.4 monorepo workspace using `create-nx-workspace@20` with `angular-monorepo` preset
- Package manager: Yarn 1.22.22 with `ignore-engines true` to work around Node 24.14.1 vs 24.15.0 constraint
- Added `fs-constants` dependency to fix Nx postinstall script compatibility

**1B — Application Generation**
- Generated `apps/travel-admin` — Angular 19 standalone app with SCSS, routing, Jest, Cypress, Webpack
- Generated `apps/travel-admin-e2e` — Cypress E2E project

**1C — Library Skeleton Generation (21 libs)**
- Generated all 21 domain-driven Angular libraries under `libs/`
- All libraries use: standalone components, OnPush change detection, Jest unit test runner

**1D — Firebase Configuration**
- Created `firebase.json` — Firestore rules + Hosting config targeting `dist/apps/travel-admin/browser`
- Created `.firebaserc` — Project alias (⚠️ replace `YOUR_FIREBASE_PROJECT_ID`)
- Created `firestore.rules` — Full security rules (admins READ-ONLY, public candidacy, deny-all default)
- Created `firestore.indexes.json` — Empty indexes file
- Created `apps/travel-admin/src/environments/environment.ts` — Dev config (⚠️ replace placeholders)
- Created `apps/travel-admin/src/environments/environment.prod.ts` — Prod config (⚠️ replace placeholders)

**1E — Proxy Configuration**
- Created `proxy.conf.mjs` — Routes `/api/weroad` → `https://api-catalog.weroad.it`
- Patched `apps/travel-admin/project.json` — Added `proxyConfig`, `port: 4200` to serve target

**1F — Git & Tracker**
- Initialized Git repository
- Created `DEVELOPMENT_TRACKER.md` (this file)

#### Files Created/Modified in Step 1:
```
apps/travel-admin/                          [NEW] Angular app
apps/travel-admin-e2e/                      [NEW] Cypress E2E
libs/shared/models/                         [NEW] Library
libs/shared/ui/                             [NEW] Library
libs/shared/mapping-and-utils/              [NEW] Library
libs/auth/models/                           [NEW] Library
libs/auth/api-requests/                     [NEW] Library
libs/auth/features/                         [NEW] Library
libs/trips/models/                          [NEW] Library
libs/trips/api-requests/                    [NEW] Library
libs/trips/mapping-and-utils/               [NEW] Library
libs/trips/ui/                              [NEW] Library
libs/trips/features/                        [NEW] Library
libs/hotels/models/                         [NEW] Library
libs/hotels/api-requests/                   [NEW] Library
libs/hotels/mapping-and-utils/              [NEW] Library
libs/hotels/ui/                             [NEW] Library
libs/hotels/features/                       [NEW] Library
libs/coordinators/models/                   [NEW] Library
libs/coordinators/api-requests/             [NEW] Library
libs/coordinators/mapping-and-utils/        [NEW] Library
libs/coordinators/ui/                       [NEW] Library
libs/coordinators/features/                 [NEW] Library
proxy.conf.mjs                              [NEW] WeRoad CORS proxy
firebase.json                               [NEW] Firebase hosting + firestore rules config
.firebaserc                                 [NEW] Firebase project alias
firestore.rules                             [NEW] Firestore security rules
firestore.indexes.json                      [NEW] Firestore indexes (empty)
apps/travel-admin/src/environments/environment.ts       [NEW] Dev Firebase config
apps/travel-admin/src/environments/environment.prod.ts  [NEW] Prod Firebase config
apps/travel-admin/project.json              [MODIFIED] Added proxy + port to serve target
DEVELOPMENT_TRACKER.md                      [NEW] This file
```

#### ⚠️ Required Manual Actions Before Step 2:
1. Replace `YOUR_FIREBASE_PROJECT_ID` in `.firebaserc` with your actual Firebase project ID
2. Replace all `YOUR_*` placeholders in both `environment.ts` and `environment.prod.ts` with real Firebase config values
3. Enable Google Auth provider in Firebase Console → Authentication → Sign-in method

---

### ✅ Step 2 — Core Models, Material UI Theming & Mappers

**Status:** COMPLETED  
**Completed At:** 2026-09-04

#### What was done:

**2A — Shared Primitive Types**
- Created `libs/shared/models/src/lib/primitives.types.ts` — `FirestoreTimestamp`, `ISODateString`, `FirestoreId`, `PaginatedResponse<T>`, `OperationResult<T>`, `SortDirection`, `CollectionQuery`
- Created `libs/shared/models/src/lib/weroad-api.types.ts` — `WeRoadGroupInfo`, `WeRoadCoordinator`, `WeRoadTour`, `WeRoadPaginatedToursResponse`

**2B — Domain Models**
- Created `libs/auth/models/src/lib/admin.model.ts` — `Admin`, `AdminDocument`, `AuthenticatedUser` (admin collection is READ-ONLY)
- Created `libs/trips/models/src/lib/trip.model.ts` — `RoomType` enum, `TripStatus` enum, `RoomComposition`, `DEFAULT_ROOM_COMPOSITION`, `Trip`, `TripFirestoreDocument`, `CreateTripPayload`, `UpdateTripPayload`
- Created `libs/hotels/models/src/lib/hotel.model.ts` — `CountryCode` enum, `HotelBillingData`, `DateRangePricing`, `RoomPriceEntry`, `Hotel`, `HotelFirestoreDocument`, `HotelCostCalculation`, `CreateHotelPayload`, `UpdateHotelPayload`
- Created `libs/coordinators/models/src/lib/coordinator.model.ts` — `AgePreference` enum, `AssignmentType` enum (AUTOMATIC/MANUAL with auto-cleanup logic), `CandidacyStatus` enum, `Coordinator`, `Candidacy`, `TripAssignment`, `CandidacyFormPayload`, `UpdateCoordinatorPayload`

**2C — Type Guards & Mappers**
- Created `libs/shared/mapping-and-utils/src/lib/type-guards.ts` — Runtime guards for all enums, Firestore documents, WeRoad API responses
- Created `libs/shared/mapping-and-utils/src/lib/utils.ts` — `timestampToIso`, `buildWhatsAppUrl`, `centsToEurString`, `eurToCents`, `calculateNights`, `isDateInRange`, `getInitials`, `capitalize`
- Created `libs/trips/mapping-and-utils/src/lib/trip.mapper.ts` — `mapSnapshotToTrip`, `mapCreatePayloadToFirestore`, `mapUpdatePayloadToFirestore`, `createDefaultTripPayload`
- Created `libs/hotels/mapping-and-utils/src/lib/hotel.mapper.ts` — `mapSnapshotToHotel`, `mapCreateHotelToFirestore`
- Created `libs/hotels/mapping-and-utils/src/lib/hotel-cost.calculator.ts` — `calculateHotelCost` (pricing range matching → per-room breakdown → grand total)
- Created `libs/coordinators/mapping-and-utils/src/lib/coordinator.mapper.ts` — `mapSnapshotToCoordinator`, `mapSnapshotToCandidacy`, `mapCandidacyFormToFirestore`, `mapCandidacyToCoordinatorFirestore`

**2D — SCSS Design System & Angular Material Theming**
- Created `apps/travel-admin/src/styles/_tokens.scss` — SCSS variables: brand palette (Primary Blue #3f7bd9, Accent Gold #ffc107), semantic colors, surface colors, typography scale, spacing, radius, shadows, transitions, breakpoints
- Created `apps/travel-admin/src/styles/_material-theme.scss` — Angular Material v19 MDC theme with custom m2 palettes; light theme (default) + dark theme (`.dark-theme` class on body)
- Created `apps/travel-admin/src/styles/_custom-properties.scss` — Exports all tokens as `var(--tha-*)` CSS custom properties; dark mode overrides under `.dark-theme`
- Created `apps/travel-admin/src/styles/_typography.scss` — Google Fonts Inter import, heading scale, utility typography classes
- Created `apps/travel-admin/src/styles/_utilities.scss` — Layout utilities (flex/grid), spacing, `.tha-card`, `.tha-badge` for all statuses, page layout, scrollbar styling, CSS animations
- Updated `apps/travel-admin/src/styles.scss` — Entry point imports all partials in correct order; global box-sizing reset, Angular Material MDC overrides, autofill fix

**2E — Barrel Export Updates (index.ts)**
Updated all library `src/index.ts` files to export new domain models and utility functions.

#### Files Created/Modified in Step 2:
```
libs/shared/models/src/lib/primitives.types.ts          [NEW]
libs/shared/models/src/lib/weroad-api.types.ts          [NEW]
libs/shared/models/src/index.ts                         [MODIFIED]
libs/shared/mapping-and-utils/src/lib/type-guards.ts   [NEW]
libs/shared/mapping-and-utils/src/lib/utils.ts         [NEW]
libs/shared/mapping-and-utils/src/index.ts             [MODIFIED]
libs/auth/models/src/lib/admin.model.ts                 [NEW]
libs/auth/models/src/index.ts                           [MODIFIED]
libs/trips/models/src/lib/trip.model.ts                 [NEW]
libs/trips/models/src/index.ts                          [MODIFIED]
libs/trips/mapping-and-utils/src/lib/trip.mapper.ts    [NEW]
libs/trips/mapping-and-utils/src/index.ts              [MODIFIED]
libs/hotels/models/src/lib/hotel.model.ts               [NEW]
libs/hotels/models/src/index.ts                         [MODIFIED]
libs/hotels/mapping-and-utils/src/lib/hotel.mapper.ts  [NEW]
libs/hotels/mapping-and-utils/src/lib/hotel-cost.calculator.ts [NEW]
libs/hotels/mapping-and-utils/src/index.ts             [MODIFIED]
libs/coordinators/models/src/lib/coordinator.model.ts   [NEW]
libs/coordinators/models/src/index.ts                   [MODIFIED]
libs/coordinators/mapping-and-utils/src/lib/coordinator.mapper.ts [NEW]
libs/coordinators/mapping-and-utils/src/index.ts       [MODIFIED]
apps/travel-admin/src/styles/_tokens.scss              [NEW]
apps/travel-admin/src/styles/_material-theme.scss      [NEW]
apps/travel-admin/src/styles/_custom-properties.scss   [NEW]
apps/travel-admin/src/styles/_typography.scss          [NEW]
apps/travel-admin/src/styles/_utilities.scss           [NEW]
apps/travel-admin/src/styles.scss                      [MODIFIED]
```


### ✅ Step 3 — External API & Firebase Services

**Status:** COMPLETED  
**Completed At:** 2026-09-04

#### What was done:

**3A — Firebase Injection Tokens**
- Created `libs/shared/models/src/lib/firebase.tokens.ts` — `FIREBASE_APP_TOKEN`, `FIRESTORE_TOKEN`, `FIREBASE_AUTH_TOKEN` as Angular InjectionTokens for DI and test mocking

**3B — ThemeService**
- Created `libs/shared/ui/src/lib/theme.service.ts` — Signal-based light/dark mode manager; toggles `.dark-theme` class on `<body>`; persists to localStorage; respects OS `prefers-color-scheme` as fallback

**3C — FirebaseAuthService**
- Created `libs/auth/api-requests/src/lib/firebase-auth.service.ts` — Google Sign-In (popup), Sign-Out, auth state via Signals (`currentUser`, `isLoading`, `isAuthenticated`, `isAdmin`), admin verification via READ-ONLY Firestore `admins` collection

**3D — Auth Guard**
- Created `libs/auth/features/src/lib/auth.guard.ts` — Functional `canActivateFn`, checks loading state → auth → admin, redirects to `/login` or `/unauthorized`

**3E — TripApiService**
- Created `libs/trips/api-requests/src/lib/trip-api.service.ts` — `getAll$()` (real-time), `getById$(id)` (real-time), `create()`, `update()`, `delete()`, `assignCoordinator()`, `assignHotel()`, `syncFacebookGroupUrl()`

**3F — HotelApiService**
- Created `libs/hotels/api-requests/src/lib/hotel-api.service.ts` — `getAll$()` (real-time), `getById$(id)` (real-time), `create()`, `update()` (partial, handles nested billingData/pricingRanges), `delete()`

**3G — CoordinatorApiService**
- Created `libs/coordinators/api-requests/src/lib/coordinator-api.service.ts`:
  - Coordinator CRUD: `getAll$()`, `getById$()`, `update()`, `delete()`
  - Candidacy ops: `getAllCandidacies$()`, `getCandidaciesForTrip$()`, `submitCandidacy()` (UPSERT by email), `updateCandidacyStatus()`
  - Assignment: `assignCoordinatorToTrip()` (AUTOMATIC → marks accepted, withdraws others; MANUAL → assigns without cascade), `getAssignmentsForTrip$()`
  - Private helpers: `#upsertCoordinatorFromCandidacy()`, `#withdrawOtherCandidacies()`

**3H — WeRoadApiService**
- Created `libs/trips/api-requests/src/lib/weroad-api.service.ts` — HttpClient-based; `getToursForTravel()` (paginated), `getAllToursForTravel()`, `getTourByStartDate()`; response validated against runtime type guard

**3I — App Configuration**
- Updated `apps/travel-admin/src/app/app.config.ts` — Wires Firebase InjectionToken providers; `provideRouter`, `provideHttpClient(withFetch())`, `provideAnimationsAsync()`
- Created `apps/travel-admin/src/app/app.routes.ts` — Full lazy-loaded route map: public area, login, unauthorized, admin area (dashboard, trips CRUD, hotels CRUD, coordinators, candidacies, calendar) all protected by `authGuard`

#### Files Created/Modified in Step 3:
```
libs/shared/models/src/lib/firebase.tokens.ts                [NEW]
libs/shared/models/src/index.ts                              [MODIFIED]
libs/shared/ui/src/lib/theme.service.ts                     [NEW]
libs/shared/ui/src/index.ts                                  [MODIFIED]
libs/auth/api-requests/src/lib/firebase-auth.service.ts     [NEW]
libs/auth/api-requests/src/index.ts                         [MODIFIED]
libs/auth/features/src/lib/auth.guard.ts                    [NEW]
libs/auth/features/src/index.ts                             [MODIFIED]
libs/trips/api-requests/src/lib/trip-api.service.ts         [NEW]
libs/trips/api-requests/src/lib/weroad-api.service.ts       [NEW]
libs/trips/api-requests/src/index.ts                        [MODIFIED]
libs/hotels/api-requests/src/lib/hotel-api.service.ts       [NEW]
libs/hotels/api-requests/src/index.ts                       [MODIFIED]
libs/coordinators/api-requests/src/lib/coordinator-api.service.ts [NEW]
libs/coordinators/api-requests/src/index.ts                 [MODIFIED]
apps/travel-admin/src/app/app.config.ts                     [MODIFIED]
apps/travel-admin/src/app/app.routes.ts                     [MODIFIED]
```

---

### ✅ Step 4 — Public Area (Coordinator Candidacy)

**Status:** COMPLETED  
**Completed At:** 2026-09-04

#### What was done:

**4A — Public Shell Component**
- Created `apps/travel-admin/src/app/areas/public/public-shell.component.ts` — Simple layout wrapper for the public area with a Material Toolbar, dynamic title, and Dark Mode toggle. Provides `<router-outlet>`.

**4B — Candidacy Form Component**
- Created `apps/travel-admin/src/app/areas/public/candidacy-form/candidacy-form.component.ts` — Reactive Form using Angular Material:
  - Fetches and filters trips using `TripApiService.getAll$()` (only `PUBLISHED` trips).
  - Handles loading states, validation (required, email format, minimum 1 trip selected), and submission using `CoordinatorApiService.submitCandidacy()`.
  - Employs Angular Signals `toSignal` for declarative state bindings instead of async pipes.

**4C — Candidacy Success Component**
- Created `apps/travel-admin/src/app/areas/public/candidacy-success/candidacy-success.component.ts` — A success confirmation view providing a user-friendly message and an action button to submit another candidacy.

**4D — Linting Fixes and Eslint Tweaks**
- Cleaned up the Angular prefix setting in `eslint.config.mjs` for the `travel-admin` app (from `app` to `tha`).
- Fixed unused imports, lifecycle hooks, and default component metadata in `app.component.ts` and `app.config.ts`.
- Removed unnecessary boilerplate generated by Nx (`nx-welcome.component.ts`).

#### Files Created/Modified in Step 4:
```
apps/travel-admin/eslint.config.mjs                                                   [MODIFIED]
apps/travel-admin/src/app/app.component.ts                                            [MODIFIED]
apps/travel-admin/src/app/app.component.html                                          [MODIFIED]
apps/travel-admin/src/app/nx-welcome.component.ts                                     [DELETED]
apps/travel-admin/src/app/app.config.ts                                               [MODIFIED]
apps/travel-admin/src/app/areas/public/public-shell.component.ts                      [NEW]
apps/travel-admin/src/app/areas/public/candidacy-form/candidacy-form.component.ts     [NEW]
apps/travel-admin/src/app/areas/public/candidacy-success/candidacy-success.component.ts [NEW]
```

---

### ✅ Step 5 — Admin Area (Dashboards & Calendars)
**Status:** COMPLETED
**Goal:** Implement all admin dashboards, calendar views, CRUD operations, and the Assignment Engine.
- **Implemented Features:**
  - `AdminShellComponent`: Sidenav navigation with centralized Material UI Light/Dark theme.
  - `DashboardComponent`: High-level stats and quick links.
  - `TripListComponent` / `TripFormComponent` / `TripDetailComponent`: Full CRUD with 8-day duration auto-calculation, room composition editor, documents view, and assignments view.
  - `HotelListComponent` / `HotelFormComponent`: Full CRUD with nested Billing Data and dynamic Monthly Pricing Ranges per room type.
  - `CoordinatorListComponent` / `CoordinatorDetailComponent`: Admin view of coordinators, WhatsApp integration (`wa.me`), and Post-trip feedback.
  - `CandidacyListComponent`: The Assignment Engine (Automatic & Manual) and rejection flow.
  - `CalendarComponent`: Monthly grid view rendering 8-day trip spans.
  - Reusable `StatusBadgeComponent` for trips and candidacies.
- **Commands run:**
  - `nx run travel-admin:lint` - Passed strict type checking (no `any` types used).

---

### ✅ Step 6 — Testing Suite (Jest + Cypress)

**Status:** COMPLETED

#### What was done:
- [x] Configure Jest for unit testing domain models and services.
- [x] Setup Cypress E2E tests for the `Public` and `Admin` critical paths.
- [x] Fix Nx and Cypress configuration errors for Standalone components.
- [x] Resolve `tha-root` bootstrapping issue in `index.html` preventing app load.
- [x] Implement E2E assertions for empty-state candidacy flow rendering and submission validation.
- [x] Verify successful build (`yarn nx build travel-admin`) and E2E pass (`yarn nx e2e travel-admin-e2e`).

---

## Known Issues / Technical Debt

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| TI-001 | Node 24.14.1 vs required 24.15.0 | MITIGATED | Added `ignore-engines true` to `.yarnrc`. Upgrade Node when possible. |
| TI-002 | Webpack bundler (not esbuild) | ACCEPTED | esbuild tarballs were corrupt in yarn cache. Webpack works correctly. Can migrate later. |
| TI-003 | Environment files have placeholder values | OPEN | Must be filled before Firebase features work. |

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Angular 19 (not 18+) | Nx 20.x ships Angular 19 with Node >=24.0.0 support. Angular 19 has all required Standalone APIs. |
| Webpack over esbuild | esbuild tarballs were corrupt in local yarn cache during bootstrap. Functional equivalent for dev. |
| `ignore-engines true` | 1-patch Node version difference (24.14.1 vs 24.15.0). All code runs correctly. |
| `admin` collection uses UID as doc ID | Enables O(1) Firestore `exists()` check in security rules without extra query. |

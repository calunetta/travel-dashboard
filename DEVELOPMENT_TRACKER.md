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

### ✅ Step 8 - PART 3: Responsive UI/UX Overhaul
**Status:** Completed  
**Date:** 2026-09-04  
**Commit:** `feat(ui): responsive UI overhaul for admin forms and detail views`

**Key Changes:**
1. **SCSS Utilities** — Added `@media (max-width: 768px)` breakpoints to `styles/_utilities.scss` to automatically collapse `.tha-grid-2`, `.tha-grid-3`, `.tha-grid-4`, and `.tha-grid-5` into a single column on mobile. Added `.tha-flex-col-sm` utility.
2. **Trip Detail Component** — Replaced fixed flex-row structures in the header and document list sections with `.tha-flex-col-sm` to ensure proper stacking on smaller screens.
3. **Trip Form Component** — Updated the main header flexbox to use `.tha-flex-col-sm` to prevent horizontal overflow on mobile devices.
4. **Hotel Form Component** — Updated the main header and the Dynamic Pricing Configurations nested cards to stack correctly on smaller devices using the new `.tha-flex-col-sm` utility. Pricing ranges and global forms now gracefully adapt to mobile without requiring fixed widths.
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

### ⏳ Step 6 — Testing Suite (Jest + Cypress)

**Status:** COMPLETED

#### What was done (by User):
- [x] Configure Jest for unit testing domain models and services.
- [x] Setup Cypress E2E tests for the `Public` and `Admin` critical paths.
- [x] Run `yarn nx run-many -t test` to verify complete test coverage and Zero-Regression policy.
- [x] Implemented global test setup to mock `fetch`, `Response`, and `firebase/auth` for JSDOM environments.
- [x] Resolved asynchronous Signal (toObservable) timeouts in testing by properly mocking and instantiating streams as class properties.
- [x] Run `yarn nx run-many -t lint` and fix accessibility and unused import lint errors in `calendar.component.ts`.
- [x] Run `yarn nx build travel-admin` to guarantee successful compilation after stabilization.
- [x] Run `yarn nx e2e travel-admin-e2e` to verify critical user flows.

---

### ✅ Step 7: Security & Deployment

**Status:** COMPLETED
**Completed At:** 2026-09-04

#### What was done:
- [x] Tightened Firestore Security Rules: Trips are restricted to `allow read: if isAdmin() || resource.data.status == 'PUBLISHED'` preventing public access to drafts.
- [x] Secured Coordinator and Candidacy documents (public creation only, no reads).
- [x] Created GitHub Actions CI/CD workflow (`.github/workflows/deploy.yml`) to automatically build and deploy to Firebase Hosting on push to `main`.
- [x] Configured Firebase Hosting rules mapped to Angular dist output.

#### ⚠️ Required Manual Actions For Deployment:
1. Initialize Firebase Hosting CI token: `firebase init hosting:github` or use GCP Console to generate a service account.
2. Ensure the GitHub Repository Secret `FIREBASE_SERVICE_ACCOUNT` is properly set.
3. Replace `YOUR_FIREBASE_PROJECT_ID` in `.github/workflows/deploy.yml` with the target project alias.

---

### ✅ Bug Fix & Polish 1

**Status:** COMPLETED
**Completed At:** 2026-09-04

#### What was done:
- [x] Fixed broken Material Icons (Ligature Issue) by adding the Google Fonts link and fixing the `<base href="/">` in `index.html`.
- [x] Fixed `AuthGuard` and `LoginComponent` race condition by implementing `toObservable` and `firstValueFrom` to accurately wait for the Firebase Auth and Firestore `admins` collection load state before redirecting.
- [x] Polished Dark Theme by updating surface colors to deep blacks (`#121212` and `#1e1e2e`) in `_tokens.scss`.
- [x] Polished `DashboardComponent` and `AdminShellComponent` UI with proper stat cards, hover states, and matching sidebar header colors.

### ✅ Bug Fix & Polish 2

**Status:** COMPLETED
**Completed At:** 2026-09-04

#### What was done:
- [x] Fixed Angular `NG0203` error by explicitly providing the `Injector` to `toObservable()` inside `auth.guard.ts` and `login.component.ts`.
- [x] Removed `title` from the `Trip` model, UI forms, and list.
- [x] Fixed Trip Creation form to allow assigning Hotel and Coordinator during creation by fetching them via the API services.
- [x] Fixed Global UI Alignment: applied standard flexbox centering to `.mdc-button__label` and list items globally.
- [x] Futuristic UI Redesign: changed dark theme tokens to deep blacks, applied thin borders and glassmorphism to cards, and replaced emojis/titles with sleek "WeRoadX Operations".

### ✅ Bug Fix & Polish 3 (Build, Login & Tests)

**Status:** COMPLETED
**Completed At:** 2026-09-04

#### What was done:
- [x] Fixed all remaining TypeScript compilation errors that arose from the `title` removal in `Trip` model across the admin dashboard, candidacies list, coordinator details, and calendar views.
- [x] Fixed content projection bug in `login.component.ts` related to the `MatButtonIcon` slot (`NG8011`).
- [x] Verified and stabilized Login Flow. Checked the wait condition on `authService.isLoading` signal before deciding to redirect to `/admin/dashboard` or `/unauthorized`.
- [x] Wrote comprehensive Jest tests for `LoginComponent`, `FirebaseAuthService`, and `AuthGuard`.

### ✅ Bug Fix & Polish 4 (Infinite Loading Fix)

**Status:** COMPLETED
**Completed At:** 2026-09-04

#### What was done:
- [x] Fixed an infinite loading bug in the Authentication flow caused by `FirebaseAuthService`.
- [x] Removed the explicit `_isLoading.set(true)` within `signInWithGoogle` to prevent the app from getting stuck if `onAuthStateChanged` does not trigger.
- [x] Wrapped the Firestore `getDoc` call for the `admins` collection in a `try/catch` block to handle permissions errors or missing documents gracefully.
- [x] Wrote specific Jest regression tests in `firebase-auth.service.spec.ts` for these scenarios, enforcing the new Zero-Regression Policy.

### ✅ Bug Fix & Polish 5 (Trip Model Cleanup & UI Polish)

**Status:** COMPLETED
**Completed At:** 2026-09-04

#### What was done:
- [x] Cleaned up Trip Model by fully removing `status` in favor of deriving assignment from `coordinatorId`.
- [x] Modernized Dashboard UI with glassmorphism, flexbox alignment, and specific icon colors.
- [x] Rebuilt Calendar UI utilizing Angular Material Dialog (`TripDialogComponent`) and dynamic hashing colors for trip pills.
- [x] Updated Candidacy Form to only show trips with `coordinatorId === null`.
- [x] Added unit tests for candidacy form logic.

### ✅ Bug Fix & Polish 6 (Trip Code & Tour Denormalization)

**Status:** COMPLETED
**Completed At:** 2026-09-04

#### What was done:
- [x] Corrected Architectural rules: removed `startDate` and `code` from the `Tour` model, shifting `code` generation to `Trip`.
- [x] Implemented Trip code generation in `TripFormComponent` using `TripCodeGenerator`, dynamically computing it from `WeRoadCode` and `startDate`.
- [x] Configured denormalization for `adminIds`: automatically syncing the `Tour.adminIds` array down to `Trip` during creation.
- [x] Executed full test suite (`yarn nx run-many -t test`) and Cypress E2E suite (`yarn nx e2e travel-admin-e2e`), ensuring strict zero-regression policy.

### ✅ Bug Fix & Polish 7 (Tour Architecture & RBAC)

**Status:** COMPLETED
**Completed At:** 2026-09-04

#### What was done:
- [x] Added `tourLength` property to `Tour` model and updated forms.
- [x] Enforced RBAC: `adminIds` are hidden from UI and injected server-side by `TourApiService` and `HotelApiService` to prevent unauthorized admin assignment.
- [x] Hotels are strictly linked to a single `tourId`.
- [x] Fixed testing suite for `trips-mapping-and-utils` and `hotel-form.component.spec.ts`.
- [x] Executed full test suite and Cypress E2E suite successfully.

---

## Git Commit History Log

Following the Master Rules for granular Git versioning, these are the logical commits performed across Steps 1 to 5:

1. `init: initialize Nx standalone monorepo with Angular 19 and styles`
2. `feat(shared): generate core domain libraries and define data models`
3. `feat(trips): implement strict WeRoad API mappers and Firestore wrappers`
4. `feat(auth): add Firebase authentication config and token providers`
5. `feat(admin): build NgRx SignalStore for admin state and assignment logic`
6. `feat(trips): implement TripReminderService for backend cloud function triggers`
7. `feat(admin-ui): create Admin shell, dashboard, and trip detail components`
8. `feat(public-ui): build public candidacy form and success flow`
9. `chore(deps): configure global Material themes and typography`

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

### ✅ Step 7 - Production Release & CI/CD Setup

**Status:** Completed
**Focus:** Production configurations and GitHub Actions pipeline.

**Key Changes:**
1. **Environment Variables:** Replaced placeholders in `environment.prod.ts` with the actual Firebase Project configuration.
2. **GitHub Actions (CI/CD):** Created `.github/workflows/ci-cd.yml` to automate testing, linting, building, and deployment to Firebase Hosting upon merges to the `main` branch.
3. **Optimizations:** Verified `project.json` Angular build configurations (`outputHashing`, build optimizer, and bundle budgets).
4. **Proxy & CORS:** Maintained `https://api-catalog.weroad.it` as the base URL for the WeRoad API in production.

---

### ✅ Step 8 - PART 1: RBAC Expansion (SUPER_ADMIN) & Hotel Creation Bug Fix

**Status:** Completed  
**Date:** 2026-09-04  
**Commit:** `feat(rbac): add SUPER_ADMIN role, admin assignment on trip creation, and fix hotel creation bug`

**Key Changes:**
1. **AdminRole type** — Added `AdminRole = 'ADMIN' | 'SUPER_ADMIN'` to `admin.model.ts`. The `role` field defaults to `'ADMIN'` if not set in Firestore. **To set SUPER_ADMIN:** Edit user's document in Firebase Console → `admins` collection → add `role: "SUPER_ADMIN"`.
2. **FirebaseAuthService** — Added `isSuperAdmin` computed signal. Reads `role` from Firestore admin document on login.
3. **AdminApiService** — New service in `auth-api-requests`: fetches all admin profiles (cached via `shareReplay`) for SUPER_ADMIN trip assignment UI.
4. **TripFormComponent** — SUPER_ADMINs see a multi-select panel to explicitly assign admins to trips. Standard admins inherit Tour's `adminIds` automatically.
5. **AdminShellComponent** — SUPER ADMIN badge pill shown in header toolbar.
6. **Firestore Rules** — Added `isSuperAdmin()` helper function. SUPER_ADMINs bypass `isResourceAdmin`. All admins can read all admin profiles (for assignment UI).
7. **Hotel Creation Bug Fix** — Race condition where `toursCache` was empty at submit time resulted in `adminIds: []` which was rejected by Firestore. Fix: use `firstValueFrom(tours$)` at submit time + fallback to `currentUser().uid`.
8. **Tests** — 8 unit tests for hotel form including 2 regression tests.

---

### ✅ Step 8 - PART 2: Firebase Storage Integration for Trip Documents

**Status:** Completed  
**Date:** 2026-09-04  
**Commit:** `feat(storage): implement Firebase Storage for trip document uploads`

**Key Changes:**
1. **TripDocument model** — Added `paymentStatus: 'TO_BE_PAID' | 'PAID'` field. Added `DocumentPaymentStatus` type and `AddTripDocumentPayload` interface.
2. **Trip mapper** — Updated to read/write `paymentStatus` field for documents in all 3 mapper functions.
3. **FIREBASE_STORAGE_TOKEN** — New injection token in `shared-models`. Registered in `app.config.ts` via `getStorage()`.
4. **TripStorageService** — New service in `trips-api-requests`:
   - `validate(file)` — PDF-only, max 20MB client-side validation.
   - `uploadDocument(tripId, file, docId)` — Resumable upload returning `Observable<UploadProgress>`.
   - `deleteDocument(tripId, docId)` — Deletes from Firebase Storage.
5. **TripApiService** — Added `addDocument` (arrayUnion), `removeDocument` (arrayRemove), `toggleDocumentPaymentStatus` methods.
6. **TripDetailComponent** — Fully functional Documents tab:
   - Hidden `<input type="file" accept="application/pdf">` with click trigger.
   - Upload progress bar with percentage display.
   - Document list with payment status toggle (TO_BE_PAID / PAID), download link, delete button.
   - Snackbar feedback for all async operations.
7. **Storage Rules** — `storage.rules`: PDF-only write (max 20MB content type check), authenticated reads, deny all other paths.
8. **firebase.json** — Registered `storage.rules`.
9. **Tests** — 9 unit tests for TripStorageService covering validate boundary values, upload progress, upload errors, delete paths.

**Storage Path Structure:**  
`trips/{tripId}/documents/{uuid}.pdf`

---

### ✅ Step 9 - PART 1: Bug Fixes & SUPER_ADMIN Tour Interface

**Status:** Completed  
**Date:** 2026-09-04  
**Commit:** `fix(hotels): strict adminIds denormalization & feat(tours): SUPER_ADMIN tour management UI`

**Key Changes:**
1. **Hotel Creation Bug Fix** — Replaced race-prone fallback logic in `HotelFormComponent` with a strict cache read. `TourApiService.getAll$()` now utilizes `shareReplay` to prevent multiple listeners and ensure instant retrieval. If the selected tour is not found in cache, creation is explicitly rejected to prevent "orphan" hotels.
2. **SUPER_ADMIN Tour Management UI** — Created `/admin/tours` with `TourListComponent` and `TourFormComponent`. Only `SUPER_ADMIN`s can see the menu link and access these routes.
3. **Tour Creation Logic** — Removed auto-assignment of creator in `TourApiService.create`. It now explicitly accepts `adminIds` from the form payload, assigned via a multi-select dropdown in `TourFormComponent`.
4. **Firestore Security Rules** — Hardened `/tours/{tourId}` to strictly `allow create: if isSuperAdmin();`.
5. **Testing** — Mocked `MatSnackBar` globally in `HotelFormComponent` specs to bypass JSDOM CSS parsing crashes, updating tests to enforce the strict fallback rejection logic. All tests pass (`13 passed`).

---

### ✅ Step 10 - PART 2: Nationality Domain Extension

**Status:** Completed  
**Date:** 2026-09-04  
**Commit:** `feat(models): implement Nationality domain logic across Tour, Trip, Coordinator, and Candidacy`

**Key Changes:**
1. **Nationality Enum** — Created `Nationality` enum (`IT`, `ES`, `UK`, `FR`, `DE`) in `shared-models`.
2. **Model Updates** — Added `nationalities` to `Tour` and `nationality` to `Trip`, `Coordinator`, `Candidacy`, and `CandidacyFormPayload`.
3. **Mappers & Type Guards** — Added `isNationality` runtime type guard. Updated mappers to read/write nationality fields, defaulting to `Nationality.IT` for legacy documents.
4. **Testing** — Fixed mock objects and linting errors (empty arrow functions) across test specs. Test suite passes successfully.

---

### ✅ Step 11 - PART 3: Nationality UI & Logic Integration

**Status:** Completed  
**Date:** 2026-09-05  
**Commit:** `feat(ui): implement Nationality logic in Candidacy form and Assignment Engine`

**Key Changes:**
1. **Public Candidacy Form** — Added a `nationality` select field (defaults to `IT`). The dropdown for `availableTrips` is now dynamically filtered using a `combineLatest` stream that matches the trip's nationality with the candidate's selected nationality.
2. **Assignment Engine (CandidacyListComponent)** — Enforced nationality matching in the First Come First Serve (FCFS) logic. For `AUTOMATIC` assignments, the engine checks that the candidacy's `nationality` strictly matches the selected trip's `nationality`, rejecting the assignment with a snackbar warning if they differ.
3. **Testing** — Added tests to `candidacy-form.component.spec.ts` to ensure trips are correctly filtered out if they belong to a different nationality. Fixed Angular `no-non-null-assertion` linting warnings by strictly typing reactive forms access via `controls`.

---

### ✅ Step 12 - PART 4: Calendar Filters & CSV Logic

**Status:** Completed  
**Date:** 2026-09-05  
**Commit:** `feat(ui): implement calendar filters and CSV batch import for Trips`

**Key Changes:**
1. **Calendar Filters** — Added `Tour` and `Nationality` dropdown filters to `CalendarComponent`, dynamically updating the `calendarDays` signal based on selected criteria.
2. **CSV Batch Importer** — Created `CsvImportDialogComponent` for Trips. The importer handles strict validation against our Nationality domain, automatically resolves `Tour` and `Hotel` models, estimates missing End Dates, and dynamically creates missing `Coordinator` profiles.
3. **Coordinator API** — Implemented `upsertCoordinatorFromCsv` to allow the CSV importer to seamlessly link coordinators by email, creating them if necessary.
4. **Testing** — Passed the full test suite (`yarn nx run travel-admin:test`), upholding the Zero-Regression Policy.

---

### ✅ Step 13 - PART 5: PWA & Firebase Notifications

**Status:** Completed  
**Date:** 2026-09-05  
**Commit:** `feat(pwa): configure offline support, firebase functions, and FCM notifications`

**Key Changes:**
1. **PWA Support** — Enabled Angular service worker via `ng add @angular/pwa` for manifest and offline capabilities. Registered `firebase-messaging-sw.js` for background push notifications in project assets.
2. **FCM Token Management** — Modified `AdminShellComponent` to request notification permissions upon login and persist the `fcmToken` to the `admins/{adminId}` document in Firestore.
3. **Firestore Security Rules** — Updated `admins` read-only rule to allow self-updates explicitly scoped to the `fcmToken` field. Added `updateFcmToken` to `AdminApiService`.
4. **Cloud Functions (`functions/src/index.ts`)** — Created three Cloud Functions using `firebase-admin` and `firebase-functions`:
   - `onTripDocumentUploaded`: Triggers on `documents` array expansion; notifies assigned admins of the trip via FCM.
   - `onDocumentStatusChanged`: Triggers when any document's `paymentStatus` transitions from `TO_BE_PAID` to `PAID`; notifies all `SUPER_ADMIN` profiles.
   - `checkUpcomingTripsCron`: Runs daily (`every day 00:00`); identifies trips starting exactly one week ahead with zero documents and notifies assigned admins.
5. **Testing** — Implemented comprehensive Jest mocks for the newly injected `FIREBASE_MESSAGING_TOKEN` and `AdminApiService` in `AdminShellComponent` specs. Passed the entire test suite.

---

### ✅ Step 14 - PART 6: Testing & Final Review

**Status:** Completed  
**Date:** 2026-09-05  
**Commit:** `test(all): add Jest and Cypress tests for responsive UI and domain logic`

**Key Changes:**
1. **Unit Testing (Jest)** — Completed unit tests for `TripFormComponent` verifying nationality filtering based on selected Tours. Added specific tests in `AdminShellComponent` evaluating the `BreakpointObserver` handling of `isMobile` changes (side vs. over modes). 
2. **E2E Testing (Cypress)** — Authored `admin-dashboard.cy.ts` covering critical UI interactions:
   - Evaluated the Mobile Burger menu toggling the Sidenav properly under the `iphone-x` viewport setting.
   - Assessed the Calendar route defaults correctly applying `Italy (IT)` as the default Nationality filter.
3. **Execution Protocol Complete** — Adhered strictly to the Zero-Regression policy ensuring that every iteration across Parts 1 through 6 passed the `travel-admin` validation suites.

---

### ✅ Step 15 - Trip Booking Details & Mobile Sidenav Fix

**Status:** Completed  
**Date:** 2026-09-05  
**Commit:** `feat(trips): implement specific image upload for Trip booking receipts`

**Key Changes:**
1. **TripStorageService (Refactor)** — Extracted image upload logic out of `TripFormComponent` and added strict validation (`validateImageReceipt`) for JPEG, PNG, and WebP, along with a 20MB file size limit. Added `uploadReceipt` to handle `uploadBytesResumable` independently from the PDF document flow.
2. **TripFormComponent** — Refactored to leverage `TripStorageService` for the `hotelBookingReceiptUrl` flow.
3. **Testing** — Implemented unit tests for the image receipt validation flow. Sidenav `BreakpointObserver` tests were already fully covered and passing.


---

### ✅ Step 16 - Cyber-Minimalist Overhaul (Part 1)

**Status:** Completed  
**Date:** 2026-09-06  
**Commit:** `feat(ui): implement cyber-minimalist styles and improve table routing`

**Key Changes:**
1. **Design System** — Updated `_tokens.scss` with Cyber-Minimalist colors (deep dark-slate, soft cyan/indigo accents, ice gray text). Modified `_utilities.scss` to use an 8px minimum gap (`tha-gap-2`) and added translucent card styles with soft box-shadows.
2. **Table Navigation** — Added `tha-clickable-row` functionality to `ToursListComponent`, `HotelsListComponent`, and `CoordinatorsListComponent` allowing users to click anywhere on a row to navigate to the respective detail/edit page.
3. **Dashboard Enhancements** — Refactored `DashboardComponent` to include a "Tours" statistics card and a "Create Tour" button in the Quick Actions section.
4. **Validation** — Executed `nx test travel-admin`. All 19 unit tests passed successfully.

---

### ✅ Step 17 - Cyber-Minimalist Overhaul (Part 2)

**Status:** Completed  
**Date:** 2026-09-06  
**Commit:** `refactor(ui): optimize hotel and trip form grids and consolidate trip view tabs`

**Key Changes:**
1. **HotelFormComponent** — Refactored the layout from `tha-grid-2` to `tha-grid-3` and `tha-grid-4` for general information and billing data, creating a more horizontal and compact grid.
2. **TripDetailComponent** — Removed `mat-tab-group` and consolidated Overview, Room Composition, and Documents into a single, cohesive view using `tha-grid-2`. 
3. **TripFormComponent** — Refactored the form layout to use `tha-grid-3` and `tha-grid-4` to eliminate wasted vertical space and align fields side-by-side.
4. **Validation** — Executed `nx test travel-admin`. All 19 unit tests passed successfully.

---

### ✅ Step 18 - Bug Fixes (Buttons & Public Logic)

**Status:** Completed  
**Date:** 2026-09-06  
**Commit:** `fix: add routerlink to hotel list and fix candidacy form trip query`

**Key Changes:**
1. **HotelListComponent** — Imported `RouterLink` to fix the "New Hotel" button routing which was broken due to missing imports.
2. **CandidacyFormComponent** — Fixed the API query for trips. Instead of strict `null` checks for `coordinatorId`, it now properly checks for falsy values to accurately filter available trips.
3. **TripDetailComponent** — Fixed unbalanced HTML tags introduced during the grid refactoring in Part 2.
4. **Validation** — Executed `nx test travel-admin` and `nx e2e travel-admin-e2e`. All unit and e2e tests passed successfully, confirming zero regressions.

---

### ✅ Step 19 - PART 4: New Feature: Hotel Costs & Overrides

**Status:** Completed  
**Date:** 2026-09-06  
**Commit:** `feat(trips): implement manualHotelCost override and calculate display costs`

**Key Changes:**
1. **Model & Mapper** — Added `manualHotelCost` to `Trip` and `TripFirestoreDocument`. Updated `trip.mapper.ts` to handle Snapshot, Create, and Update flows for this field.
2. **Trip Form** — Updated `TripFormComponent` to include a manual input field for hotel costs.
3. **Trip Views** — Updated `TripDetailComponent` and `TripsListComponent` to display the `manualHotelCost` if present, alongside the calculated cost using `calculateHotelCost`.
4. **Validation** — Fixed TypeScript error in CSV Import Dialog related to the new field. Executed `nx test travel-admin` and `nx e2e travel-admin-e2e`. All tests passed successfully.


---

### ✅ Step 20 - PART 5: New Feature: Gmail Calendar Notifications

**Status:** Completed  
**Date:** 2026-09-06  
**Commit:** `feat(functions): implement onTripCreated trigger for email calendar notifications`

**Key Changes:**
1. **Firebase Functions** — Added `onTripCreated` to `functions/src/index.ts`.
2. **ICS Generation** — Used `ical-generator` to generate an ICS calendar event scheduled for exactly 1 month prior to the trip's `startDate`.
3. **Email Delivery** — Implemented `nodemailer` to send an email to all `SUPER_ADMIN` users containing the `reminder.ics` attachment.
4. **Validation** — TypeScript compilation for the `functions` package passes, and Angular tests passed successfully.


---

### ✅ Step 21 - PART 6: Bug Fixes and Final Polish

**Status:** Completed  
**Date:** 2026-09-06  
**Commit:** `fix(ui): resolve grid layout, public visibility, and github actions`

**Key Changes:**
1. **Public Page:** Added `getAvailableTrips$` to `TripApiService` and updated `CandidacyFormComponent` to fix the bug where trips were not visible to unauthenticated users.
2. **Edit Forms Grid Layout:** Standardized `TourFormComponent` to use `tha-grid-4`. 
3. **Edit Forms Field Visibility:** Removed the `!isEditMode` constraint for the `SUPER_ADMIN` assignment fields in both `TripFormComponent` and `TourFormComponent` so they are now fully editable in edit mode.
4. **GitHub Actions:** Added `workflow_dispatch` to `ci-cd.yml` and appended a step to explicitly deploy Firebase Functions alongside the Hosting build.

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

### ⏳ Step 2 — Core Models, Material UI Theming & Mappers

**Status:** PENDING

**Planned tasks:**
- TypeScript enums, interfaces, type guards for all domains
- SCSS centralized design system (Dark + Light themes)
- Angular Material theming setup
- Data mapper functions
- Firestore ↔ Domain model mapping utilities

---

### ⏳ Step 3 — External API & Firebase Services

**Status:** PENDING

---

### ⏳ Step 4 — Public Area (Coordinator Candidacy)

**Status:** PENDING

---

### ⏳ Step 5 — Admin Area (Dashboards & Calendars)

**Status:** PENDING

---

### ⏳ Step 6 — Testing Suite (Jest + Cypress)

**Status:** PENDING

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

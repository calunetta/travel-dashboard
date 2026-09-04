# Cost & Optimization Audit + Manual Setup Guide

## PART 1: Firestore Cost & API Optimization Audit

### 1. Request Volume Assessment
During a standard admin flow (e.g., logging in and opening the Dashboard), the application fetches several collections. Initially, there were multiple subscriptions to `getAll$()` across different components (e.g., `DashboardComponent`, `TripListComponent`). Because Firestore charges **one read per document** when a query is executed, fetching a collection with 100 trips across 3 different active components would result in **300 document reads**.

### 2. RxJS & Real-time Optimization
**Issue Found:** The original implementation of the API services (`TripApiService`, `HotelApiService`, and `CoordinatorApiService`) created a **new `onSnapshot` listener** for every single subscriber.
- This meant real-time listeners were not being shared.
- Multiple subscriptions inside the app (e.g. via `async` pipes or route navigations) were triggering multiple identical queries to the database, unnecessarily driving up read costs.

**Optimization Applied:**
We have refactored all `getAll$()` methods in the API services to cache the observables using `shareReplay({ bufferSize: 1, refCount: true })`.
- **`shareReplay(1)`** ensures that late subscribers receive the latest snapshot immediately without triggering a new network request to Firestore.
- **`refCount: true`** ensures that when the last component unsubscribes (e.g., the user leaves the admin area), the Firestore snapshot listener is properly closed, preventing memory leaks and ghost reads.

### 3. N+1 Query Problems
With our recent architectural changes, **we have successfully eliminated N+1 read problems**:
- **Denormalization:** By copying `adminIds` directly onto Trips and Hotels, we avoid having to fetch the parent `Tour` document for every Trip just to check permissions.
- **Client-Side Joins:** In `TripListComponent` and `CalendarComponent`, instead of querying Firestore for a Hotel or Coordinator for *each individual trip*, we fetch the full list of Hotels and Coordinators *once* globally (which is now properly cached via `shareReplay`) and perform the join entirely in memory using RxJS `combineLatest`.

### 4. Actionable Fixes (Already Applied!)
I have already updated `TripApiService`, `HotelApiService`, and `CoordinatorApiService` to prevent these expensive re-renders. 

Here is an example of the exact refactored code applied to `TripApiService` to solve the multiple snapshot issue:

```typescript
// libs/trips/api-requests/src/lib/trip-api.service.ts
import { Observable, shareReplay } from 'rxjs';

private allTrips$?: Observable<ReadonlyArray<Trip>>;

getAll$(): Observable<ReadonlyArray<Trip>> {
  if (!this.allTrips$) {
    this.allTrips$ = new Observable<ReadonlyArray<Trip>>((observer) => {
      const col = collection(this.firestore, TRIPS_COLLECTION);
      const q = query(
        col, 
        where('adminIds', 'array-contains', this.auth.currentUser()?.uid ?? ''),
        orderBy('startDate', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const trips = snapshot.docs
            .map((docSnap) => mapSnapshotToTrip(docSnap))
            .filter((t): t is Trip => t !== null);
          observer.next(trips);
        },
        (err) => observer.error(err)
      );

      return () => unsubscribe();
    }).pipe(shareReplay({ bufferSize: 1, refCount: true })); // <-- OPTIMIZATION
  }
  return this.allTrips$;
}
```

---

## PART 2: The Final Manual Configuration Guide

### 1. Firebase Console Setup

**A. Enable Google Authentication:**
1. Go to your Firebase Console -> **Authentication** -> **Sign-in method**.
2. Click **Add new provider** and select **Google**.
3. Enable it, provide your support email, and save.

**B. Insert the First Admin User:**
Because our Firestore Rules strictly enforce that only users inside the `admins` collection can read/write data, you cannot log in until you manually create your admin profile.
1. Go to Firebase Console -> **Firestore Database**.
2. Click **Start Collection** and name it `admins`.
3. Create the first document:
   - **Document ID:** Must be your exact Google Account UID. *(To find this, try logging into the app once; it will fail, but you can find your UID in the Firebase Authentication "Users" tab).*
   - **Fields:**
     - `email` (string): your Google email.
     - `name` (string): your name.
     - `role` (string): `SUPER_ADMIN`.
4. Save. You can now successfully log into the dashboard.

**C. Cloud Functions (Blaze Plan):**
Yes, **you must upgrade to the Blaze (Pay-as-you-go) plan** if you intend to deploy Cloud Functions (like Trip Reminders or automated emails). Firebase strictly requires a billing account to deploy Node.js backend functions, even if your usage falls well within the free tier.

### 2. Firestore Indexes
Because we are utilizing `where('adminIds', 'array-contains')` combined with `orderBy(...)` in our queries, Firestore requires specific composite indexes. I have already generated and updated your `firestore.indexes.json` file.

You can deploy these indexes by running: `npx firebase deploy --only firestore:indexes`

### 3. GitHub Actions CI/CD Configuration

To allow GitHub Actions to automatically build and deploy your app to Firebase Hosting, you need to configure Repository Secrets.

**Required Secrets:**
1. **`FIREBASE_SERVICE_ACCOUNT`**
   - **How to get it:**
     1. Run `npx firebase init hosting:github` in your terminal.
     2. Follow the prompts. Firebase will automatically create a Service Account in Google Cloud and set the secret in your GitHub repository for you.
     3. Alternatively, go to GCP Console -> IAM & Admin -> Service Accounts -> Create Key (JSON) and paste the entire JSON string into the GitHub Secret.

2. *(Optional)* **`FIREBASE_TOKEN`**
   - **How to get it:** Run `npx firebase login:ci`.
   - **Usage:** This is the older method for CI/CD, but `FIREBASE_SERVICE_ACCOUNT` via Workload Identity Federation (which the Firebase CLI sets up automatically) is the modern and recommended approach.

Make sure to replace `YOUR_FIREBASE_PROJECT_ID` in `.github/workflows/deploy.yml` and `.firebaserc` with your actual project alias before pushing!

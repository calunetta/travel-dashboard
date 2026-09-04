// ─────────────────────────────────────────────────────────────────────────────
// WEROAD API SERVICE — External REST API Client
//
// Fetches paginated tour data from the WeRoad catalog API.
// During development: routed through /api/weroad (proxy.conf.mjs → CORS bypass)
// In production: direct HTTPS call to https://api-catalog.weroad.it
//
// Reference endpoint:
//   GET /travels/{slug}/tours/paginated?page=1&pageSize=50
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import type { WeRoadPaginatedToursResponse, WeRoadTour } from 'shared-models';
import { isWeRoadPaginatedToursResponse } from 'shared-mapping-and-utils';

/** Base URL for the WeRoad API — injected via the environment at bootstrap. */
export const WEROAD_API_BASE_URL = '/api/weroad';

@Injectable({ providedIn: 'root' })
export class WeRoadApiService {
  private readonly http = inject(HttpClient);

  /**
   * Fetches a paginated list of tours for a given WeRoad travel slug.
   *
   * @param travelSlug - The WeRoad travel slug (e.g. "bali-7-days")
   * @param page - Page number (1-indexed, default 1)
   * @param pageSize - Items per page (default 50)
   *
   * Example URL:
   *   /api/weroad/travels/bali-7-days/tours/paginated?page=1&pageSize=50
   */
  getToursForTravel(
    travelSlug: string,
    page = 1,
    pageSize = 50
  ): Observable<WeRoadPaginatedToursResponse> {
    if (!travelSlug || travelSlug.trim().length === 0) {
      return throwError(() => new Error('[WeRoadApiService] travelSlug must not be empty.'));
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<unknown>(
        `${WEROAD_API_BASE_URL}/travels/${encodeURIComponent(travelSlug)}/tours/paginated`,
        { params }
      )
      .pipe(
        map((raw) => {
          if (!isWeRoadPaginatedToursResponse(raw)) {
            throw new Error(
              `[WeRoadApiService] Unexpected response shape from WeRoad API for slug "${travelSlug}"`
            );
          }
          return raw;
        }),
        catchError((err: unknown) => {
          const message = err instanceof Error ? err.message : 'WeRoad API error';
          console.error('[WeRoadApiService]', message, err);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Fetches ALL tours for a given travel (handles pagination automatically).
   * Use with caution for large datasets.
   *
   * @param travelSlug - The WeRoad travel slug
   */
  getAllToursForTravel(travelSlug: string): Observable<ReadonlyArray<WeRoadTour>> {
    return this.getToursForTravel(travelSlug, 1, 100).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Searches for a specific tour by its start date.
   * Returns the first match, or null if not found.
   *
   * @param travelSlug - The WeRoad travel slug
   * @param startDate - ISO date string (e.g. "2025-07-14")
   */
  getTourByStartDate(
    travelSlug: string,
    startDate: string
  ): Observable<WeRoadTour | null> {
    return this.getAllToursForTravel(travelSlug).pipe(
      map((tours) => tours.find((t) => t.startDate === startDate) ?? null)
    );
  }
}

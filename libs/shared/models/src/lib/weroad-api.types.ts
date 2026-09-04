// ─────────────────────────────────────────────────────────────────────────────
// WEROAD EXTERNAL API MODELS
// Source: https://api-catalog.weroad.it/travels/{slug}/tours/paginated
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Group info extracted from the WeRoad paginated tours API.
 */
export interface WeRoadGroupInfo {
  readonly hasPax: boolean;
  readonly expectedGroupSizeCount: number;
}

/**
 * Coordinator info from the WeRoad API.
 * This is the FULL coordinator object as returned by the external API.
 */
export interface WeRoadCoordinator {
  readonly id: string;
  readonly name: string;
  readonly surname: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly bio: string | null;
  readonly photoUrl: string | null;
}

/**
 * A single tour item from the WeRoad paginated endpoint.
 * Only the fields we extract are typed — the rest are unknown.
 */
export interface WeRoadTour {
  readonly id: string;
  readonly slug: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly groupInfo: WeRoadGroupInfo;
  readonly coordinator: WeRoadCoordinator | null;
  readonly facebookGroupUrl: string | null;
}

/**
 * The paginated response envelope from the WeRoad API.
 */
export interface WeRoadPaginatedToursResponse {
  readonly data: ReadonlyArray<WeRoadTour>;
  readonly meta: {
    readonly currentPage: number;
    readonly lastPage: number;
    readonly perPage: number;
    readonly total: number;
  };
}

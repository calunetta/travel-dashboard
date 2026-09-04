// ─────────────────────────────────────────────────────────────────────────────
// WEROAD EXTERNAL API MAPPER
// Strict extraction functions for WeRoad API responses.
// Prevents `any` types from leaking into application state.
// ─────────────────────────────────────────────────────────────────────────────

import { 
  WeRoadTour, 
  WeRoadGroupInfo, 
  WeRoadCoordinator 
} from 'shared-models';

/**
 * Safely extracts groupInfo from a raw WeRoad API tour object.
 */
export function extractGroupInfo(rawTour: unknown): WeRoadGroupInfo {
  if (
    typeof rawTour !== 'object' ||
    rawTour === null ||
    !('groupInfo' in rawTour)
  ) {
    return { hasPax: false, expectedGroupSizeCount: 0 };
  }

  const groupInfo = (rawTour as Record<string, unknown>)['groupInfo'];
  
  if (typeof groupInfo !== 'object' || groupInfo === null) {
    return { hasPax: false, expectedGroupSizeCount: 0 };
  }

  const record = groupInfo as Record<string, unknown>;
  
  return {
    hasPax: typeof record['hasPax'] === 'boolean' ? record['hasPax'] : false,
    expectedGroupSizeCount: typeof record['expectedGroupSizeCount'] === 'number' ? record['expectedGroupSizeCount'] : 0,
  };
}

/**
 * Safely extracts coordinator from a raw WeRoad API tour object.
 */
export function extractCoordinator(rawTour: unknown): WeRoadCoordinator | null {
  if (
    typeof rawTour !== 'object' ||
    rawTour === null ||
    !('coordinator' in rawTour)
  ) {
    return null;
  }

  const coordinator = (rawTour as Record<string, unknown>)['coordinator'];
  
  if (typeof coordinator !== 'object' || coordinator === null) {
    return null;
  }

  const record = coordinator as Record<string, unknown>;

  // Must have at least an ID and name to be considered valid
  if (typeof record['id'] !== 'string' || typeof record['name'] !== 'string') {
    return null;
  }

  return {
    id: record['id'],
    name: record['name'],
    surname: typeof record['surname'] === 'string' ? record['surname'] : '',
    email: typeof record['email'] === 'string' ? record['email'] : null,
    phone: typeof record['phone'] === 'string' ? record['phone'] : null,
    bio: typeof record['bio'] === 'string' ? record['bio'] : null,
    photoUrl: typeof record['photoUrl'] === 'string' ? record['photoUrl'] : null,
  };
}

/**
 * Safely extracts facebookGroupUrl from a raw WeRoad API tour object.
 */
export function extractFacebookGroupUrl(rawTour: unknown): string | null {
  if (typeof rawTour !== 'object' || rawTour === null) {
    return null;
  }
  
  const record = rawTour as Record<string, unknown>;
  return typeof record['facebookGroupUrl'] === 'string' ? record['facebookGroupUrl'] : null;
}

/**
 * Maps a raw unknown object into a strongly typed WeRoadTour.
 */
export function mapUnknownToWeRoadTour(rawTour: unknown): WeRoadTour | null {
  if (typeof rawTour !== 'object' || rawTour === null) {
    return null;
  }

  const record = rawTour as Record<string, unknown>;

  if (
    typeof record['id'] !== 'string' ||
    typeof record['slug'] !== 'string' ||
    typeof record['startDate'] !== 'string' ||
    typeof record['endDate'] !== 'string'
  ) {
    return null;
  }

  return {
    id: record['id'] as string,
    slug: record['slug'] as string,
    startDate: record['startDate'] as string,
    endDate: record['endDate'] as string,
    groupInfo: extractGroupInfo(rawTour),
    coordinator: extractCoordinator(rawTour),
    facebookGroupUrl: extractFacebookGroupUrl(rawTour),
  };
}

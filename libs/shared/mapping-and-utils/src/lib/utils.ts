// ─────────────────────────────────────────────────────────────────────────────
// SHARED UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

import type { Timestamp } from 'firebase/firestore';
import type { ISODateString } from 'shared-models';

// ─── Timestamp Conversion ─────────────────────────────────────────────────────

/**
 * Converts a Firestore Timestamp to an ISO date string.
 * Performs a runtime check to ensure `value` has `.toDate()` method.
 *
 * @param value - A Firestore Timestamp or any unknown value
 * @param fallback - Returned if conversion fails (defaults to current datetime ISO string)
 */
export function timestampToIso(
  value: unknown,
  fallback: ISODateString = new Date().toISOString()
): ISODateString {
  if (
    value !== null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate === 'function'
  ) {
    return (value as Timestamp).toDate().toISOString();
  }
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return fallback;
}

/**
 * Converts an ISO date string to a JavaScript Date object.
 * Returns `null` if the string is invalid.
 */
export function isoToDate(iso: ISODateString): Date | null {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// ─── WhatsApp Link Builder ────────────────────────────────────────────────────

/**
 * Generates a WhatsApp deep link for the given phone number and message.
 * Phone must include country code (e.g. "+393331234567").
 *
 * @param phone - Phone number with country code
 * @param message - Pre-filled message text (URL-encoded automatically)
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  if (!phone || phone.trim().length === 0) {
    throw new Error('[buildWhatsAppUrl] Phone number must not be empty.');
  }
  const sanitized = phone.replace(/\s+/g, '').replace(/[^+\d]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${sanitized}?text=${encoded}`;
}

// ─── Currency Helpers ─────────────────────────────────────────────────────────

/**
 * Converts cents (integer) to a EUR-formatted string.
 * e.g. 125000 → "€ 1.250,00"
 */
export function centsToEurString(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`[centsToEurString] Expected a non-negative integer, got: ${cents}`);
  }
  const value = cents / 100;
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}

/**
 * Converts a EUR decimal amount to cents (safe integer math).
 * e.g. 1250.50 → 125050
 */
export function eurToCents(eur: number): number {
  if (typeof eur !== 'number' || isNaN(eur) || eur < 0) {
    throw new Error(`[eurToCents] Expected a non-negative number, got: ${eur}`);
  }
  return Math.round(eur * 100);
}

// ─── Date Range Helpers ───────────────────────────────────────────────────────

/**
 * Returns the number of nights between two ISO date strings.
 * e.g. "2025-07-14" to "2025-07-22" = 8 nights.
 */
export function calculateNights(startDate: ISODateString, endDate: ISODateString): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error(
      `[calculateNights] Invalid date strings: "${startDate}", "${endDate}"`
    );
  }
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a given ISO date falls within an inclusive date range.
 */
export function isDateInRange(
  date: ISODateString,
  fromDate: ISODateString,
  toDate: ISODateString
): boolean {
  const d = new Date(date).getTime();
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();
  return d >= from && d <= to;
}

// ─── String Helpers ───────────────────────────────────────────────────────────

/**
 * Returns initials from a name and surname.
 * e.g. "Mario", "Rossi" → "MR"
 */
export function getInitials(name: string, surname: string): string {
  const n = name.trim().charAt(0).toUpperCase();
  const s = surname.trim().charAt(0).toUpperCase();
  return `${n}${s}`;
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(value: string): string {
  if (!value || value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

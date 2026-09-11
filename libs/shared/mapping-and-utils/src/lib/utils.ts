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

// ─── Date Normalization ───────────────────────────────────────────────────────

/**
 * Regular expressions for supported date input formats.
 * - dd/MM/yyyy  (European slash)
 * - dd-MM-yyyy  (European dash)
 * - YYYYMMDD    (compact ISO)
 * - YYYY-MM-DD  (standard ISO)
 */
const DATE_PATTERNS = {
  /** dd/MM/yyyy — e.g. "21/02/2027" */
  europeanSlash: /^(\d{2})\/(\d{2})\/(\d{4})$/,
  /** dd-MM-yyyy — e.g. "21-02-2027" */
  europeanDash: /^(\d{2})-(\d{2})-(\d{4})$/,
  /** YYYYMMDD — e.g. "20270221" */
  compactIso: /^(\d{4})(\d{2})(\d{2})$/,
  /** YYYY-MM-DD — e.g. "2027-02-21" */
  standardIso: /^(\d{4})-(\d{2})-(\d{2})$/,
} as const;

/**
 * Validates that year, month, day components form a real calendar date.
 * Catches impossible dates like 2027-02-30 or 2027-13-01.
 */
export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  // Construct with UTC to avoid timezone issues; month is 0-indexed in JS
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Normalizes a date string from any supported format into a standard
 * ISO `YYYY-MM-DD` date string suitable for Firestore storage and
 * date calculations.
 *
 * Accepted input formats:
 * - `dd/MM/yyyy`  (e.g. "21/02/2027")
 * - `dd-MM-yyyy`  (e.g. "21-02-2027")
 * - `YYYYMMDD`    (e.g. "20270221")
 * - `YYYY-MM-DD`  (e.g. "2027-02-21")
 *
 * @param dateStr - Raw date string from CSV, form, or API
 * @returns Normalized `YYYY-MM-DD` string, or `null` if parsing fails
 */
export function normalizeDateInput(dateStr: string): ISODateString | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  if (trimmed.length === 0) return null;

  let year: number;
  let month: number;
  let day: number;

  // Try dd/MM/yyyy
  let match = trimmed.match(DATE_PATTERNS.europeanSlash);
  if (match) {
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    year = parseInt(match[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return null;
  }

  // Try dd-MM-yyyy
  match = trimmed.match(DATE_PATTERNS.europeanDash);
  if (match) {
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    year = parseInt(match[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return null;
  }

  // Try YYYYMMDD
  match = trimmed.match(DATE_PATTERNS.compactIso);
  if (match) {
    year = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    day = parseInt(match[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return null;
  }

  // Try YYYY-MM-DD (already normalized, just validate)
  match = trimmed.match(DATE_PATTERNS.standardIso);
  if (match) {
    year = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    day = parseInt(match[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return null;
  }

  return null;
}

/**
 * Safely parses a date string (in any supported format) into a Date object.
 * Uses `normalizeDateInput` internally so it handles European formats.
 *
 * @returns A valid Date object or `null` if the input cannot be parsed.
 */
export function parseDateSafe(dateStr: string): Date | null {
  const normalized = normalizeDateInput(dateStr);
  if (!normalized) return null;
  // Parse as UTC noon to avoid timezone edge cases
  const d = new Date(`${normalized}T12:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Date Range Helpers ───────────────────────────────────────────────────────

/**
 * Returns the number of nights between two date strings.
 * Accepts any format supported by `normalizeDateInput`.
 *
 * e.g. "2025-07-14" to "2025-07-22" = 8 nights.
 * e.g. "14/07/2025" to "22/07/2025" = 8 nights.
 *
 * Returns `0` and logs a warning if either date is invalid,
 * preventing app-crashing errors during bulk imports.
 */
export function calculateNights(startDate: ISODateString, endDate: ISODateString): number {
  const normalizedStart = normalizeDateInput(startDate);
  const normalizedEnd = normalizeDateInput(endDate);

  if (!normalizedStart || !normalizedEnd) {
    console.warn(
      `[calculateNights] Could not parse date strings: "${startDate}", "${endDate}". Returning 0.`
    );
    return 0;
  }

  const start = new Date(normalizedStart);
  const end = new Date(normalizedEnd);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a given date falls within an inclusive date range.
 * Accepts any format supported by `normalizeDateInput`.
 */
export function isDateInRange(
  date: ISODateString,
  fromDate: ISODateString,
  toDate: ISODateString
): boolean {
  const d = parseDateSafe(date);
  const from = parseDateSafe(fromDate);
  const to = parseDateSafe(toDate);
  if (!d || !from || !to) return false;
  return d.getTime() >= from.getTime() && d.getTime() <= to.getTime();
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

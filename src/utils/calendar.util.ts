/**
 * UTC date-only helpers shared by the attendance and leave engines. Everything is
 * computed in UTC so day boundaries are stable regardless of server timezone.
 */

/** Strip time, returning 00:00:00.000 UTC of the same calendar day. */
export function toUtcDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Stable yyyy-mm-dd key for set lookups. */
export function dateKey(date: Date): string {
  return toUtcDateOnly(date).toISOString().slice(0, 10);
}

/** Inclusive list of date-only days from start..end (UTC). */
export function eachDayOfRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = toUtcDateOnly(start);
  const last = toUtcDateOnly(end);
  // Guard against inverted ranges.
  if (cursor.getTime() > last.getTime()) return days;
  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor);
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}

/**
 * Weekly-off test against a 7-char Sun..Sat pattern ('1' = off).
 * e.g. "1000000" => Sunday off; "1000001" => Sun & Sat off.
 */
export function isWeeklyOff(date: Date, pattern: string): boolean {
  if (!pattern || pattern.length !== 7) return false;
  return pattern[date.getUTCDay()] === "1";
}

/** Calendar days in a month. `month` is 1-12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** First and last date-only days of a month (UTC). `month` is 1-12. */
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month - 1, daysInMonth(year, month))),
  };
}

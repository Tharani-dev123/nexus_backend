export interface Period {
  year: number;
  month: number;
}

/**
 * The 12 (year, month) periods of a financial year.
 * e.g. fyStartYear=2025, startMonth=4 → Apr 2025 … Mar 2026.
 */
export function getFinancialYearPeriods(fyStartYear: number, startMonth = 4): Period[] {
  const periods: Period[] = [];
  for (let i = 0; i < 12; i++) {
    const abs = startMonth + i; // 4..15 for an April start
    const month = abs <= 12 ? abs : abs - 12;
    const year = abs <= 12 ? fyStartYear : fyStartYear + 1;
    periods.push({ year, month });
  }
  return periods;
}

/** Calendar days in a given month (month is 1-based). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Which financial year (its start year) a given calendar (year, month) falls in. */
export function financialYearStartFor(year: number, month: number, startMonth = 4): number {
  return month >= startMonth ? year : year - 1;
}

export function getRemainingMonthsInFY(year: number, month: number, startMonth = 4): number {
  const periods = getFinancialYearPeriods(financialYearStartFor(year, month, startMonth), startMonth);
  const currentIndex = periods.findIndex((p) => p.year === year && p.month === month);
  return currentIndex === -1 ? 12 : 12 - currentIndex;
}

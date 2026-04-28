/**
 * Get the current academic year in YYYY-YY format
 * Academic year runs from April to March
 * - If current month is April or later (4-12), return current_year to next_year
 * - If current month is before April (1-3), return previous_year to current_year
 * 
 * Examples:
 * - February 2026 -> "2025-26"
 * - April 2026 -> "2026-27"
 * - December 2026 -> "2026-27"
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

  let startYear: number;
  let endYear: number;

  if (currentMonth >= 4) {
    // April or later: current academic year started this year
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    // January-March: current academic year started last year
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  // Format as "YYYY-YY" (e.g., "2025-26")
  const endYearShort = (endYear % 100).toString().padStart(2, '0');
  return `${startYear}-${endYearShort}`;
}

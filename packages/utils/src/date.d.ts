/**
 * Format a date to a localized string
 */
export declare function formatDate(date: string | Date, locale?: string): string;
/**
 * Format a date to a localized datetime string
 */
export declare function formatDateTime(date: string | Date, locale?: string): string;
/**
 * Format a date to YYYY-MM-DD
 */
export declare function toISODateString(date: Date): string;
/**
 * Calculate number of days between two dates
 */
export declare function daysBetween(start: Date, end: Date): number;
/**
 * Add days to a date
 */
export declare function addDays(date: Date, days: number): Date;
/**
 * Check if a date is in the past
 */
export declare function isPast(date: string | Date): boolean;
/**
 * Check if a date is today
 */
export declare function isToday(date: string | Date): boolean;
//# sourceMappingURL=date.d.ts.map
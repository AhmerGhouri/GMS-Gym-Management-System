/**
 * Format currency (PKR by default)
 */
export declare function formatCurrency(amount: number | string, currency?: string, locale?: string): string;
/**
 * Format a number with commas
 */
export declare function formatNumber(num: number | string): string;
/**
 * Format phone number (Pakistan format)
 */
export declare function formatPhone(phone: string): string;
/**
 * Format CNIC number
 */
export declare function formatCNIC(cnic: string): string;
/**
 * Pad a number with leading zeros
 */
export declare function padNumber(num: number, length: number): string;
/**
 * Generate a member ID in format GMS-XXXX
 */
export declare function generateMemberId(sequence: number): string;
/**
 * Generate an invoice number in format INV-YYYYMMDD-XXXX
 */
export declare function generateInvoiceNumber(date: Date, sequence: number): string;
/**
 * Truncate text with ellipsis
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Capitalize first letter
 */
export declare function capitalize(text: string): string;
/**
 * Get full name from first and last name
 */
export declare function getFullName(firstName: string, lastName: string): string;
/**
 * Get initials from name
 */
export declare function getInitials(firstName: string, lastName: string): string;
/**
 * Format minutes to hours and minutes
 */
export declare function formatDuration(minutes: number): string;
//# sourceMappingURL=format.d.ts.map
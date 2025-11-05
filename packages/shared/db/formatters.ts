import type { ClaimRecord, ClaimResult } from "../types/claims";
import { dollarsToCents } from "./currency";

/**
 * Parses a date string in MM/DD/YY format to a Date object
 * @param dateStr - Date string in MM/DD/YY format
 * @returns Date object or null if invalid
 */
export const parseDate = (dateStr: string | undefined): Date | null => {
	if (!dateStr) return null;
	// Parse MM/DD/YY format
	const [month, day, year] = dateStr.split("/");
	if (!month || !day || !year) return null;
	// Convert 2-digit year to 4-digit (assuming 2000s)
	const fullYear =
		parseInt(year, 10) < 50
			? 2000 + parseInt(year, 10)
			: 1900 + parseInt(year, 10);
	return new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
};

/**
 * Transforms a ClaimResult to database format
 * Converts dollar amounts to cents (as strings) and handles null values
 */
export function transformClaimResult(result: Omit<ClaimResult, "id">) {
	return {
		trackingNumber: result.trackingNumber,
		tenantName: result.tenantName,
		status: result.status,
		maxBenefit: String(dollarsToCents(result.maxBenefit)),
		monthlyRent: String(dollarsToCents(result.monthlyRent)),
		isFirstMonthPaid: result.isFirstMonthPaid,
		firstMonthPaidEvidence: result.firstMonthPaidEvidence ?? null,
		isFirstMonthSDIPremiumPaid: result.isFirstMonthSDIPremiumPaid,
		firstMonthSDIPremiumPaidEvidence:
			result.firstMonthSDIPremiumPaidEvidence ?? null,
		missingRequiredDocuments: result.missingRequiredDocuments,
		submittedDocuments: result.submittedDocuments,
		approvedCharges: result.approvedCharges,
		approvedChargesTotal: String(dollarsToCents(result.approvedChargesTotal)),
		excludedCharges: result.excludedCharges,
		finalPayout: String(dollarsToCents(result.finalPayout)),
		decisionSummary: result.decisionSummary,
	};
}

/**
 * Transforms a ClaimRecord to database format
 * Converts dollar amounts to cents (as strings), parses dates, and handles null values
 */
export function transformClaim(record: Omit<ClaimRecord, "id">) {
	return {
		trackingNumber: record.trackingNumber,
		claimDate: parseDate(record.claimDate),
		propertyAddress: record.propertyAddress ?? null,
		leaseStartDate: parseDate(record.leaseStartDate),
		leaseEndDate: parseDate(record.leaseEndDate),
		moveOutDate: parseDate(record.moveOutDate),
		monthlyRent: record.monthlyRent
			? String(dollarsToCents(record.monthlyRent))
			: null,
		propertyManagementCompany: record.propertyManagementCompany ?? null,
		groupNumber: record.groupNumber ?? null,
		treatyNumber: record.treatyNumber ?? null,
		policy: record.policy ?? null,
		maxBenefit: record.maxBenefit
			? String(dollarsToCents(record.maxBenefit))
			: null,
		status: record.status ?? null,
		documents: record.documents,
		claudeFiles: record.claudeFiles ?? null,
	};
}

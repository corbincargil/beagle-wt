import type {
	ClaimRecord,
	ClaimResult,
	ClaudeFile,
	Document,
} from "../types/claims";

type DocumentType =
	| "lease_addendum"
	| "lease_agreement"
	| "notification_to_tenant"
	| "tenant_ledger"
	| "invoice"
	| "claim_evaluation_report";

import { centsToDollars, dollarsToCents } from "./currency";

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
 * Formats a Date object to MM/DD/YY string format
 * @param date - Date object or null
 * @returns Date string in MM/DD/YY format or undefined
 */
export const formatDate = (date: Date | null): string | undefined => {
	if (!date) return undefined;
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const year = String(date.getFullYear()).slice(-2);
	return `${month}/${day}/${year}`;
};

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
		approvedBenefitAmount: record.approvedBenefitAmount
			? String(dollarsToCents(record.approvedBenefitAmount))
			: null,
		documents: record.documents,
		claudeFiles: record.claudeFiles ?? null,
	};
}

/**
 * Transforms a database row back to ClaimRecord format
 * Converts cents (numeric strings) back to dollars, formats dates to MM/DD/YY strings
 * @param row - Database row from claims table
 * @returns ClaimRecord object
 */
export function untransformClaim(row: {
	id: string;
	trackingNumber: string;
	claimDate: Date | null;
	propertyAddress: string | null;
	leaseStartDate: Date | null;
	leaseEndDate: Date | null;
	moveOutDate: Date | null;
	monthlyRent: string | null;
	propertyManagementCompany: string | null;
	groupNumber: string | null;
	treatyNumber: string | null;
	policy: string | null;
	maxBenefit: string | null;
	status: "posted" | "declined" | null;
	approvedBenefitAmount: string | null;
	documents: Document[];
	claudeFiles: ClaudeFile[] | null;
}): ClaimRecord {
	return {
		id: row.id,
		trackingNumber: row.trackingNumber,
		claimDate: formatDate(row.claimDate),
		propertyAddress: row.propertyAddress ?? undefined,
		leaseStartDate: formatDate(row.leaseStartDate),
		leaseEndDate: formatDate(row.leaseEndDate),
		moveOutDate: formatDate(row.moveOutDate),
		monthlyRent: row.monthlyRent
			? centsToDollars(parseFloat(row.monthlyRent))
			: undefined,
		propertyManagementCompany: row.propertyManagementCompany ?? undefined,
		groupNumber: row.groupNumber ?? undefined,
		treatyNumber: row.treatyNumber ?? undefined,
		policy: row.policy ?? undefined,
		maxBenefit: row.maxBenefit
			? centsToDollars(parseFloat(row.maxBenefit))
			: undefined,
		status: row.status ?? undefined,
		approvedBenefitAmount: row.approvedBenefitAmount
			? centsToDollars(parseFloat(row.approvedBenefitAmount))
			: undefined,
		documents: row.documents,
		claudeFiles: row.claudeFiles ?? undefined,
	};
}

/**
 * Transforms a database row back to ClaimResult format
 * Converts cents (numeric strings) back to dollars
 * @param row - Database row from claim_results table
 * @returns ClaimResult object
 */
export function untransformClaimResult(row: {
	id: string;
	trackingNumber: string;
	tenantName: string;
	status: "approved" | "declined";
	maxBenefit: string;
	monthlyRent: string;
	isFirstMonthPaid: boolean;
	firstMonthPaidEvidence: string | null;
	isFirstMonthSDIPremiumPaid: boolean;
	firstMonthSDIPremiumPaidEvidence: string | null;
	missingRequiredDocuments: DocumentType[];
	submittedDocuments: Document[];
	approvedCharges: ChargeItem[];
	approvedChargesTotal: string;
	excludedCharges: ChargeItem[];
	finalPayout: string;
	decisionSummary: string;
}): ClaimResult {
	return {
		id: row.id,
		trackingNumber: row.trackingNumber,
		tenantName: row.tenantName,
		status: row.status,
		maxBenefit: centsToDollars(parseFloat(row.maxBenefit)),
		monthlyRent: centsToDollars(parseFloat(row.monthlyRent)),
		isFirstMonthPaid: row.isFirstMonthPaid,
		firstMonthPaidEvidence: row.firstMonthPaidEvidence ?? "",
		isFirstMonthSDIPremiumPaid: row.isFirstMonthSDIPremiumPaid,
		firstMonthSDIPremiumPaidEvidence:
			row.firstMonthSDIPremiumPaidEvidence ?? "",
		missingRequiredDocuments: row.missingRequiredDocuments,
		submittedDocuments: row.submittedDocuments,
		approvedCharges: row.approvedCharges,
		approvedChargesTotal: centsToDollars(parseFloat(row.approvedChargesTotal)),
		excludedCharges: row.excludedCharges,
		finalPayout: centsToDollars(parseFloat(row.finalPayout)),
		decisionSummary: row.decisionSummary,
	};
}

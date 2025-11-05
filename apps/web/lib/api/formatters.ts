import type {
	ClaimRecord,
	ClaimResult,
} from "../../../../packages/shared/types/claims";
import { dollarsToCents } from "../currency";
import { parseDate } from "../formatters";

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

export function transformClaim(record: ClaimRecord) {
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

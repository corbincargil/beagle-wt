type DocumentType =
	| "lease_addendum"
	| "lease_agreement"
	| "notification_to_tenant"
	| "tenant_ledger"
	| "invoice"
	| "claim_evaluation_report";

export interface Document {
	types?: DocumentType[]; // multiple types are possible for a single document (e.g. agreement & addendum)
	name: string;
	path: string;
}

export interface ClaudeFile {
	id: string;
	type: "file";
	filename: string;
	mime_type: string;
	size_bytes: number;
	created_at: string; // ISO date string
	downloadable: boolean;
}

export const RequiredDocuments: DocumentType[] = [
	"lease_addendum",
	"lease_agreement",
	"notification_to_tenant",
	"tenant_ledger",
];
export const OptionalDocuments: DocumentType[] = [
	"invoice",
	"claim_evaluation_report",
];

interface ChargeItem {
	description: string;
	amount: number;
	category?: string;
}

export interface ClaimRecord {
	id: string;
	trackingNumber: string;
	claimDate?: string;
	propertyAddress?: string;
	leaseStartDate?: string;
	leaseEndDate?: string;
	moveOutDate?: string;
	monthlyRent?: number;
	propertyManagementCompany?: string;
	groupNumber?: string;
	treatyNumber?: string;
	policy?: string;
	maxBenefit?: number;
	status?: "posted" | "declined";
	approvedBenefitAmount?: number; // Ground truth from CSV
	documents: Document[];
	claudeFiles: ClaudeFile[] | undefined;
}

export interface ClaimResult {
	id: string;
	trackingNumber: string;
	tenantName: string;
	status: "approved" | "declined";
	maxBenefit: number;
	monthlyRent: number;
	isFirstMonthPaid: boolean;
	firstMonthPaidEvidence: string; // not sure about this data type
	isFirstMonthSDIPremiumPaid: boolean;
	firstMonthSDIPremiumPaidEvidence: string; // not sure about this data type
	missingRequiredDocuments: DocumentType[];
	submittedDocuments: Document[];
	approvedCharges: ChargeItem[];
	approvedChargesTotal: number;
	excludedCharges: ChargeItem[];
	finalPayout: number;
	decisionSummary: string;
}

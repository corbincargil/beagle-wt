type DocumentType = "lease_addendum" | "lease_agreement" | "notification_to_tenant" | "tenant_ledger" | "invoice" | "claim_evaluation_report";

export interface Document {
  type?: DocumentType;
  name: string;
  path: string;
}

const RequiredDocuments: DocumentType[] = ["lease_addendum", "lease_agreement", "notification_to_tenant", "tenant_ledger"];
const OptionalDocuments: DocumentType[] = ["invoice", "claim_evaluation_report"];

interface ChargeItem {
  description: string;
  amount: number;
  category?: string;
}

export interface ClaimRecord {
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
    documents: Document[];
  }
  
  export interface ClaimResult {
    trackingNumber: string;
    tenantName: string;
    status: "approved" | "declined";
    finalPayout: number;
    maxBenefit: number;
    monthlyRent: number;
    decisionSummary: string;
    isFirstMonthPaid: boolean;
    firstMonthPaidEvidence: string; // not sure about this data type
    isFirstMonthSDIPremiumPaid: boolean;
    firstMonthSDIPremiumPaidEvidence: string; // not sure about this data type
    missingRequiredDocuments: DocumentType[];
    submittedDocuments: string[];
    approvedCharges: ChargeItem[];
    approvedChargesTotal: number;
    excludedCharges: ChargeItem[];
  }
  
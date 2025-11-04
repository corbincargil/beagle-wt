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
    folderPath: string; // maps to the folder (1, 2, 3, etc.)
  }
  
  interface ChargeItem {
    description: string;
    amount: number;
    category?: string;
  }

  type DocumentType = "lease_addendum" | "lease_agreement" | "notification_to_tenant" | "tenant_ledger" | "invoice" | "claim_evaluation_report";

  const RequiredDocuments: DocumentType[] = ["lease_addendum", "lease_agreement", "notification_to_tenant", "tenant_ledger"];
  const OptionalDocuments: DocumentType[] = ["invoice", "claim_evaluation_report"];
  
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
  
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
  
  export interface ClaimResult {
    trackingNumber: string;
    approvedCharges: ChargeItem[];
    excludedCharges: ChargeItem[];
    totalApproved: number;
    finalPayout: number;
    status: "approved" | "declined";
    notes?: string;
  }
  
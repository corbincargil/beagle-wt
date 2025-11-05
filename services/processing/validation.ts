import { z } from "zod";

// Document type enum matching the type definition
export const DocumentTypeSchema = z.enum([
  "lease_addendum",
  "lease_agreement",
  "notification_to_tenant",
  "tenant_ledger",
  "invoice",
  "claim_evaluation_report",
]);

// Charge item schema
const ChargeItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
  category: z.string().optional(),
});

// Document schema
const DocumentSchema = z.object({
  types: z.array(DocumentTypeSchema).optional(),
  name: z.string(),
  path: z.string(),
});

// Initial ClaimResult schema (without charges analysis fields)
export const InitialClaimResultSchema = z.object({
  trackingNumber: z.string(),
  tenantName: z.string(),
  status: z.enum(["approved", "declined"]),
  maxBenefit: z.number(),
  monthlyRent: z.number(),
  isFirstMonthPaid: z.boolean(),
  firstMonthPaidEvidence: z.string(),
  isFirstMonthSDIPremiumPaid: z.boolean(),
  firstMonthSDIPremiumPaidEvidence: z.string(),
  missingRequiredDocuments: z.array(DocumentTypeSchema),
  submittedDocuments: z.array(DocumentSchema),
  // Fields that will be populated in Phase 2:
  approvedCharges: z.array(ChargeItemSchema).default([]),
  approvedChargesTotal: z.number().default(0),
  excludedCharges: z.array(ChargeItemSchema).default([]),
  finalPayout: z.number().default(0),
  decisionSummary: z.string().default(""),
});

// Full ClaimResult schema (complete validation)
export const ClaimResultSchema = z.object({
  trackingNumber: z.string(),
  tenantName: z.string(),
  status: z.enum(["approved", "declined"]),
  maxBenefit: z.number(),
  monthlyRent: z.number(),
  isFirstMonthPaid: z.boolean(),
  firstMonthPaidEvidence: z.string(),
  isFirstMonthSDIPremiumPaid: z.boolean(),
  firstMonthSDIPremiumPaidEvidence: z.string(),
  missingRequiredDocuments: z.array(DocumentTypeSchema),
  submittedDocuments: z.array(DocumentSchema),
  approvedCharges: z.array(ChargeItemSchema),
  approvedChargesTotal: z.number(),
  excludedCharges: z.array(ChargeItemSchema),
  finalPayout: z.number(),
  decisionSummary: z.string(),
});

// Type exports for use in other files
export type InitialClaimResult = z.infer<typeof InitialClaimResultSchema>;
export type ValidatedClaimResult = z.infer<typeof ClaimResultSchema>;


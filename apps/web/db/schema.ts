import { relations } from "drizzle-orm";
import {
	boolean,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import type {
	ClaudeFile,
	Document,
} from "../../../packages/shared/types/claims";

type DocumentType =
	| "lease_addendum"
	| "lease_agreement"
	| "notification_to_tenant"
	| "tenant_ledger"
	| "invoice"
	| "claim_evaluation_report";

interface ChargeItem {
	description: string;
	amount: number;
	category?: string;
}

export const claims = pgTable("claims", {
	id: uuid("id").defaultRandom().primaryKey(),
	trackingNumber: text("tracking_number").notNull().unique(),
	claimDate: timestamp("claim_date"),
	propertyAddress: text("property_address"),
	leaseStartDate: timestamp("lease_start_date"),
	leaseEndDate: timestamp("lease_end_date"),
	moveOutDate: timestamp("move_out_date"),
	monthlyRent: numeric("monthly_rent"), // stored in cents
	propertyManagementCompany: text("property_management_company"),
	groupNumber: text("group_number"),
	treatyNumber: text("treaty_number"),
	policy: text("policy"),
	maxBenefit: numeric("max_benefit"), // stored in cents
	status: text("status").$type<"posted" | "declined">(),
	documents: jsonb("documents").$type<Document[]>().notNull().default([]),
	claudeFiles: jsonb("claude_files").$type<ClaudeFile[]>(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const claimResults = pgTable("claim_results", {
	id: uuid("id").defaultRandom().primaryKey(),
	trackingNumber: text("tracking_number").notNull().unique(),
	tenantName: text("tenant_name").notNull(),
	status: text("status").$type<"approved" | "declined">().notNull(),
	maxBenefit: numeric("max_benefit").notNull(), // stored in cents
	monthlyRent: numeric("monthly_rent").notNull(), // stored in cents
	isFirstMonthPaid: boolean("is_first_month_paid").notNull(),
	firstMonthPaidEvidence: text("first_month_paid_evidence"),
	isFirstMonthSDIPremiumPaid: boolean(
		"is_first_month_sdi_premium_paid",
	).notNull(),
	firstMonthSDIPremiumPaidEvidence: text(
		"first_month_sdi_premium_paid_evidence",
	),
	missingRequiredDocuments: jsonb("missing_required_documents")
		.$type<DocumentType[]>()
		.notNull()
		.default([]),
	submittedDocuments: jsonb("submitted_documents")
		.$type<Document[]>()
		.notNull()
		.default([]),
	approvedCharges: jsonb("approved_charges")
		.$type<ChargeItem[]>()
		.notNull()
		.default([]),
	approvedChargesTotal: numeric("approved_charges_total").notNull(), // stored in cents
	excludedCharges: jsonb("excluded_charges")
		.$type<ChargeItem[]>()
		.notNull()
		.default([]),
	finalPayout: numeric("final_payout").notNull(), // stored in cents
	decisionSummary: text("decision_summary").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const claimsRelations = relations(claims, ({ one }) => ({
	claimResult: one(claimResults, {
		fields: [claims.trackingNumber],
		references: [claimResults.trackingNumber],
	}),
}));

export const claimResultsRelations = relations(claimResults, ({ one }) => ({
	claim: one(claims, {
		fields: [claimResults.trackingNumber],
		references: [claims.trackingNumber],
	}),
}));

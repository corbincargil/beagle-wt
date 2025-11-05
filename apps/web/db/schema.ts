import {
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

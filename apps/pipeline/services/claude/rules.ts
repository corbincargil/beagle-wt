/**
 * SDI Policy Rules Configuration
 *
 * This file contains all the rules used by the AI to determine claim validity.
 * Modify these rules to adjust how claims are evaluated.
 */

export interface SDIRules {
	documentTypes: {
		required: string[];
		optional: string[];
		descriptions: Record<string, string>;
	};
	chargeClassification: {
		approved: {
			description: string;
			examples: string[];
		};
		excluded: {
			description: string;
			examples: string[];
		};
	};
	paymentVerification: {
		firstMonthRent: {
			required: boolean;
			description: string;
		};
		firstMonthSDIPremium: {
			required: boolean;
			description: string;
		};
	};
	claimStatusRules: {
		autoDeclineConditions: string[];
		approvalConditions: string[];
	};
}

/**
 * Current SDI Policy Rules
 * Update this object to modify claim evaluation logic
 */
export const sdiRules: SDIRules = {
	documentTypes: {
		required: [],
		optional: [
			"lease_addendum",
			"lease_agreement",
			"notification_to_tenant",
			"tenant_ledger",
			"invoice",
			"claim_evaluation_report",
		],
		descriptions: {
			lease_addendum:
				"Security deposit addendum or SDI addendum that outlines the security deposit insurance terms",
			lease_agreement: "The main lease agreement between tenant and landlord",
			notification_to_tenant:
				"Move-out notice or notification sent to tenant regarding move-out procedures",
			tenant_ledger:
				"Account ledger showing charges, payments, and account balance",
			invoice: "Invoice or bill for specific charges related to the property",
			claim_evaluation_report:
				"Report evaluating the claim and its associated charges",
		},
	},
	chargeClassification: {
		approved: {
			description:
				"Charges that are covered by SDI policy. These include normal wear and tear, cleaning, repairs, and damages that are the tenant's responsibility.",
			examples: [
				"Cleaning fees",
				"Repair costs for tenant damage",
				"Normal wear and tear repairs",
				"Property damage caused by tenant",
				"Maintenance charges for tenant-caused issues",
			],
		},
		excluded: {
			description:
				"Charges that are NOT covered by SDI policy. These should be excluded from the approved benefit amount.",
			examples: [
				"Unpaid rent",
				"Late fees",
				"Pet fees and pet-related damages",
				"Non-refundable fees",
				"Charges clearly outside the lease terms",
				"Charges that exceed reasonable amounts",
			],
		},
	},
	paymentVerification: {
		firstMonthRent: {
			required: false,
			description:
				"First month's rent payment status is a factor to consider. Check the tenant ledger or payment records if available.",
		},
		firstMonthSDIPremium: {
			required: false,
			description:
				"First month's SDI premium payment status is a factor to consider. Look for 'SDRP Monthly Premium' or similar charges in the ledger if available.",
		},
	},
	claimStatusRules: {
		autoDeclineConditions: [
			"No usable information available (no documents AND no payment information AND no other usable information)",
		],
		approvalConditions: [
			"Proceed with best effort when any information is available (documents, payment info, or other usable data)",
			"Use available documents and payment information as factors to consider",
			"Valid approved charges exist (if charge information is available)",
		],
	},
};

/**
 * Formats rules into a prompt text for AI analysis
 */
export function formatRulesForPrompt(): string {
	const rules = sdiRules;

	let prompt = "SDI POLICY RULES:\n\n";

	// Document types (all optional, use as factors)
	prompt += "DOCUMENT TYPES (all optional - use as factors to consider):\n";
	rules.documentTypes.optional.forEach((docType) => {
		const desc = rules.documentTypes.descriptions[docType];
		prompt += `- ${docType}: ${desc}\n`;
	});

	// Payment verification (factors to consider, not requirements)
	prompt += "\nPAYMENT VERIFICATION (factors to consider, not requirements):\n";
	prompt += `- First Month Rent: ${rules.paymentVerification.firstMonthRent.description}\n`;
	prompt += `- First Month SDI Premium: ${rules.paymentVerification.firstMonthSDIPremium.description}\n`;

	// Charge classification
	prompt += "\nCHARGE CLASSIFICATION RULES:\n";
	prompt += `APPROVED (Covered by SDI): ${rules.chargeClassification.approved.description}\n`;
	prompt += `Examples: ${rules.chargeClassification.approved.examples.join(", ")}\n\n`;
	prompt += `EXCLUDED (Not covered): ${rules.chargeClassification.excluded.description}\n`;
	prompt += `Examples: ${rules.chargeClassification.excluded.examples.join(", ")}\n`;

	// Status rules
	prompt += "\nCLAIM STATUS RULES:\n";
	prompt += "A claim will be DECLINED ONLY if:\n";
	rules.claimStatusRules.autoDeclineConditions.forEach((condition) => {
		prompt += `- ${condition}\n`;
	});

	prompt += "\nA claim should be APPROVED and proceed with best effort if:\n";
	rules.claimStatusRules.approvalConditions.forEach((condition) => {
		prompt += `- ${condition}\n`;
	});
	prompt +=
		"\nIMPORTANT: Documents and payment verification are factors to consider, not hard requirements. Proceed with analysis using whatever information is available.\n";

	return prompt;
}

/**
 * Gets charge classification rules formatted for prompt
 */
export function getChargeClassificationRules(): string {
	const rules = sdiRules.chargeClassification;
	return `CHARGE CLASSIFICATION RULES:

APPROVED (covered by SDI policy): ${rules.approved.description}
Examples: ${rules.approved.examples.join(", ")}

EXCLUDED (not covered by SDI policy): ${rules.excluded.description}
Examples: ${rules.excluded.examples.join(", ")}`;
}

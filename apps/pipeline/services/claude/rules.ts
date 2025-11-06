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
		required: [
			"lease_addendum",
			"lease_agreement",
			"notification_to_tenant",
			"tenant_ledger",
		],
		optional: ["invoice", "claim_evaluation_report"],
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
			required: true,
			description:
				"First month's rent must be paid for the claim to be valid. Check the tenant ledger or payment records.",
		},
		firstMonthSDIPremium: {
			required: true,
			description:
				"First month's SDI premium must be paid for the claim to be valid. Look for 'SDRP Monthly Premium' or similar charges in the ledger.",
		},
	},
	claimStatusRules: {
		autoDeclineConditions: [
			"Missing required documents",
			"First month's rent not paid",
			"First month's SDI premium not paid",
		],
		approvalConditions: [
			"All required documents present",
			"First month's rent paid",
			"First month's SDI premium paid",
			"Valid approved charges exist",
		],
	},
};

/**
 * Formats rules into a prompt text for AI analysis
 */
export function formatRulesForPrompt(): string {
	const rules = sdiRules;

	let prompt = "SDI POLICY RULES:\n\n";

	// Document requirements
	prompt += "REQUIRED DOCUMENTS:\n";
	rules.documentTypes.required.forEach((docType) => {
		const desc = rules.documentTypes.descriptions[docType];
		prompt += `- ${docType}: ${desc}\n`;
	});

	prompt += "\nOPTIONAL DOCUMENTS:\n";
	rules.documentTypes.optional.forEach((docType) => {
		const desc = rules.documentTypes.descriptions[docType];
		prompt += `- ${docType}: ${desc}\n`;
	});

	// Payment verification
	prompt += "\nPAYMENT VERIFICATION REQUIREMENTS:\n";
	if (rules.paymentVerification.firstMonthRent.required) {
		prompt += `- First Month Rent: ${rules.paymentVerification.firstMonthRent.description}\n`;
	}
	if (rules.paymentVerification.firstMonthSDIPremium.required) {
		prompt += `- First Month SDI Premium: ${rules.paymentVerification.firstMonthSDIPremium.description}\n`;
	}

	// Charge classification
	prompt += "\nCHARGE CLASSIFICATION RULES:\n";
	prompt += `APPROVED (Covered by SDI): ${rules.chargeClassification.approved.description}\n`;
	prompt += `Examples: ${rules.chargeClassification.approved.examples.join(", ")}\n\n`;
	prompt += `EXCLUDED (Not covered): ${rules.chargeClassification.excluded.description}\n`;
	prompt += `Examples: ${rules.chargeClassification.excluded.examples.join(", ")}\n`;

	// Status rules
	prompt += "\nCLAIM STATUS RULES:\n";
	prompt += "A claim will be DECLINED if:\n";
	rules.claimStatusRules.autoDeclineConditions.forEach((condition) => {
		prompt += `- ${condition}\n`;
	});

	prompt += "\nA claim will be APPROVED if:\n";
	rules.claimStatusRules.approvalConditions.forEach((condition) => {
		prompt += `- ${condition}\n`;
	});

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

import Anthropic from "@anthropic-ai/sdk";
import type { BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta.mjs";
import type {
	ClaimRecord,
	ClaimResult,
} from "../../../../packages/shared/types/claims";
import { getChargeClassificationRules } from "./rules";

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!CLAUDE_API_KEY) {
	console.warn("Warning: ANTHROPIC_API_KEY environment variable is not set");
}

// Initialize Anthropic client
const anthropic = new Anthropic();

/**
 * Analyzes charges for a claim and completes the ClaimResult with charges analysis
 * This is Phase 2: Extract charges, classify them, calculate totals, and generate decision summary
 * @param claim - The claim record with uploaded Claude files
 * @param initialResult - The validated initial ClaimResult from Phase 1
 * @returns Complete ClaimResult with charges analysis
 */
export async function analyzeClaimCharges(
	claim: ClaimRecord,
	initialResult: Omit<ClaimResult, "id">,
): Promise<Omit<ClaimResult, "id">> {
	if (!CLAUDE_API_KEY) {
		throw new Error("ANTHROPIC_API_KEY environment variable is required");
	}

	if (!claim.claudeFiles || claim.claudeFiles.length === 0) {
		throw new Error(`No Claude files found for claim ${claim.trackingNumber}`);
	}

	// Extract file IDs from claudeFiles
	const fileIds = claim.claudeFiles.map((file) => file.id);

	// Load charge classification rules from configuration
	const chargeRulesText = getChargeClassificationRules();

	// Build the prompt for charges analysis
	const prompt = `You are analyzing charges for a Security Deposit Insurance (SDI) claim. Your task is to:

1. EXTRACT ALL CHARGES: Find all charges, line items, or deductions from the documents. Look in:
   - Tenant ledgers
   - Move-out statements
   - Invoices
   - Claim evaluation reports

2. CLASSIFY CHARGES: For each charge, determine if it is approved or excluded based on the SDI policy rules.

3. PROVIDE DETAILS: For each charge, provide:
   - description: Clear description of the charge
   - amount: The dollar amount (as a number)
   - category: Optional category (e.g., "cleaning", "repair", "damage", "unpaid_rent", etc.)

${chargeRulesText}

Claim Information:
- Tracking Number: ${claim.trackingNumber}
- Tenant Name: ${initialResult.tenantName}
- Monthly Rent: $${claim.monthlyRent || 0}
- Max Benefit: $${claim.maxBenefit || 0}
- Status: ${initialResult.status}
- Missing Required Documents: ${initialResult.missingRequiredDocuments.join(", ") || "None"}

Initial Analysis Results:
- First Month Rent Paid: ${initialResult.isFirstMonthPaid} (${initialResult.firstMonthPaidEvidence})
- First Month SDI Premium Paid: ${initialResult.isFirstMonthSDIPremiumPaid} (${initialResult.firstMonthSDIPremiumPaidEvidence})

Analyze all charges and return a JSON object matching this exact structure:
{
  "approvedCharges": [],
  "approvedChargesTotal": 0,
  "excludedCharges": [],
  "decisionSummary": ""
}

Important: Return ONLY valid JSON, no markdown formatting or code blocks.`;

	try {
		// Build content array with text prompt and file references
		const fileContent = fileIds.map((fileId) => ({
			type: "document",
			source: {
				type: "file",
				file_id: fileId,
			},
		})) as BetaContentBlockParam[];

		const message = await anthropic.beta.messages.create({
			model: "claude-sonnet-4-5",
			max_tokens: 4096,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: prompt,
						},
						...fileContent,
					],
				},
			],
			betas: ["files-api-2025-04-14"],
		});

		// Check if response was truncated
		if (message.stop_reason === "max_tokens") {
			console.warn(
				`Warning: Claude response for claim ${claim.trackingNumber} was truncated due to max_tokens limit`,
			);
		}

		// Extract the structured content from the response
		const responseContent = message.content[0];
		if (responseContent?.type !== "text") {
			throw new Error("Expected text response from Claude");
		}

		// Parse the JSON response
		const responseText = responseContent.text.trim();
		// Remove markdown code blocks if present
		const jsonText = responseText
			.replace(/^```json\s*/i, "")
			.replace(/^```\s*/i, "")
			.replace(/\s*```$/g, "")
			.trim();

		const chargesAnalysis = JSON.parse(jsonText) as {
			approvedCharges: Array<{
				description: string;
				amount: number;
				category?: string;
			}>;
			excludedCharges: Array<{
				description: string;
				amount: number;
				category?: string;
			}>;
			decisionSummary: string;
		};

		// Calculate totals
		const approvedChargesTotal = chargesAnalysis.approvedCharges.reduce(
			(sum, charge) => sum + charge.amount,
			0,
		);

		// Calculate final payout (capped by maxBenefit)
		const finalPayout = Math.min(
			approvedChargesTotal,
			initialResult.maxBenefit,
		);

		// Merge with initial result
		const completeResult: Omit<ClaimResult, "id"> = {
			...initialResult,
			approvedCharges: chargesAnalysis.approvedCharges,
			approvedChargesTotal,
			excludedCharges: chargesAnalysis.excludedCharges,
			finalPayout,
			decisionSummary: chargesAnalysis.decisionSummary,
		};

		return completeResult;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(
				`Error analyzing charges for claim ${claim.trackingNumber}: ${error.message}`,
			);
		}
		throw error;
	}
}

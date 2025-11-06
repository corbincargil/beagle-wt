import Anthropic from "@anthropic-ai/sdk";
import type { BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta.mjs";
import type { ClaimRecord } from "../../../../packages/shared/types/claims";
import type { InitialClaimResult } from "../processing/validation";
import { formatRulesForPrompt } from "./rules";

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!CLAUDE_API_KEY) {
	console.warn("Warning: ANTHROPIC_API_KEY environment variable is not set");
}

// Initialize Anthropic client
const anthropic = new Anthropic();

/**
 * Generates initial ClaimResult by analyzing documents and extracting basic information
 * This is Phase 1: Document classification, payment verification, and required document checks
 * @param claim - The claim record with uploaded Claude files
 * @returns Initial ClaimResult without charges analysis
 */
export async function analyzeClaimInitial(
	claim: ClaimRecord,
): Promise<InitialClaimResult> {
	if (!CLAUDE_API_KEY) {
		throw new Error("ANTHROPIC_API_KEY environment variable is required");
	}

	if (!claim.claudeFiles || claim.claudeFiles.length === 0) {
		throw new Error(`No Claude files found for claim ${claim.trackingNumber}`);
	}

	// Extract file IDs from claudeFiles
	const fileIds = claim.claudeFiles.map((file) => file.id);

	// Load rules from configuration
	const rulesText = formatRulesForPrompt();

	// Build the prompt with claim information and rules
	const prompt = `You are analyzing a Security Deposit Insurance (SDI) claim. Your task is to:

1. CLASSIFY DOCUMENTS: For each document, classify its type(s). A document can have multiple types.

2. EXTRACT TENANT NAME: Find and extract the tenant's full name from the documents.

3. VERIFY FIRST MONTH RENT PAYMENT: Determine if the first month's rent was paid. Provide clear evidence (quote from document or explanation).

4. VERIFY FIRST MONTH SDI PREMIUM PAYMENT: Determine if the first month's SDI premium was paid. Provide clear evidence (quote from document or explanation).

5. IDENTIFY MISSING REQUIRED DOCUMENTS: Check if all required documents are present.

${rulesText}

Claim Information:
- Tracking Number: ${claim.trackingNumber}
- Property Address: ${claim.propertyAddress || "Not provided"}
- Lease Start Date: ${claim.leaseStartDate || "Not provided"}
- Lease End Date: ${claim.leaseEndDate || "Not provided"}
- Move Out Date: ${claim.moveOutDate || "Not provided"}
- Monthly Rent: $${claim.monthlyRent || 0}
- Max Benefit: $${claim.maxBenefit || 0}

Return a JSON object matching this exact structure:
{
  "trackingNumber": "${claim.trackingNumber}",
  "tenantName": "Full Name from Documents",
  "status": "approved" or "declined" (decline if missing required documents or payment issues),
  "maxBenefit": ${claim.maxBenefit || 0},
  "monthlyRent": ${claim.monthlyRent || 0},
  "isFirstMonthPaid": true/false,
  "firstMonthPaidEvidence": "Evidence or explanation",
  "isFirstMonthSDIPremiumPaid": true/false,
  "firstMonthSDIPremiumPaidEvidence": "Evidence or explanation",
  "missingRequiredDocuments": ["array", "of", "missing", "types"],
  "submittedDocuments": [
    {
      "types": ["array", "of", "document", "types"],
      "name": "document filename",
      "path": "document path"
    }
  ],
  "approvedCharges": [],
  "approvedChargesTotal": 0,
  "excludedCharges": [],
  "finalPayout": 0,
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

		const result = JSON.parse(jsonText) as InitialClaimResult;

		// Ensure the result has the correct tracking number
		result.trackingNumber = claim.trackingNumber;
		result.maxBenefit = claim.maxBenefit || 0;
		result.monthlyRent = claim.monthlyRent || 0;

		return result;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(
				`Error analyzing claim ${claim.trackingNumber}: ${error.message}`,
			);
		}
		throw error;
	}
}

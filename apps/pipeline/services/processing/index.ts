import type {
	ClaimRecord,
	ClaimResult,
} from "../../../../packages/shared/types/claims";
import { analyzeClaimCharges } from "../claude/analyze-claim-charges";
import { analyzeClaimInitial } from "../claude/analyze-claim-initial";
import { ClaimResultSchema, InitialClaimResultSchema } from "./validation";

/**
 * Processes a single claim through Phase 1: Initial analysis
 * Classifies documents, verifies payments, checks required documents
 * @param claim - The claim record with uploaded Claude files
 * @returns Initial ClaimResult (validated)
 */
export async function processClaimInitial(
	claim: ClaimRecord,
): Promise<Omit<ClaimResult, "id">> {
	console.log(`Processing Phase 1 for claim ${claim.trackingNumber}...`);

	// Phase 1: Get initial analysis from Claude
	const initialResult = await analyzeClaimInitial(claim);

	// Validate with Zod
	const validatedResult = InitialClaimResultSchema.parse(initialResult);

	console.log(`✓ Phase 1 complete for claim ${claim.trackingNumber}`);
	return validatedResult;
}

/**
 * Processes a single claim through Phase 2: Charges analysis
 * Only processes claims that passed Phase 1 validation
 * @param claim - The claim record with uploaded Claude files
 * @param initialResult - The validated initial ClaimResult from Phase 1
 * @returns Complete ClaimResult with charges analysis
 */
export async function processClaimCharges(
	claim: ClaimRecord,
	initialResult: Omit<ClaimResult, "id">,
): Promise<Omit<ClaimResult, "id">> {
	console.log(
		`Processing Phase 2 (charges analysis) for claim ${claim.trackingNumber}...`,
	);

	// Phase 2: Analyze charges
	const completeResult = await analyzeClaimCharges(claim, initialResult);

	// Validate with Zod
	const validatedResult = ClaimResultSchema.parse(completeResult);

	console.log(`✓ Phase 2 complete for claim ${claim.trackingNumber}`);
	return validatedResult;
}

/**
 * Processes all claims sequentially through both phases
 * Phase 1: Initial analysis and validation
 * Phase 2: Charges analysis (only for valid claims)
 * @param claims - Array of claim records with uploaded Claude files
 * @param onResultProcessed - Optional callback to be called immediately after each claim is processed
 * @returns Array of complete ClaimResult objects
 */
export async function processAllClaims(
	claims: ClaimRecord[],
	onResultProcessed?: (result: Omit<ClaimResult, "id">) => Promise<void>,
): Promise<Omit<ClaimResult, "id">[]> {
	const results: Omit<ClaimResult, "id">[] = [];

	for (let i = 0; i < claims.length; i++) {
		const claim = claims[i];
		if (!claim) {
			console.warn(`Warning: Claim at index ${i} is undefined, skipping...`);
			continue;
		}

		console.log(
			`\n📋 Processing claim ${i + 1}/${claims.length}: ${claim.trackingNumber}`,
		);

		try {
			// Phase 1: Initial analysis
			const initialResult = await processClaimInitial(claim);

			// Only proceed to Phase 2 if claim passed initial validation
			// (You could add additional validation logic here if needed)
			const finalResult = await processClaimCharges(claim, initialResult);

			results.push(finalResult);

			// Call the callback immediately if provided (for incremental saving)
			if (onResultProcessed) {
				try {
					await onResultProcessed(initialResult);
				} catch (error) {
					console.error(
						`✗ Error in onResultProcessed callback for claim ${claim.trackingNumber}:`,
						error,
					);
					// Continue processing even if callback fails
				}
			}

			console.log(`✓ Completed processing claim ${claim.trackingNumber}\n`);
		} catch (error) {
			console.error(`✗ Error processing claim ${claim.trackingNumber}:`, error);
			// Continue with next claim even if one fails
			// Optionally, you could create a declined result here
		}
	}

	return results;
}

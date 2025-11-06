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

	// Check if claim is declined - if so, return early with default values
	if (validatedResult.status === "declined") {
		console.log(
			`⚠️  Claim ${claim.trackingNumber} declined in Phase 1 - skipping Phase 2`,
		);
		// Return a complete ClaimResult with default values for declined claims
		const declinedResult = {
			...validatedResult,
			approvedCharges: [],
			approvedChargesTotal: 0,
			excludedCharges: [],
			finalPayout: 0,
			decisionSummary:
				validatedResult.decisionSummary ||
				`Claim declined. Missing documents: ${validatedResult.missingRequiredDocuments.join(", ") || "None"}. First month rent paid: ${validatedResult.isFirstMonthPaid}. First month SDI premium paid: ${validatedResult.isFirstMonthSDIPremiumPaid}.`,
		};
		// Validate with full ClaimResult schema to ensure completeness
		return ClaimResultSchema.parse(declinedResult);
	}

	console.log(
		`✓ Phase 1 complete for claim ${claim.trackingNumber} - approved, proceeding to Phase 2`,
	);
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
 * Helper function to process a single claim through Phase 1
 * Wrapped for use with Promise.allSettled
 */
async function processClaimPhase1(claim: ClaimRecord): Promise<{
	claim: ClaimRecord;
	result: Omit<ClaimResult, "id"> | null;
	error: Error | null;
}> {
	try {
		const result = await processClaimInitial(claim);
		return { claim, result, error: null };
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		console.error(`✗ Error in Phase 1 for claim ${claim.trackingNumber}:`, err);
		return { claim, result: null, error: err };
	}
}

/**
 * Helper function to process an approved claim through Phase 2
 * Wrapped for use with Promise.allSettled
 */
async function processClaimPhase2(
	claim: ClaimRecord,
	initialResult: Omit<ClaimResult, "id">,
): Promise<{
	claim: ClaimRecord;
	result: Omit<ClaimResult, "id"> | null;
	error: Error | null;
}> {
	try {
		const result = await processClaimCharges(claim, initialResult);
		return { claim, result, error: null };
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		console.error(`✗ Error in Phase 2 for claim ${claim.trackingNumber}:`, err);
		return { claim, result: null, error: err };
	}
}

/**
 * Processes all claims in parallel through both phases
 * Phase 1: Initial analysis and validation (all claims processed in parallel)
 * Phase 2: Charges analysis (only approved claims processed in parallel)
 * @param claims - Array of claim records with uploaded Claude files
 * @param onResultProcessed - Optional callback to be called immediately after each claim is processed
 * @returns Array of complete ClaimResult objects
 */
export async function processAllClaims(
	claims: ClaimRecord[],
	onResultProcessed?: (result: Omit<ClaimResult, "id">) => Promise<void>,
): Promise<Omit<ClaimResult, "id">[]> {
	const results: Omit<ClaimResult, "id">[] = [];
	const totalClaims = claims.length;

	// Filter out undefined claims
	const validClaims = claims.filter((claim, index) => {
		if (!claim) {
			console.warn(
				`Warning: Claim at index ${index} is undefined, skipping...`,
			);
			return false;
		}
		return true;
	});

	if (validClaims.length === 0) {
		console.warn("No valid claims to process");
		return results;
	}

	// Phase 1: Process all claims in parallel
	console.log(
		`\n🔍 Phase 1: Processing ${validClaims.length} claims in parallel...`,
	);
	const phase1Results = await Promise.allSettled(
		validClaims.map((claim) => processClaimPhase1(claim)),
	);

	// Process Phase 1 results
	const phase1Successes: Array<{
		claim: ClaimRecord;
		result: Omit<ClaimResult, "id">;
	}> = [];
	const phase1Errors: Array<{ claim: ClaimRecord; error: Error }> = [];
	const declinedClaims: Array<Omit<ClaimResult, "id">> = [];

	for (const settled of phase1Results) {
		if (settled.status === "fulfilled") {
			const { claim, result, error } = settled.value;
			if (error) {
				phase1Errors.push({ claim, error });
			} else if (result) {
				if (result.status === "declined") {
					declinedClaims.push(result);
				} else {
					phase1Successes.push({ claim, result });
				}
			}
		} else {
			// Promise itself was rejected
			console.error("Phase 1 promise rejected:", settled.reason);
		}
	}

	console.log(
		`✓ Phase 1 complete: ${phase1Successes.length} approved, ${declinedClaims.length} declined, ${phase1Errors.length} errors`,
	);

	// Save declined claims immediately
	if (declinedClaims.length > 0 && onResultProcessed) {
		console.log(`\n💾 Saving ${declinedClaims.length} declined claims...`);
		await Promise.allSettled(
			declinedClaims.map(async (result) => {
				try {
					await onResultProcessed(result);
					console.log(`✓ Saved declined claim ${result.trackingNumber}`);
				} catch (error) {
					console.error(
						`✗ Error saving declined claim ${result.trackingNumber}:`,
						error,
					);
				}
			}),
		);
		results.push(...declinedClaims);
	}

	// Phase 2: Process approved claims in parallel
	if (phase1Successes.length > 0) {
		console.log(
			`\n🔍 Phase 2: Processing ${phase1Successes.length} approved claims in parallel...`,
		);
		const phase2Results = await Promise.allSettled(
			phase1Successes.map(({ claim, result }) =>
				processClaimPhase2(claim, result),
			),
		);

		// Process Phase 2 results
		const phase2Successes: Array<Omit<ClaimResult, "id">> = [];
		const phase2Errors: Array<{ claim: ClaimRecord; error: Error }> = [];

		for (const settled of phase2Results) {
			if (settled.status === "fulfilled") {
				const { claim, result, error } = settled.value;
				if (error) {
					phase2Errors.push({ claim, error });
				} else if (result) {
					phase2Successes.push(result);
				}
			} else {
				console.error("Phase 2 promise rejected:", settled.reason);
			}
		}

		console.log(
			`✓ Phase 2 complete: ${phase2Successes.length} successful, ${phase2Errors.length} errors`,
		);

		// Save approved claims
		if (phase2Successes.length > 0 && onResultProcessed) {
			console.log(`\n💾 Saving ${phase2Successes.length} approved claims...`);
			await Promise.allSettled(
				phase2Successes.map(async (result) => {
					try {
						await onResultProcessed(result);
						console.log(`✓ Saved approved claim ${result.trackingNumber}`);
					} catch (error) {
						console.error(
							`✗ Error saving approved claim ${result.trackingNumber}:`,
							error,
						);
					}
				}),
			);
			results.push(...phase2Successes);
		}

		// Log any Phase 2 errors
		for (const { claim, error } of phase2Errors) {
			console.error(
				`✗ Failed to process Phase 2 for claim ${claim.trackingNumber}:`,
				error.message,
			);
		}
	}

	// Log any Phase 1 errors
	for (const { claim, error } of phase1Errors) {
		console.error(
			`✗ Failed to process Phase 1 for claim ${claim.trackingNumber}:`,
			error.message,
		);
	}

	console.log(
		`\n✅ Completed processing: ${results.length}/${totalClaims} claims processed successfully`,
	);

	return results;
}

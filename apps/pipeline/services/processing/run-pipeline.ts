import db, {
	claimResults,
	claims,
	pipelineJobs,
	transformClaim,
	transformClaimResult,
	untransformClaim,
} from "@beagle-wt/shared-db";
import { eq } from "drizzle-orm";
import { extractClaimDataFromString } from "../parsing";
import { batchUploadDocuments } from "./batch-upload-documents";
import { processAllClaims } from "./index";

interface RunPipelineOptions {
	csvContent: string;
	rowLimit?: number;
	batchSize?: number;
	jobId?: string;
}

interface RunPipelineResult {
	claimsProcessed: number;
}

/**
 * Runs the complete pipeline processing flow
 * @param options - Pipeline configuration options
 * @returns Result with claims processed count and results path
 */
export async function runPipeline(
	options: RunPipelineOptions,
): Promise<RunPipelineResult> {
	const { csvContent, rowLimit = 5, batchSize = 10, jobId } = options;

	// Update job status to processing if jobId provided
	if (jobId) {
		await db
			.update(pipelineJobs)
			.set({
				status: "processing",
				updatedAt: new Date(),
			})
			.where(eq(pipelineJobs.id, jobId));
	}

	try {
		//* 1. Parse the CSV content and convert the raw data into ClaimRecord objects
		const claimsRecords = await extractClaimDataFromString(
			csvContent,
			rowLimit,
		);

		//* 2. Save sanitized claims to database
		console.log("\n💾 Saving claims to database...");
		let savedClaimsCount = 0;
		let failedClaimsCount = 0;

		for (const claim of claimsRecords) {
			try {
				const transformed = transformClaim(claim);
				await db
					.insert(claims)
					.values(transformed)
					.onConflictDoUpdate({
						target: claims.trackingNumber,
						set: {
							...transformed,
							updatedAt: new Date(),
						},
					});
				savedClaimsCount++;
			} catch (error) {
				console.error(
					`✗ Error saving claim ${claim.trackingNumber} to database:`,
					error,
				);
				failedClaimsCount++;
			}
		}

		console.log(
			`✅ Saved ${savedClaimsCount} claims to database${failedClaimsCount > 0 ? ` (${failedClaimsCount} failed)` : ""}`,
		);

		//* 3. Upload documents to Claude API in batches
		await batchUploadDocuments(batchSize);

		//* 4. Process all claims through Phase 1 and Phase 2 analysis
		console.log("\n🔍 Starting claim analysis...");
		// Fetch all claims from database
		const allClaimsRows = await db.select().from(claims);
		const allClaims = allClaimsRows.map((row) => untransformClaim(row));

		// Track saved/failed counts for incremental saving
		let savedResultsCount = 0;
		let failedResultsCount = 0;

		// Process claims with incremental saving callback
		await processAllClaims(allClaims, async (result) => {
			// Save each result immediately to database
			try {
				const transformed = transformClaimResult(result);
				await db
					.insert(claimResults)
					.values(transformed)
					.onConflictDoUpdate({
						target: claimResults.trackingNumber,
						set: {
							...transformed,
							updatedAt: new Date(),
						},
					});
				savedResultsCount++;
				console.log(
					`💾 Saved result for claim ${result.trackingNumber} to database`,
				);

				// Update job status with current progress if jobId provided
				if (jobId) {
					await db
						.update(pipelineJobs)
						.set({
							claimsProcessed: savedResultsCount.toString(),
							updatedAt: new Date(),
						})
						.where(eq(pipelineJobs.id, jobId));
				}
			} catch (error) {
				failedResultsCount++;
				console.error(
					`✗ Error saving claim result ${result.trackingNumber} to database:`,
					error,
				);
			}
		});

		console.log(
			`\n✅ Processing complete: ${savedResultsCount} claim results saved to database${failedResultsCount > 0 ? ` (${failedResultsCount} failed)` : ""}`,
		);

		// Update job status to completed if jobId provided
		if (jobId) {
			await db
				.update(pipelineJobs)
				.set({
					status: "completed",
					claimsProcessed: savedResultsCount.toString(),
					updatedAt: new Date(),
				})
				.where(eq(pipelineJobs.id, jobId));
		}

		return {
			claimsProcessed: savedResultsCount,
		};
	} catch (error) {
		// Update job status to failed if jobId provided
		if (jobId) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			await db
				.update(pipelineJobs)
				.set({
					status: "failed",
					errorMessage,
					updatedAt: new Date(),
				})
				.where(eq(pipelineJobs.id, jobId));
		}
		throw error;
	}
}

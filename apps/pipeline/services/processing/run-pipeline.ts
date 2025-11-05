import db, {
	claimResults,
	claims,
	pipelineJobs,
	transformClaim,
	transformClaimResult,
} from "@beagle-wt/shared-db";
import { eq } from "drizzle-orm";
import type { ClaimRecord } from "../../../../packages/shared/types/claims";
import { extractClaimDataFromString } from "../parsing";
import { batchUploadDocuments } from "./batch-upload-documents";
import { processAllClaims } from "./index";

interface RunPipelineOptions {
	csvContent: string;
	rowLimit?: number;
	batchSize?: number;
	jobId?: string;
	sanitizedClaimsFilePath?: string;
	claimsResultsFilePath?: string;
}

interface RunPipelineResult {
	claimsProcessed: number;
	resultsPath: string;
}

/**
 * Runs the complete pipeline processing flow
 * @param options - Pipeline configuration options
 * @returns Result with claims processed count and results path
 */
export async function runPipeline(
	options: RunPipelineOptions,
): Promise<RunPipelineResult> {
	const {
		csvContent,
		rowLimit = 5,
		batchSize = 10,
		jobId,
		sanitizedClaimsFilePath = "./data/claims-records.json",
		claimsResultsFilePath = "./data/claim-results.json",
	} = options;

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

		//* 2. Save sanitized claims to JSON file (before processing)
		await Bun.write(
			sanitizedClaimsFilePath,
			JSON.stringify(claimsRecords, null, 2),
		);
		console.log(
			`Saved ${claimsRecords.length} sanitized claims to ${sanitizedClaimsFilePath}`,
		);

		//* 2b. Save sanitized claims to database
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
		// Temporarily set env var for batch upload function
		const originalEnv = process.env.CLAIMS_RECORDS_FILE_PATH;
		process.env.CLAIMS_RECORDS_FILE_PATH = sanitizedClaimsFilePath;
		await batchUploadDocuments(batchSize);
		if (originalEnv) {
			process.env.CLAIMS_RECORDS_FILE_PATH = originalEnv;
		} else {
			delete process.env.CLAIMS_RECORDS_FILE_PATH;
		}

		//* 4. Process all claims through Phase 1 and Phase 2 analysis
		console.log("\n🔍 Starting claim analysis...");
		const allClaims = JSON.parse(
			await Bun.file(sanitizedClaimsFilePath).text(),
		) as ClaimRecord[];
		const claimResultsData = await processAllClaims(allClaims);

		//* 5. Save final results to JSON
		await Bun.write(
			claimsResultsFilePath,
			JSON.stringify(claimResultsData, null, 2),
		);
		console.log(
			`\n✅ Saved ${claimResultsData.length} claim results to ${claimsResultsFilePath}`,
		);

		//* 5b. Save final results to database
		console.log("\n💾 Saving claim results to database...");
		let savedResultsCount = 0;
		let failedResultsCount = 0;

		for (const result of claimResultsData) {
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
			} catch (error) {
				console.error(
					`✗ Error saving claim result ${result.trackingNumber} to database:`,
					error,
				);
				failedResultsCount++;
			}
		}

		console.log(
			`✅ Saved ${savedResultsCount} claim results to database${failedResultsCount > 0 ? ` (${failedResultsCount} failed)` : ""}`,
		);

		// Update job status to completed if jobId provided
		if (jobId) {
			await db
				.update(pipelineJobs)
				.set({
					status: "completed",
					claimsProcessed: claimResultsData.length.toString(),
					resultsPath: claimsResultsFilePath,
					updatedAt: new Date(),
				})
				.where(eq(pipelineJobs.id, jobId));
		}

		return {
			claimsProcessed: claimResultsData.length,
			resultsPath: claimsResultsFilePath,
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

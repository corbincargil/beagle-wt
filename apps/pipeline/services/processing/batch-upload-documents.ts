import db, { claims, transformClaim } from "@beagle-wt/shared-db";
import { eq } from "drizzle-orm";
import type { ClaimRecord } from "../../../../packages/shared/types/claims";
import { uploadMultipleClaimsDocuments } from "../claude/uploads";

const CLAIMS_RECORDS_FILE_PATH =
	process.env.CLAIMS_RECORDS_FILE_PATH || "./data/claims-records.json";

/**
 * Processes claims in batches by uploading documents to Claude API
 * Reads from JSON file, processes batches, and writes back after each batch
 * @param batchSize - Number of claims to process per batch
 * @returns Promise that resolves when all batches are processed
 */
export async function batchUploadDocuments(batchSize: number): Promise<void> {
	// Read file to get total claims count
	const allClaims = JSON.parse(
		await Bun.file(CLAIMS_RECORDS_FILE_PATH).text(),
	) as ClaimRecord[];
	const totalClaims = allClaims.length;
	const totalBatches = Math.ceil(totalClaims / batchSize);

	for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
		const startIndex = batchIndex * batchSize;
		const endIndex = Math.min(startIndex + batchSize, totalClaims);

		console.log(
			`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (claims ${startIndex + 1}-${endIndex})`,
		);

		// Read file once per batch to get latest state
		const currentClaims = JSON.parse(
			await Bun.file(CLAIMS_RECORDS_FILE_PATH).text(),
		) as ClaimRecord[];
		const batchClaims = currentClaims.slice(startIndex, endIndex);

		// Filter out claims that already have claudeFiles (already processed)
		const unprocessedClaims = batchClaims.filter(
			(claim) => !claim.claudeFiles || claim.claudeFiles.length === 0,
		);
		const skippedCount = batchClaims.length - unprocessedClaims.length;

		if (skippedCount > 0) {
			console.log(
				`⏭️  Skipping ${skippedCount} claim(s) that already have claudeFiles`,
			);
		}

		// If all claims in batch are already processed, skip to next batch
		if (unprocessedClaims.length === 0) {
			console.log(
				`✓ Batch ${batchIndex + 1}/${totalBatches} already processed, skipping...`,
			);
			continue;
		}

		// Process only unprocessed claims
		const processedClaims =
			await uploadMultipleClaimsDocuments(unprocessedClaims);

		// Merge processed claims back with already-processed claims
		const allProcessedClaims = batchClaims.map((claim) => {
			const processed = processedClaims.find(
				(pc) => pc.trackingNumber === claim.trackingNumber,
			);
			return processed || claim;
		});

		// Update the full array with processed results
		allProcessedClaims.forEach((processedClaim, i) => {
			const claimIndex = startIndex + i;
			if (claimIndex < currentClaims.length) {
				currentClaims[claimIndex] = processedClaim;
			}
		});

		// Write back to file once per batch
		await Bun.write(
			CLAIMS_RECORDS_FILE_PATH,
			JSON.stringify(currentClaims, null, 2),
		);
		console.log(
			`✓ Saved batch ${batchIndex + 1}/${totalBatches} to ${CLAIMS_RECORDS_FILE_PATH}`,
		);

		// Update database records with claudeFiles after successful upload
		// Only update claims that were actually processed (have new claudeFiles)
		if (processedClaims.length > 0) {
			console.log(
				`💾 Updating database records for batch ${batchIndex + 1}/${totalBatches}...`,
			);
			let updatedDbCount = 0;
			let failedDbCount = 0;

			for (const processedClaim of processedClaims) {
				try {
					const transformed = transformClaim(processedClaim);
					await db
						.update(claims)
						.set({
							claudeFiles: transformed.claudeFiles,
							updatedAt: new Date(),
						})
						.where(eq(claims.trackingNumber, processedClaim.trackingNumber));
					updatedDbCount++;
				} catch (error) {
					console.error(
						`✗ Error updating claim ${processedClaim.trackingNumber} in database:`,
						error,
					);
					failedDbCount++;
				}
			}

			console.log(
				`✅ Updated ${updatedDbCount} claims in database${failedDbCount > 0 ? ` (${failedDbCount} failed)` : ""}`,
			);
		}
	}
}

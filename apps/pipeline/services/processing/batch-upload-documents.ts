import db, {
	claims,
	transformClaim,
	untransformClaim,
} from "@beagle-wt/shared-db";
import { count, eq } from "drizzle-orm";
import { uploadMultipleClaimsDocuments } from "../claude/uploads";

/**
 * Processes claims in batches by uploading documents to Claude API
 * Reads from database, processes batches incrementally, and updates database
 * @param batchSize - Number of claims to process per batch
 * @returns Promise that resolves when all batches are processed
 */
export async function batchUploadDocuments(batchSize: number): Promise<void> {
	// Get total claims count from database
	const [{ count: totalClaimsValue } = { count: 0 }] = await db
		.select({ count: count() })
		.from(claims);
	const totalClaims = Number(totalClaimsValue);
	const totalBatches = Math.ceil(totalClaims / batchSize);

	for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
		const startIndex = batchIndex * batchSize;
		const endIndex = Math.min(startIndex + batchSize, totalClaims);

		console.log(
			`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (claims ${startIndex + 1}-${endIndex})`,
		);

		// Query claims from database for this batch
		const batchRows = await db
			.select()
			.from(claims)
			.limit(batchSize)
			.offset(startIndex);
		const batchClaims = batchRows.map((row) => untransformClaim(row));

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

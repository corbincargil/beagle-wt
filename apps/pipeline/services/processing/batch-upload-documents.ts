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

		// Process batch using uploadMultipleClaimsDocuments
		const processedClaims = await uploadMultipleClaimsDocuments(batchClaims);

		// Update the full array with processed results
		processedClaims.forEach((processedClaim, i) => {
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
	}
}

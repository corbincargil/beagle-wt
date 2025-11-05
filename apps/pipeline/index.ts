import db, {
	claimResults,
	claims,
	transformClaim,
	transformClaimResult,
} from "@beagle-wt/shared-db";
import type { ClaimRecord } from "../../packages/shared/types/claims";
import { extractClaimData } from "./services/parsing";
import { processAllClaims } from "./services/processing";
import { batchUploadDocuments } from "./services/processing/batch-upload-documents";

const RAW_CLAIMS_FILE_PATH =
	process.env.RAW_CLAIMS_FILE_PATH || "./data/raw-claims-data.csv";
const SANITIZED_CLAIMS_FILE_PATH =
	process.env.SANITIZED_CLAIMS_FILE_PATH || "./data/claims-records.json";
const CLAIMS_RESULTS_FILE_PATH =
	process.env.CLAIMS_RESULTS_FILE_PATH || "./data/claim-results.json";
const CLAIMS_BATCH_SIZE = 50; // Process 50 claims per batch

//* 1. Parse the CSV file and convert the raw data into ClaimRecord objects
const claimsRecords = await extractClaimData(RAW_CLAIMS_FILE_PATH);

//* 2. Save sanitized claims to JSON file (before processing)
await Bun.write(
	SANITIZED_CLAIMS_FILE_PATH,
	JSON.stringify(claimsRecords, null, 2),
);
console.log(
	`Saved ${claimsRecords.length} sanitized claims to ${SANITIZED_CLAIMS_FILE_PATH}`,
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
await batchUploadDocuments(CLAIMS_BATCH_SIZE);

//* 4. Process all claims through Phase 1 and Phase 2 analysis
console.log("\n🔍 Starting claim analysis...");
const allClaims = JSON.parse(
	await Bun.file(SANITIZED_CLAIMS_FILE_PATH).text(),
) as ClaimRecord[];
const claimResultsData = await processAllClaims(allClaims);

//* 5. Save final results to JSON
await Bun.write(
	CLAIMS_RESULTS_FILE_PATH,
	JSON.stringify(claimResultsData, null, 2),
);
console.log(
	`\n✅ Saved ${claimResultsData.length} claim results to ${CLAIMS_RESULTS_FILE_PATH}`,
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

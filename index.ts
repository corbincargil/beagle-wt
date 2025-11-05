import { extractClaimData } from "./services/parsing";
import { batchUploadDocuments } from "./services/processing/batch-upload-documents";
import { processAllClaims } from "./services/processing";
import type { ClaimRecord } from "./types/claims";

const RAW_CLAIMS_FILE_PATH = process.env.RAW_CLAIMS_FILE_PATH || "./data/raw-claims-data.csv";
const SANITIZED_CLAIMS_FILE_PATH = process.env.SANITIZED_CLAIMS_FILE_PATH || "./data/claims-records.json";
const CLAIMS_RESULTS_FILE_PATH = process.env.CLAIMS_RESULTS_FILE_PATH || "./data/claim-results.json";
const CLAIMS_BATCH_SIZE = 50; // Process 50 claims per batch

//* 1. Parse the CSV file and convert the raw data into ClaimRecord objects
const claimsRecords = await extractClaimData(RAW_CLAIMS_FILE_PATH);

//* 2. Save sanitized claims to JSON file (before processing)
await Bun.write(SANITIZED_CLAIMS_FILE_PATH, JSON.stringify(claimsRecords, null, 2));
console.log(`Saved ${claimsRecords.length} sanitized claims to ${SANITIZED_CLAIMS_FILE_PATH}`);

//* 3. Upload documents to Claude API in batches
await batchUploadDocuments(CLAIMS_BATCH_SIZE);

//* 4. Process all claims through Phase 1 and Phase 2 analysis
console.log("\n🔍 Starting claim analysis...");
const allClaims = JSON.parse(await Bun.file(SANITIZED_CLAIMS_FILE_PATH).text()) as ClaimRecord[];
const claimResults = await processAllClaims(allClaims);

//* 5. Save final results
await Bun.write(CLAIMS_RESULTS_FILE_PATH, JSON.stringify(claimResults, null, 2));
console.log(`\n✅ Saved ${claimResults.length} claim results to ${CLAIMS_RESULTS_FILE_PATH}`);

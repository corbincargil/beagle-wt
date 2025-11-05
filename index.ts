import { extractClaimData } from "./services/parsing";
import { batchUploadDocuments } from "./services/processing/batch-upload-documents";

const RAW_CLAIMS_FILE_PATH = process.env.RAW_CLAIMS_FILE_PATH || "./data/raw-claims-data.csv";
const SANITIZED_CLAIMS_FILE_PATH = process.env.SANITIZED_CLAIMS_FILE_PATH || "./data/claims-records.json";
const CLAIMS_BATCH_SIZE = 50; // Process 50 claims per batch

//* 1. Parse the CSV file and convert the raw data into ClaimRecord objects
const claimsRecords = await extractClaimData(RAW_CLAIMS_FILE_PATH);

//* 2. Save sanitized claims to JSON file (before processing)
await Bun.write(SANITIZED_CLAIMS_FILE_PATH, JSON.stringify(claimsRecords, null, 2));
console.log(`Saved ${claimsRecords.length} sanitized claims to ${SANITIZED_CLAIMS_FILE_PATH}`);

//* 3. Upload documents to Claude API in batches
await batchUploadDocuments(CLAIMS_BATCH_SIZE);


import { runPipeline } from "./services/processing/run-pipeline";

const RAW_CLAIMS_FILE_PATH =
	process.env.RAW_CLAIMS_FILE_PATH || "./data/raw-claims-data.csv";
const CLAIMS_BATCH_SIZE = 50; // Process 50 claims per batch

// Read CSV file content
const csvContent = await Bun.file(RAW_CLAIMS_FILE_PATH).text();

// Run pipeline using shared function
const result = await runPipeline({
	csvContent,
	batchSize: CLAIMS_BATCH_SIZE,
});

console.log(
	`\n✅ Pipeline completed: ${result.claimsProcessed} claims processed`,
);

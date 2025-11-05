import { runPipeline } from "./services/processing/run-pipeline";

const RAW_CLAIMS_FILE_PATH =
	process.env.RAW_CLAIMS_FILE_PATH || "./data/raw-claims-data.csv";
const SANITIZED_CLAIMS_FILE_PATH =
	process.env.SANITIZED_CLAIMS_FILE_PATH || "./data/claims-records.json";
const CLAIMS_RESULTS_FILE_PATH =
	process.env.CLAIMS_RESULTS_FILE_PATH || "./data/claim-results.json";
const CLAIMS_BATCH_SIZE = 50; // Process 50 claims per batch

// Read CSV file content
const csvContent = await Bun.file(RAW_CLAIMS_FILE_PATH).text();

// Run pipeline using shared function
const result = await runPipeline({
	csvContent,
	batchSize: CLAIMS_BATCH_SIZE,
	sanitizedClaimsFilePath: SANITIZED_CLAIMS_FILE_PATH,
	claimsResultsFilePath: CLAIMS_RESULTS_FILE_PATH,
});

console.log(
	`\n✅ Pipeline completed: ${result.claimsProcessed} claims processed`,
);
console.log(`Results saved to: ${result.resultsPath}`);

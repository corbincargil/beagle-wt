import Anthropic from "@anthropic-ai/sdk";
import type { ClaimRecord } from "../../../packages/shared/types/claims";

const CLAIMS_RECORDS_FILE_PATH =
	process.env.CLAIMS_RECORDS_FILE_PATH || "./data/claims-records.json";
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!CLAUDE_API_KEY) {
	console.error("Error: ANTHROPIC_API_KEY environment variable is required");
	process.exit(1);
}

// Initialize Anthropic client
const anthropic = new Anthropic();

/**
 * Deletes a single file from Claude using its file ID
 */
async function deleteClaudeFile(fileId: string): Promise<boolean> {
	try {
		await anthropic.beta.files.delete(fileId, {
			betas: ["files-api-2025-04-14"],
		});
		return true;
	} catch (error) {
		if (error instanceof Error) {
			console.error(`  ✗ Failed to delete file ${fileId}: ${error.message}`);
		}
		return false;
	}
}

/**
 * Deletes all Claude files from claims-records.json
 */
async function cleanupClaudeFiles(): Promise<void> {
	console.log("🗑️  Starting cleanup of Claude files...");
	console.log(`Reading from: ${CLAIMS_RECORDS_FILE_PATH}\n`);

	// Read claims from JSON file
	const claims = JSON.parse(
		await Bun.file(CLAIMS_RECORDS_FILE_PATH).text(),
	) as ClaimRecord[];

	let totalFiles = 0;
	let deletedFiles = 0;
	let failedFiles = 0;

	// Process each claim
	for (let i = 0; i < claims.length; i++) {
		const claim = claims[i];

		if (!claim) {
			console.warn(`⚠ Warning: Claim at index ${i} is missing, skipping`);
			continue;
		}

		if (!claim.claudeFiles || claim.claudeFiles.length === 0) {
			continue;
		}

		console.log(
			`[${i + 1}/${claims.length}] Processing claim ${claim.trackingNumber} (${claim.claudeFiles.length} files)`,
		);

		// Delete each file in the claim's claudeFiles array
		for (const claudeFile of claim.claudeFiles) {
			totalFiles++;
			console.log(`  Deleting file: ${claudeFile.filename} (${claudeFile.id})`);

			const success = await deleteClaudeFile(claudeFile.id);

			if (success) {
				deletedFiles++;
				console.log(`  ✓ Deleted ${claudeFile.filename}`);
			} else {
				failedFiles++;
			}
		}
	}

	// Summary
	console.log(`\n📊 Cleanup Summary:`);
	console.log(`  Total files processed: ${totalFiles}`);
	console.log(`  Successfully deleted: ${deletedFiles}`);
	console.log(`  Failed: ${failedFiles}`);
}

// Run cleanup
cleanupClaudeFiles().catch((error) => {
	console.error("Fatal error during cleanup:", error);
	process.exit(1);
});

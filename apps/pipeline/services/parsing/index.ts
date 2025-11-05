import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import type {
	ClaimRecord,
	ClaudeFile,
	Document,
} from "../../../../packages/shared/types/claims";
import {
	buildPropertyAddress,
	normalizeStatus,
	parseDollarAmount,
} from "./helpers";

/**
 * Converts string arrays (CSV rows) to ClaimRecord objects
 * Skips the header row and maps CSV columns to ClaimRecord fields
 */
const parseClaimsWithoutDocuments = (
	rows: string[][],
): Omit<ClaimRecord, "id" | "documents" | "claudeFiles">[] => {
	// Skip header row (first row)
	const dataRows = rows.slice(1);

	return dataRows.map(
		(row: string[]): Omit<ClaimRecord, "id" | "documents" | "claudeFiles"> => {
			return {
				trackingNumber: row[0] || "",
				claimDate: row[1] || undefined,
				propertyAddress: buildPropertyAddress(
					row[3], // Lease Street Address
					row[4], // Lease City
					row[5], // Lease State
					row[6], // Lease Zip
				),
				leaseStartDate: row[7] || undefined,
				leaseEndDate: row[8] || undefined,
				moveOutDate: row[9] || undefined,
				monthlyRent: parseDollarAmount(row[10]), // Monthly Rent
				propertyManagementCompany: row[22] || undefined, // Property Management Company
				groupNumber: row[24] || undefined, // Group #
				treatyNumber: row[25] || undefined, // Treaty #
				policy: row[26] || undefined, // Policy
				maxBenefit: parseDollarAmount(row[27]), // Max Benefit
				status: normalizeStatus(row[28]), // Status
			};
		},
	);
};

/**
 * Loads documents for a single claim from its folder
 */
const loadDocumentsForClaim = async (
	trackingNumber: string,
): Promise<Document[]> => {
	const documentsPath = join("./data/documents", trackingNumber);

	try {
		const files = await readdir(documentsPath, { withFileTypes: true });

		return files
			.filter((file) => file.isFile()) // Only include files, not subdirectories
			.map((file) => {
				const filename = file.name;
				const filePath = join(documentsPath, filename);

				return {
					name: filename,
					path: filePath,
				};
			});
	} catch (error) {
		// Folder doesn't exist or can't be read - return empty array
		console.warn(
			`Warning: Could not read documents for claim ${trackingNumber}: ${error}`,
		);
		return [];
	}
};

/**
 * Attaches documents and claudeFiles to claims by reading document folders
 * Processes claims in parallel for better performance
 */
const attachDocuments = async (
	claims: Omit<ClaimRecord, "documents" | "claudeFiles" | "id">[],
): Promise<Omit<ClaimRecord, "id">[]> => {
	// Process all claims in parallel
	const claimsWithDocuments = await Promise.all(
		claims.map(async (claim) => {
			const documents = await loadDocumentsForClaim(claim.trackingNumber);
			// claudeFiles will be populated later when files are uploaded to Claude
			const claudeFiles: ClaudeFile[] = [];
			return { ...claim, documents, claudeFiles };
		}),
	);

	return claimsWithDocuments;
};

/**
 * Parses CSV content string into ClaimRecord objects
 * @param csvContent - The CSV content as a string
 * @param limitRows - Optional limit on number of rows to process (for testing)
 * @returns An array of ClaimRecord objects
 */
const extractClaimDataFromString = async (
	csvContent: string,
	limitRows?: number,
): Promise<Omit<ClaimRecord, "id">[]> => {
	const rows = parse(csvContent, {
		delimiter: ",",
		skip_empty_lines: true,
	});

	// Apply limit if specified (for testing purposes)
	const rowsToProcess = limitRows ? rows.slice(0, limitRows + 1) : rows;

	// Sanitize the rows (string[][] to ClaimRecord[])
	const claimsWithoutDocuments = parseClaimsWithoutDocuments(rowsToProcess);

	// Add documents to each claim record
	const claimsRecords = await attachDocuments(claimsWithoutDocuments);

	return claimsRecords;
};

/**
 * Extracts the raw claim data from a CSV file and returns an array of ClaimRecord objects
 * @param filePath - The path to the CSV file
 * @param limitRows - Optional limit on number of rows to process (for testing)
 * @returns An array of ClaimRecord objects
 */
const extractClaimData = async (
	filePath: string,
	limitRows?: number,
): Promise<Omit<ClaimRecord, "id">[]> => {
	const file = Bun.file(filePath);
	const contents = await file.text();
	return extractClaimDataFromString(contents, limitRows);
};

export { extractClaimData, extractClaimDataFromString };

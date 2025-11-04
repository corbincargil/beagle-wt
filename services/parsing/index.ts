import type { ClaimRecord } from "../../types/claims";
import { parseDollarAmount, buildPropertyAddress, normalizeStatus } from "./helpers";
import { parse } from "csv-parse/sync";

/**
 * Converts string arrays (CSV rows) to ClaimRecord objects
 * Skips the header row and maps CSV columns to ClaimRecord fields
 */
const parseClaims = (rows: string[][]): ClaimRecord[] => {
    // Skip header row (first row)
    const dataRows = rows.slice(1);
    
    return dataRows.map((row: string[]): ClaimRecord => {
        return {
            trackingNumber: row[0] || "",
            claimDate: row[1] || undefined,
            propertyAddress: buildPropertyAddress(
                row[3], // Lease Street Address
                row[4], // Lease City
                row[5], // Lease State
                row[6]  // Lease Zip
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
            folderPath: row[0] || "", // Maps to trackingNumber (folder names are 1, 2, 3, etc.)
        };
    });
}

/** 
 * Extracts the raw claim data from a CSV file and returns an array of ClaimRecord objects
 * @param filePath - The path to the CSV file
 * @returns An array of ClaimRecord objects
 */
const extractClaimData = async (filePath: string): Promise<ClaimRecord[]> => {
    const file = Bun.file(filePath);
    const contents = await file.text();
    const rows = parse(contents, {
        delimiter: ",",
        skip_empty_lines: true,
    });

    // first 5 rows
    const first5Rows = rows.slice(0, 5);

    // sanitize the rows (string[][] to ClaimRecord[])
    const claimsRecords = parseClaims(first5Rows);

    
    // log first 5 rows
    console.log(claimsRecords);
    return claimsRecords;
}

export { extractClaimData };
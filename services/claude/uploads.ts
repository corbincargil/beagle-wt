import type { ClaimRecord, Document, ClaudeFile } from "../../types/claims";
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import { createReadStream } from "fs";
import { basename } from "path";

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!CLAUDE_API_KEY) {
  console.warn("Warning: ANTHROPIC_API_KEY environment variable is not set");
}

// Initialize Anthropic client
const anthropic = new Anthropic();

/**
 * Gets the MIME type for a file based on its extension
 */
const getMimeType = (filePath: string): string => {
  const ext = filePath.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
};

/**
 * Uploads a single file to Claude API using the Anthropic SDK
 * @param filePath - The path to the file to upload
 * @returns The ClaudeFile object returned from the API
 */
export async function uploadFileToClaude(filePath: string): Promise<ClaudeFile> {
  if (!CLAUDE_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  if (!filePath || filePath.length === 0) {
    throw new Error("File path is required");
  }

  try {
    const filename = basename(filePath);
    const mimeType = getMimeType(filePath);

    // Use toFile helper to convert file stream to File object
    const file = await toFile(
      createReadStream(filePath),
      filename,
      { type: mimeType }
    );

    // Upload using the SDK's beta files API
    const claudeFile = await anthropic.beta.files.upload({
      file,
      betas: ["files-api-2025-04-14"],
    });

    return claudeFile as ClaudeFile;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error uploading file ${filePath} to Claude: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Uploads all documents for a claim to Claude API
 * @param claim - The claim record with documents to upload
 * @returns The updated claim with claudeFiles populated
 */
export async function uploadClaimDocuments(
  claim: ClaimRecord
): Promise<ClaimRecord> {
  // Skip if already processed
  if (claim.claudeFiles && claim.claudeFiles.length > 0) {
    return claim;
  }

  if (claim.documents.length === 0) {
    return { ...claim, claudeFiles: [] };
  }

  // Upload all documents in parallel
  const claudeFilesPromises = claim.documents.map((doc) =>
    uploadFileToClaude(doc.path).catch((error) => {
      console.error(
        `Failed to upload document ${doc.name} for claim ${claim.trackingNumber}:`,
        error
      );
      // Return null for failed uploads - we'll filter these out
      return null;
    })
  );

  const claudeFilesResults = await Promise.all(claudeFilesPromises);
  
  // Filter out failed uploads (null values)
  const claudeFiles = claudeFilesResults.filter(
    (file): file is ClaudeFile => file !== null
  );

  return {
    ...claim,
    claudeFiles,
  };
}

/**
 * Uploads documents for multiple claims
 * @param claims - Array of claim records to upload documents for
 * @returns Array of updated claims with claudeFiles populated
 */
export async function uploadMultipleClaimsDocuments(
  claims: ClaimRecord[]
): Promise<ClaimRecord[]> {
  // Process claims sequentially to avoid rate limiting
  // You may want to add batching/concurrency control here
  const results: ClaimRecord[] = [];
  
  for (const claim of claims) {
    try {
      const updatedClaim = await uploadClaimDocuments(claim);
      console.log(`Uploaded documents for ${claim.trackingNumber} / ${claims.length} claims`);
      results.push(updatedClaim);
    } catch (error) {
      console.error(
        `Failed to upload documents for claim ${claim.trackingNumber}:`,
        error
      );
      // Continue with other claims even if one fails
      results.push(claim);
    }
  }

  return results;
}


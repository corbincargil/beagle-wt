import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AccuracyMetrics, ClaimAccuracy } from "./index";

/**
 * Accuracy report data structure
 */
export interface AccuracyReport {
	timestamp: string;
	metrics: AccuracyMetrics;
	claimDetails: ClaimAccuracy[];
}

/**
 * Generates a formatted accuracy report
 */
export function formatAccuracyReport(
	metrics: AccuracyMetrics,
	claimAccuracies: ClaimAccuracy[],
): string {
	let report = `${"=".repeat(80)}\n`;
	report += "AI ACCURACY REPORT\n";
	report += `${"=".repeat(80)}\n\n`;

	// Overall summary
	report += `Total Claims Analyzed: ${metrics.totalClaims}\n\n`;

	// Status accuracy
	report += "STATUS ACCURACY\n";
	report += `${"-".repeat(80)}\n`;
	report += `Correct: ${metrics.statusAccuracy.correct}\n`;
	report += `Incorrect: ${metrics.statusAccuracy.incorrect}\n`;
	report += `Accuracy: ${metrics.statusAccuracy.accuracy.toFixed(2)}%\n\n`;

	report += "Confusion Matrix:\n";
	report += `  Approved → Approved: ${metrics.statusAccuracy.confusionMatrix.approvedApproved}\n`;
	report += `  Approved → Declined: ${metrics.statusAccuracy.confusionMatrix.approvedDeclined}\n`;
	report += `  Declined → Approved: ${metrics.statusAccuracy.confusionMatrix.declinedApproved}\n`;
	report += `  Declined → Declined: ${metrics.statusAccuracy.confusionMatrix.declinedDeclined}\n\n`;

	// Payout accuracy
	report += "PAYOUT ACCURACY\n";
	report += `${"-".repeat(80)}\n`;
	report += `Exact Matches: ${metrics.payoutAccuracy.exactMatches}\n`;
	report += `Within $1.00: ${metrics.payoutAccuracy.withinTolerance}\n`;
	report += `Within 5%: ${metrics.payoutAccuracy.withinPercentage}\n`;
	report += `Mean Absolute Error: $${metrics.payoutAccuracy.meanAbsoluteError.toFixed(2)}\n`;
	report += `Mean Percentage Error: ${metrics.payoutAccuracy.meanPercentageError.toFixed(2)}%\n`;
	report += `Symmetric Mean Absolute Percentage Error (SMAPE): ${metrics.payoutAccuracy.symmetricMeanAbsolutePercentageError.toFixed(2)}%\n`;
	report += `Root Mean Squared Error: $${metrics.payoutAccuracy.rootMeanSquaredError.toFixed(2)}\n`;
	report += `Max Error: $${metrics.payoutAccuracy.maxError.toFixed(2)}\n`;
	report += `Min Error: $${metrics.payoutAccuracy.minError.toFixed(2)}\n\n`;

	// Per-claim details
	report += "PER-CLAIM DETAILS\n";
	report += `${"-".repeat(80)}\n`;
	report +=
		"Tracking # | Status | Status Match | Payout AI | Payout GT | Difference | % Error\n";
	report += `${"-".repeat(80)}\n`;

	claimAccuracies.forEach((acc) => {
		const statusMatch = acc.statusCorrect ? "✓" : "✗";
		report += `${acc.trackingNumber.padEnd(12)} | ${acc.statusAIMatch.padEnd(6)} | ${statusMatch.padEnd(11)} | $${acc.payoutAI.toFixed(2).padStart(10)} | $${acc.payoutGroundTruth.toFixed(2).padStart(10)} | $${acc.payoutDifference.toFixed(2).padStart(10)} | ${acc.payoutPercentageError.toFixed(2).padStart(6)}%\n`;
	});

	return report;
}

/**
 * Generates and saves accuracy report to text file
 */
export async function saveAccuracyReportText(
	metrics: AccuracyMetrics,
	claimAccuracies: ClaimAccuracy[],
	outputPath?: string,
): Promise<string> {
	const reportText = formatAccuracyReport(metrics, claimAccuracies);

	const path =
		outputPath ||
		join(process.cwd(), "data", `accuracy-report-${Date.now()}.txt`);

	await writeFile(path, reportText, "utf-8");
	return path;
}

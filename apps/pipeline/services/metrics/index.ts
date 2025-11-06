import type {
	ClaimRecord,
	ClaimResult,
} from "../../../../packages/shared/types/claims";

/**
 * Accuracy metrics for a single claim
 */
export interface ClaimAccuracy {
	trackingNumber: string;
	statusCorrect: boolean;
	statusAIMatch: "approved" | "declined";
	statusGroundTruth: "approved" | "declined";
	payoutCorrect: boolean;
	payoutAI: number;
	payoutGroundTruth: number;
	payoutDifference: number;
	payoutPercentageError: number;
}

/**
 * Overall accuracy metrics across all claims
 */
export interface AccuracyMetrics {
	totalClaims: number;
	statusAccuracy: {
		correct: number;
		incorrect: number;
		accuracy: number; // percentage
		confusionMatrix: {
			approvedApproved: number; // AI approved, GT approved
			approvedDeclined: number; // AI approved, GT declined
			declinedApproved: number; // AI declined, GT approved
			declinedDeclined: number; // AI declined, GT declined
		};
	};
	payoutAccuracy: {
		exactMatches: number;
		withinTolerance: number; // within $1 tolerance
		withinPercentage: number; // within 5% tolerance
		meanAbsoluteError: number;
		meanPercentageError: number;
		symmetricMeanAbsolutePercentageError: number; // SMAPE
		rootMeanSquaredError: number;
		maxError: number;
		minError: number;
	};
}

/**
 * Derives ground truth status from approved benefit amount
 * > 0 = approved, 0 or missing = declined
 */
function deriveGroundTruthStatus(
	approvedBenefitAmount?: number,
): "approved" | "declined" {
	if (approvedBenefitAmount === undefined || approvedBenefitAmount === null) {
		return "declined";
	}
	return approvedBenefitAmount > 0 ? "approved" : "declined";
}

/**
 * Calculates accuracy for a single claim
 */
export function calculateClaimAccuracy(
	claim: ClaimRecord,
	result: ClaimResult,
): ClaimAccuracy | null {
	// Need ground truth to calculate accuracy
	if (claim.approvedBenefitAmount === undefined) {
		return null;
	}

	const groundTruthStatus = deriveGroundTruthStatus(
		claim.approvedBenefitAmount,
	);
	const aiStatus = result.status;

	const statusCorrect = groundTruthStatus === aiStatus;

	const payoutAI = result.finalPayout;
	const payoutGroundTruth = claim.approvedBenefitAmount;
	const payoutDifference = Math.abs(payoutAI - payoutGroundTruth);
	const payoutPercentageError =
		payoutGroundTruth > 0
			? (payoutDifference / payoutGroundTruth) * 100
			: payoutAI > 0
				? 100 // Ground truth is 0 but AI predicted something
				: 0; // Both are 0

	// Payout is correct if exact match (within $0.01 for floating point precision)
	const payoutCorrect = payoutDifference < 0.01;

	return {
		trackingNumber: claim.trackingNumber,
		statusCorrect,
		statusAIMatch: aiStatus,
		statusGroundTruth: groundTruthStatus,
		payoutCorrect,
		payoutAI: payoutAI,
		payoutGroundTruth: payoutGroundTruth,
		payoutDifference,
		payoutPercentageError,
	};
}

/**
 * Calculates overall accuracy metrics across all claims
 */
export function calculateAccuracyMetrics(
	claimAccuracies: ClaimAccuracy[],
): AccuracyMetrics {
	const totalClaims = claimAccuracies.length;

	// Status accuracy
	const statusMetrics = {
		correct: 0,
		incorrect: 0,
		confusionMatrix: {
			approvedApproved: 0,
			approvedDeclined: 0,
			declinedApproved: 0,
			declinedDeclined: 0,
		},
	};

	claimAccuracies.forEach((acc) => {
		if (acc.statusCorrect) {
			statusMetrics.correct++;
			if (acc.statusAIMatch === "approved") {
				statusMetrics.confusionMatrix.approvedApproved++;
			} else {
				statusMetrics.confusionMatrix.declinedDeclined++;
			}
		} else {
			statusMetrics.incorrect++;
			if (acc.statusAIMatch === "approved") {
				statusMetrics.confusionMatrix.approvedDeclined++;
			} else {
				statusMetrics.confusionMatrix.declinedApproved++;
			}
		}
	});

	const statusAccuracy =
		totalClaims > 0 ? (statusMetrics.correct / totalClaims) * 100 : 0;

	// Payout accuracy
	const payoutErrors: number[] = [];
	const payoutPercentageErrors: number[] = [];
	let exactMatches = 0;
	let withinTolerance = 0; // within $1
	let withinPercentage = 0; // within 5%

	claimAccuracies.forEach((acc) => {
		payoutErrors.push(acc.payoutDifference);
		payoutPercentageErrors.push(acc.payoutPercentageError);

		if (acc.payoutCorrect) {
			exactMatches++;
		}
		if (acc.payoutDifference < 1.0) {
			withinTolerance++;
		}
		if (acc.payoutPercentageError < 5.0) {
			withinPercentage++;
		}
	});

	const meanAbsoluteError =
		payoutErrors.length > 0
			? payoutErrors.reduce((sum, err) => sum + err, 0) / payoutErrors.length
			: 0;

	const meanPercentageError =
		payoutPercentageErrors.length > 0
			? payoutPercentageErrors.reduce((sum, err) => sum + err, 0) /
				payoutPercentageErrors.length
			: 0;

	// SMAPE (Symmetric Mean Absolute Percentage Error)
	const symmetricMeanAbsolutePercentageError =
		claimAccuracies.length > 0
			? (100 / claimAccuracies.length) *
				claimAccuracies.reduce((sum, acc) => {
					const actual = acc.payoutGroundTruth;
					const predicted = acc.payoutAI;
					const denominator = (Math.abs(actual) + Math.abs(predicted)) / 2;
					// Handle division by zero: if both are 0, error is 0
					if (denominator === 0) {
						return sum;
					}
					return sum + Math.abs(actual - predicted) / denominator;
				}, 0)
			: 0;

	const rootMeanSquaredError =
		payoutErrors.length > 0
			? Math.sqrt(
					payoutErrors.reduce((sum, err) => sum + err * err, 0) /
						payoutErrors.length,
				)
			: 0;

	const maxError = payoutErrors.length > 0 ? Math.max(...payoutErrors) : 0;
	const minError = payoutErrors.length > 0 ? Math.min(...payoutErrors) : 0;

	return {
		totalClaims,
		statusAccuracy: {
			...statusMetrics,
			accuracy: statusAccuracy,
		},
		payoutAccuracy: {
			exactMatches,
			withinTolerance,
			withinPercentage,
			meanAbsoluteError,
			meanPercentageError,
			symmetricMeanAbsolutePercentageError,
			rootMeanSquaredError,
			maxError,
			minError,
		},
	};
}

/**
 * Calculates accuracy for all claims and their results
 */
export function calculateAllClaimAccuracies(
	claims: ClaimRecord[],
	results: ClaimResult[],
): {
	claimAccuracies: ClaimAccuracy[];
	metrics: AccuracyMetrics;
} {
	// Create a map of results by tracking number for quick lookup
	const resultsMap = new Map<string, ClaimResult>();
	results.forEach((result) => {
		resultsMap.set(result.trackingNumber, result);
	});

	// Calculate accuracy for each claim
	const claimAccuracies: ClaimAccuracy[] = [];

	claims.forEach((claim) => {
		const result = resultsMap.get(claim.trackingNumber);
		if (result) {
			const accuracy = calculateClaimAccuracy(claim, result);
			if (accuracy) {
				claimAccuracies.push(accuracy);
			}
		}
	});

	const metrics = calculateAccuracyMetrics(claimAccuracies);

	return {
		claimAccuracies,
		metrics,
	};
}

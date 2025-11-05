const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const PIPELINE_API_URL =
	process.env.NEXT_PUBLIC_PIPELINE_API_URL || "http://localhost:3001";

/**
 * Generic API fetch function with error handling
 */
async function apiFetch<T>(
	endpoint: string,
	options?: RequestInit,
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => response.statusText);
		throw new Error(
			`API Error (${response.status}): ${errorText || response.statusText}`,
		);
	}

	return response.json();
}

/**
 * API client for claims-related endpoints
 */
export const claimsApi = {
	getClaims: async <T = unknown>(): Promise<T[]> => {
		return apiFetch<T[]>("/api/claims");
	},

	getClaimResults: async <T = unknown>(): Promise<T[]> => {
		return apiFetch<T[]>("/api/claims-results");
	},

	getCombinedClaims: async <T = unknown>(): Promise<T[]> => {
		return apiFetch<T[]>("/api/claims-combined");
	},
};

/**
 * Pipeline API client for uploading CSV files and processing jobs
 */
export interface UploadPipelineJobResponse {
	jobId: string;
	status: string;
}

export const pipelineApi = {
	uploadPipelineJob: async (
		csv: string,
		batchSize?: number,
	): Promise<UploadPipelineJobResponse> => {
		const url = `${PIPELINE_API_URL}/api/pipeline/jobs`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				csv,
				...(batchSize !== undefined && { batchSize }),
			}),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => response.statusText);
			throw new Error(
				`Pipeline API Error (${response.status}): ${errorText || response.statusText}`,
			);
		}

		return response.json();
	},
};

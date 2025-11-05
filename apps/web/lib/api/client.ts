const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

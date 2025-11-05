import db, { pipelineJobs } from "@beagle-wt/shared-db";
import { serve } from "bun";
import { runPipeline } from "./services/processing/run-pipeline";

const PORT = parseInt(process.env.PIPELINE_PORT || "3001", 10);

// CORS headers helper
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Content-Type": "application/json",
};

serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);
		const path = url.pathname;
		const method = req.method;

		// Handle CORS preflight
		if (method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Health check endpoint
			if (path === "/health" && method === "GET") {
				return Response.json({ status: "ok" }, { headers: corsHeaders });
			}

			// Create pipeline job endpoint
			if (path === "/api/pipeline/jobs" && method === "POST") {
				const body = (await req.json().catch(() => {
					throw new Error("Invalid JSON in request body");
				})) as { csv?: string; batchSize?: number };

				if (!body.csv || typeof body.csv !== "string") {
					return Response.json(
						{ error: "Missing or invalid 'csv' field in request body" },
						{ status: 400, headers: corsHeaders },
					);
				}

				const batchSize = body.batchSize
					? parseInt(String(body.batchSize), 10)
					: undefined;

				if (
					batchSize !== undefined &&
					(Number.isNaN(batchSize) || batchSize < 1)
				) {
					return Response.json(
						{ error: "batchSize must be a positive number" },
						{ status: 400, headers: corsHeaders },
					);
				}

				// Create job in database
				const [job] = await db
					.insert(pipelineJobs)
					.values({
						status: "pending",
						csvContent: body.csv,
						batchSize: batchSize ? batchSize.toString() : undefined,
					})
					.returning();

				if (!job) {
					throw new Error("Failed to create job");
				}

				// Start async processing (non-blocking)
				runPipeline({
					csvContent: body.csv,
					batchSize: batchSize || 50,
					jobId: job.id,
				}).catch((error) => {
					console.error(`Error processing job ${job.id}:`, error);
					// Error handling is done in runPipeline function
				});

				return Response.json(
					{ jobId: job.id, status: "pending" },
					{ headers: corsHeaders },
				);
			}

			// Not found
			return Response.json(
				{ error: "Not found" },
				{ status: 404, headers: corsHeaders },
			);
		} catch (error) {
			console.error("API Error:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Internal server error";
			return Response.json(
				{ error: errorMessage },
				{ status: 500, headers: corsHeaders },
			);
		}
	},
});

console.log(`🚀 Pipeline API server running on http://localhost:${PORT}`);

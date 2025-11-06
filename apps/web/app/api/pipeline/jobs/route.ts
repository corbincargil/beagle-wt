import { pipelineJobs } from "@beagle-wt/shared-db/schema";
import { desc } from "drizzle-orm";
import db from "@/db";

export async function GET() {
	const results = await db
		.select()
		.from(pipelineJobs)
		.orderBy(desc(pipelineJobs.createdAt));

	return Response.json(results);
}

import db from "@/db";
import { pipelineJobs } from "@beagle-wt/shared-db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
	const results = await db
		.select()
		.from(pipelineJobs)
		.orderBy(desc(pipelineJobs.createdAt));

	return Response.json(results);
}

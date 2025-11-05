import db from "@/db";
import { claimResults } from "@/db/schema";
import { transformClaimResult } from "@/lib/api/formatters";

export async function GET() {
	const results = await db.select().from(claimResults);

	return Response.json(results);
}

export async function POST(_request: Request) {
	const body = await _request.json();
	const transformed = transformClaimResult(body);
	const claimResult = await db
		.insert(claimResults)
		.values(transformed)
		.returning();

	return Response.json(claimResult);
}

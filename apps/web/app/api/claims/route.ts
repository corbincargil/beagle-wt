import db from "@/db";
import { claims } from "@/db/schema";
import { transformClaim } from "@/lib/api/formatters";

export async function GET() {
	const results = await db.select().from(claims);

	return Response.json(results);
}

export async function POST(_request: Request) {
	const body = await _request.json();
	const transformed = transformClaim(body);
	const claim = await db.insert(claims).values(transformed).returning();

	return Response.json(claim);
}

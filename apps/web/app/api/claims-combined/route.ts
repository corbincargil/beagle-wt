import { eq } from "drizzle-orm";
import db from "@/db";
import { claimResults, claims } from "@/db/schema";

export async function GET() {
	const results = await db
		.select({
			// Fields from claims
			id: claims.id,
			trackingNumber: claims.trackingNumber,
			propertyAddress: claims.propertyAddress,
			claimDate: claims.claimDate,
			monthlyRent: claims.monthlyRent,
			maxBenefit: claims.maxBenefit,
			claimStatus: claims.status,
			// Fields from claimResults (nullable)
			claimResultId: claimResults.id,
			tenantName: claimResults.tenantName,
			finalPayout: claimResults.finalPayout,
			approvedChargesTotal: claimResults.approvedChargesTotal,
			resultStatus: claimResults.status,
			decisionSummary: claimResults.decisionSummary,
		})
		.from(claims)
		.leftJoin(
			claimResults,
			eq(claims.trackingNumber, claimResults.trackingNumber),
		);

	return Response.json(results);
}

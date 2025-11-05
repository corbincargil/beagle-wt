import db from "@/db";
import { claims } from "@/db/schema";
import { dollarsToCents } from "@/lib/currency";
import type { ClaimRecord } from "../../../../../packages/shared/types/claims";

function parseDate(dateStr: string | undefined): Date | null {
	if (!dateStr) return null;
	// Parse MM/DD/YY format
	const [month, day, year] = dateStr.split("/");
	if (!month || !day || !year) return null;
	// Convert 2-digit year to 4-digit (assuming 2000s)
	const fullYear =
		parseInt(year, 10) < 50
			? 2000 + parseInt(year, 10)
			: 1900 + parseInt(year, 10);
	return new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
}

function transformClaimRecord(record: ClaimRecord) {
	return {
		trackingNumber: record.trackingNumber,
		claimDate: parseDate(record.claimDate),
		propertyAddress: record.propertyAddress ?? null,
		leaseStartDate: parseDate(record.leaseStartDate),
		leaseEndDate: parseDate(record.leaseEndDate),
		moveOutDate: parseDate(record.moveOutDate),
		monthlyRent: record.monthlyRent
			? String(dollarsToCents(record.monthlyRent))
			: null,
		propertyManagementCompany: record.propertyManagementCompany ?? null,
		groupNumber: record.groupNumber ?? null,
		treatyNumber: record.treatyNumber ?? null,
		policy: record.policy ?? null,
		maxBenefit: record.maxBenefit
			? String(dollarsToCents(record.maxBenefit))
			: null,
		status: record.status ?? null,
		documents: record.documents,
		claudeFiles: record.claudeFiles ?? null,
	};
}

export async function GET() {
	const results = await db.select().from(claims);

	return Response.json(results);
}

export async function POST(_request: Request) {
	const body = await _request.json();
	const transformed = transformClaimRecord(body);
	const claim = await db.insert(claims).values(transformed).returning();

	return Response.json(claim);
}

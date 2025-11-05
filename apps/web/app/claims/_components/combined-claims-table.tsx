"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { claimsApi } from "@/lib/api/client";
import { centsToDollars } from "@/lib/currency";
import { currencyFormatter, dateFormatter } from "@/lib/formatters";

interface CombinedClaim {
	id: string;
	trackingNumber: string;
	propertyAddress: string | null;
	claimDate: string | null;
	monthlyRent: string | null;
	maxBenefit: string | null;
	claimStatus: "posted" | "declined" | null;
	claimResultId: string | null;
	tenantName: string | null;
	finalPayout: string | null;
	approvedChargesTotal: string | null;
	resultStatus: "approved" | "declined" | null;
	decisionSummary: string | null;
}

async function getCombinedClaims(): Promise<CombinedClaim[]> {
	return claimsApi.getCombinedClaims<CombinedClaim>();
}

export default function CombinedClaimsTable() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["combined-claims"],
		queryFn: getCombinedClaims,
	});

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;
	if (!data) return <div>No data</div>;

	return (
		<div className="flex flex-col w-full">
			<h1 className="text-4xl font-bold mb-6">Combined Claims</h1>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Tracking Number</TableHead>
						<TableHead>Tenant Name</TableHead>
						<TableHead>Result Status</TableHead>
						<TableHead>Final Payout</TableHead>
						<TableHead>Max Benefit</TableHead>
						<TableHead>Property Address</TableHead>
						<TableHead>Claim Status</TableHead>
						<TableHead>Claim Date</TableHead>
						<TableHead>Monthly Rent</TableHead>
						<TableHead>Approved Charges Total</TableHead>
						<TableHead>Decision Summary</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((claim: CombinedClaim) => (
						<TableRow key={claim.id}>
							<TableCell>{claim.trackingNumber}</TableCell>
							<TableCell
								className="max-w-[200px] truncate"
								title={claim.tenantName || undefined}
							>
								{claim.tenantName || "—"}
							</TableCell>
							<TableCell>
								{claim.resultStatus ? (
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
											claim.resultStatus === "approved"
												? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												: claim.resultStatus === "declined"
													? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
													: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
										}`}
									>
										{claim.resultStatus}
									</span>
								) : (
									"—"
								)}
							</TableCell>
							<TableCell>
								{claim.finalPayout
									? currencyFormatter.format(
											centsToDollars(Number(claim.finalPayout)),
										)
									: "—"}
							</TableCell>
							<TableCell>
								{claim.maxBenefit
									? currencyFormatter.format(
											centsToDollars(Number(claim.maxBenefit)),
										)
									: "—"}
							</TableCell>
							<TableCell
								className="max-w-[200px] truncate"
								title={claim.propertyAddress || undefined}
							>
								{claim.propertyAddress || "—"}
							</TableCell>
							<TableCell>
								{claim.claimStatus ? (
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
											claim.claimStatus === "posted"
												? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												: claim.claimStatus === "declined"
													? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
													: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
										}`}
									>
										{claim.claimStatus}
									</span>
								) : (
									"—"
								)}
							</TableCell>
							<TableCell>
								{claim.claimDate
									? dateFormatter.format(new Date(claim.claimDate))
									: "—"}
							</TableCell>
							<TableCell>
								{claim.monthlyRent
									? currencyFormatter.format(
											centsToDollars(Number(claim.monthlyRent)),
										)
									: "—"}
							</TableCell>
							<TableCell>
								{claim.approvedChargesTotal
									? currencyFormatter.format(
											centsToDollars(Number(claim.approvedChargesTotal)),
										)
									: "—"}
							</TableCell>
							<TableCell
								className="max-w-[600px] truncate"
								title={claim.decisionSummary || undefined}
							>
								{claim.decisionSummary || "—"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

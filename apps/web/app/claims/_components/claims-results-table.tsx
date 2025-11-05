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
import { currencyFormatter } from "@/lib/formatters";
import type { ClaimResult } from "../../../../../packages/shared/types/claims";

async function getClaimResults(): Promise<ClaimResult[]> {
	return claimsApi.getClaimResults<ClaimResult>();
}

export default function ClaimsResultsTable() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["claim-results"],
		queryFn: getClaimResults,
	});

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;
	if (!data) return <div>No data</div>;

	return (
		<div className="flex flex-col w-full">
			<h1 className="text-4xl font-bold mb-6">Claim Results</h1>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Tracking Number</TableHead>
						<TableHead>Tenant Name</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Monthly Rent</TableHead>
						<TableHead>Max Benefit</TableHead>
						<TableHead>Approved Charges Total</TableHead>
						<TableHead>Final Payout</TableHead>
						<TableHead>First Month Paid</TableHead>
						<TableHead>SDI Premium Paid</TableHead>
						<TableHead>Missing Documents</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((claim) => (
						<TableRow key={claim.id}>
							<TableCell>{claim.trackingNumber}</TableCell>
							<TableCell
								className="max-w-[200px] truncate"
								title={claim.tenantName || undefined}
							>
								{claim.tenantName}
							</TableCell>
							<TableCell>
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
										claim.status === "approved"
											? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
											: claim.status === "declined"
												? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
												: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
									}`}
								>
									{claim.status || "—"}
								</span>
							</TableCell>
							<TableCell>
								{claim.monthlyRent
									? currencyFormatter.format(
											centsToDollars(Number(claim.monthlyRent)),
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
							<TableCell>
								{claim.approvedChargesTotal
									? currencyFormatter.format(
											centsToDollars(Number(claim.approvedChargesTotal)),
										)
									: "—"}
							</TableCell>
							<TableCell>
								{claim.finalPayout
									? currencyFormatter.format(
											centsToDollars(Number(claim.finalPayout)),
										)
									: "—"}
							</TableCell>
							<TableCell>
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
										claim.isFirstMonthPaid
											? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
											: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
									}`}
								>
									{claim.isFirstMonthPaid ? "Yes" : "No"}
								</span>
							</TableCell>
							<TableCell>
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
										claim.isFirstMonthSDIPremiumPaid
											? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
											: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
									}`}
								>
									{claim.isFirstMonthSDIPremiumPaid ? "Yes" : "No"}
								</span>
							</TableCell>
							<TableCell>
								{claim.missingRequiredDocuments.length > 0
									? claim.missingRequiredDocuments.join(", ")
									: "None"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

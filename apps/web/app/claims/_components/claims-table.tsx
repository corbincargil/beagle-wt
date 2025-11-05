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
import type { ClaimRecord } from "../../../../../packages/shared/types/claims";
import ErrorMessage from "./error-message";
import Loading from "./loading";

async function getClaims(): Promise<ClaimRecord[]> {
	return claimsApi.getClaims<ClaimRecord>();
}

export default function ClaimsTable() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["claims"],
		queryFn: getClaims,
	});

	if (isLoading) return <Loading rows={5} columns={7} title="Claims" />;
	if (error) return <ErrorMessage message={error.message} />;
	if (!data) return <ErrorMessage message="No data available" />;

	return (
		<div className="flex flex-col w-full">
			<h1 className="text-4xl font-bold mb-6">Claims</h1>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Tracking Number</TableHead>
						<TableHead>Property Address</TableHead>
						<TableHead>Claim Date</TableHead>
						<TableHead>Monthly Rent</TableHead>
						<TableHead>Max Benefit</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Property Management Company</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((claim: ClaimRecord) => (
						<TableRow key={claim.id}>
							<TableCell>{claim.trackingNumber}</TableCell>
							<TableCell
								className="max-w-[200px] truncate"
								title={claim.propertyAddress || undefined}
							>
								{claim.propertyAddress || "—"}
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
								{claim.maxBenefit
									? currencyFormatter.format(
											centsToDollars(Number(claim.maxBenefit)),
										)
									: "—"}
							</TableCell>
							<TableCell>
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
										claim.status === "posted"
											? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
											: claim.status === "declined"
												? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
												: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
									}`}
								>
									{claim.status || "—"}
								</span>
							</TableCell>
							<TableCell>{claim.propertyManagementCompany || "—"}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

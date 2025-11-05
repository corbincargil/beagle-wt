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
import { centsToDollars } from "@/lib/currency";
import { currencyFormatter, dateFormatter } from "@/lib/formatters";

type Claim = {
	id: string;
	trackingNumber: string;
	claimDate: string | null;
	propertyAddress: string | null;
	monthlyRent: string | null;
	maxBenefit: string | null;
	status: "posted" | "declined" | null;
	propertyManagementCompany: string | null;
};

async function getClaims(): Promise<Claim[]> {
	const response = await fetch("http://localhost:3000/api/claims");
	const data = await response.json();
	return data;
}

export default function ClaimsPage() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["claims"],
		queryFn: getClaims,
	});

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

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
					{data?.map((claim: Claim) => (
						<TableRow key={claim.id}>
							<TableCell>{claim.trackingNumber}</TableCell>
							<TableCell>{claim.propertyAddress || "—"}</TableCell>
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

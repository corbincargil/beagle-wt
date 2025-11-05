"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClaimsResultsTable from "./_components/claims-results-table";
import ClaimsTable from "./_components/claims-table";

const postClaimResult = async () => {
	const response = await fetch("/api/claims-results", {
		method: "POST",
	});
	return response.json();
};

//todo: add "combined" tab for joined claims and results
export default function ClaimsPage() {
	return (
		<Tabs defaultValue="claims" className="">
			<TabsList>
				<TabsTrigger value="claims">Claims</TabsTrigger>
				<TabsTrigger value="claim-results">Results</TabsTrigger>
			</TabsList>
			<TabsContent value="claims">
				<ClaimsTable />
			</TabsContent>
			<TabsContent value="claim-results">
				<button type="button" onClick={() => postClaimResult()}>
					Add Claim Result
				</button>
				<ClaimsResultsTable />
			</TabsContent>
		</Tabs>
	);
}

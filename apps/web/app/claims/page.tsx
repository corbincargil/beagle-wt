import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClaimsResultsTable from "./_components/claims-results-table";
import ClaimsTable from "./_components/claims-table";
import CombinedClaimsTable from "./_components/combined-claims-table";

export default function ClaimsPage() {
	return (
		<Tabs defaultValue="combined">
			<TabsList>
				<TabsTrigger value="combined">Combined</TabsTrigger>
				<TabsTrigger value="claims">Claims</TabsTrigger>
				<TabsTrigger value="claim-results">Results</TabsTrigger>
			</TabsList>
			<TabsContent value="combined">
				<CombinedClaimsTable />
			</TabsContent>
			<TabsContent value="claims">
				<ClaimsTable />
			</TabsContent>
			<TabsContent value="claim-results">
				<ClaimsResultsTable />
			</TabsContent>
		</Tabs>
	);
}

"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalErrorBoundary } from "@/components/error/global-error-boundary";

export default function App({ children }: { children: React.ReactNode }) {
	const queryClient = new QueryClient();
	return (
		<GlobalErrorBoundary>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</GlobalErrorBoundary>
	);
}

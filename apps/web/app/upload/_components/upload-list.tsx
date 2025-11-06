"use client";

import { useQuery } from "@tanstack/react-query";
import { type PipelineJob, pipelineJobsApi } from "@/lib/api/client";
import { dateFormatter } from "@/lib/formatters";
import ErrorMessage from "../../claims/_components/error-message";
import Loading from "../../claims/_components/loading";

async function getPipelineJobs(): Promise<PipelineJob[]> {
	return pipelineJobsApi.getPipelineJobs();
}

export default function UploadList() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["pipeline-jobs"],
		queryFn: getPipelineJobs,
	});

	if (isLoading) return <Loading rows={5} columns={5} title="Upload History" />;
	if (error) return <ErrorMessage message={error.message} />;
	if (!data) return <ErrorMessage message="No data available" />;

	if (data.length === 0) {
		return (
			<div className="flex flex-col w-full">
				<h2 className="text-2xl font-bold mb-4">Upload History</h2>
				<p className="text-muted-foreground">No uploads yet.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full">
			<h2 className="text-2xl font-bold mb-4">Upload History</h2>
			<div className="space-y-2">
				{data.map((job) => (
					<div
						key={job.id}
						className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
					>
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-4 flex-1 min-w-0">
								{/* Status Badge */}
								<span
									className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
										job.status === "completed"
											? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
											: job.status === "failed"
												? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
												: job.status === "processing"
													? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
													: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
									}`}
								>
									{job.status}
								</span>

								{/* Job Info */}
								<div className="flex flex-col gap-1 min-w-0 flex-1">
									<div className="flex items-center gap-2 text-sm">
										<span className="font-mono text-xs text-muted-foreground truncate">
											{job.id}
										</span>
									</div>
									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										{job.batchSize && <span>Batch: {job.batchSize}</span>}
										{job.claimsProcessed && (
											<span>Processed: {job.claimsProcessed} claims</span>
										)}
										<span>{dateFormatter.format(new Date(job.createdAt))}</span>
									</div>
								</div>
							</div>

							{/* Error Message */}
							{job.errorMessage && (
								<div className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
									{job.errorMessage}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

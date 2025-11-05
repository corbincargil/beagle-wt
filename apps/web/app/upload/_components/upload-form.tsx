"use client";

import { useState } from "react";
import { pipelineApi, type UploadPipelineJobResponse } from "@/lib/api/client";

export default function UploadForm() {
	const [file, setFile] = useState<File | null>(null);
	const [batchSize, setBatchSize] = useState<string>("50");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<UploadPipelineJobResponse | null>(
		null,
	);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			if (!selectedFile.name.endsWith(".csv")) {
				setError("Please select a CSV file");
				setFile(null);
				return;
			}
			setFile(selectedFile);
			setError(null);
			setSuccess(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!file) {
			setError("Please select a CSV file");
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			// Read file as text
			const csvContent = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (event) => {
					if (event.target?.result && typeof event.target.result === "string") {
						resolve(event.target.result);
					} else {
						reject(new Error("Failed to read file"));
					}
				};
				reader.onerror = () => reject(new Error("Error reading file"));
				reader.readAsText(file);
			});

			// Parse batch size (optional)
			const parsedBatchSize =
				batchSize && batchSize.trim() !== ""
					? parseInt(batchSize, 10)
					: undefined;

			if (
				parsedBatchSize !== undefined &&
				(Number.isNaN(parsedBatchSize) || parsedBatchSize < 1)
			) {
				setError("Batch size must be a positive number");
				setIsLoading(false);
				return;
			}

			// Upload to pipeline API
			const response = await pipelineApi.uploadPipelineJob(
				csvContent,
				parsedBatchSize,
			);

			setSuccess(response);
			setFile(null);
			// Reset file input
			const fileInput = document.getElementById("csv-file") as HTMLInputElement;
			if (fileInput) {
				fileInput.value = "";
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "An error occurred while uploading",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col w-full max-w-2xl mx-auto">
			<h1 className="text-4xl font-bold mb-6">Upload CSV File</h1>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* File Input */}
				<div className="space-y-2">
					<label
						htmlFor="csv-file"
						className="text-sm font-medium text-foreground"
					>
						CSV File
					</label>
					<input
						id="csv-file"
						type="file"
						accept=".csv"
						onChange={handleFileChange}
						disabled={isLoading}
						className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
					/>
					{file && (
						<p className="text-sm text-muted-foreground">
							Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
						</p>
					)}
				</div>

				{/* Batch Size Input */}
				<div className="space-y-2">
					<label
						htmlFor="batch-size"
						className="text-sm font-medium text-foreground"
					>
						Batch Size (optional)
					</label>
					<input
						id="batch-size"
						type="number"
						min="1"
						value={batchSize}
						onChange={(e) => setBatchSize(e.target.value)}
						disabled={isLoading}
						placeholder="50"
						className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
					/>
					<p className="text-xs text-muted-foreground">
						Number of claims to process per batch (default: 50)
					</p>
				</div>

				{/* Error Message */}
				{error && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
						<p className="text-sm text-red-800 dark:text-red-200">{error}</p>
					</div>
				)}

				{/* Success Message */}
				{success && (
					<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
						<h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
							Upload Successful!
						</h3>
						<p className="text-sm text-green-700 dark:text-green-300">
							Job ID: <span className="font-mono">{success.jobId}</span>
						</p>
						<p className="text-sm text-green-700 dark:text-green-300 mt-1">
							Status: <span className="font-medium">{success.status}</span>
						</p>
					</div>
				)}

				{/* Submit Button */}
				<button
					type="submit"
					disabled={isLoading || !file}
					className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? "Uploading..." : "Upload CSV"}
				</button>
			</form>
		</div>
	);
}

interface ErrorMessageProps {
	message?: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] p-8">
			<div className="max-w-2xl w-full">
				<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
					<h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
						Error loading data
					</h2>
					{message && (
						<p className="text-sm text-red-700 dark:text-red-300 mb-4">
							{message}
						</p>
					)}
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
					>
						Reload page
					</button>
				</div>
			</div>
		</div>
	);
}

import React, { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex flex-col items-center justify-center min-h-[400px] p-8">
					<div className="max-w-2xl w-full">
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
							<h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
								Something went wrong
							</h2>
							{this.state.error && (
								<div className="mb-4">
									<p className="text-sm text-red-700 dark:text-red-300 mb-2">
										Error message:
									</p>
									<pre className="bg-red-100 dark:bg-red-900/40 p-3 rounded text-xs overflow-auto text-red-800 dark:text-red-200">
										{this.state.error.message}
									</pre>
									{this.state.error.stack && (
										<details className="mt-2">
											<summary className="text-sm text-red-700 dark:text-red-300 cursor-pointer">
												Stack trace
											</summary>
											<pre className="bg-red-100 dark:bg-red-900/40 p-3 rounded text-xs overflow-auto text-red-800 dark:text-red-200 mt-2">
												{this.state.error.stack}
											</pre>
										</details>
									)}
								</div>
							)}
							<div className="flex gap-3">
								<button
									type="button"
									onClick={this.handleReset}
									className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
								>
									Try again
								</button>
								<button
									type="button"
									onClick={() => window.location.reload()}
									className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors font-medium"
								>
									Reload page
								</button>
							</div>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

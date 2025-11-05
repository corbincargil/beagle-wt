import { cn } from "@/lib/utils";

export const Footer = ({ maxWidth }: { maxWidth: string }) => {
	return (
		<footer className="bg-black px-14 py-4 md:py-5 w-full flex items-center justify-center">
			<div
				className={cn(
					"w-full flex flex-col md:flex-row justify-between items-center gap-2",
					maxWidth,
				)}
			>
				<a className="text-center text-white" href="/">
					© 2025 Corbi Insurance Services, Inc
				</a>
				<div className="flex flex-row items-center gap-1 text-white">
					<a
						className="hover:underline underline-offset-4"
						href="mailto:support@corbi.insure"
					>
						support@corbi.insure
					</a>
					<div>•</div>
					<a
						target="_blank"
						rel="noopener noreferrer"
						className="underline underline-offset-4"
						href="https://www.linkedin.com/in/corbin-cargil/"
					>
						LinkedIn
					</a>
				</div>
			</div>
		</footer>
	);
};

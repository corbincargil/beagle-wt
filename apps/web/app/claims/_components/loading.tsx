import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface LoadingProps {
	rows?: number;
	columns?: number;
	title?: string;
}

export default function Loading({
	rows = 5,
	columns = 7,
	title,
}: LoadingProps) {
	return (
		<div className="flex flex-col w-full">
			{title && <h1 className="text-4xl font-bold mb-6">{title}</h1>}
			<Table>
				<TableHeader>
					<TableRow>
						{Array.from({ length: columns }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton placeholders
							<TableHead key={`header-${i}`}>
								<Skeleton className="h-4 w-24" />
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: rows }).map((_, rowIndex) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton placeholders
						<TableRow key={`row-${rowIndex}`}>
							{Array.from({ length: columns }).map((_, colIndex) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton placeholders
								<TableCell key={`row-${rowIndex}-col-${colIndex}`}>
									<Skeleton className="h-4 w-full" />
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

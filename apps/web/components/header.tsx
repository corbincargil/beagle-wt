"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const Header = ({ maxWidth }: { maxWidth: string }) => {
	const pathname = usePathname();

	const linkClass = (path: string) =>
		cn(
			"transition-colors hover:text-primary",
			pathname === path
				? "text-primary font-semibold underline underline-offset-4"
				: "text-foreground",
		);

	return (
		<header className="w-full flex items-center justify-center bg-background border-b border-border sticky top-0 z-10">
			<div
				className={cn(
					"flex items-center justify-between px-4 py-4 w-full",
					maxWidth,
				)}
			>
				<Image
					src="/corbi-logo.png"
					alt="Corbi Logo"
					loading="eager"
					width={80}
					height={80}
				/>
				<div className="flex items-center gap-4">
					<Link href="/" className={linkClass("/")}>
						Home
					</Link>
					<Link href="/claims" className={linkClass("/claims")}>
						Claims
					</Link>
					<Link href="/upload" className={linkClass("/upload")}>
						Upload
					</Link>
				</div>
			</div>
		</header>
	);
};

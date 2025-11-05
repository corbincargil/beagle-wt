import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Beagle Claim Processor",
	description: "Beagle Claim Processor",
	icons: {
		icon: "/corbi-favicon.png",
	},
};

const MAX_WIDTH = "max-w-7xl";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased h-dvh`}
			>
				<div className="h-full min-h-screen flex flex-col items-center">
					<Header maxWidth={MAX_WIDTH} />
					<main
						className={cn(
							"p-4 h-full w-full flex-1 overflow-y-auto",
							MAX_WIDTH,
						)}
					>
						{children}
					</main>
					<Footer maxWidth={MAX_WIDTH} />
				</div>
			</body>
		</html>
	);
}

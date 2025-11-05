import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is not set");
}

export default drizzle(process.env.DATABASE_URL);

export * from "./currency";
export * from "./formatters";
// Re-export schema and utilities
export * from "./schema";

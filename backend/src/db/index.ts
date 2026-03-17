import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "@/db/schema";

const sqlite = new Database("petid.db");

/** Drizzle ORM 实例 */
export const db = drizzle(sqlite, { schema });

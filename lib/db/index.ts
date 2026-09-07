import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Conexión "pooled" (via Supabase Supavisor, puerto 6543): la correcta para
// tráfico normal de la app (queries de request/response). Las migraciones
// usan DATABASE_URL_UNPOOLED (ver drizzle.config.ts) — no esta.
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export const db = drizzle(pool, { schema });

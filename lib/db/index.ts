import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Conexión "pooled" (-pooler): la correcta para tráfico normal de la app
// (queries de request/response). Las migraciones usan DATABASE_URL_UNPOOLED
// (ver drizzle.config.ts) — no esta.
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

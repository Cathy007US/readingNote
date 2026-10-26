import "dotenv/config";
import pg from "pg";

export const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/reading_notes",
});

export async function pingDatabase(): Promise<void> {
  await pool.query("SELECT 1");
}

export const PORT = Number(process.env.PORT) || 3001;
export const CORS_ORIGIN =
  process.env.CORS_ORIGIN ?? "http://localhost:5173";
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";

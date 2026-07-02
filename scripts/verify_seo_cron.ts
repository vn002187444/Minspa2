import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let pgConnectionString = process.env.POSTGRES_URL_NON_POOLING || `postgresql://postgres:${encodeURIComponent(supabaseKey)}@db.${supabaseUrl.replace("https://", "").replace(".supabase.co", "")}.supabase.co:5432/postgres`;
pgConnectionString = pgConnectionString.replace("?sslmode=require", "").replace("&sslmode=require", "");

async function verify() {
  const pool = new pg.Pool({ connectionString: pgConnectionString, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    console.log("Checking extensions...");
    const extensions = await client.query("SELECT extname FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net')");
    console.log("Extensions found:", extensions.rows.map(r => r.extname));

    console.log("\nChecking cron jobs...");
    const jobs = await client.query("SELECT jobname FROM cron.job WHERE jobname = 'auto-seo-publish'");
    console.log("Cron jobs found:", jobs.rows.map(r => r.jobname));
  } catch (e) {
    console.error("Verification failed:", e);
  } finally {
    client.release();
    await pool.end();
  }
}
verify();
// scripts/apply-migrations.ts
// Applies all pending SQL migrations in migrations/ to Supabase sequentially.
// Uses pg (node-postgres) for direct SQL execution via service role.
// Usage: npx tsx scripts/apply-migrations.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function main() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const archiveDir = path.join(process.cwd(), 'scripts', 'archive', 'migrations');

  // Build pg connection string from Supabase URL
  const projectRef = supabaseUrl!.replace('https://', '').replace('.supabase.co', '');
  const pgConnectionString = `postgresql://postgres:${encodeURIComponent(supabaseKey!)}@db.${projectRef}.supabase.co:5432/postgres`;

  console.log('=== MIGRATION RUNNER ===\n');

  // Try to connect
  let pg: any;
  try {
    const { default: pgModule } = await import('pg');
    const { Pool } = pgModule;
    const pool = new Pool({ connectionString: pgConnectionString, ssl: { rejectUnauthorized: false } });
    pg = await pool.connect();
    const { rows } = await pg.query('SELECT version()');
    console.log(`Connected: ${rows[0].version.split(',')[0]}\n`);
  } catch (err: any) {
    console.error(`Cannot connect to database: ${err.message}`);
    console.error('\nApply manually via Supabase SQL Editor:');
    console.error('  https://supabase.com/dashboard/project/' + supabaseUrl.replace('https://', '').replace('.supabase.co', '') + '/sql/new');
    process.exit(1);
  }

  try {
    // Get list of already applied migrations from archive
    const applied = new Set(
      fs.readdirSync(archiveDir)
        .filter(f => f.endsWith('.sql'))
        .map(f => f)
    );

    // Get pending migrations
    const pending = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .filter(f => !applied.has(f))
      .sort();

    if (pending.length === 0) {
      console.log('No pending migrations. All migrations have been applied.\n');
      console.log(`Applied: ${applied.size} files in scripts/archive/migrations/`);
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);

    for (const file of pending) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`→ ${file} ...`);

      try {
        await pg.query(sql);
        console.log(`  ✓ Done\n`);

        // Copy to archive after success
        fs.copyFileSync(filePath, path.join(archiveDir, file));
        fs.unlinkSync(filePath);
        console.log(`  → Moved to scripts/archive/migrations/\n`);
      } catch (err: any) {
        console.error(`  ✗ FAILED: ${err.message}\n`);
        process.exit(1);
      }
    }

    console.log('=== ALL MIGRATIONS APPLIED SUCCESSFULLY ===\n');
    console.log(`Total: ${pending.length} migration(s)`);
  } finally {
    pg.release();
  }
}

main().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});

/**
 * Robust migration runner — splits SQL into individual statements,
 * tolerates "already exists" errors, and archives on full success.
 *
 * Usage: node scripts/run-migrations.mjs
 */
import { readFileSync, copyFileSync, unlinkSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

dotenv.config({ path: join(process.cwd(), '.env.local'), override: true });

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');
const ARCHIVE_DIR = join(process.cwd(), 'scripts', 'archive', 'migrations');

const ALREADY_EXISTS_PATTERNS = [
  'relation "',         // "relation "foo" already exists"
  'already exists',
  'is already a member',
  'is already member',
  'policy "',           // "policy "foo" for table "bar" already exists"
];

function isIdempotentError(msg) {
  return ALREADY_EXISTS_PATTERNS.some(p => msg.includes(p));
}

function splitStatements(sql) {
  const statements = [];
  const parts = sql.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && !trimmed.startsWith('--')) {
      statements.push(trimmed + ';');
    }
  }
  return statements;
}

if (!existsSync(ARCHIVE_DIR)) mkdirSync(ARCHIVE_DIR, { recursive: true });

const pending = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
console.log(`Found ${pending.length} pending migration(s):\n`);

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  connectionTimeoutMillis: 30000,
});
await client.connect();

let allSucceeded = true;

for (const file of pending) {
  const fp = join(MIGRATIONS_DIR, file);
  const sql = readFileSync(fp, 'utf8');
  const statements = splitStatements(sql);
  let failed = 0;

  process.stdout.write(`→ ${file} (${statements.length} stmts) … `);

  for (const stmt of statements) {
    if (stmt.length < 10) continue;
    try {
      await client.query(stmt);
    } catch (err) {
      if (isIdempotentError(err.message)) {
        failed++;
      } else {
        console.log(); // newline from the inline write above
        console.error(`  ✗ ${file}: ${err.message}`);
        console.error(`    Statement: ${stmt.substring(0, 100)}...`);
        failed = -1; // mark as non-recoverable
        break;
      }
    }
  }

  if (failed === 0) {
    console.log('✓');
    copyFileSync(fp, join(ARCHIVE_DIR, file));
    unlinkSync(fp);
  } else if (failed > 0) {
    console.log(`✓ (${failed} skippable warnings)`);
    copyFileSync(fp, join(ARCHIVE_DIR, file));
    unlinkSync(fp);
  } else {
    console.log('✗ FAILED');
    allSucceeded = false;
  }
}

await client.end();
console.log(allSucceeded ? '\nAll migrations applied successfully.' : '\nSome migrations failed. See above.');

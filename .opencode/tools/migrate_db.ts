import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

export const description = 'Runs database migration scripts safely. In verify mode, shows what would be run without applying.';
export const args = {
  verify: {
    type: 'boolean',
    description: 'Dry-run mode: show pending migrations without applying them.',
    default: false,
  },
  file: {
    type: 'string',
    description: 'Specific migration file to run (e.g., "migrate_v3.14.sql"). If omitted, runs all pending.',
  },
};

export async function execute({ verify = false, file }: { verify?: boolean; file?: string }) {
  const start = Date.now();

  const migrationsDir = join(process.cwd(), 'scripts/archive/migrations');
  let migrationFiles: string[] = [];

  try {
    const fs = await import('fs');
    migrationFiles = fs.readdirSync(migrationsDir)
      .filter((f: string) => f.endsWith('.sql'))
      .sort();
  } catch {
    return { success: false, error: 'Migrations directory not found at scripts/archive/migrations/' };
  }

  if (file) {
    migrationFiles = migrationFiles.filter(f => f === file);
    if (migrationFiles.length === 0) {
      return { success: false, error: `Migration file "${file}" not found in ${migrationsDir}` };
    }
  }

  if (verify) {
    return {
      success: true,
      dryRun: true,
      pendingMigrations: migrationFiles,
      count: migrationFiles.length,
      message: migrationFiles.length === 0
        ? 'No pending migrations.'
        : `Found ${migrationFiles.length} migration(s) to apply.`,
    };
  }

  if (migrationFiles.length === 0) {
    return { success: true, message: 'No migrations to apply.', duration: Date.now() - start };
  }

  try {
    const command = `npx tsx scripts/run-migrations.mjs`;
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return {
      success: true,
      output,
      duration: Date.now() - start,
      appliedCount: migrationFiles.length,
    };
  } catch (error: unknown) {
    const err = error as { stdout?: Buffer | string; stderr?: Buffer | string; message?: string };
    return {
      success: false,
      output: err.stdout?.toString() || err.stderr?.toString() || err.message || 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

import { execSync } from 'child_process';

export const description = 'Dumps current Supabase schema and syncs to database.sql. Requires POSTGRES_URL_NON_POOLING env var.';
export const args = {
  dryRun: {
    type: 'boolean',
    description: 'Show schema diff without overwriting database.sql.',
    default: false,
  },
};

export async function execute({ dryRun = false }: { dryRun?: boolean }) {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    return { success: false, error: 'POSTGRES_URL_NON_POOLING or POSTGRES_URL env var is required.' };
  }

  try {
    const dumpCommand = `npx pg_dump --schema-only --no-owner --no-acl "${connectionString}" 2>&1`;
    const schemaDump = execSync(dumpCommand, { encoding: 'utf8', timeout: 30000 });

    const dbSqlPath = process.cwd() + '/database.sql';
    const fs = await import('fs');

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        message: 'Schema dump generated. No changes written (dry-run mode).',
        schemaLength: schemaDump.length,
        schemaPreview: schemaDump.slice(0, 2000),
      };
    }

    fs.writeFileSync(dbSqlPath, schemaDump, 'utf8');
    return {
      success: true,
      message: 'Schema dumped to database.sql successfully.',
      bytesWritten: schemaDump.length,
    };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      error: err.stderr || err.stdout || err.message || 'Failed to sync schema',
    };
  }
}

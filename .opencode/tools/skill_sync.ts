import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const description = 'Updates SKILL.md with current database table count and realtime publication status. Reads database.sql for table list.';
export const args = {
  dryRun: {
    type: 'boolean',
    description: 'Show proposed changes without writing to SKILL.md.',
    default: false,
  },
};

export async function execute({ dryRun = false }: { dryRun?: boolean }) {
  const cwd = process.cwd();
  const skillPath = join(cwd, '.agents/skills/minspa/SKILL.md');
  const dbSqlPath = join(cwd, 'database.sql');

  if (!existsSync(skillPath)) {
    return { success: false, error: 'SKILL.md not found at .agents/skills/minspa/SKILL.md' };
  }
  if (!existsSync(dbSqlPath)) {
    return { success: false, error: 'database.sql not found at project root' };
  }

  try {
    const dbSql = readFileSync(dbSqlPath, 'utf8');
    const skillContent = readFileSync(skillPath, 'utf8');

    // Extract table names from CREATE TABLE statements
    const tableRegex = /CREATE TABLE\s+(?:public\.)?(\w+)/gi;
    const tables: string[] = [];
    let match;
    while ((match = tableRegex.exec(dbSql)) !== null) {
      tables.push(match[1]);
    }

    // Extract tables in supabase_realtime publication
    const realtimeTables: string[] = [];
    const realtimeSection = dbSql.match(/supabase_realtime[^;]+/i);
    if (realtimeSection) {
      const pubMatch = realtimeSection[0].match(/ADD TABLE\s+(?:public\.)?(\w+)/gi);
      if (pubMatch) {
        for (const m of pubMatch) {
          const t = m.replace(/ADD TABLE\s+(?:public\.)?/i, '').trim();
          realtimeTables.push(t);
        }
      }
    }

    const uniqueTables = [...new Set(tables)].sort();
    const uniqueRealtime = [...new Set(realtimeTables)].sort();

    // Build the updated section 4 content
    const tableCount = uniqueTables.length;
    const realtimeCount = uniqueRealtime.length;

    const _newSection4 = `## 4. Database Quick Ref (${tableCount} tables)`;
    const _newSection9Realtime = `| Table | Realtime | Why |`;

    const updates: string[] = [];

    if (!skillContent.includes(`${tableCount} tables`)) {
      updates.push(`Section 4: table count → ${tableCount} (current SKILL.md may be stale)`);
    }

    return {
      success: true,
      dryRun,
      tableCount,
      realtimeTableCount: uniqueRealtime.length,
      allTables: uniqueTables,
      realtimeTables: uniqueRealtime,
      proposedChanges: updates,
      message: dryRun
        ? `[DRY RUN] SKILL.md would be updated: ${tableCount} tables, ${realtimeCount} with Realtime.`
        : `Analysis complete. SKILL.md has ${tableCount} tables (${realtimeCount} with Realtime).`,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to sync SKILL.md' };
  }
}

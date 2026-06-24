import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const description = 'Compares .env.local vs .env.example to find missing, extra, or outdated variables.';
export const args = {
  sync: {
    type: 'boolean',
    description: 'If true, add missing keys from .env.example into .env.local with empty values.',
    default: false,
  },
};

function parseEnv(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!existsSync(filePath)) return vars;

  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    vars[key] = value;
  }
  return vars;
}

export async function execute({ sync = false }: { sync?: boolean }) {
  try {
    const cwd = process.cwd();
    const exampleVars = parseEnv(join(cwd, '.env.example'));
    const localVars = parseEnv(join(cwd, '.env.local'));

    const missing: string[] = [];
    const extra: string[] = [];
    const outdated: Array<{ key: string; example: string; local: string }> = [];

    for (const [key, val] of Object.entries(exampleVars)) {
      if (!(key in localVars)) {
        missing.push(key);
      } else if (val && localVars[key] === '') {
        outdated.push({ key, example: val, local: localVars[key] });
      }
    }

    for (const key of Object.keys(localVars)) {
      if (!(key in exampleVars) && !key.startsWith('NEXT_PUBLIC_')) {
        extra.push(key);
      }
    }

    if (sync && missing.length > 0) {
      const fs = await import('fs');
      let localContent = readFileSync(join(cwd, '.env.local'), 'utf8');
      for (const key of missing) {
        if (!localContent.includes(`${key}=`)) {
          localContent += `\n${key}=`;
        }
      }
      fs.writeFileSync(join(cwd, '.env.local'), localContent, 'utf8');
    }

    return {
      success: missing.length === 0 || sync,
      missingCount: missing.length,
      extraCount: extra.length,
      outdatedCount: outdated.length,
      missing,
      extra,
      outdated,
      synced: sync ? `Added ${missing.length} missing variable(s) to .env.local` : undefined,
      message: missing.length === 0 && extra.length === 0 && outdated.length === 0
        ? '.env.local is fully in sync with .env.example.'
        : `Found ${missing.length} missing, ${extra.length} extra, ${outdated.length} outdated.`,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to diff env files' };
  }
}

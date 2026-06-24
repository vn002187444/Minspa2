import { readFileSync } from 'fs';
import { join } from 'path';

export const description = 'Compares current environment variables with .env.example and reports missing ones.';
export const args = {
  strict: {
    type: 'boolean',
    description: 'If true, any missing variable will cause the tool to return success: false.',
    default: false,
  },
};

export async function execute({ strict = false }: { strict?: boolean }) {
  try {
    const envExamplePath = join(process.cwd(), '.env.example');
    const content = readFileSync(envExamplePath, 'utf8');

    const requiredVars = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=')[0].trim());

    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length === 0) {
      return { success: true, message: 'All required environment variables are set.' };
    }

    return {
      success: !strict,
      missingVars,
      message: `Found ${missingVars.length} missing environment variables.`,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to check environment variables' };
  }
}

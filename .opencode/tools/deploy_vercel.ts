import { execSync } from 'child_process';

export const description = 'Deploys the application to Vercel production. Auto-runs CI check first (build-guard).';
export const args = {
  token: {
    type: 'string',
    description: 'Vercel API token. If not provided, will use VERCEL_TOKEN from environment.',
  },
  skipCiCheck: {
    type: 'boolean',
    description: 'Skip the pre-deploy CI check (not recommended).',
    default: false,
  },
};

async function ciCheck(): ReturnType<typeof import('./ci_check.ts')['execute']> {
  const { execute } = await import('./ci_check.ts');
  return execute({ step: 'build' });
}

export async function execute({ token, skipCiCheck = false }: { token?: string; skipCiCheck?: boolean }) {
  const vercelToken = token || process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return { success: false, error: 'Vercel API token is required. Provide it as an argument or set VERCEL_TOKEN env var.' };
  }

  if (!skipCiCheck) {
    const ciResult = await ciCheck();
    if (!ciResult.success) {
      return {
        success: false,
        error: 'Build-guard: CI check failed. Fix build before deploying.',
        ciResults: ciResult.results,
      };
    }
  }

  const start = Date.now();
  try {
    const output = execSync(`npx vercel --prod --yes --token ${vercelToken}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return {
      success: true,
      output,
      duration: Date.now() - start,
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

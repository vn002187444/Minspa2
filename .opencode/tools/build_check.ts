import { execSync } from 'child_process';

export const description = 'Runs npm run build and reports output and duration.';
export const args = {};

export async function execute() {
  const start = Date.now();
  try {
    const output = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
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

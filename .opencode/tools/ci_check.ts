import { execSync } from 'child_process';

export const description = 'Runs the full CI pipeline: lint, typecheck, and build. Returns results for each step.';
export const args = {
  step: {
    type: 'string',
    description: 'Specific step to run: "lint", "typecheck", "build", or "all" (default)',
    default: 'all',
  },
};

interface StepResult { success: boolean; output: string; duration: number }

export async function execute({ step = 'all' }: { step?: string }) {
  const results: Record<string, StepResult> = {};

  const runStep = (name: string, command: string) => {
    const start = Date.now();
    try {
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      results[name] = { success: true, output, duration: Date.now() - start };
    } catch (error: unknown) {
      const err = error as { stdout?: Buffer | string; stderr?: Buffer | string; message?: string };
      results[name] = {
        success: false,
        output: (err.stdout?.toString() || err.stderr?.toString() || err.message || 'Unknown error'),
        duration: Date.now() - start,
      };
    }
  };

  if (step === 'all' || step === 'lint') {
    runStep('lint', 'npm run lint');
  }
  if (step === 'all' || step === 'typecheck') {
    runStep('typecheck', 'npx tsc --noEmit');
  }
  if (step === 'all' || step === 'build') {
    runStep('build', 'npm run build');
  }

  const overallSuccess = Object.values(results).every(r => r.success);

  return {
    success: overallSuccess,
    results,
    summary: overallSuccess ? 'CI pipeline passed!' : 'CI pipeline failed in one or more steps.',
  };
}

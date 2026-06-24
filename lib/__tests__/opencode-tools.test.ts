import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

const toolsDir = path.resolve(__dirname, '../../.opencode/tools');

function getToolFiles(): string[] {
  if (!fs.existsSync(toolsDir)) return [];
  return fs.readdirSync(toolsDir).filter(f => f.endsWith('.ts'));
}

describe('OpenCode Tools Structure', () => {
  const toolFiles = getToolFiles();

  it('should have at least 5 tool files', () => {
    expect(toolFiles.length).toBeGreaterThanOrEqual(5);
  });

  it('should have exactly 11 tool files', () => {
    expect(toolFiles.length).toBe(11);
    expect(toolFiles).toContain('ci_check.ts');
    expect(toolFiles).toContain('build_check.ts');
    expect(toolFiles).toContain('deploy_vercel.ts');
    expect(toolFiles).toContain('migrate_db.ts');
    expect(toolFiles).toContain('check_env.ts');
    expect(toolFiles).toContain('schema_sync.ts');
    expect(toolFiles).toContain('env_diff.ts');
    expect(toolFiles).toContain('db_health_check.ts');
    expect(toolFiles).toContain('vercel_status.ts');
    expect(toolFiles).toContain('seo_analyzer.ts');
    expect(toolFiles).toContain('skill_sync.ts');
  });

  for (const file of toolFiles) {
    it(`${file} should export description, args, and execute`, async () => {
      const content = fs.readFileSync(path.resolve(toolsDir, file), 'utf8');
      expect(content).toContain('export const description');
      expect(content).toContain('export const args');
      expect(content).toContain('export async function execute');
    });

    it(file + ' should avoid any type in catch blocks', () => {
      const content = fs.readFileSync(path.resolve(toolsDir, file), 'utf8');
      expect(content).not.toContain('catch (error: any)');
      expect(content).not.toContain('catch(e: any)');
    });
  }
});

describe('Specific tool validations', () => {
  it('check_env.ts should use proper split regex', () => {
    const content = fs.readFileSync(path.resolve(toolsDir, 'check_env.ts'), 'utf8');
    expect(content).toContain("split(/\\r?\\n/)");
    expect(content).not.toContain("split('\\\\n')");
  });

  it('deploy_vercel.ts should have build-guard', () => {
    const content = fs.readFileSync(path.resolve(toolsDir, 'deploy_vercel.ts'), 'utf8');
    expect(content).toContain('skipCiCheck');
  });

  it('migrate_db.ts should support verify dry-run', () => {
    const content = fs.readFileSync(path.resolve(toolsDir, 'migrate_db.ts'), 'utf8');
    expect(content).toContain('dryRun');
    expect(content).toContain('verify');
  });

  it('ci_check.ts should support step selection', () => {
    const content = fs.readFileSync(path.resolve(toolsDir, 'ci_check.ts'), 'utf8');
    expect(content).toContain("step === 'all'");
  });

  it('agent files should be valid markdown with frontmatter', () => {
    const agentsDir = path.resolve(__dirname, '../../.opencode/agents');
    const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    expect(agentFiles).toContain('ci-fix.md');
    expect(agentFiles).toContain('db-admin.md');

    for (const file of agentFiles) {
      const content = fs.readFileSync(path.resolve(agentsDir, file), 'utf8');
      expect(content).toMatch(/^---/); // has frontmatter
      expect(content).toContain('mode: subagent');
      expect(content).toContain('description:');
    }
  });

  it('opencode.json should exist and be valid JSON', () => {
    const configPath = path.resolve(__dirname, '../../.opencode/opencode.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
    const config = JSON.parse(content);
    expect(config.agent['ci-fix']).toBeDefined();
    expect(config.agent['db-admin']).toBeDefined();
  });
});

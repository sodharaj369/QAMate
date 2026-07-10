import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceIntelligenceEngine } from '../src/workspace/WorkspaceIntelligenceEngine.js';
import { ProjectDNAStore } from '../src/workspace/DNA/ProjectDNAStore.js';
import { QAMateEngine } from '../src/platform/qamateEngine.js';
import { JsonFileStorage } from '../src/storage/index.js';

const tempDir = path.resolve('packages/engine/tests/temp/workspace_intel_test');

const setupMockWorkspace = () => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Create README.md
  fs.writeFileSync(path.join(tempDir, 'README.md'), '# QAMate Test Project\nAn example node project.', 'utf-8');

  // 2. Create package.json
  const packageJson = {
    name: 'qamate-test-project',
    dependencies: {
      express: '^4.18.2'
    },
    devDependencies: {
      playwright: '^1.40.0',
      vitest: '^1.0.0'
    }
  };
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

  // 3. Create Dockerfile
  fs.writeFileSync(path.join(tempDir, 'Dockerfile'), 'FROM node:18\nWORKDIR /app', 'utf-8');

  // 4. Create openapi.json
  const openapi = {
    openapi: '3.0.0',
    paths: {
      '/users': {
        get: {
          summary: 'Get all users'
        }
      }
    }
  };
  fs.writeFileSync(path.join(tempDir, 'openapi.json'), JSON.stringify(openapi, null, 2), 'utf-8');

  // 5. Create test files
  const testsDir = path.join(tempDir, 'tests');
  fs.mkdirSync(testsDir, { recursive: true });
  fs.writeFileSync(path.join(testsDir, 'auth.test.ts'), '// Auth tests', 'utf-8');
  fs.writeFileSync(path.join(testsDir, 'checkout.spec.ts'), '// Checkout tests', 'utf-8');
};

const cleanTempDir = () => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

describe('Phase 0: Project Discovery & Workspace Intelligence tests', () => {
  afterAll(() => {
    cleanTempDir();
  });

  it('should crawl mock workspace and construct valid sub-profiles', async () => {
    setupMockWorkspace();

    const engine = new WorkspaceIntelligenceEngine();
    const profile = await engine.analyze(tempDir);

    expect(profile.repo.isGitRepo).toBe(false); // mock dir is not a git repo
    expect(profile.tech.primaryLanguage).toBe('typescript');
    expect(profile.tech.isContainerized).toBe(true);
    expect(profile.tech.dependencies).toContain('playwright');
    expect(profile.tech.dependencies).toContain('express');

    expect(profile.testing.framework).toBe('Playwright');
    expect(profile.testing.testFilesCount).toBe(2);
    expect(profile.testing.testFiles).toContain('tests/auth.test.ts');

    expect(profile.api.hasContracts).toBe(true);
    expect(profile.api.parsedEndpoints).toContainEqual({
      method: 'GET',
      path: '/users',
      description: 'Get all users'
    });

    expect(profile.docs.hasReadme).toBe(true);
    expect(profile.summary).toContain('typescript');
    expect(profile.warnings).toHaveLength(3); // no git repo warning, no pom.xml warning, no ADR warning
  });

  it('should initialize, load, and save ProjectDNA using ProjectDNAStore', async () => {
    setupMockWorkspace();

    const engine = new WorkspaceIntelligenceEngine();
    const profile = await engine.analyze(tempDir);

    const dnaStore = new ProjectDNAStore();
    const defaultDna = dnaStore.generateDefaultDNA(profile);

    expect(defaultDna.techStack.toLowerCase()).toContain('typescript');
    expect(defaultDna.techStack).toContain('Playwright');

    // Save DNA
    await dnaStore.save(tempDir, defaultDna);
    expect(fs.existsSync(path.join(tempDir, '.qamate', 'dna.json'))).toBe(true);

    // Load DNA
    const loadedDna = await dnaStore.load(tempDir);
    expect(loadedDna.techStack).toBe(defaultDna.techStack);
  });

  it('should integrate workspace bootstrap inside QAMateEngine instance flow', async () => {
    setupMockWorkspace();

    const storage = new JsonFileStorage(path.join(tempDir, 'data'));
    const qamateEngine = new QAMateEngine(storage);

    const { profile, pendingDNA } = await qamateEngine.bootstrapWorkspace(tempDir);

    expect(profile.projectId).toBe('workspace-intel-test');
    expect(pendingDNA.techStack).toContain('Playwright');
    // Ensure it did not silently save to .qamate/dna.json yet
    expect(fs.existsSync(path.join(tempDir, '.qamate', 'dna.json'))).toBe(false);
  });
});

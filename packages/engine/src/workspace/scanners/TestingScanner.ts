import * as fs from 'fs';
import * as path from 'path';
import { IScanner, ScanResult } from './IScanner.js';
import { TestingProfile } from '../../domain.js';

export class TestingScanner implements IScanner {
  public readonly name = 'Testing Framework Detector';

  private readonly ignoreDirs = new Set([
    'node_modules', 'dist', 'build', 'coverage', '.git',
    '.next', 'bin', 'obj', 'target', 'out', 'vendor', '.gemini'
  ]);

  public async scan(projectRoot: string): Promise<ScanResult<TestingProfile>> {
    const testFiles: string[] = [];
    const testDirectories = new Set<string>();

    this.crawl(projectRoot, projectRoot, testFiles, testDirectories);

    // Framework detection based on file extensions, patterns, and framework names
    let framework: string | undefined = undefined;
    const testFilesList = testFiles.map(f => path.relative(projectRoot, f).replace(/\\/g, '/'));

    // Simple heuristic detections
    const hasPlaywright = testFilesList.some(f => f.includes('playwright') || f.includes('.spec.ts'));
    const hasVitest = testFilesList.some(f => f.includes('vitest') || f.includes('.test.ts'));
    const hasJest = testFilesList.some(f => f.includes('.test.js') || f.includes('.spec.js'));
    const hasJUnit = testFilesList.some(f => f.endsWith('Test.java'));
    const hasNUnit = testFilesList.some(f => f.endsWith('Tests.cs'));
    const hasPytest = testFilesList.some(f => f.startsWith('test_') && f.endsWith('.py'));

    if (hasPlaywright) framework = 'Playwright';
    else if (hasVitest) framework = 'Vitest';
    else if (hasJest) framework = 'Jest';
    else if (hasJUnit) framework = 'JUnit';
    else if (hasNUnit) framework = 'NUnit';
    else if (hasPytest) framework = 'Pytest';

    const warnings: string[] = [];
    if (testFiles.length === 0) {
      warnings.push('No test suites found in the workspace.');
    }

    return {
      source: 'Workspace Tests',
      confidence: testFiles.length > 0 ? 100 : 30,
      evidence: Array.from(testDirectories).slice(0, 10).map(d => d.replace(/\\/g, '/')), // list some test dirs
      warnings,
      data: {
        framework,
        testFilesCount: testFiles.length,
        testFiles: testFilesList.slice(0, 50), // cap preview count
        testDirectories: Array.from(testDirectories).map(d => path.relative(projectRoot, d).replace(/\\/g, '/'))
      }
    };
  }

  private crawl(dir: string, root: string, testFiles: string[], testDirs: Set<string>): void {
    if (!fs.existsSync(dir)) return;

    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (this.ignoreDirs.has(file.toLowerCase())) {
            continue;
          }
          this.crawl(fullPath, root, testFiles, testDirs);
        } else if (stat.isFile()) {
          const isTestFile = 
            file.endsWith('.test.ts') || 
            file.endsWith('.spec.ts') ||
            file.endsWith('.test.js') || 
            file.endsWith('.spec.js') ||
            file.endsWith('Test.java') ||
            file.endsWith('Tests.cs') ||
            (file.startsWith('test_') && file.endsWith('.py'));

          if (isTestFile) {
            testFiles.push(fullPath);
            testDirs.add(dir);
          }
        }
      }
    } catch {
      // ignore unreadable files/folders
    }
  }
}

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { DefaultCoverageEngine } from '../src/coverage-engine/coverageEngine.js';
import { DefaultKnowledgeEngine } from '../src/knowledge/knowledgeEngine.js';
import { SafetyScanner } from '../src/review/safetyScanner.js';
import { QAArtifact, TestStrategy } from '../src/domain.js';

describe('Performance Benchmarking diagnostics', () => {
  it('should measure Coverage Engine calculation speed', async () => {
    const coverageEngine = new DefaultCoverageEngine();

    // Prepare large mock strategy
    const mockStrategy: TestStrategy = {
      id: 'strat-1',
      requirementId: 'req-1',
      businessImpact: 'high',
      riskLevel: 'high',
      objectives: ['Obj1', 'Obj2', 'Obj3'],
      primaryFocus: ['Focus1'],
      recommendedSuites: [],
      excludedSuites: [],
      outOfScope: [],
      automationCandidates: [],
      manualExploratoryScenarios: [],
      suggestedTestData: [],
      suggestedPreconditions: [],
      suggestedEnvironments: [],
      executionOrder: [],
      estimatedEffort: [],
      confidenceScore: 0.9,
      reasoningTrace: [],
      createdAt: new Date(),
    };

    // Mocks and artifacts
    const intelligenceReport: any = {
      businessRules: Array.from({ length: 50 }, (_, i) => ({
        id: `rule-${i + 1}`,
        description: `Rule description for rule ${i + 1}`,
        rationale: 'critical requirement',
      })),
      actors: [],
      riskAreas: [],
    };

    const artifacts: QAArtifact[] = [
      {
        id: 'art-1',
        planId: 'plan-1',
        type: 'playwright-ts',
        content: 'Check logic for rule-1, rule-2, rule-5, rule-10, rule-45',
        createdAt: new Date(),
      },
    ];

    const start = performance.now();
    const report = await coverageEngine.calculateCoverage(mockStrategy, artifacts, intelligenceReport);
    const duration = performance.now() - start;

    console.log(`⏱️  Coverage Engine Benchmark: Mapped 50 rules in ${duration.toFixed(2)}ms`);

    expect(report).toBeDefined();
    // Coverage engine should perform calculations under 50ms
    expect(duration).toBeLessThan(50);
  });

  it('should measure Knowledge Engine pattern lookup speed', async () => {
    const testStorePath = 'd:/QAMate/data/knowledge/store-bench.json';
    if (fs.existsSync(testStorePath)) {
      try { fs.unlinkSync(testStorePath); } catch {}
    }

    const knowledgeEngine = new DefaultKnowledgeEngine(testStorePath);

    // Insert 50 mock entries into the store
    const mockEntries = Array.from({ length: 50 }, (_, i) => ({
      id: `entry-${i + 1}`,
      requirementId: `req-${i + 1}`,
      title: `Pattern definition ${i + 1}`,
      description: `Description targeting keyword key${i + 1}`,
      category: 'contradiction' as const,
      keywords: [`key${i + 1}`, 'commonpattern'],
      confidence: 0.95,
      resolvedAt: new Date(),
    }));

    (knowledgeEngine as any).store = mockEntries;
    mockEntries.forEach(entry => {
      knowledgeEngine.getRepository().getStore('project').push({
        id: entry.id,
        title: entry.title,
        type: 'org-standards',
        scope: 'project',
        content: entry.description,
        tags: entry.keywords,
        createdBy: 'QA Benchmark',
        version: 1,
        confidence: entry.confidence,
        status: 'active',
        usageCount: 0
      });
    });

    const start = performance.now();
    const result = await knowledgeEngine.findSimilarRequirements({
      id: 'req-test',
      projectId: 'p-1',
      title: 'Query keyword test',
      content: 'Needs lookup matching key25, key49, and key12.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
    });
    const duration = performance.now() - start;

    console.log(
      `⏱️  Knowledge Engine Pattern Match Lookup: Searched 50 entries in ${duration.toFixed(2)}ms`,
    );

    expect(result.matches.length).toBeGreaterThan(0);
    // Lookup speed should be under 20ms
    expect(duration).toBeLessThan(20);
  });

  it('should measure Safety Scanner text profiling speed', () => {
    const safetyScanner = new SafetyScanner();
    const largeContent = `
      // System generated automated test cases
      // Author: Jane Doe
      // TODO: verify boundary credentials
      // FIXME: resolve password token database leaks
      // Mock links: http://mock.api/testing
      // Credentials: const apiKey = "ABC-123-XYZ";
    `.repeat(100); // 100 times repetitions to build realistic text block

    const start = performance.now();
    const report = safetyScanner.scanContent(largeContent);
    const duration = performance.now() - start;

    console.log(`⏱️  Safety Scanner Profiling: Audited ${largeContent.length} bytes in ${duration.toFixed(2)}ms`);

    expect(report.isSafe).toBe(false);
    expect(report.issues.length).toBeGreaterThan(0);
    // Scanning speed should be under 15ms
    expect(duration).toBeLessThan(15);
  });
});

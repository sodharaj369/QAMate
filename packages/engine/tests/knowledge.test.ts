import { describe, it, expect } from 'vitest';
import {
  Requirement,
  RequirementIntelligenceReport,
  QAArtifact,
  ReviewReport,
} from '../src/domain.js';
import { DefaultKnowledgeEngine } from '../src/knowledge/index.js';

const makeIntelligence = (
  overrides: Partial<RequirementIntelligenceReport> = {},
): RequirementIntelligenceReport => ({
  requirementId: 'req-1',
  analyzedAt: new Date(),
  actors: [],
  entities: [],
  businessRules: [
    { id: 'BR-1', description: 'Public access must be disabled on all storage accounts.', priority: 'must' },
  ],
  ambiguities: [],
  missingInformation: [],
  riskAreas: [
    { area: 'Security', description: 'Unauthorized blob access', severity: 'high' },
  ],
  complexity: { level: 'low', factors: [], rationale: 'simple' },
  confidenceScore: 1.0,
  ...overrides,
});

const makeReviewReport = (
  overrides: Partial<ReviewReport> = {},
): ReviewReport => ({
  id: 'rev-1',
  strategyId: 'strat-1',
  checkedAt: new Date(),
  status: 'approved',
  issues: [],
  scores: {
    deduplicationScore: 100,
    businessValueScore: 100,
    codeQualityScore: 100,
    overallScore: 100,
  },
  suggestions: [],
  traceLogs: [],
  ...overrides,
});

const makeArtifact = (type: string, content: string): QAArtifact => ({
  id: `art-${Date.now()}`,
  planId: 'plan-1',
  type,
  content,
  createdAt: new Date(),
});

describe('Knowledge Engine tests', () => {
  it('should extract knowledge entries from artifacts, intelligence, and review', async () => {
    const engine = new DefaultKnowledgeEngine();
    const intelligence = makeIntelligence();
    const review = makeReviewReport({
      suggestions: ['Add token expiry edge case tests.'],
    });
    const artifacts: QAArtifact[] = [
      makeArtifact('Manual Test Cases', 'TC-001: Verify anonymous storage access denied'),
    ];

    const entries = await engine.extractKnowledge(artifacts, intelligence, review);

    // Should have: 1 common-defect (risk area), 1 test-template, 1 lesson-learned, 1 reusable-assertion
    expect(entries.length).toBeGreaterThanOrEqual(3);
    expect(entries.some((e) => e.category === 'common-defect')).toBe(true);
    expect(entries.some((e) => e.category === 'test-template')).toBe(true);
    expect(entries.some((e) => e.category === 'reusable-assertion')).toBe(true);
    expect(entries.some((e) => e.category === 'lesson-learned')).toBe(true);

    // All entries should be persisted in the store
    expect(engine.getStore().length).toBe(entries.length);
  });

  it('should find similar requirements by keyword overlap', async () => {
    const engine = new DefaultKnowledgeEngine();
    const intelligence = makeIntelligence();
    const review = makeReviewReport();
    const artifacts: QAArtifact[] = [
      makeArtifact('Unit Tests', 'Verify storage account public access disabled'),
    ];

    // Seed the knowledge store
    await engine.extractKnowledge(artifacts, intelligence, review);

    // Query with a similar requirement
    const requirement: Requirement = {
      id: 'req-2',
      projectId: 'proj-1',
      title: 'Disable public access on Azure storage',
      content: 'Storage accounts should not be publicly accessible.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const result = await engine.findSimilarRequirements(requirement);

    // Should find matches because keywords overlap (storage, access, public, etc.)
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].relevanceScore).toBeGreaterThan(0);
  });

  it('should query knowledge by category filter', async () => {
    const engine = new DefaultKnowledgeEngine();
    const intelligence = makeIntelligence();
    const review = makeReviewReport({
      issues: [
        {
          id: 'REV-DUP-1',
          category: 'duplication',
          description: 'Duplicate scenario found',
          severity: 'medium',
          fileArtifactId: 'art-1',
        },
      ],
    });
    const artifacts: QAArtifact[] = [
      makeArtifact('Manual Test Cases', 'Verify storage security'),
    ];

    await engine.extractKnowledge(artifacts, intelligence, review);

    // Query only bug-patterns
    const bugPatterns = await engine.queryKnowledge({
      keywords: ['duplication', 'duplicate'],
      category: 'bug-pattern',
    });

    expect(bugPatterns.matches.length).toBeGreaterThanOrEqual(1);
    expect(bugPatterns.matches.every((m) => m.entry.category === 'bug-pattern')).toBe(true);
  });
});

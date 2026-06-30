import { describe, it, expect } from 'vitest';
import { Requirement } from '../src/domain.js';
import {
  DefaultRequirementValidator,
  RuleBasedAnalysisStrategy,
  DefaultConfidenceScorer,
  DefaultRequirementAnalyzer
} from '../src/analyzer/index.js';

describe('Requirement Validator Heuristics tests', () => {
  const validator = new DefaultRequirementValidator();

  it('should flag an error if requirement content is empty', () => {
    const req: Requirement = {
      id: 'req-1',
      projectId: 'proj-1',
      title: 'Empty Spec',
      content: '   ',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const result = validator.validate(req);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.ruleId === 'VAL-001' && i.severity === 'error')).toBe(true);
  });

  it('should flag a warning if content word count is too short', () => {
    const req: Requirement = {
      id: 'req-2',
      projectId: 'proj-1',
      title: 'Short Spec',
      content: 'This is a short specification with very few words in it.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const result = validator.validate(req);
    expect(result.isValid).toBe(true); // Short spec is a warning, not blocking error
    expect(result.issues.some((i) => i.ruleId === 'VAL-002' && i.severity === 'warning')).toBe(true);
  });
});

describe('Rule-Based Analysis Strategy tests', () => {
  const strategy = new RuleBasedAnalysisStrategy();

  it('should extract actors, entities, business rules, and gaps correctly', async () => {
    const content = `
# Cart Management System
As a Customer, I want to add items to my ShoppingCart so that I can buy them later.

## Rules
1. The Customer must only add valid items to the \`ShoppingCart\`.
2. If the user is a PremiumCustomer, then apply a discount.
3. The shopping cart price should always be calculated fast.

## Gaps
No boundaries are listed here.
    `;

    const req: Requirement = {
      id: 'req-3',
      projectId: 'proj-1',
      title: 'Cart Spec',
      content,
      contentType: 'markdown',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const report = await strategy.analyze(req);

    // Verify Actors
    expect(report.actors).toHaveLength(1);
    expect(report.actors[0].name).toBe('Customer');

    // Verify backtick entities
    expect(report.entities.some((e) => e.name === 'ShoppingCart')).toBe(true);

    // Verify Business Rules
    expect(report.businessRules.length).toBeGreaterThanOrEqual(2);
    expect(report.businessRules.some((r) => r.id === 'BR-001' && r.description.includes('must only add'))).toBe(true);

    // Verify Ambiguities
    expect(report.ambiguities.some((a) => a.description.includes('Vague term "fast"'))).toBe(true);

    // Verify Gaps
    expect(report.missingInfo.some((g) => g.category === 'error-handling')).toBe(true);
  });
});

describe('Confidence Scorer tests', () => {
  const scorer = new DefaultConfidenceScorer();
  const mockReq: Requirement = {
    id: '1',
    projectId: '1',
    title: 'test',
    content: 'A'.repeat(500), // ~100 words
    contentType: 'plain-text',
    version: 1,
    status: 'draft',
    metadata: {},
    createdAt: new Date(),
  };

  it('should score 1.0 when there are no ambiguities and no missing information gaps', () => {
    const confidence = scorer.score(mockReq, [], []);
    expect(confidence.score).toBe(1.0);
    expect(confidence.recommendation).toBe('generate-direct');
  });

  it('should score lower and recommend clarification when gaps exist', () => {
    const gaps = [
      {
        category: 'error-handling' as const,
        description: 'Missing error paths.',
        whyCriticalForQA: 'Critical',
      },
    ];

    const confidence = scorer.score(mockReq, [], gaps);
    expect(confidence.score).toBeLessThan(1.0);
    expect(confidence.score).toBe(0.88); // 1.0 - (1/4 * 0.5) = 1 - 0.125 = 0.875 ~ 0.88
  });
});

describe('Requirement Analyzer Orchestrator tests', () => {
  it('should coordinate validator, strategies, scorer and return unified results', async () => {
    const validator = new DefaultRequirementValidator();
    const scorer = new DefaultConfidenceScorer();
    const strategy = new RuleBasedAnalysisStrategy();
    const analyzer = new DefaultRequirementAnalyzer(validator, scorer, [strategy]);

    const req: Requirement = {
      id: 'req-4',
      projectId: 'proj-1',
      title: 'Full Spec test',
      content: `
# Feature Spec
As a GuestUser, I want to authenticate so that I can access my dashboard.
The security must be highly secure.
      `,
      contentType: 'markdown',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const result = await analyzer.analyze(req);

    expect(result.validation.isValid).toBe(true);
    expect(result.intelligence.actors[0].name).toBe('GuestUser');
    expect(result.intelligence.ambiguities.some((a) => a.description.includes('Vague term "secure"'))).toBe(true);
    expect(result.intelligence.confidenceScore).toBeLessThan(0.8); // Gaps + Vagueness
  });
});

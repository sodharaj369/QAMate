import { describe, it, expect } from 'vitest';
import { Requirement } from '../src/domain.js';
import {
  DefaultRequirementValidator,
  RuleBasedAnalysisStrategy,
  DefaultConfidenceScorer,
  DefaultRequirementAnalyzer,
  RuleBasedDomainDetector
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

  it('should flag duplicate requirements lines (VAL-005)', () => {
    const req: Requirement = {
      id: 'req-val-005',
      projectId: 'proj-1',
      title: 'Duplicate Spec',
      content: `
# Feature Spec
- This is scenario detail check.
- This is scenario detail check.
      `,
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const result = validator.validate(req);
    expect(result.issues.some((i) => i.ruleId === 'VAL-005')).toBe(true);
  });

  it('should flag missing acceptance blocks (VAL-006)', () => {
    const req: Requirement = {
      id: 'req-val-006',
      projectId: 'proj-1',
      title: 'Missing Criteria Spec',
      content: '# Feature Spec\nThis is a standard requirement document that describes how the application is expected to save user files on local hard disk drives. It is clean and long enough to pass the word count warning checks completely.\n',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const result = validator.validate(req);
    expect(result.issues.some((i) => i.ruleId === 'VAL-006')).toBe(true);
  });

  it('should flag inconsistent Gherkin steps (VAL-007)', () => {
    const req: Requirement = {
      id: 'req-val-007',
      projectId: 'proj-1',
      title: 'Inconsistent Gherkin Spec',
      content: '# Feature Spec\nThis is a standard requirement document with Given statement. Given the user is on the homepage. There is no other step. Let us see if it fails Gherkin validation check. It is long enough to bypass word count checks.\n',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const result = validator.validate(req);
    expect(result.issues.some((i) => i.ruleId === 'VAL-007')).toBe(true);
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

  it('should detect assumptions, contradictions, and missing database schemas', async () => {
    const content = `
# System Spec
We assume the database persistence is always ready.
The system must validate user logins and must not allow access to banned accounts.
Anonymous access is enabled. Anonymous access is disabled.
The system will save the transaction logs but we do not define details here.
    `;

    const req: Requirement = {
      id: 'req-strategy-details',
      projectId: 'proj-1',
      title: 'Strategy Details Spec',
      content,
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const report = await strategy.analyze(req);

    // Verify unverified assumptions
    expect(report.ambiguities.some((a) => a.type === 'implied-behavior')).toBe(true);

    // Verify contradictions
    expect(report.ambiguities.some((a) => a.type === 'contradiction')).toBe(true);

    // Verify missing database models check
    expect(report.missingInfo.some((m) => m.category === 'database-models')).toBe(true);
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

describe('RuleBasedDomainDetector tests', () => {
  const detector = new RuleBasedDomainDetector();

  it('should detect Authentication and API domains and calculate correct confidence scores', () => {
    const content = 'Create a secure signup endpoint with oauth credential authentication and json request payload.';
    const result = detector.detect(content);
    expect(result.domains).toContain('Authentication');
    expect(result.domains).toContain('API');
    expect(result.confidencePercent).toBe(90);
  });

  it('should fallback to General Scope with 80% confidence when no keywords match', () => {
    const content = 'Simple text file without any specialized terms.';
    const result = detector.detect(content);
    expect(result.domains).toEqual(['General Scope']);
    expect(result.confidencePercent).toBe(80);
  });
});

describe('Org Playbooks (Team Settings) tests', () => {
  it('should override standard rules and evaluate keyword triggers in OrgPlaybooks', () => {
    const customPlaybook = {
      rules: [
        {
          ruleId: 'VAL-002',
          enabled: false,
          severity: 'warning' as const,
        },
        {
          ruleId: 'PLAYBOOK-001',
          enabled: true,
          severity: 'error' as const,
          customMessage: 'Compliance violation: Requirement must mention "GDPR" compliance.',
          keywordTriggers: ['GDPR'],
        }
      ]
    };

    const req: Requirement = {
      id: 'req-3',
      projectId: 'proj-1',
      title: 'Short Spec',
      content: 'This is a short specification with very few words in it.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const validator = new DefaultRequirementValidator(customPlaybook);
    const result = validator.validate(req);

    expect(result.issues.some((i) => i.ruleId === 'VAL-002')).toBe(false);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.ruleId === 'PLAYBOOK-001' && i.severity === 'error')).toBe(true);
  });
});

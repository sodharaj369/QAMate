import { describe, it, expect } from 'vitest';
import { Requirement, RequirementIntelligenceReport } from '../src/domain.js';
import {
  DefaultQuestionCandidateGenerator,
  DefaultQuestionPrioritizer,
  DefaultQuestionDeduplicator,
  DefaultQuestionPlanner,
  DefaultClarificationEngine
} from '../src/clarification/index.js';

const mockReq: Requirement = {
  id: 'req-test',
  projectId: 'proj-test',
  title: 'Mock Spec',
  content: 'Content does not matter for mock static analysis input checks',
  contentType: 'plain-text',
  version: 1,
  status: 'draft',
  metadata: {},
  createdAt: new Date(),
};

const mockIntelligence: RequirementIntelligenceReport = {
  requirementId: 'req-test',
  analyzedAt: new Date(),
  actors: [{ name: 'Admin', description: 'desc' }],
  entities: [],
  businessRules: [],
  ambiguities: [
    { id: 'AMB-001', description: 'vague term "fast"', locationSnippet: 'fast login', severity: 'medium' },
  ],
  missingInformation: [
    { description: 'Authentication is undefined', category: 'permissions-auth', impactSeverity: 'high' },
    { description: 'No validation boundaries', category: 'boundary-conditions', impactSeverity: 'medium' },
  ],
  riskAreas: [],
  complexity: { level: 'low', factors: [], rationale: 'low' },
  confidenceScore: 0.5,
};

describe('Question Candidate Generator tests', () => {
  const generator = new DefaultQuestionCandidateGenerator();

  it('should generate candidates matching gaps and ambiguities', async () => {
    const candidates = await generator.generateCandidates(mockReq, mockIntelligence);
    expect(candidates).toHaveLength(3); // 2 gaps + 1 ambiguity
    expect(candidates.some((c) => c.category === 'PERMISSIONS AUTH')).toBe(true);
    expect(candidates.some((c) => c.category === 'AMBIGUITY')).toBe(true);
  });
});

describe('Question Prioritizer tests', () => {
  const generator = new DefaultQuestionCandidateGenerator();
  const prioritizer = new DefaultQuestionPrioritizer();

  it('should assign high priority and blocking impact to security/permissions gaps', async () => {
    const raw = await generator.generateCandidates(mockReq, mockIntelligence);
    const prioritized = await prioritizer.prioritize(raw);

    const authCand = prioritized.find((c) => c.category === 'PERMISSIONS AUTH')!;
    expect(authCand.priority).toBe('high');
    expect(authCand.impact).toBe('blocking-test-strategy');
    expect(authCand.skipRisk).toContain('missing security regression');

    const vagueCand = prioritized.find((c) => c.category === 'AMBIGUITY')!;
    expect(vagueCand.priority).toBe('low');
    expect(vagueCand.impact).toBe('optional');
  });
});

describe('Question Deduplicator tests', () => {
  const deduplicator = new DefaultQuestionDeduplicator();

  it('should remove identical text question candidates', async () => {
    const candidates = [
      { id: 'CAND-1', conversationId: '1', text: 'Vague term?', type: 'open-text' as const, category: 'A', impact: 'optional' as const, rationale: 'R', skipRisk: 'S', priority: 'low' as const },
      { id: 'CAND-2', conversationId: '1', text: 'Vague term?', type: 'open-text' as const, category: 'A', impact: 'optional' as const, rationale: 'R', skipRisk: 'S', priority: 'low' as const },
      { id: 'CAND-3', conversationId: '1', text: 'Different?', type: 'open-text' as const, category: 'A', impact: 'optional' as const, rationale: 'R', skipRisk: 'S', priority: 'low' as const },
    ];

    const deduplicated = await deduplicator.deduplicate(candidates);
    expect(deduplicated).toHaveLength(2);
    expect(deduplicated[0].text).toBe('Vague term?');
    expect(deduplicated[1].text).toBe('Different?');
  });
});

describe('Question Planner tests', () => {
  const generator = new DefaultQuestionCandidateGenerator();
  const prioritizer = new DefaultQuestionPrioritizer();
  const planner = new DefaultQuestionPlanner();

  it('should plan all active questions when askOnlyBlocking is false', async () => {
    const raw = await generator.generateCandidates(mockReq, mockIntelligence);
    const prioritized = await prioritizer.prioritize(raw);
    const questions = await planner.plan(prioritized, { askOnlyBlocking: false });

    expect(questions).toHaveLength(3);
    expect(questions.every((q) => q.status === 'pending')).toBe(true);
    expect(questions[0].id.startsWith('Q-')).toBe(true);
  });

  it('should filter non-blocking questions when askOnlyBlocking is true', async () => {
    const raw = await generator.generateCandidates(mockReq, mockIntelligence);
    const prioritized = await prioritizer.prioritize(raw);
    const questions = await planner.plan(prioritized, { askOnlyBlocking: true });

    // Permissions (blocking-test-strategy) and Boundary (blocking-understanding) should remain.
    // Ambiguity (vague term - optional) should be filtered out.
    expect(questions).toHaveLength(2);
    expect(questions.some((q) => q.category === 'AMBIGUITY')).toBe(false);
  });
});

describe('Clarification Engine Orchestrator tests', () => {
  it('should run full pipeline and output planned results', async () => {
    const candidateGenerator = new DefaultQuestionCandidateGenerator();
    const prioritizer = new DefaultQuestionPrioritizer();
    const deduplicator = new DefaultQuestionDeduplicator();
    const planner = new DefaultQuestionPlanner();
    const engine = new DefaultClarificationEngine(candidateGenerator, prioritizer, deduplicator, planner);

    const result = await engine.planClarifications(mockReq, mockIntelligence, { askOnlyBlocking: true, skipDecisionEngine: true });
    expect(result.candidates).toHaveLength(3);
    expect(result.activeQuestions).toHaveLength(2);
  });
});

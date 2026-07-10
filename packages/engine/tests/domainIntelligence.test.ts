import { describe, it, expect } from 'vitest';
import { Requirement, QuestionCandidate } from '../src/domain.js';
import { DomainIntelligenceEngine, PlaybookDecisionEngine } from '../src/clarification/domainIntelligence.js';

describe('Domain Intelligence & Playbook Decisions Engine tests', () => {
  it('should correctly classify requirement domains under Monitoring & Observability using rule heuristics', async () => {
    const requirement: Requirement = {
      id: 'req-mon-1',
      projectId: 'proj-1',
      title: 'Setup exception alerts',
      content: 'Create Azure Application Insights alert when tenant exceptions exceed threshold.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {}
    };

    const classifier = new DomainIntelligenceEngine();
    const { domains } = await classifier.classify(requirement);

    expect(domains).toContain('Monitoring & Observability');
  });

  it('should exclude irrelevant UI questions and cap questions count to 0-2 for Monitoring requirements', async () => {
    const candidates: QuestionCandidate[] = [
      {
        id: 'CAND-001',
        conversationId: 'conv-1',
        text: 'What alert threshold value triggers the exception escalation?',
        type: 'open-text',
        category: 'MONITORING',
        impact: 'blocking-understanding',
        rationale: 'Needed for alert threshold',
        skipRisk: 'None',
        priority: 'high'
      },
      {
        id: 'CAND-002',
        conversationId: 'conv-1',
        text: 'Should we verify browser compatibility across Chrome and Safari?',
        type: 'single-choice',
        options: ['Yes', 'No'],
        category: 'UI',
        impact: 'optional',
        rationale: 'Generic browser check',
        skipRisk: 'None',
        priority: 'low'
      },
      {
        id: 'CAND-003',
        conversationId: 'conv-1',
        text: 'What are the user roles permitted to login to configure the alert?',
        type: 'open-text',
        category: 'AUTH',
        impact: 'optional',
        rationale: 'Generic access role check',
        skipRisk: 'None',
        priority: 'low'
      },
      {
        id: 'CAND-004',
        conversationId: 'conv-1',
        text: 'What notification channel should be used (e.g. Email or Slack)?',
        type: 'single-choice',
        options: ['Email', 'Slack'],
        category: 'NOTIFICATION',
        impact: 'blocking-understanding',
        rationale: 'Determine alerts channel',
        skipRisk: 'None',
        priority: 'high'
      },
      {
        id: 'CAND-005',
        conversationId: 'conv-1',
        text: 'Define boundary limits for metric sizes.',
        type: 'open-text',
        category: 'BOUNDARY',
        impact: 'optional',
        rationale: 'Boundary checks',
        skipRisk: 'None',
        priority: 'low'
      }
    ];

    const mentalModel = {
      facts: [],
      assumptions: [],
      inferences: ['Monitoring & Observability'],
      unknowns: [],
      confidence: 90,
      recommendedTesting: [],
      excludedTesting: ['UI', 'AUTH'],
      reasoningTrace: []
    };

    const decisionEngine = new PlaybookDecisionEngine();
    const { activeQuestions, telemetry } = await decisionEngine.evaluateQuestions(
      mentalModel,
      candidates
    );

    // Verify 70% reduction / max 2 questions check
    expect(activeQuestions.length).toBeLessThanOrEqual(2);

    // Verify irrelevant browser UI / roles questions are skipped
    const skippedTexts = telemetry.questionsSkipped.map((q) => q.question);
    expect(skippedTexts).toContain('Should we verify browser compatibility across Chrome and Safari?');
    expect(skippedTexts).toContain('What are the user roles permitted to login to configure the alert?');

    // Verify skip reason telemetry tracking
    const UIReason = telemetry.questionsSkipped.find((q) => q.question.includes('browser compatibility'))?.reason;
    expect(UIReason).toContain('QA Mental Model Exclusion');
  });

  it('should exclude monitoring questions when classified under Authentication domain', async () => {
    const candidates: QuestionCandidate[] = [
      {
        id: 'CAND-001',
        conversationId: 'conv-2',
        text: 'What password lock rules apply?',
        type: 'open-text',
        category: 'AUTH',
        impact: 'blocking-understanding',
        rationale: 'Lock settings',
        skipRisk: 'None',
        priority: 'high'
      },
      {
        id: 'CAND-002',
        conversationId: 'conv-2',
        text: 'What alert evaluation window triggers exception alarms?',
        type: 'open-text',
        category: 'MONITORING',
        impact: 'optional',
        rationale: 'Alarms time',
        skipRisk: 'None',
        priority: 'low'
      }
    ];

    const mentalModel = {
      facts: [],
      assumptions: [],
      inferences: ['Authentication'],
      unknowns: [],
      confidence: 90,
      recommendedTesting: [],
      excludedTesting: ['MONITORING'],
      reasoningTrace: []
    };

    const decisionEngine = new PlaybookDecisionEngine();
    const { activeQuestions, telemetry } = await decisionEngine.evaluateQuestions(
      mentalModel,
      candidates
    );

    expect(activeQuestions.length).toBe(1);
    const skippedTexts = telemetry.questionsSkipped.map((q) => q.question);
    expect(skippedTexts).toContain('What alert evaluation window triggers exception alarms?');
  });
});


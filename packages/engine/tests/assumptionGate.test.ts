import { describe, it, expect } from 'vitest';
import { HumanFeedbackStore } from '../src/platform/humanFeedback.js';
import { AssumptionVerificationGate } from '../src/platform/assumptionGate.js';
import { QAReasoningEngine } from '../src/platform/reasoningEngine.js';
import { SemanticValidator } from '../src/platform/semanticValidator.js';
import { EvidenceGraph, SystemModel } from '../src/platform/reasoningModel.js';
import { Assumption } from '../src/domain.js';

describe('Phase 3: QA Mental Model & Gaps Gating tests', () => {

  it('Test 1: Rejecting an assumption updates status, records decision history, and dispatches human feedback', async () => {
    const feedbackStore = new HumanFeedbackStore();
    const gate = new AssumptionVerificationGate(feedbackStore);

    const assumptions: Assumption[] = [
      {
        id: 'ass-stripe',
        statement: 'System integrates with Stripe',
        source: 'ai',
        confidence: 0.88,
        reason: 'Requirement mentions billing checkout flow',
        evidence: ['billing checkout'],
        status: 'pending',
        decisions: []
      }
    ];

    gate.loadAssumptions(assumptions);
    expect(gate.getAssumptions()[0].status).toBe('pending');

    // Reject the assumption
    gate.rejectAssumption('ass-stripe', 'SRE-QA-Lead', 'Requirement checkout is via invoice, not Stripe API');

    const result = gate.getAssumptions()[0];
    expect(result.status).toBe('rejected');
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0].decision).toBe('reject');
    expect(result.decisions[0].user).toBe('SRE-QA-Lead');
    expect(result.decisions[0].comment).toBe('Requirement checkout is via invoice, not Stripe API');

    // Confirm human feedback dispatcher tracked this correction
    const feedbackList = await feedbackStore.getAllFeedback();
    expect(feedbackList).toHaveLength(1);
    expect(feedbackList[0].targetId).toBe('ass-stripe');
    expect(feedbackList[0].action).toBe('reject');
  });

  it('Test 2: Adding a manual assumption updates the reasoning pass', async () => {
    const feedbackStore = new HumanFeedbackStore();
    const gate = new AssumptionVerificationGate(feedbackStore);
    const reasoning = new QAReasoningEngine();

    gate.addManualAssumption('Database is hosted on Azure SQL instance', 'Developer-Jack');
    const list = gate.getAssumptions();

    expect(list).toHaveLength(1);
    expect(list[0].source).toBe('user');
    expect(list[0].statement).toBe('Database is hosted on Azure SQL instance');

    // Build evidence graph using manual observations
    const system: SystemModel = {
      schemaVersion: 2,
      name: 'SQL App',
      components: [],
      flows: [],
      users: [],
      qualityAttributes: [],
      risks: [],
      unknowns: []
    };

    const evidence: EvidenceGraph = {
      system,
      rulesEvidence: [],
      knowledgeEvidence: [],
      aiObservations: [
        {
          id: list[0].id,
          type: 'Component',
          value: 'Azure SQL',
          confidence: list[0].confidence,
          evidence: list[0].evidence,
          reason: list[0].reason
        }
      ]
    };

    const mentalModel = await reasoning.reason(evidence);
    expect(mentalModel.mentalModelVersion).toBe(2);
    expect(mentalModel.confidenceMetadata?.level).toBe('VeryHigh'); // 0 unknowns
    expect(mentalModel.assumptions).toContain('AI-observed assumption: Azure SQL');
  });

  it('Test 3: Reconnecting AI preserves previous manual assumptions and confirmed status', () => {
    const feedbackStore = new HumanFeedbackStore();
    const gate = new AssumptionVerificationGate(feedbackStore);

    const scanAssumptions: Assumption[] = [
      {
        id: 'a1',
        statement: 'Payment is processed locally',
        source: 'ai',
        confidence: 0.75,
        reason: 'Parsed term "payment"',
        evidence: ['payment'],
        status: 'pending',
        decisions: []
      }
    ];

    gate.loadAssumptions(scanAssumptions);
    gate.confirmAssumption('a1', 'QA-Manager', 'Confirmed local sandbox scope');
    gate.addManualAssumption('Offline logging is configured', 'SRE-Jack');

    // Simulate AI reconnecting and reloading a new scan array
    const reconnectedScan: Assumption[] = [
      {
        id: 'a1',
        statement: 'Payment is processed locally', // matches statement
        source: 'ai',
        confidence: 0.90,
        reason: 'Parsed term "payment" on reconnect',
        evidence: ['payment'],
        status: 'pending',
        decisions: []
      },
      {
        id: 'a2',
        statement: 'MFA is bypassed in staging environment',
        source: 'ai',
        confidence: 0.60,
        reason: 'Rule scan default',
        evidence: ['staging override'],
        status: 'pending',
        decisions: []
      }
    ];

    gate.loadAssumptions(reconnectedScan);
    const result = gate.getAssumptions();

    // Preserve manual one (1) + scanned ones (2) = 3 total assumptions
    expect(result).toHaveLength(3);

    // a1 remains confirmed with previous comment
    const assA1 = result.find(a => a.statement === 'Payment is processed locally');
    expect(assA1?.status).toBe('confirmed');
    expect(assA1?.userComment).toBe('Confirmed local sandbox scope');

    // Manual logging assumption remains intact
    const manualAss = result.find(a => a.source === 'user');
    expect(manualAss).toBeDefined();
    expect(manualAss?.statement).toBe('Offline logging is configured');
  });

  it('Test 4: Verify reasoning trace items are immutable and replaced on updates', async () => {
    const reasoning = new QAReasoningEngine();
    const system: SystemModel = {
      schemaVersion: 2,
      name: 'SQL App',
      components: [],
      flows: [],
      users: [],
      qualityAttributes: [],
      risks: [],
      unknowns: ['Port availability']
    };

    const evidence: EvidenceGraph = {
      system,
      rulesEvidence: [],
      knowledgeEvidence: [],
      aiObservations: []
    };

    const run1 = await reasoning.reason(evidence);
    const traceOriginal = run1.reasoningTrace;
    
    // Rerun reasoning pass (simulates regeneration)
    const run2 = await reasoning.reason(evidence);
    const traceRegenerated = run2.reasoningTrace;

    // Verify trace is separate (immutable instances)
    expect(traceOriginal).not.toBe(traceRegenerated);
  });

  it('Test 5: Semantic contract checker validates rephrase semantic integrity', () => {
    const validator = new SemanticValidator();

    const original = 'Integrate credit card payments via Stripe processor and log exceptions to App Insights.';
    
    // 1. Valid rephrase preserving nouns and length
    const validRephrase = 'Connect credit card payments through Stripe and capture all exceptions in App Insights telemetry.';
    const resValid = validator.verifyRephrase(original, validRephrase);
    expect(resValid.isValid).toBe(true);

    // 2. Invalid rephrase missing critical noun "Stripe"
    const invalidRephrase = 'Connect credit card payments and stream logs to telemetry.';
    const resInvalid = validator.verifyRephrase(original, invalidRephrase);
    expect(resInvalid.isValid).toBe(false);
    expect(resInvalid.warnings[resInvalid.warnings.length - 1]).toContain('stripe" was dropped');

    // 3. Invalid rephrase too short
    const shortRephrase = 'Integrate payments.';
    const resShort = validator.verifyRephrase(original, shortRephrase);
    expect(resShort.isValid).toBe(false);
    expect(resShort.warnings[resShort.warnings.length - 1]).toContain('Rephrased output is too short');
  });
});

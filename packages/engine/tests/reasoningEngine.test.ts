import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Requirement } from '../src/domain.js';
import { SystemUnderstandingEngine } from '../src/platform/systemEngine.js';
import { QAReasoningEngine } from '../src/platform/reasoningEngine.js';
import { QAMateEngine } from '../src/platform/qamateEngine.js';
import { JsonFileStorage } from '../src/storage/index.js';

const tempDir = path.resolve('packages/engine/tests/temp/reasoning_test');

const cleanTempDir = () => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

describe('System-Centric QA Reasoning Engine tests', () => {
  afterAll(() => {
    cleanTempDir();
  });

  it('should construct a structural SystemModel and extract components, flows, and risks', async () => {
    const requirement: Requirement = {
      id: 'req-mon-telemetry',
      projectId: 'proj-1',
      title: 'App Insights exception alerts',
      content: 'Create Azure Application Insights alert when tenant exceptions exceed threshold.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {}
    };

    const systemEngine = new SystemUnderstandingEngine();
    const systemModel = await systemEngine.understand(requirement);

    expect(systemModel.name).toBe('Telemetry & Alert Monitoring System');
    
    // Validate components
    const componentNames = systemModel.components.map(c => c.name);
    expect(componentNames).toContain('Application Insights Ingest');
    expect(componentNames).toContain('KQL Query Engine');
    expect(componentNames).toContain('Alert Rule Manager');

    // Validate flows
    expect(systemModel.flows.length).toBeGreaterThan(0);
    expect(systemModel.flows[0].from).toBe('Target System Service');
    expect(systemModel.flows[0].to).toBe('Application Insights Ingest');

    // Validate risks
    expect(systemModel.risks).toContain('Alert Storms');
    expect(systemModel.risks).toContain('False Positives');

    // Validate quality attributes
    expect(systemModel.qualityAttributes).toContain('Telemetry Ingestion Latency');
  });

  it('should reason over the SystemModel to establish QA facts and exclude UI testing', async () => {
    const requirement: Requirement = {
      id: 'req-mon-telemetry',
      projectId: 'proj-1',
      title: 'App Insights exception alerts',
      content: 'Create Azure Application Insights alert when tenant exceptions exceed threshold.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {}
    };

    const systemEngine = new SystemUnderstandingEngine();
    const systemModel = await systemEngine.understand(requirement);

    const evidenceGraph = {
      system: systemModel,
      rulesEvidence: [],
      knowledgeEvidence: [],
      aiObservations: []
    };

    const reasoningEngine = new QAReasoningEngine();
    const mentalModel = await reasoningEngine.reason(evidenceGraph);

    // Verify facts/inferences
    expect(mentalModel.inferences[0]).toContain('Telemetry & Alert Monitoring System');

    // Verify recommendations
    expect(mentalModel.recommendedTesting).toContain('Telemetry logging ingestion reliability checks');
    expect(mentalModel.recommendedTesting).toContain('Alert threshold triggering accuracy');

    // Verify exclusions
    expect(mentalModel.excludedTesting).toContain('Web UI Visual Design & Layout validation');
    expect(mentalModel.excludedTesting).toContain('Browser Compatibility testing');

    // Verify trace is recorded
    const uiTrace = mentalModel.reasoningTrace.find(t => t.decision.includes('Exclude UI'));
    expect(uiTrace).toBeDefined();
    expect(uiTrace?.confidence).toBe(99);
    expect(uiTrace?.reason).toContain('zero front-end layout nodes');
  });

  it('should support payments feature to verify double charges and payment gateways', async () => {
    const requirement: Requirement = {
      id: 'req-pay-1',
      projectId: 'proj-1',
      title: 'Stripe subscription payments',
      content: 'Integrate stripe subscription payment checkout with credit card verification.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {}
    };

    const systemEngine = new SystemUnderstandingEngine();
    const systemModel = await systemEngine.understand(requirement);

    expect(systemModel.name).toBe('Transaction & Payment Processing Gateway');

    const evidenceGraph = {
      system: systemModel,
      rulesEvidence: [],
      knowledgeEvidence: [],
      aiObservations: []
    };

    const reasoningEngine = new QAReasoningEngine();
    const mentalModel = await reasoningEngine.reason(evidenceGraph);

    expect(mentalModel.recommendedTesting).toContain('PCI DSS compliance security audit');
    expect(mentalModel.recommendedTesting).toContain('Double-charge protection and idempotency checks');
  });

  it('should dynamically update the system model and mental model inside QAMateEngine session workflows', async () => {
    cleanTempDir();
    const requirement: Requirement = {
      id: 'req-dyn-1',
      projectId: 'proj-1',
      title: 'App Insights exception alerts',
      content: 'Create Azure Application Insights alert when tenant exceptions exceed threshold.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {}
    };

    const storage = new JsonFileStorage(tempDir);
    const engine = new QAMateEngine(storage);

    const conv = await engine.createSession(requirement);

    // Verify stored models
    expect(conv.systemModel).toBeDefined();
    expect(conv.systemModel?.name).toBe('Telemetry & Alert Monitoring System');
    expect(conv.mentalModel).toBeDefined();
    expect(conv.mentalModel?.excludedTesting).toContain('Web UI Visual Design & Layout validation');

    // Submit answers to refine models
    const answers = [
      {
        questionId: 'Q-001',
        textValue: 'Suppression window is 10 minutes.',
        answeredAt: new Date(),
        answeredBy: 'QA-lead'
      }
    ];

    const updatedConv = await engine.submitAnswers(conv.id, answers);

    // Verify dynamically refined model content
    expect(updatedConv.systemModel).toBeDefined();
    expect(updatedConv.mentalModel).toBeDefined();
  });
});

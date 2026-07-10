import { ProjectConfig } from '../domain.js';
import { EvidenceGraph, QAMentalModel, ReasoningTraceItem } from './reasoningModel.js';

export class QAReasoningEngine {
  public async reason(
    evidence: EvidenceGraph,
    _projectConfig?: ProjectConfig
  ): Promise<QAMentalModel> {
    const system = evidence.system;
    
    const facts: string[] = [];
    const assumptions: string[] = [];
    const inferences: string[] = [];
    const risks: string[] = [...(system.risks || [])];
    const unknowns: string[] = [...system.unknowns];
    const recommendedTesting: string[] = [];
    const excludedTesting: string[] = [];
    const reasoningTrace: ReasoningTraceItem[] = [];

    // 1. Establish initial system inferences
    inferences.push(`System classified as "${system.name}"`);
    reasoningTrace.push({
      decision: `Identify System Class`,
      evidence: [system.name],
      confidence: 100,
      reason: `Requirement mapped to structural system signature of "${system.name}".`
    });

    // Extract facts from components and quality attributes
    for (const comp of system.components) {
      facts.push(`Component node: ${comp.name} (${comp.type})`);
    }
    for (const attr of system.qualityAttributes) {
      facts.push(`Verify Quality Attribute: ${attr}`);
    }

    // 2. Perform QA Cognition and Core Testing Scope Decisions
    const sysNameLower = system.name.toLowerCase();
    
    // Check if system has UI components/flows
    const hasUI = system.components.some(
      (c) => c.type.toLowerCase().includes('ui') || c.type.toLowerCase().includes('interface') || c.name.toLowerCase().includes('interface')
    ) || system.flows.some(
      (f) => f.from.toLowerCase().includes('ui') || f.from.toLowerCase().includes('interface') || f.to.toLowerCase().includes('ui')
    );

    if (!hasUI) {
      excludedTesting.push('Web UI Visual Design & Layout validation');
      excludedTesting.push('Browser Compatibility testing');
      excludedTesting.push('Accessibility testing checks');
      
      reasoningTrace.push({
        decision: 'Exclude UI, Browser, and Accessibility testing',
        evidence: system.components.map(c => c.name),
        confidence: 99,
        reason: 'System model components lists contain zero front-end layout nodes or UI endpoints. All interaction flows are backend-to-backend or infrastructure pipelines.'
      });
    } else {
      recommendedTesting.push('UI layout & visual element checks');
      recommendedTesting.push('Cross-browser compatibility verification');
      recommendedTesting.push('Accessibility standard validations');
      
      reasoningTrace.push({
        decision: 'Include UI and Browser testing',
        evidence: system.components.filter(c => c.type.toLowerCase().includes('ui')).map(c => c.name),
        confidence: 95,
        reason: 'Structural components or flows interact directly with client interface nodes.'
      });
    }

    // Check for storage focus
    const hasStorage = system.components.some(
      (c) => c.type.toLowerCase().includes('storage') || c.name.toLowerCase().includes('storage') || c.name.toLowerCase().includes('bucket') || c.name.toLowerCase().includes('blob')
    );
    if (hasStorage) {
      inferences.push('Cloud Infrastructure / Storage');
      recommendedTesting.push('Cloud bucket storage accessibility & policy controls');
      reasoningTrace.push({
        decision: 'Focus testing on Storage access controls',
        evidence: ['Cloud Storage Bucket'],
        confidence: 95,
        reason: 'Requirement involves cloud container resources or storage buckets. Security policy flags must be verified.'
      });
    }

    // Check for authentication focus
    const hasAuth = system.components.some(
      (c) => c.type.toLowerCase().includes('auth') || c.name.toLowerCase().includes('auth') || c.name.toLowerCase().includes('token')
    );
    if (hasAuth) {
      inferences.push('Security / Authentication');
      recommendedTesting.push('Token security encryption & expiry validation');
      recommendedTesting.push('Account lockout brute force thresholds');
      reasoningTrace.push({
        decision: 'Focus testing on identity and tokens security',
        evidence: ['Auth Router', 'Security Token Manager'],
        confidence: 99,
        reason: 'Target system manages session credentials and token issuing scopes.'
      });
    }

    // Handle monitoring system domain reasoning
    const hasMonitoring = sysNameLower.includes('monitoring') || sysNameLower.includes('telemetry') || system.components.some(c => c.type.toLowerCase().includes('telemetry') || c.name.toLowerCase().includes('insights'));
    if (hasMonitoring) {
      recommendedTesting.push('Telemetry logging ingestion reliability checks');
      recommendedTesting.push('KQL query syntax & execution performance validations');
      recommendedTesting.push('Alert threshold triggering accuracy');
      recommendedTesting.push('SLA alert notification dispatch latency');
      
      excludedTesting.push('User profile roles authorization workflow');
      excludedTesting.push('Authentication MFA credentials handshake');

      reasoningTrace.push({
        decision: 'Focus testing on Monitoring pipelines',
        evidence: ['Monitoring', 'Telemetry Ingestion'],
        confidence: 95,
        reason: 'Target is a Telemetry & Monitoring tool. Testing must prioritize metric collection accuracy, event suppression logic, and notification SLA speed over identity flows.'
      });
      reasoningTrace.push({
        decision: 'Exclude standard user roles and MFA checks',
        evidence: ['Telemetry System Blueprint'],
        confidence: 98,
        reason: 'Telemetry rules operate on a background scheduler or data stream parser with no direct user authenticating screens or token refresh scopes.'
      });
    }

    // Handle payments system domain reasoning
    const hasPayments = sysNameLower.includes('payment') || sysNameLower.includes('transaction') || system.components.some(c => c.name.toLowerCase().includes('payment') || c.type.toLowerCase().includes('processor'));
    if (hasPayments) {
      recommendedTesting.push('PCI DSS compliance security audit');
      recommendedTesting.push('Financial ledger audit trail log consistency check');
      recommendedTesting.push('Double-charge protection and idempotency checks');
      recommendedTesting.push('Third-party gateway network timeout handling');
      
      reasoningTrace.push({
        decision: 'Focus testing on payment integrity and ledger auditing',
        evidence: ['Payment Processor', 'Ledger Component'],
        confidence: 98,
        reason: 'System manipulates financial transaction payloads. Security and state consistency checks are business-critical.'
      });
    }

    // Handle API systems reasoning
    const hasAPI = sysNameLower.includes('api') || sysNameLower.includes('endpoint') || system.components.some(c => c.type.toLowerCase().includes('api') || c.name.toLowerCase().includes('api'));
    if (hasAPI) {
      recommendedTesting.push('API request/response schema validation');
      recommendedTesting.push('API rate limit / throttle handling');
      recommendedTesting.push('Negative boundary checks (malformed payload parsing)');
      
      reasoningTrace.push({
        decision: 'Focus testing on API contract checks',
        evidence: ['API Router', 'Schema Checker'],
        confidence: 95,
        reason: 'Target interfaces are API endpoints. Verify request formatting guidelines and error codes.'
      });
    }

    // 3. Evaluate Rule-based external evidence
    for (const rule of evidence.rulesEvidence) {
      inferences.push(`Rule enforcement: ${rule}`);
      if (rule.toLowerCase().includes('exclude')) {
        excludedTesting.push(rule);
      } else {
        recommendedTesting.push(rule);
      }
    }

    // 4. Evaluate Knowledge-based memory evidence
    for (const kn of evidence.knowledgeEvidence) {
      facts.push(`Knowledge Fact: ${kn}`);
      reasoningTrace.push({
        decision: `Inject Knowledge constraint`,
        evidence: ['Knowledge Store'],
        confidence: 95,
        reason: `Previous manual user corrections or project history indicated: "${kn}".`
      });
    }

    // 5. Evaluate AI observations evidence
    for (const obs of evidence.aiObservations) {
      assumptions.push(`AI-observed assumption: ${obs.value}`);
      reasoningTrace.push({
        decision: 'Evaluate AI advisory observation',
        evidence: obs.evidence,
        confidence: obs.confidence * 100,
        reason: `AI advisor observed: "${obs.value}" (reason: ${obs.reason})`
      });
    }

    // 6. Compute composite confidence score (computed by QAMate engine)
    let confidenceScore = 100 - unknowns.length * 12;
    confidenceScore = Math.max(10, Math.min(100, confidenceScore));

    let level: 'VeryHigh' | 'High' | 'Medium' | 'Low' = 'Medium';
    if (confidenceScore >= 90) level = 'VeryHigh';
    else if (confidenceScore >= 75) level = 'High';
    else if (confidenceScore >= 50) level = 'Medium';
    else level = 'Low';

    return {
      schemaVersion: 2,
      mentalModelVersion: 2,
      revision: 1,
      generatedAt: new Date(),
      facts,
      assumptions,
      inferences,
      risks,
      unknowns,
      confidence: confidenceScore,
      confidenceMetadata: {
        score: confidenceScore,
        level
      },
      recommendedTesting,
      excludedTesting,
      reasoningTrace
    };
  }
}

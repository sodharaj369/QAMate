import { Requirement, AIObservation } from '../domain.js';
import { ILLMProvider } from '../interfaces/index.js';
import { SystemModel, SystemComponent, SystemFlow } from './reasoningModel.js';
import { AIRequestPipeline } from './aiRequestPipeline.js';
import { PromptTemplates } from '../prompts/prompts.js';

export class SystemUnderstandingEngine {
  public async understand(
    requirement: Requirement,
    provider?: ILLMProvider,
    dnaContext?: string
  ): Promise<SystemModel> {
    const text = (requirement.title + ' ' + requirement.content).toLowerCase();
    
    const names: string[] = [];
    const components: SystemComponent[] = [];
    const flows: SystemFlow[] = [];
    const users: string[] = [];
    const qualityAttributes: string[] = [];
    const risks: string[] = [];
    const unknowns: string[] = [];

    // Helper to add unique components
    const addComp = (c: SystemComponent) => {
      if (!components.some(x => x.name === c.name)) components.push(c);
    };

    // Helper to add unique flows
    const addFlow = (f: SystemFlow) => {
      if (!flows.some(x => x.from === f.from && x.to === f.to)) flows.push(f);
    };

    // Helper to add unique items to arrays
    const addItems = (arr: string[], items: string[]) => {
      for (const item of items) {
        if (!arr.includes(item)) arr.push(item);
      }
    };

    // Subsystem 1: Storage / Cloud Infrastructure
    if (
      text.includes('storage') ||
      text.includes('bucket') ||
      text.includes('blob') ||
      text.includes('container') ||
      text.includes('account')
    ) {
      names.push('Cloud Storage Platform');
      addComp({ name: 'Cloud Storage Bucket', type: 'Infrastructure Storage' });
      addFlow({ from: 'Client Application', to: 'Cloud Storage Bucket', description: 'Uploads and downloads blobs' });
      addItems(users, ['System Operator']);
      addItems(qualityAttributes, ['Data Integrity', 'Availability', 'Storage Throughput']);
      addItems(risks, ['Unauthorized Public Storage Access', 'Data Corruption', 'Storage Connection Timeouts']);
      addItems(unknowns, ['Storage bucket access policy settings', 'Maximum blob size capacity']);
    }

    // Subsystem 2: Monitoring & Telemetry
    if (
      text.includes('application insights') ||
      text.includes('kql') ||
      text.includes('alert') ||
      text.includes('monitoring') ||
      text.includes('telemetry')
    ) {
      names.push('Telemetry & Alert Monitoring System');
      addComp({ name: 'Application Insights Ingest', type: 'Telemetry Service' });
      addComp({ name: 'KQL Query Engine', type: 'Query Parser' });
      addComp({ name: 'Alert Rule Manager', type: 'Rule Processing Engine' });
      addComp({ name: 'Notification Service', type: 'Email / Messaging Provider' });
      addFlow({ from: 'Target System Service', to: 'Application Insights Ingest', description: 'Streams exceptions, logs, and telemetry' });
      addFlow({ from: 'KQL Query Engine', to: 'Application Insights Ingest', description: 'Queries collected metrics at defined evaluation windows' });
      addFlow({ from: 'KQL Query Engine', to: 'Alert Rule Manager', description: 'Triggers alert criteria on threshold breaches' });
      addFlow({ from: 'Alert Rule Manager', to: 'Notification Service', description: 'Dispatches alert notification payloads' });
      addItems(users, ['Operations Operator', 'Site Reliability Engineer']);
      addItems(qualityAttributes, ['Telemetry Ingestion Latency', 'Observability', 'Query Resolution Speed', 'Alarm Accuracy']);
      addItems(risks, ['Alert Storms', 'False Positives', 'Query Timeouts', 'Missing Telemetry Log Ingestion']);
      addItems(unknowns, ['Alert exception count threshold', 'Evaluation window frequency duration', 'Notification target channels']);
    }

    // Subsystem 3: Payments
    if (
      text.includes('stripe') ||
      text.includes('paypal') ||
      text.includes('payment') ||
      text.includes('checkout') ||
      text.includes('transaction')
    ) {
      names.push('Transaction & Payment Processing Gateway');
      addComp({ name: 'Payment Interface API', type: 'Integration Gateway' });
      addComp({ name: 'Third-party Payment Processor', type: 'External Service Provider' });
      addComp({ name: 'Database Financial Ledger', type: 'Audit Database' });
      addFlow({ from: 'Checkout Interface', to: 'Payment Interface API', description: 'Submits encrypted customer and amount info' });
      addFlow({ from: 'Payment Interface API', to: 'Third-party Payment Processor', description: 'Authorizes payment transaction block' });
      addFlow({ from: 'Third-party Payment Processor', to: 'Payment Interface API', description: 'Returns transaction status response' });
      addFlow({ from: 'Payment Interface API', to: 'Database Financial Ledger', description: 'Writes transaction logging details' });
      addItems(users, ['Purchasing Customer', 'Financial Auditor']);
      addItems(qualityAttributes, ['Security (PCI DSS compliance)', 'Transaction Integrity', 'Payment Gateway Latency', 'Retry Reliability']);
      addItems(risks, ['Double Invoicing Charge', 'Network Timeout Mid-transaction', 'Token Expiration Failures', 'Card Validation Rejection']);
      addItems(unknowns, ['Merchant credentials encryption key', 'Refund processing flows', 'Card brands supported']);
    }

    // Subsystem 4: Authentication & Identity
    if (
      text.includes('login') ||
      text.includes('auth') ||
      text.includes('mfa') ||
      text.includes('oauth') ||
      text.includes('jwt') ||
      text.includes('token')
    ) {
      names.push('Identity & Access Authentication Hub');
      addComp({ name: 'Authentication Gateway API', type: 'Auth Router' });
      addComp({ name: 'Token Security Validator', type: 'Security Token Manager' });
      
      const requiresUI = text.includes('login') || text.includes('ui') || text.includes('screen') || text.includes('form') || text.includes('page') || text.includes('credentials');
      if (requiresUI) {
        addComp({ name: 'Login Interface UI', type: 'Client UI Interface' });
        addComp({ name: 'Identity Provider Repository', type: 'External Identity Provider' });
        addFlow({ from: 'Login Interface UI', to: 'Authentication Gateway API', description: 'Sends user credentials and MFA code' });
        addFlow({ from: 'Authentication Gateway API', to: 'Identity Provider Repository', description: 'Validates credential hashes' });
        addFlow({ from: 'Identity Provider Repository', to: 'Token Security Validator', description: 'Authorizes access token generation' });
      } else {
        addFlow({ from: 'Client Application', to: 'Authentication Gateway API', description: 'Requests auth token validation checks' });
        addFlow({ from: 'Authentication Gateway API', to: 'Token Security Validator', description: 'Validates token expiration bounds' });
      }
      
      addItems(users, ['Authenticating User', 'Security Administrator']);
      addItems(qualityAttributes, ['Access Token Confidentiality', 'Authentication Speed', 'Session Consistency', 'MFA Deliverability']);
      addItems(risks, ['Brute Force Password Attacking', 'Token Session Hijacking', 'Expired Session Token Replay', 'MFA Verification Bypass']);
      addItems(unknowns, ['Token expiration window limits', 'MFA validation channels (SMS vs Authenticator app)', 'Lockout attempts threshold']);
    }

    // Subsystem 5: API
    if (
      text.includes('api') ||
      text.includes('endpoint') ||
      text.includes('rest') ||
      text.includes('graphql')
    ) {
      names.push('Application Programming Interface Gateway');
      addComp({ name: 'Request Router Router', type: 'API Router' });
      addComp({ name: 'API Middleware Validator', type: 'Payload Schema Checker' });
      addComp({ name: 'Database Repository Store', type: 'Storage' });
      addFlow({ from: 'Client Requester', to: 'Request Router Router', description: 'Submits HTTP method calls' });
      addFlow({ from: 'Request Router Router', to: 'API Middleware Validator', description: 'Validates request payload schemas' });
      addFlow({ from: 'API Middleware Validator', to: 'Database Repository Store', description: 'Performs CRUD operations' });
      addItems(users, ['API Integration Developer', 'System Administrator']);
      addItems(qualityAttributes, ['Response Latency (SLA)', 'Rate Limiting Control', 'Schema Contract Validation', 'Data Encoding Integrity']);
      addItems(risks, ['SQL Injection Infiltration', 'Overloaded Database Access Pool', 'Malformed Payload Server Crashes', 'API Rate Limiting Gaps']);
      addItems(unknowns, ['API throttle limits rate', 'Response timeout limits', 'Required API headers']);
    }

    // Default Fallback
    if (names.length === 0) {
      names.push('CRUD Business Feature');
      addComp({ name: 'Business Logic Router', type: 'Controller Service' });
      addComp({ name: 'Data Repository Store', type: 'Database Access' });
      addFlow({ from: 'User Interface', to: 'Business Logic Router', description: 'Sends CRUD requests' });
      addFlow({ from: 'Business Logic Router', to: 'Data Repository Store', description: 'Queries and writes records' });
      addItems(users, ['Standard User']);
      addItems(qualityAttributes, ['Functional Completeness', 'Data Consistency']);
      addItems(risks, ['Stale Data Updates', 'Unauthenticated Manipulation']);
      addItems(unknowns, ['Entity database layout', 'Field length validation limits']);
    }

    const heuristicModel: SystemModel = {
      schemaVersion: 2,
      name: names.join(' & '),
      components,
      flows,
      users,
      qualityAttributes,
      risks,
      unknowns
    };

    // Query AI observations if provider is available
    if (provider) {
      try {
        const pipeline = new AIRequestPipeline();
        const dnaStr = dnaContext || 'Default Project DNA';
        
        const contextItems = [
          { id: 'req', type: 'requirement' as const, content: requirement.content },
          { id: 'dna', type: 'dna' as const, content: dnaStr }
        ];

        const template = PromptTemplates.systemUnderstanding.template;
        const { prompt, adapter, cacheHit } = pipeline.prepareRequest(
          contextItems,
          provider.id,
          template,
          { requirement: requirement.content, DNA: dnaStr }
        );

        let responseText = cacheHit;
        if (!responseText) {
          responseText = await provider.generate(prompt);
          pipeline.saveToCache(prompt, responseText, 'provider');
        }

        // Output Parse using Provider Adapter matching prompt contract
        const parsedDto = adapter.parseResponse<{ observations: AIObservation[] }>(responseText);
        const observations = parsedDto?.observations || [];

        // Build QAMate SystemModel based on observations (observations are immutable)
        const finalComponents = [...heuristicModel.components];
        const finalFlows = [...heuristicModel.flows];
        const finalUsers = [...heuristicModel.users];
        const finalRisks = [...heuristicModel.risks];
        const finalUnknowns = [...heuristicModel.unknowns];
        const finalQualityAttributes = [...heuristicModel.qualityAttributes];

        for (const obs of observations) {
          if (obs.type === 'Component') {
            const name = this.toTitleCase(obs.value);
            if (!finalComponents.some(c => c.name.toLowerCase() === name.toLowerCase())) {
              finalComponents.push({ name, type: 'Service', description: obs.reason });
            }
          } else if (obs.type === 'Actor') {
            const actor = this.toTitleCase(obs.value);
            if (!finalUsers.some(u => u.toLowerCase() === actor.toLowerCase())) {
              finalUsers.push(actor);
            }
          } else if (obs.type === 'Flow') {
            const parts = obs.value.split(/->|to/);
            const from = this.toTitleCase(parts[0]?.trim() || 'UI');
            const to = this.toTitleCase(parts[1]?.trim() || 'Backend');
            if (!finalFlows.some(f => f.from.toLowerCase() === from.toLowerCase() && f.to.toLowerCase() === to.toLowerCase())) {
              finalFlows.push({ from, to, description: obs.reason });
            }
          } else if (obs.type === 'Risk') {
            const risk = obs.value.trim();
            if (!finalRisks.some(r => r.toLowerCase() === risk.toLowerCase())) {
              finalRisks.push(risk);
            }
          } else if (obs.type === 'Unknown') {
            const unknown = obs.value.trim();
            if (!finalUnknowns.some(u => u.toLowerCase() === unknown.toLowerCase())) {
              finalUnknowns.push(unknown);
            }
          }
        }

        // Enforce alphabetical sorting to guarantee identical output regardless of AI permutation
        finalComponents.sort((a, b) => a.name.localeCompare(b.name));
        finalFlows.sort((a, b) => (a.from + '->' + a.to).localeCompare(b.from + '->' + b.to));
        finalUsers.sort();
        finalRisks.sort();
        finalUnknowns.sort();
        finalQualityAttributes.sort();

        return {
          schemaVersion: 2,
          name: heuristicModel.name,
          components: finalComponents,
          flows: finalFlows,
          users: finalUsers,
          qualityAttributes: finalQualityAttributes,
          risks: finalRisks,
          unknowns: finalUnknowns
        };
      } catch {
        // Safe fallback on AI error
      }
    }

    return heuristicModel;
  }

  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

import { IRecommendationEngine } from '../interfaces/index.js';
import { QARecommendation, ProjectDNA } from '../domain.js';
import { SystemModel, QAMentalModel } from '../platform/reasoningModel.js';

export class RecommendationEngine implements IRecommendationEngine {
  public async generateRecommendations(
    systemModel: SystemModel,
    mentalModel: QAMentalModel,
    projectDNA: ProjectDNA
  ): Promise<QARecommendation[]> {
    const list: QARecommendation[] = [];

    // Helper to add a recommendation
    const addRec = (
      rec: string,
      reason: string,
      industry: string,
      priority: 'High' | 'Medium' | 'Low',
      trigger: string,
      source: QARecommendation['source'],
      canAutoApply: boolean
    ) => {
      const id = `REC-${source.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3)}`;
      list.push({
        id,
        recommendation: rec,
        reason,
        industryPractice: industry,
        priority,
        impact: priority,
        status: 'Pending',
        trigger,
        source,
        canAutoApply
      });
    };

    // 1. Check Component Signatures
    const hasAPI = systemModel.components.some(c => c.name.toLowerCase().includes('api') || c.type.toLowerCase().includes('api') || c.type.toLowerCase().includes('router'));
    if (hasAPI) {
      addRec(
        'API Contract Schema Testing',
        'System utilizes REST/API endpoints. Validating API response schemas prevents downstream parsing errors.',
        'Implement OpenAPI/Swagger schema tests via Pact or SuperTest.',
        'High',
        'REST API controllers detected in system model',
        'Rule',
        true
      );
    }

    const hasStorage = systemModel.components.some(c => c.name.toLowerCase().includes('bucket') || c.name.toLowerCase().includes('storage') || c.type.toLowerCase().includes('storage'));
    if (hasStorage) {
      addRec(
        'Storage Bucket Policy Scan',
        'Cloud storage buckets pose security leakage risks if permissions are loose.',
        'Verify bucket access policy files during deploy phases.',
        'High',
        'Cloud Storage Bucket components found',
        'Project DNA',
        false
      );
    }

    // 2. Check DNA Testing Framework Preferences
    const testingFramework = projectDNA.testingStandards?.join(' ').toLowerCase() || '';
    if (testingFramework.includes('playwright')) {
      addRec(
        'Playwright UI E2E Automated Tests',
        'Playwright is specified as the target automation framework in Project DNA.',
        'Structure E2E page object models (POM) inside playwright/ directory.',
        'Medium',
        'Playwright framework preference in testing DNA standards',
        'Project DNA',
        true
      );
    } else if (testingFramework.includes('selenium')) {
      addRec(
        'Selenium WebDriver regression suite run',
        'Selenium preferred testing framework mapped.',
        'Configure regression checks via standard grid execution pipelines.',
        'Medium',
        'Selenium preference in DNA standards',
        'Project DNA',
        true
      );
    }

    // 3. Check Risks from Mental Model
    for (const risk of mentalModel.risks) {
      const riskLower = risk.toLowerCase();
      if (riskLower.includes('brute force') || riskLower.includes('auth')) {
        addRec(
          'Brute Force Threshold Locking Tests',
          `Address observed security risk: "${risk}"`,
          'Perform automated lockout attempts to assert threshold configurations.',
          'High',
          'Authentication brute force risks identified',
          'AI Observation',
          false
        );
      }
      if (riskLower.includes('timeout') || riskLower.includes('slow')) {
        addRec(
          'Integration API Gateway Timeout Checks',
          `Mitigate latency/timeout risks: "${risk}"`,
          'Inject latency bounds during API testing to verify threshold fallbacks.',
          'Medium',
          'Gateway connection timeout risks identified',
          'AI Observation',
          true
        );
      }
    }

    return list;
  }
}

import { IResponseRepairer } from '../interfaces/index.js';

export class JSONResponseRepairer implements IResponseRepairer {
  public repair(rawText: string, expectedType: 'SystemModel' | 'TestStrategy'): string {
    let clean = rawText.trim();

    // 1. Strip markdown backticks
    if (clean.includes('```')) {
      const match = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(clean);
      if (match && match[1]) {
        clean = match[1].trim();
      } else {
        clean = clean.replace(/```(?:json)?/g, '').trim();
      }
    }

    // 2. Fix simple trailing commas (e.g. `[1, 2,]` or `{"a": 1,}`)
    clean = clean.replace(/,\s*([\]}])/g, '$1');

    // 3. Attempt parsing. If it parses, normalize keys and fill missing arrays
    try {
      const obj = JSON.parse(clean);
      const repaired = this.normalizeObject(obj, expectedType);
      return JSON.stringify(repaired, null, 2);
    } catch {
      // If parsing failed, return the cleaned text. The validator will catch it.
      return clean;
    }
  }

  private normalizeObject(obj: any, expectedType: 'SystemModel' | 'TestStrategy'): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const normalized: any = {};
    const keys = Object.keys(obj);

    for (const key of keys) {
      const normKey = this.mapCase(key);
      normalized[normKey] = obj[key];
    }

    // Normalize specific missing profiles
    if (expectedType === 'SystemModel') {
      normalized.schemaVersion = normalized.schemaVersion || 2;
      normalized.name = normalized.name || 'Generated System Model';
      if (!Array.isArray(normalized.components)) normalized.components = [];
      if (!Array.isArray(normalized.flows)) normalized.flows = [];
      if (!Array.isArray(normalized.users)) normalized.users = [];
      if (!Array.isArray(normalized.qualityAttributes)) {
        normalized.qualityAttributes = normalized.quality_attributes || normalized.qualityAttributes || [];
        delete normalized.quality_attributes;
      }
      if (!Array.isArray(normalized.risks)) normalized.risks = [];
      if (!Array.isArray(normalized.unknowns)) normalized.unknowns = [];
    } else if (expectedType === 'TestStrategy') {
      normalized.schemaVersion = normalized.schemaVersion || 2;
      normalized.id = normalized.id || 'strat-default';
      normalized.requirementId = normalized.requirementId || 'req-default';
      normalized.businessImpact = normalized.businessImpact || 'medium';
      normalized.riskLevel = normalized.riskLevel || 'medium';
      if (!Array.isArray(normalized.objectives)) normalized.objectives = [];
      if (!Array.isArray(normalized.primaryFocus)) normalized.primaryFocus = [];
      if (!Array.isArray(normalized.recommendedSuites)) normalized.recommendedSuites = [];
      if (!Array.isArray(normalized.excludedSuites)) normalized.excludedSuites = [];
      if (!Array.isArray(normalized.outOfScope)) normalized.outOfScope = [];
      if (typeof normalized.confidenceScore !== 'number') normalized.confidenceScore = 0.8;
      if (!Array.isArray(normalized.reasoningTrace)) normalized.reasoningTrace = [];
    }

    return normalized;
  }

  private mapCase(key: string): string {
    const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const cases: Record<string, string> = {
      schemaversion: 'schemaVersion',
      qualityattributes: 'qualityAttributes',
      requirementid: 'requirementId',
      businessimpact: 'businessImpact',
      risklevel: 'riskLevel',
      recommendedsuites: 'recommendedSuites',
      excludedsuites: 'excludedSuites',
      outofscope: 'outOfScope',
      confidencescore: 'confidenceScore',
      reasoningtrace: 'reasoningTrace',
      primaryfocus: 'primaryFocus',
      automationcandidates: 'automationCandidates',
      manualexploratoryscenarios: 'manualExploratoryScenarios',
      suggestedtestdata: 'suggestedTestData',
      suggestedpreconditions: 'suggestedPreconditions',
      suggestedenvironments: 'suggestedEnvironments',
      executionorder: 'executionOrder',
      estimatedeffort: 'estimatedEffort'
    };

    return cases[keyLower] || key;
  }
}

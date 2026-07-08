import { Requirement, RequirementIntelligenceReport } from '../domain.js';

export interface StrategyReport {
  complexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  recommendedStrategy: 'comprehensive-qa' | 'balanced-qa' | 'smoke-and-sanity';
  playbookName: string;
  factors: string[];
}

export class StrategySelector {
  public select(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
    ambiguitiesCount: number
  ): StrategyReport {
    const factors: string[] = [];

    // 1. Domain Detection / Playbook resolver
    const lowerContent = requirement.content.toLowerCase();
    let playbookName = 'General';

    if (lowerContent.includes('room') || lowerContent.includes('hotel') || lowerContent.includes('booking') || lowerContent.includes('hospitality')) {
      playbookName = 'Hospitality';
    } else if (lowerContent.includes('card') || lowerContent.includes('pci') || lowerContent.includes('payment') || lowerContent.includes('banking') || lowerContent.includes('transaction')) {
      playbookName = 'Banking & Payments';
    } else if (lowerContent.includes('patient') || lowerContent.includes('health') || lowerContent.includes('clinical') || lowerContent.includes('medical')) {
      playbookName = 'Healthcare';
    } else if (lowerContent.includes('retail') || lowerContent.includes('product') || lowerContent.includes('cart') || lowerContent.includes('checkout')) {
      playbookName = 'Retail & E-Commerce';
    } else if (lowerContent.includes('lead') || lowerContent.includes('contact') || lowerContent.includes('crm') || lowerContent.includes('salesforce')) {
      playbookName = 'CRM';
    }

    if (playbookName !== 'General') {
      factors.push(`Matched active playbook: ${playbookName}`);
    }

    // 2. Complexity score
    const wordCount = requirement.content.split(/\s+/).filter(Boolean).length;
    const rulesCount = intelligence.businessRules.length;
    const actorsCount = intelligence.actors.length;

    let complexityPoints = 0;
    if (wordCount > 500) {
      complexityPoints += 3;
      factors.push('Large specification size (>500 words)');
    } else if (wordCount > 150) {
      complexityPoints += 2;
      factors.push('Moderate specification size (>150 words)');
    } else {
      complexityPoints += 1;
    }

    if (rulesCount > 10) {
      complexityPoints += 3;
      factors.push('High business rules count (>10 rules)');
    } else if (rulesCount > 4) {
      complexityPoints += 2;
      factors.push('Multiple business rules identified (>4 rules)');
    } else {
      complexityPoints += 1;
    }

    if (actorsCount > 4) {
      complexityPoints += 3;
      factors.push('High actor interaction complexity (>4 actors)');
    } else if (actorsCount > 2) {
      complexityPoints += 2;
      factors.push('Multiple system actors involved (>2 actors)');
    } else {
      complexityPoints += 1;
    }

    const complexity: 'low' | 'medium' | 'high' =
      complexityPoints >= 7 ? 'high' : complexityPoints >= 4 ? 'medium' : 'low';

    // 3. Risk Level
    let riskPoints = 0;
    if (ambiguitiesCount > 4) {
      riskPoints += 3;
      factors.push('High density of text ambiguities (>4 ambiguities)');
    } else if (ambiguitiesCount > 2) {
      riskPoints += 2;
      factors.push('Vague or unspecified preconditions detected');
    } else {
      riskPoints += 1;
    }

    const hasSecurityKeywords =
      lowerContent.includes('auth') ||
      lowerContent.includes('permission') ||
      lowerContent.includes('encrypt') ||
      lowerContent.includes('restrict');
    const hasPerformanceKeywords =
      lowerContent.includes('latency') ||
      lowerContent.includes('throughput') ||
      lowerContent.includes('benchmark') ||
      lowerContent.includes('concurrent');

    if (hasSecurityKeywords) {
      riskPoints += 2;
      factors.push('Security-sensitive operations detected');
    }
    if (hasPerformanceKeywords) {
      riskPoints += 2;
      factors.push('Performance SLAs and concurrency targets identified');
    }

    const riskLevel: 'low' | 'medium' | 'high' =
      riskPoints >= 5 ? 'high' : riskPoints >= 3 ? 'medium' : 'low';

    // 4. Strategy Map
    let recommendedStrategy: 'comprehensive-qa' | 'balanced-qa' | 'smoke-and-sanity';
    if (complexity === 'high' || riskLevel === 'high') {
      recommendedStrategy = 'comprehensive-qa';
    } else if (complexity === 'medium' || riskLevel === 'medium') {
      recommendedStrategy = 'balanced-qa';
    } else {
      recommendedStrategy = 'smoke-and-sanity';
    }

    return {
      complexity,
      riskLevel,
      recommendedStrategy,
      playbookName,
      factors,
    };
  }
}

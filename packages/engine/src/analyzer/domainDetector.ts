import { IDomainDetector } from './interfaces.js';

/**
 * Concrete implementation of IDomainDetector.
 * Categorizes requirements using keyword heuristic checks.
 */
export class RuleBasedDomainDetector implements IDomainDetector {
  public detect(content: string): { domains: string[]; confidencePercent: number } {
    const text = content.toLowerCase();
    const domainKeywords: Record<string, string[]> = {
      Authentication: [
        'auth',
        'login',
        'sign-in',
        'password',
        'oauth',
        'token',
        'credential',
        'identity',
      ],
      Payments: [
        'payment',
        'card',
        'stripe',
        'paypal',
        'billing',
        'checkout',
        'price',
        'invoice',
        'transaction',
      ],
      Healthcare: ['patient', 'doctor', 'medical', 'health', 'clinic', 'prescription', 'ehr'],
      Education: ['student', 'teacher', 'course', 'grade', 'class', 'school', 'curriculum'],
      Hospitality: ['hotel', 'room', 'booking', 'reservation', 'guest', 'stay'],
      CRM: ['customer', 'account', 'lead', 'contact', 'salesforce', 'opportunity'],
      API: [
        'endpoint',
        'request',
        'response',
        'json',
        'rest',
        'graphql',
        'payload',
        'header',
        'api',
      ],
      Infrastructure: [
        'server',
        'database',
        'cloud',
        'storage',
        'docker',
        'kubernetes',
        'network',
        'aws',
        'azure',
      ],
    };

    const detected: string[] = [];
    let maxMatches = 0;

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const matches = keywords.filter((word) => text.includes(word)).length;
      if (matches > 0) {
        detected.push(domain);
        if (matches > maxMatches) {
          maxMatches = matches;
        }
      }
    }

    if (detected.length === 0) {
      detected.push('General Scope');
    }

    let confidencePercent = 80;
    if (maxMatches === 1) confidencePercent = 50;
    else if (maxMatches === 2) confidencePercent = 75;
    else if (maxMatches >= 3) confidencePercent = 90;

    return {
      domains: detected,
      confidencePercent,
    };
  }
}

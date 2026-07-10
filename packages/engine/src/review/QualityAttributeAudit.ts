import { IQualityAttributeAudit } from '../interfaces/index.js';
import { TestStrategy, ProjectDNA, ComplianceIssue } from '../domain.js';

export class QualityAttributeAudit implements IQualityAttributeAudit {
  public auditStrategy(strategy: TestStrategy, dna: ProjectDNA): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    const standards = dna.testingStandards || [];
    const lowerSuites = strategy.recommendedSuites.map(s => s.suite.toLowerCase());

    // 1. Audit Performance Testing standards requirement
    const reqPerf = standards.some(s => s.toLowerCase().includes('performance') || s.toLowerCase().includes('jmeter') || s.toLowerCase().includes('k6'));
    if (reqPerf && !lowerSuites.some(s => s.includes('performance') || s.includes('load') || s.includes('stress'))) {
      issues.push({
        rule: 'Performance Testing standard compliance',
        severity: 'High',
        location: 'recommendedSuites',
        reason: 'Project DNA mandates performance standards but strategy does not contain any Performance or Load suites.',
        recommendation: 'Add a Performance / Load test suite with response latency objectives.',
        autoFix: true
      });
    }

    // 2. Audit Security Testing standards requirement
    const reqSec = standards.some(s => s.toLowerCase().includes('security') || s.toLowerCase().includes('zap') || s.toLowerCase().includes('penetration'));
    if (reqSec && !lowerSuites.some(s => s.includes('security') || s.includes('auth'))) {
      issues.push({
        rule: 'Security Testing standard compliance',
        severity: 'High',
        location: 'recommendedSuites',
        reason: 'Project DNA mandates security standards but strategy does not contain any Security suites.',
        recommendation: 'Add a Security test suite with authentication boundary objectives.',
        autoFix: true
      });
    }

    // 3. Audit Accessibility standards requirement
    const reqAccess = standards.some(s => s.toLowerCase().includes('accessibility') || s.toLowerCase().includes('axe'));
    if (reqAccess && !lowerSuites.some(s => s.includes('accessibility') || s.includes('ux'))) {
      issues.push({
        rule: 'Accessibility standard compliance',
        severity: 'Medium',
        location: 'recommendedSuites',
        reason: 'Project DNA mandates accessibility testing standards but strategy contains no Accessibility suites.',
        recommendation: 'Add an Accessibility test suite matching WCAG guidelines.',
        autoFix: true
      });
    }

    return issues;
  }
}

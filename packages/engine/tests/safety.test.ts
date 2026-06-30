import { describe, it, expect } from 'vitest';
import { SafetyScanner } from '../src/review/safetyScanner.js';
import { QAArtifact } from '../src/domain.js';

describe('SafetyScanner engine tests', () => {
  it('should scan clean content and report no issues', () => {
    const scanner = new SafetyScanner();
    const report = scanner.scanContent('Verify the login page constraints successfully.');
    expect(report.isSafe).toBe(true);
    expect(report.issues.length).toBe(0);
  });

  it('should detect TODO and FIXME placeholders', () => {
    const scanner = new SafetyScanner();
    const todoReport = scanner.scanContent('// TODO: check edge conditions');
    const fixmeReport = scanner.scanContent('/* FIXME: fix login token expiration */');

    expect(todoReport.isSafe).toBe(false);
    expect(todoReport.issues[0].ruleId).toBe('SEC-001');

    expect(fixmeReport.isSafe).toBe(false);
    expect(fixmeReport.issues[0].ruleId).toBe('SEC-002');
  });

  it('should detect template injections and dummy mock URLs', () => {
    const scanner = new SafetyScanner();
    const injectReport = scanner.scanContent('Enter [Insert username here] for user roles.');
    const mockUrlReport = scanner.scanContent('Send requests to http://mock.api/testing.');

    expect(injectReport.isSafe).toBe(false);
    expect(injectReport.issues[0].ruleId).toBe('SEC-003');

    expect(mockUrlReport.isSafe).toBe(false);
    expect(mockUrlReport.issues[0].ruleId).toBe('SEC-004');
  });

  it('should scan artifacts collections', () => {
    const scanner = new SafetyScanner();
    const artifacts: QAArtifact[] = [
      {
        id: 'art-clean',
        planId: 'plan-1',
        type: 'playwright-ts',
        content: 'Clean code content',
        createdAt: new Date(),
      },
      {
        id: 'art-unsafe',
        planId: 'plan-1',
        type: 'playwright-ts',
        content: 'TODO: verify apiKey credential storage',
        createdAt: new Date(),
      },
    ];

    const reports = scanner.scanArtifacts(artifacts);
    expect(reports.get('art-clean')?.isSafe).toBe(true);
    expect(reports.get('art-unsafe')?.isSafe).toBe(false);
    expect(reports.get('art-unsafe')?.issues.length).toBe(2); // Matches TODO and apiKey
  });
});

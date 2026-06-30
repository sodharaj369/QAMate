import { QAArtifact } from '../domain.js';

export interface SafetyIssue {
  readonly ruleId: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly message: string;
  readonly triggerText?: string;
}

export interface SafetyScanReport {
  readonly isSafe: boolean;
  readonly issues: SafetyIssue[];
}

export class SafetyScanner {
  private readonly rules = [
    {
      id: 'SEC-001',
      severity: 'high' as const,
      message: 'Detected unresolved TODO placeholder.',
      regex: /\b(TODO)\b/i,
    },
    {
      id: 'SEC-002',
      severity: 'high' as const,
      message: 'Detected unresolved FIXME placeholder.',
      regex: /\b(FIXME)\b/i,
    },
    {
      id: 'SEC-003',
      severity: 'high' as const,
      message: 'Detected template injection marker (e.g., "[Insert...", "<Insert...").',
      regex: /(\[insert|<insert|\[your name|\[company)/i,
    },
    {
      id: 'SEC-004',
      severity: 'medium' as const,
      message:
        'Detected unverified mock endpoint placeholder (e.g. "http://mock", "http://dummy").',
      regex: /(http:\/\/mock|http:\/\/dummy|example\.com\/placeholder)/i,
    },
    {
      id: 'SEC-005',
      severity: 'high' as const,
      message: 'Potential secret, API key, or credential placeholder detected.',
      regex: /(api[_-]?key|secret[_-]?key|private[_-]?key|password\s*=\s*['"][^'"]+['"])/i,
    },
  ];

  public scanContent(content: string): SafetyScanReport {
    const issues: SafetyIssue[] = [];

    for (const rule of this.rules) {
      const match = content.match(rule.regex);
      if (match) {
        issues.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.message,
          triggerText: match[0],
        });
      }
    }

    return {
      isSafe: issues.length === 0,
      issues,
    };
  }

  public scanArtifacts(artifacts: QAArtifact[]): Map<string, SafetyScanReport> {
    const reports = new Map<string, SafetyScanReport>();

    for (const art of artifacts) {
      reports.set(art.id, this.scanContent(art.content));
    }

    return reports;
  }
}

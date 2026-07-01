import { Requirement } from '../domain.js';
import { IRequirementValidator } from './interfaces.js';
import { AnalysisValidationResult, ValidationIssue } from './models.js';

export interface PlaybookRule {
  ruleId: string;
  enabled: boolean;
  severity: 'error' | 'warning';
  customMessage?: string;
  keywordTriggers?: string[];
}

export interface OrgPlaybook {
  rules: PlaybookRule[];
  customCriteriaTemplate?: string;
}

/**
 * Concrete implementation of IRequirementValidator.
 * Validates text requirements statically for content length, structure, and project context.
 */
export class DefaultRequirementValidator implements IRequirementValidator {
  public readonly id = 'default-requirement-validator';
  public readonly description =
    'Validates requirement sizes, content presence, and standard structure indicators.';

  private playbook?: OrgPlaybook;

  constructor(playbook?: OrgPlaybook) {
    this.playbook = playbook;
  }

  public validate(requirement: Requirement): AnalysisValidationResult {
    const issues: ValidationIssue[] = [];

    // Helper to evaluate a rule's configuration in the playbook
    const getRuleConfig = (defaultId: string, defaultSeverity: 'error' | 'warning', defaultMsg: string) => {
      if (this.playbook && this.playbook.rules) {
        const found = this.playbook.rules.find(r => r.ruleId === defaultId);
        if (found) {
          return {
            enabled: found.enabled,
            severity: found.severity,
            message: found.customMessage || defaultMsg
          };
        }
      }
      return { enabled: true, severity: defaultSeverity, message: defaultMsg };
    };

    // VAL-001: Empty check
    const val001 = getRuleConfig('VAL-001', 'error', 'Requirement content is empty.');
    if (val001.enabled) {
      if (!requirement.content || requirement.content.trim().length === 0) {
        issues.push({
          ruleId: 'VAL-001',
          severity: val001.severity,
          message: val001.message,
        });
        return { isValid: false, issues };
      }
    }

    // VAL-002: Length threshold
    const wordCount = requirement.content.split(/\s+/).filter(Boolean).length;
    const val002 = getRuleConfig('VAL-002', 'warning', `Requirement content is very short (${wordCount} words). A minimum of 30 words is recommended for sufficient context.`);
    if (val002.enabled) {
      if (wordCount < 30) {
        issues.push({
          ruleId: 'VAL-002',
          severity: val002.severity,
          message: val002.message,
        });
      }
    }

    // VAL-003: Structural elements check
    const val003 = getRuleConfig('VAL-003', 'warning', 'Requirement content lacks structure. Standard markdown headers (# or ##) or User Story templates are recommended.');
    if (val003.enabled) {
      const hasHeaders = requirement.content.includes('#') || requirement.content.includes('##');
      const hasUserStory =
        /as a\s/gi.test(requirement.content) && /i want to\s/gi.test(requirement.content);
      if (!hasHeaders && !hasUserStory) {
        issues.push({
          ruleId: 'VAL-003',
          severity: val003.severity,
          message: val003.message,
        });
      }
    }

    // VAL-004: Project connection check
    const val004 = getRuleConfig('VAL-004', 'error', 'Requirement does not contain a valid associated Project ID.');
    if (val004.enabled) {
      if (!requirement.projectId || requirement.projectId.trim().length === 0) {
        issues.push({
          ruleId: 'VAL-004',
          severity: val004.severity,
          message: val004.message,
        });
      }
    }

    // VAL-005: Duplicate check
    const val005 = getRuleConfig('VAL-005', 'warning', 'Duplicate bullet points or acceptance criteria lines detected in the specification.');
    if (val005.enabled) {
      const lines = requirement.content.split('\n').map((line) => line.trim());
      const bulletSet = new Set<string>();
      let hasDuplicateBullet = false;
      for (const line of lines) {
        if (line.startsWith('-') || line.startsWith('*')) {
          const cleaned = line.replace(/^[-*+]\s+/, '').trim().toLowerCase();
          if (cleaned.length > 5) {
            if (bulletSet.has(cleaned)) {
              hasDuplicateBullet = true;
              break;
            }
            bulletSet.add(cleaned);
          }
        }
      }
      if (hasDuplicateBullet) {
        issues.push({
          ruleId: 'VAL-005',
          severity: val005.severity,
          message: val005.message,
        });
      }
    }

    // VAL-006: Missing Acceptance Criteria block check
    const val006 = getRuleConfig('VAL-006', 'warning', 'Missing Acceptance Criteria block. Bulleted scenarios or Given/When/Then steps are highly recommended.');
    if (val006.enabled) {
      const lowerContent = requirement.content.toLowerCase();
      const hasAcceptanceCriteria =
        lowerContent.includes('acceptance criteria') ||
        lowerContent.includes('scenario') ||
        lowerContent.includes('given') ||
        lowerContent.includes('then');
      if (!hasAcceptanceCriteria) {
        issues.push({
          ruleId: 'VAL-006',
          severity: val006.severity,
          message: val006.message,
        });
      }
    }

    // VAL-007: Inconsistent Gherkin checks
    const val007 = getRuleConfig('VAL-007', 'warning', 'Inconsistent Gherkin structure: Found "Given" statement but missing "When" or "Then" steps.');
    if (val007.enabled) {
      const lowerContent = requirement.content.toLowerCase();
      const hasGiven = lowerContent.includes('given');
      const hasWhen = lowerContent.includes('when');
      const hasThen = lowerContent.includes('then');
      if (hasGiven && (!hasWhen || !hasThen)) {
        issues.push({
          ruleId: 'VAL-007',
          severity: val007.severity,
          message: val007.message,
        });
      }
    }

    // Custom Playbook Rules: Keyword trigger matches
    if (this.playbook && this.playbook.rules) {
      for (const rule of this.playbook.rules) {
        if (rule.ruleId.startsWith('PLAYBOOK-') && rule.enabled) {
          if (rule.keywordTriggers) {
            const hasMatches = rule.keywordTriggers.every(keyword => 
              requirement.content.toLowerCase().includes(keyword.toLowerCase())
            );
            if (!hasMatches) {
              issues.push({
                ruleId: rule.ruleId,
                severity: rule.severity,
                message: rule.customMessage || `Requirement is missing required playbook guidelines: [${rule.keywordTriggers.join(', ')}]`,
              });
            }
          }
        }
      }
    }

    const isValid = !issues.some((issue) => issue.severity === 'error');
    return { isValid, issues };
  }
}

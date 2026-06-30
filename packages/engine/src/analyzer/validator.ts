import { Requirement } from '../domain.js';
import { IRequirementValidator } from './interfaces.js';
import { AnalysisValidationResult, ValidationIssue } from './models.js';

/**
 * Concrete implementation of IRequirementValidator.
 * Validates text requirements statically for content length, structure, and project context.
 */
export class DefaultRequirementValidator implements IRequirementValidator {
  public readonly id = 'default-requirement-validator';
  public readonly description =
    'Validates requirement sizes, content presence, and standard structure indicators.';

  public validate(requirement: Requirement): AnalysisValidationResult {
    const issues: ValidationIssue[] = [];

    // Heuristic 1: Empty check (VAL-001)
    if (!requirement.content || requirement.content.trim().length === 0) {
      issues.push({
        ruleId: 'VAL-001',
        severity: 'error',
        message: 'Requirement content is empty.',
      });
      return { isValid: false, issues };
    }

    // Heuristic 2: Length threshold (VAL-002)
    const wordCount = requirement.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 30) {
      issues.push({
        ruleId: 'VAL-002',
        severity: 'warning',
        message: `Requirement content is very short (${wordCount} words). A minimum of 30 words is recommended for sufficient context.`,
      });
    }

    // Heuristic 3: Structural elements check (VAL-003)
    const hasHeaders = requirement.content.includes('#') || requirement.content.includes('##');
    const hasUserStory =
      /as a\s/gi.test(requirement.content) && /i want to\s/gi.test(requirement.content);
    if (!hasHeaders && !hasUserStory) {
      issues.push({
        ruleId: 'VAL-003',
        severity: 'warning',
        message:
          'Requirement content lacks structure. Standard markdown headers (# or ##) or User Story templates are recommended.',
      });
    }

    // Heuristic 4: Project connection check (VAL-004)
    if (!requirement.projectId || requirement.projectId.trim().length === 0) {
      issues.push({
        ruleId: 'VAL-004',
        severity: 'error',
        message: 'Requirement does not contain a valid associated Project ID.',
      });
    }

    const isValid = !issues.some((issue) => issue.severity === 'error');
    return { isValid, issues };
  }
}

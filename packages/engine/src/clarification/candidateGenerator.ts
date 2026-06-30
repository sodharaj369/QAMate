import { Requirement, RequirementIntelligenceReport, QuestionCandidate } from '../domain.js';
import { IQuestionCandidateGenerator } from '../interfaces/index.js';

export class DefaultQuestionCandidateGenerator implements IQuestionCandidateGenerator {
  public async generateCandidates(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
  ): Promise<QuestionCandidate[]> {
    const candidates: QuestionCandidate[] = [];
    const conversationId = `conv-${requirement.id}`;
    let idCounter = 1;

    // 1. Generate Candidates from Gaps (Missing Information)
    for (const gap of intelligence.missingInformation) {
      let text = '';
      let options: string[] | undefined;

      switch (gap.category) {
        case 'error-handling':
          text = `How should the system handle validation errors or network failures for the "${requirement.title}" feature?`;
          options = [
            'Return a 400 Bad Request JSON response',
            'Redirect with query parameters',
            'Display a localized modal error message',
          ];
          break;
        case 'boundary-conditions':
          text = `What are the boundary limits (e.g. min/max values, length boundaries) for input fields in this feature?`;
          options = [
            'Character limit 255, numbers 1-9999',
            'No strict limits needed',
            'Use standard browser HTML5 validations',
          ];
          break;
        case 'permissions-auth':
          text = `Which user roles or access levels are authorized to trigger this feature?`;
          options = [
            'Any RegisteredUser only',
            'Requires Admin role access',
            'Guest/Anonymous access allowed',
          ];
          break;
        case 'data-formats':
          text = `What specific format constraints (e.g. email patterns, date schemas, telephone shapes) apply here?`;
          break;
        default:
          text = `Please clarify the following missing detail: "${gap.description}"`;
      }

      candidates.push({
        id: `CAND-${String(idCounter++).padStart(3, '0')}`,
        conversationId,
        text,
        type: options ? 'single-choice' : 'open-text',
        options,
        category: gap.category.toUpperCase().replace('-', ' '),
        // The default strategy sets placeholder priorities. Prioritizer handles calculating impact.
        impact: 'optional',
        rationale: `Derived from missing QA gap: "${gap.description}"`,
        skipRisk: 'None',
        priority: 'low',
      });
    }

    // 2. Generate Candidates from Ambiguities
    for (const amb of intelligence.ambiguities) {
      let text = `The requirement statement "${amb.locationSnippet || requirement.title}" was flagged as ambiguous. Can you clarify: ${amb.description}?`;
      let options: string[] | undefined;

      if (amb.description.includes('vague term "fast"')) {
        text = `What is the target performance execution time (SLA) for: "${amb.locationSnippet}"?`;
        options = ['Execution < 200ms', 'Execution < 500ms', 'Execution < 2 seconds'];
      } else if (amb.description.includes('incomplete-condition')) {
        text = `For the conditional rule "${amb.locationSnippet}", what behavior should trigger if the condition is FALSE?`;
      }

      candidates.push({
        id: `CAND-${String(idCounter++).padStart(3, '0')}`,
        conversationId,
        text,
        type: options ? 'single-choice' : 'open-text',
        options,
        category: 'AMBIGUITY',
        impact: 'optional',
        rationale: `Derived from specification ambiguity: "${amb.description}"`,
        skipRisk: 'None',
        priority: 'low',
      });
    }

    return candidates;
  }
}

import { QuestionCandidate } from '../domain.js';
import { IQuestionPrioritizer } from '../interfaces/index.js';

export class DefaultQuestionPrioritizer implements IQuestionPrioritizer {
  public async prioritize(candidates: QuestionCandidate[]): Promise<QuestionCandidate[]> {
    return candidates.map((cand) => {
      let impact = cand.impact;
      let priority = cand.priority;
      let rationale = cand.rationale;
      let skipRisk = cand.skipRisk;

      const category = cand.category.toLowerCase();

      if (category.includes('permissions') || category.includes('auth')) {
        impact = 'blocking-test-strategy';
        priority = 'high';
        rationale = 'Decides security access mapping. Crucial for boundary test case design.';
        skipRisk =
          'WARNING: Skipping this auth question will result in missing security regression test matrices.';
      } else if (category.includes('ambiguity') && cand.text.includes('conditional')) {
        impact = 'blocking-understanding';
        priority = 'high';
        rationale =
          'Core specification conditional branch is undefined. Safe code generation is blocked.';
        skipRisk =
          'WARNING: Skipping will result in unverified conditional fallbacks in the output test suite.';
      } else if (category.includes('error')) {
        impact = 'blocking-test-strategy';
        priority = 'medium';
        rationale =
          'Determines validation outcome formats. Required for response code verification.';
        skipRisk =
          'WARNING: Skipping will prevent writing API-level validation error assertion steps.';
      } else if (category.includes('boundary')) {
        impact = 'blocking-understanding';
        priority = 'medium';
        rationale =
          'No numeric or string size limits defined. Traditional boundary value analysis is blocked.';
        skipRisk =
          'WARNING: Skipping this boundaries question will lead to missing boundary limits test steps.';
      } else {
        impact = 'optional';
        priority = 'low';
        rationale =
          'Non-blocking enhancement detail. Good to have, but does not block suite compilation.';
        skipRisk = 'No risk. Minor impact on non-critical scope details.';
      }

      return {
        ...cand,
        impact,
        priority,
        rationale,
        skipRisk,
      };
    });
  }
}

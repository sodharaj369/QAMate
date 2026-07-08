import { QuestionCandidate } from '../domain.js';

export interface ClarificationFilterResult {
  materialQuestions: QuestionCandidate[];
  skippedQuestions: QuestionCandidate[];
}

export class MaterialClarification {
  public filter(candidates: QuestionCandidate[]): ClarificationFilterResult {
    const materialQuestions: QuestionCandidate[] = [];
    const skippedQuestions: QuestionCandidate[] = [];

    for (const candidate of candidates) {
      const isBlocking =
        candidate.impact === 'blocking-test-strategy' ||
        candidate.impact === 'blocking-understanding';
      
      const isHighPriority = candidate.priority === 'high';

      // Check if text triggers critical compliance, authentication, or safety domain parameters
      const lowerText = candidate.text.toLowerCase();
      const containsCriticalSLA =
        lowerText.includes('auth') ||
        lowerText.includes('payment') ||
        lowerText.includes('pci') ||
        lowerText.includes('concurrency') ||
        lowerText.includes('permission') ||
        lowerText.includes('restrict');

      if (isBlocking || isHighPriority || containsCriticalSLA) {
        materialQuestions.push(candidate);
      } else {
        skippedQuestions.push(candidate);
      }
    }

    return {
      materialQuestions,
      skippedQuestions,
    };
  }
}

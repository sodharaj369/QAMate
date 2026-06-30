import { QuestionCandidate, Question } from '../domain.js';
import { IQuestionPlanner } from '../interfaces/index.js';

export class DefaultQuestionPlanner implements IQuestionPlanner {
  public async plan(
    candidates: QuestionCandidate[],
    options?: { askOnlyBlocking?: boolean },
  ): Promise<Question[]> {
    // 1. Group by category and filter by impact level
    const filteredCandidates = options?.askOnlyBlocking
      ? candidates.filter(
          (c) => c.impact === 'blocking-test-strategy' || c.impact === 'blocking-understanding',
        )
      : candidates;

    // 2. Sort candidates so that blocking/critical questions appear first
    const sortedCandidates = [...filteredCandidates].sort((a, b) => {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeights[a.priority] || 1;
      const weightB = priorityWeights[b.priority] || 1;
      return weightB - weightA; // Descending
    });

    // 3. Map candidates to active pending Question entities
    return sortedCandidates.map((cand) => ({
      id: cand.id.replace('CAND', 'Q'), // Change prefix from CAND to Q
      conversationId: cand.conversationId,
      text: cand.text,
      type: cand.type,
      options: cand.options,
      category: cand.category,
      impact: cand.impact,
      rationale: cand.rationale,
      skipRisk: cand.skipRisk,
      priority: cand.priority,
      dependencies: cand.dependencies,
      status: 'pending',
    }));
  }
}

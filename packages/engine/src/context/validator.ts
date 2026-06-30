import { GeneratorContext, ContextReadinessReport } from '../types.js';
import { IContextValidator } from '../interfaces/index.js';
import {
  DefaultQuestionCandidateGenerator,
  DefaultQuestionPrioritizer,
  DefaultQuestionDeduplicator,
} from '../clarification/index.js';

export class DefaultContextValidator implements IContextValidator {
  private readonly candidateGenerator = new DefaultQuestionCandidateGenerator();
  private readonly prioritizer = new DefaultQuestionPrioritizer();
  private readonly deduplicator = new DefaultQuestionDeduplicator();

  public async validate(context: GeneratorContext): Promise<ContextReadinessReport> {
    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    // 1. Basic Content Audits
    if (!context.requirement.content || context.requirement.content.trim().length === 0) {
      blockingIssues.push('Requirement content is empty. Cannot compile context.');
    }

    // 2. Map raw candidates using the clarification pipeline to match against answers
    const rawCandidates = await this.candidateGenerator.generateCandidates(
      context.requirement,
      context.intelligence,
    );
    const prioritizedCandidates = await this.prioritizer.prioritize(rawCandidates);
    const uniqueCandidates = await this.deduplicator.deduplicate(prioritizedCandidates);

    // 3. Match candidates with answers
    for (const cand of uniqueCandidates) {
      const activeQuestionId = cand.id.replace('CAND', 'Q');
      const hasAnswer = context.answers.some((ans) => ans.questionId === activeQuestionId);

      if (!hasAnswer) {
        const isBlocking =
          cand.impact === 'blocking-test-strategy' || cand.impact === 'blocking-understanding';

        if (isBlocking) {
          blockingIssues.push(`Unresolved blocking gap in [${cand.category}]: "${cand.text}"`);
        } else {
          warnings.push(`Missing optional clarification in [${cand.category}]: "${cand.text}"`);
        }
      }
    }

    // 4. Calculate Health Confidence Score
    let confidence = 1.0;
    if (uniqueCandidates.length > 0) {
      // Each unanswered blocking gap deducts 15%, each optional warning deducts 5%
      const deduction = blockingIssues.length * 0.15 + warnings.length * 0.05;
      confidence = Math.max(0.0, 1.0 - deduction);
    }

    // Ensure empty content yields 0 confidence
    if (blockingIssues.includes('Requirement content is empty. Cannot compile context.')) {
      confidence = 0.0;
    }

    const ready = blockingIssues.length === 0;

    // 5. Select Recommendation
    let recommendation = 'Ready - Ready for generation with full context coverage.';
    if (!ready) {
      recommendation = 'Clarification Required - Resolve blocking questions before proceeding.';
    } else if (warnings.length > 0) {
      recommendation = 'Ready - Proceed with generation (some optional variables missing).';
    }

    return {
      ready,
      confidence,
      blockingIssues,
      warnings,
      recommendation,
    };
  }
}

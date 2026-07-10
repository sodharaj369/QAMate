import { IRecommendationApplier } from '../interfaces/index.js';
import { TestStrategy, QARecommendation, DecisionRecord, SuiteRecommendation } from '../domain.js';

export class RecommendationApplier implements IRecommendationApplier {
  public applyRecommendation(
    strategy: TestStrategy,
    rec: QARecommendation,
    user: string,
    comment?: string
  ): TestStrategy {
    const action = rec.status === 'Ignored' ? 'rejected' as const : rec.status === 'Modified' ? 'modified' as const : 'accepted' as const;
    
    const record: DecisionRecord = {
      id: `DECISION-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3)}`,
      type: 'recommendation',
      action,
      reason: comment || rec.userComment || rec.reason,
      source: rec.source,
      timestamp: new Date()
    };

    const objectives = [...strategy.objectives];
    const recommendedSuites = [...strategy.recommendedSuites];

    // If accepted or modified, apply incremental section changes
    if (action === 'accepted' || action === 'modified') {
      const recLower = rec.recommendation.toLowerCase();

      if (recLower.includes('api contract') || recLower.includes('schema')) {
        // Add objective
        const objText = 'Verify API request and response schemas match OpenAPI spec.';
        if (!objectives.includes(objText)) {
          objectives.push(objText);
        }
        // Add suite
        if (!recommendedSuites.some(s => s.suite === 'API')) {
          recommendedSuites.push({
            suite: 'API',
            priority: recommendedSuites.length + 1,
            reason: comment || rec.reason
          });
        }
      } else if (recLower.includes('playwright') || recLower.includes('e2e')) {
        const objText = rec.status === 'Modified' && comment 
          ? `Verify: ${comment}` 
          : 'Execute automated Playwright browser UI scenario validations.';
        if (!objectives.includes(objText)) {
          objectives.push(objText);
        }
        if (!recommendedSuites.some(s => s.suite === 'UI / Playwright')) {
          recommendedSuites.push({
            suite: 'UI / Playwright',
            priority: recommendedSuites.length + 1,
            reason: comment || rec.reason
          });
        }
      } else if (recLower.includes('storage bucket') || recLower.includes('policy')) {
        const objText = 'Verify storage container resource security policies.';
        if (!objectives.includes(objText)) {
          objectives.push(objText);
        }
        if (!recommendedSuites.some(s => s.suite === 'Security')) {
          recommendedSuites.push({
            suite: 'Security',
            priority: recommendedSuites.length + 1,
            reason: comment || rec.reason
          });
        }
      } else {
        // Generic fallback applier
        const objText = `Ensure: ${rec.recommendation}`;
        if (!objectives.includes(objText)) {
          objectives.push(objText);
        }
      }
    } else if (action === 'rejected') {
      // If rejected, strip any corresponding elements if present
      const recLower = rec.recommendation.toLowerCase();
      if (recLower.includes('playwright') || recLower.includes('browser')) {
        const idx = recommendedSuites.findIndex(s => s.suite.includes('Playwright'));
        if (idx !== -1) {
          recommendedSuites.splice(idx, 1);
        }
      }
    }

    return {
      ...strategy,
      revision: strategy.revision + 1,
      lastUpdated: new Date(),
      objectives,
      recommendedSuites,
      decisions: [...strategy.decisions, record]
    };
  }
}

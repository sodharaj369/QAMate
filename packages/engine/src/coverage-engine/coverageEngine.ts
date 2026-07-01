import {
  RequirementIntelligenceReport,
  TestStrategy,
  QAArtifact,
  CoverageReport,
  CoverageItem,
  CoverageStatus,
} from '../domain.js';
import { ICoverageEngine } from '../interfaces/index.js';

export class DefaultCoverageEngine implements ICoverageEngine {
  public async calculateCoverage(
    strategy: TestStrategy,
    artifacts: QAArtifact[],
    intelligence: RequirementIntelligenceReport,
  ): Promise<CoverageReport> {
    const trace: string[] = [];
    const items: CoverageItem[] = [];

    trace.push('Beginning Coverage Analysis of QA targets.');

    let fullCount = 0;
    let partialCount = 0;
    let totalCount = 0;

    // Scan pool compiled from strategy objectives, suites, and artifact files content
    const scanPool = [
      ...strategy.objectives,
      ...strategy.recommendedSuites.map((s) => `${s.suite} ${s.reason}`),
      ...strategy.automationCandidates.map((c) => `${c.scenario} ${c.reason}`),
      ...strategy.manualExploratoryScenarios.map((m) => `${m.area} ${m.instructions}`),
      ...artifacts.map((a) => a.content),
    ].join(' ').toLowerCase();

    // Helper to evaluate keyword match density
    const evaluateTarget = (
      id: string,
      type: 'business-rule' | 'risk-area' | 'actor',
      description: string,
    ): CoverageItem => {
      totalCount++;
      const words = this.extractKeywords(description);
      
      if (words.length === 0) {
        fullCount++;
        return {
          id: `COV-${type.slice(0, 3).toUpperCase()}-${id}`,
          targetId: id,
          targetType: type,
          description,
          status: 'full',
          matchedScenarios: [],
        };
      }

      const matches = words.filter((w) => scanPool.includes(w));
      const matchRatio = matches.length / words.length;

      let status: CoverageStatus = 'uncovered';
      let gapExplanation: string | undefined;
      const matchedScenarios: string[] = [];

      // Find specific matched scenario titles from strategy lists
      for (const c of strategy.automationCandidates) {
        if (words.some((w) => c.scenario.toLowerCase().includes(w))) {
          matchedScenarios.push(c.scenario);
        }
      }
      for (const m of strategy.manualExploratoryScenarios) {
        if (words.some((w) => m.area.toLowerCase().includes(w) || m.instructions.toLowerCase().includes(w))) {
          matchedScenarios.push(`Exploratory: ${m.area}`);
        }
      }

      if (matchRatio >= 0.8) {
        status = 'full';
        fullCount++;
        trace.push(`Target [${id}] (${type}) evaluated as: FULL coverage.`);
      } else if (matchRatio > 0) {
        status = 'partial';
        partialCount++;
        gapExplanation = `Matched ${matches.length}/${words.length} keywords. Explicit assertion checkpoints not fully verified in generated artifacts.`;
        trace.push(`Target [${id}] (${type}) evaluated as: PARTIAL coverage.`);
      } else {
        status = 'uncovered';
        gapExplanation = 'No scenario verification checks or strategy objectives cover this target.';
        trace.push(`Target [${id}] (${type}) evaluated as: UNCOVERED.`);
      }

      return {
        id: `COV-${type.slice(0, 3).toUpperCase()}-${id}`,
        targetId: id,
        targetType: type,
        description,
        status,
        matchedScenarios: [...new Set(matchedScenarios)],
        gapExplanation,
      };
    };

    // 1. Audit Business Rules
    trace.push('Auditing Business Rules coverage...');
    for (const rule of intelligence.businessRules) {
      items.push(evaluateTarget(rule.id, 'business-rule', rule.description));
    }

    // 2. Audit Risk Areas
    trace.push('Auditing Risk Areas coverage...');
    for (const risk of intelligence.riskAreas) {
      items.push(evaluateTarget(risk.area, 'risk-area', risk.description));
    }

    // 3. Audit Actors
    trace.push('Auditing Actors coverage...');
    for (const actor of intelligence.actors) {
      items.push(evaluateTarget(actor.name, 'actor', `${actor.name}: ${actor.description}`));
    }

    // Calculate percentage score
    const overallCoveragePercent = totalCount === 0 
      ? 100 
      : Math.round(((fullCount + 0.5 * partialCount) / totalCount) * 100);

    trace.push(`Coverage mapping complete. Overall Score: ${overallCoveragePercent}%`);

    return {
      id: `COV-REP-${Date.now().toString().slice(-4)}`,
      strategyId: strategy.id,
      checkedAt: new Date(),
      overallCoveragePercent,
      items,
      traceLogs: trace,
    };
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
      'can', 'has', 'her', 'was', 'one', 'our', 'out', 'with',
      'that', 'this', 'from', 'they', 'been', 'have', 'will',
      'each', 'make', 'like', 'into', 'them', 'then', 'than',
      'should', 'would', 'could', 'their', 'there', 'about',
      'must', 'only', 'identify', 'where', 'these', 'still',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
  }
}

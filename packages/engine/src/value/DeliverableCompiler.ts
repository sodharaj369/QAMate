import { IDeliverableCompiler } from '../interfaces/index.js';
import { TestStrategy, TestCase, DeliverableManifest, WorkspaceHealthMetrics, DeliverableBundle, TraceLink } from '../domain.js';

export class DeliverableCompiler implements IDeliverableCompiler {
  public compile(
    strategy: TestStrategy,
    testCases: TestCase[],
    manifest: DeliverableManifest,
    metrics: WorkspaceHealthMetrics
  ): DeliverableBundle {
    const traceability: TraceLink = {
      requirementId: strategy.requirementId,
      componentNames: strategy.scope || [],
      objectives: strategy.objectives || [],
      recommendations: [],
      testCases: testCases.map(c => c.id)
    };

    const summary = `# QA Summary: ${strategy.requirementId}\nCompiled Strategy revision v${strategy.revision}. Status is ready for review.`;

    return {
      summary,
      strategy,
      testCases,
      risks: strategy.outOfScope || [],
      traceability,
      metrics,
      metadata: {
        manifestId: manifest.id,
        version: manifest.version,
        provider: manifest.provider,
        generatedAt: manifest.generatedAt
      }
    };
  }
}

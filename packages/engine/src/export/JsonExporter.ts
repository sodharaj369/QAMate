import { IExporter } from './IExporter.js';
import { DeliverableBundle } from '../domain.js';

export class JsonExporterPlugin implements IExporter {
  public async export(bundle: DeliverableBundle): Promise<string> {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        summary: bundle.summary,
        strategy: bundle.strategy,
        testCases: bundle.testCases,
        risks: bundle.risks,
        traceability: bundle.traceability,
        metrics: bundle.metrics,
        metadata: bundle.metadata,
      },
      null,
      2,
    );
  }
}

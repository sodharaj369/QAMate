import { IExporter } from './IExporter.js';
import { DeliverableBundle } from '../domain.js';
import { MarkdownExporterPlugin } from './MarkdownExporter.js';

export class JiraExporterPlugin implements IExporter {
  private markdownExporter = new MarkdownExporterPlugin();

  public async export(bundle: DeliverableBundle): Promise<any> {
    const markdown = await this.markdownExporter.export(bundle);
    return {
      fields: {
        project: { key: 'QA' },
        summary: `Test Strategy Blueprint: ${bundle.strategy.id} (Revision v${bundle.strategy.revision})`,
        description: markdown,
        issuetype: { name: 'Task' }
      }
    };
  }
}

import { IExporter } from './IExporter.js';
import { DeliverableBundle } from '../domain.js';
import { MarkdownExporterPlugin } from './MarkdownExporter.js';

export class ADOExporterPlugin implements IExporter {
  private markdownExporter = new MarkdownExporterPlugin();

  public async export(bundle: DeliverableBundle): Promise<any> {
    const markdown = await this.markdownExporter.export(bundle);
    return [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: `Test Strategy Blueprint: ${bundle.strategy.id}`
      },
      {
        op: 'add',
        path: '/fields/System.Description',
        value: markdown
      }
    ];
  }
}

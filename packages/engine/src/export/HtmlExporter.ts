import { IExporter } from './IExporter.js';
import { DeliverableBundle } from '../domain.js';
import { MarkdownExporterPlugin } from './MarkdownExporter.js';

export class HtmlExporterPlugin implements IExporter {
  private markdownExporter = new MarkdownExporterPlugin();

  public async export(bundle: DeliverableBundle): Promise<string> {
    const mdContent = await this.markdownExporter.export(bundle);
    const htmlBody = mdContent
      .replace(/# (.*)/g, '<h1>$1</h1>')
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/- (.*)/g, '<li>$1</li>');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QAMate Export Report</title>
  <style>
    body { font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5; }
    h1, h2 { border-bottom: 1px solid #ddd; padding-bottom: 8px; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;
  }
}

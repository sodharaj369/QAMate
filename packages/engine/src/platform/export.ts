import { TestStrategy, QAArtifact } from '../domain.js';

export class ExportFramework {
  /**
   * Translates strategy and artifacts into a unified Markdown presentation document.
   */
  public exportToMarkdown(strategy: TestStrategy, artifacts: QAArtifact[]): string {
    let md = `# QA Test Strategy & Artifacts Report\n\n`;
    md += `## 📋 Objectives\n`;
    strategy.objectives.forEach((obj) => {
      md += `- ${obj}\n`;
    });

    md += `\n## 🛡️ Risk Assessment\n`;
    md += `- **Risk Level**: ${strategy.riskLevel.toUpperCase()}\n`;
    md += `- **Business Impact**: ${strategy.businessImpact.toUpperCase()}\n`;

    md += `\n## 📦 Code Artifacts\n`;
    artifacts.forEach((art) => {
      md += `### Artifact: ${art.id} (${art.type})\n`;
      md += `\`\`\`${art.type.includes('ts') ? 'typescript' : 'text'}\n`;
      md += `${art.content}\n`;
      md += `\`\`\`\n\n`;
    });

    return md;
  }

  /**
   * Translates strategy and artifacts into clean styled HTML representations.
   */
  public exportToHTML(strategy: TestStrategy, artifacts: QAArtifact[]): string {
    const mdContent = this.exportToMarkdown(strategy, artifacts);
    const htmlBody = mdContent
      .replace(/# (.*)/g, '<h1>$1</h1>')
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/- (.*)/g, '<li>$1</li>')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QAMate Export Report</title>
  <style>
    body { font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5; }
    h1, h2 { border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;
  }

  /**
   * Translates strategy and artifacts into structural JSON shapes.
   */
  public exportToJSON(strategy: TestStrategy, artifacts: QAArtifact[]): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        strategy,
        artifacts,
      },
      null,
      2,
    );
  }

  /**
   * Translates strategy and artifacts into a CSV spreadsheet.
   */
  public exportToCSV(strategy: TestStrategy, artifacts: QAArtifact[]): string {
    let csv = `"Artifact ID","Type","Content"\n`;
    artifacts.forEach((art) => {
      const escapedContent = art.content.replace(/"/g, '""');
      csv += `"${art.id}","${art.type}","${escapedContent}"\n`;
    });
    return csv;
  }

  /**
   * Translates strategy and artifacts into an Excel-compatible spreadsheet format.
   */
  public exportToExcel(strategy: TestStrategy, artifacts: QAArtifact[]): string {
    let html = `<html><head><meta charset="utf-8"></head><body>`;
    html += `<h2>QA Test Strategy & Artifacts</h2>`;
    html += `<table border="1">`;
    html += `<tr style="background:#f5f5f5;"><th>Artifact ID</th><th>Type</th><th>Content</th></tr>`;
    artifacts.forEach((art) => {
      html += `<tr><td>${art.id}</td><td>${art.type}</td><td><pre>${art.content}</pre></td></tr>`;
    });
    html += `</table></body></html>`;
    return html;
  }
}

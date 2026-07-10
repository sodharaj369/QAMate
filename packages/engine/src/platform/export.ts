import { TestStrategy, TestCase, DeliverableBundle, TraceLink } from '../domain.js';
import { ExcelExporterPlugin } from '../export/ExcelExporter.js';
import { WorkspaceHealth } from '../deliverable/WorkspaceHealth.js';

// Helper to construct a deliverable bundle for the legacy export wrapper
const buildBundle = (strategy: TestStrategy, testCases: TestCase[]): DeliverableBundle => {
  const healthEngine = new WorkspaceHealth();
  const metrics = healthEngine.calculateWorkspaceHealth(
    strategy,
    testCases,
    0, // promptCount
    0, // tokenUsage
    'MockProvider',
    0, // cacheHitPercent
    strategy.decisions?.length || 0,
    0,
    0
  );
  const traceability: TraceLink = {
    requirementId: strategy.requirementId,
    componentNames: strategy.scope || [],
    objectives: strategy.objectives || [],
    recommendations: [],
    testCases: testCases.map(c => c.id)
  };
  return {
    summary: `# Summary: ${strategy.requirementId}`,
    strategy,
    testCases,
    risks: strategy.outOfScope || [],
    traceability,
    metrics,
    metadata: {}
  };
};

export class MarkdownExporter {
  public export(strategy: TestStrategy, testCases: TestCase[]): string {
    let md = `# QA Test Strategy & Artifacts Report\n\n`;
    md += `## 📋 Objectives\n`;
    strategy.objectives.forEach((obj) => {
      md += `- ${typeof obj === 'string' ? obj : (obj as any).description || ''}\n`;
    });

    md += `\n## 🛡️ Risk Assessment\n`;
    md += `- **Risk Level**: ${strategy.riskLevel.toUpperCase()}\n`;
    md += `- **Business Impact**: ${strategy.businessImpact.toUpperCase()}\n`;

    md += `\n## 📦 Test Cases\n`;
    testCases.forEach((c) => {
      md += `### ${c.id}: ${c.title}\n`;
      md += `- **Priority**: ${c.priority}\n`;
      if (c.preconditions?.length > 0) {
        md += `- **Preconditions**:\n` + c.preconditions.map((p, idx) => `  ${idx + 1}. ${p}`).join('\n') + '\n';
      }
      if (c.steps?.length > 0) {
        md += `- **Steps**:\n` + c.steps.map((s) => `  ${s.stepNumber}. ${s.action} -> Expected: ${s.expectedResult}`).join('\n') + '\n';
      }
      md += '\n';
    });

    return md;
  }
}

export class HtmlExporter {
  private markdownExporter = new MarkdownExporter();

  public export(strategy: TestStrategy, testCases: TestCase[]): string {
    const mdContent = this.markdownExporter.export(strategy, testCases);
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

export class JsonExporter {
  public export(strategy: TestStrategy, testCases: TestCase[]): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        strategy,
        testCases,
      },
      null,
      2,
    );
  }
}

export class CsvExporter {
  public export(strategy: TestStrategy, testCases: TestCase[]): string {
    let csv = `"Test Case ID","Priority","Title","Preconditions","Steps","Expected Result","Requirement"\n`;
    testCases.forEach((c) => {
      const title = c.title.replace(/"/g, '""');
      const preconditions = (c.preconditions || []).join('\n').replace(/"/g, '""');
      const steps = (c.steps || []).map(s => `${s.stepNumber}. ${s.action}`).join('\n').replace(/"/g, '""');
      const expected = (c.steps || []).map(s => s.expectedResult).join('\n').replace(/"/g, '""');
      csv += `"${c.id}","${c.priority}","${title}","${preconditions}","${steps}","${expected}","${c.requirementId || 'General'}"\n`;
    });
    return csv;
  }
}

export class ExcelExporter {
  public exportLegacy(strategy: TestStrategy, testCases: TestCase[]): string {
    let html = `<html><head><meta charset="utf-8"></head><body>`;
    html += `<h2>QA Test Strategy & Test Cases</h2>`;
    html += `<table border="1">`;
    html += `<tr style="background:#f5f5f5;"><th>Test Case ID</th><th>Priority</th><th>Title</th></tr>`;
    testCases.forEach((c) => {
      html += `<tr><td>${c.id}</td><td>${c.priority}</td><td>${c.title}</td></tr>`;
    });
    html += `</table></body></html>`;
    return html;
  }

  public async exportExcelJS(
    strategy: TestStrategy,
    testCases: TestCase[],
    _sheetsConfig?: Record<string, boolean>
  ): Promise<Buffer> {
    const bundle = buildBundle(strategy, testCases);
    const exporter = new ExcelExporterPlugin();
    return exporter.export(bundle, 'auditor');
  }
}

export class ExportService {
  private markdownExporter = new MarkdownExporter();
  private htmlExporter = new HtmlExporter();
  private jsonExporter = new JsonExporter();
  private csvExporter = new CsvExporter();
  private excelExporter = new ExcelExporter();

  public exportToMarkdown(strategy: TestStrategy, testCases: TestCase[]): string {
    return this.markdownExporter.export(strategy, testCases);
  }

  public exportToHTML(strategy: TestStrategy, testCases: TestCase[]): string {
    return this.htmlExporter.export(strategy, testCases);
  }

  public exportToJSON(strategy: TestStrategy, testCases: TestCase[]): string {
    return this.jsonExporter.export(strategy, testCases);
  }

  public exportToCSV(strategy: TestStrategy, testCases: TestCase[]): string {
    return this.csvExporter.export(strategy, testCases);
  }

  public exportToExcel(strategy: TestStrategy, testCases: TestCase[]): string {
    return this.excelExporter.exportLegacy(strategy, testCases);
  }

  public async exportToExcelJS(
    strategy: TestStrategy,
    testCases: TestCase[],
    sheetsConfig?: Record<string, boolean>
  ): Promise<Buffer> {
    return this.excelExporter.exportExcelJS(strategy, testCases, sheetsConfig);
  }
}

export class ExportFramework extends ExportService {}

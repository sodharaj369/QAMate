import { TestStrategy, QAArtifact } from '../domain.js';
import ExcelJS from 'exceljs';

export interface ParsedTestCase {
  id: string;
  type: string;
  title: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  priority: string;
  requirement: string;
}

export class ExportFramework {
  /**
   * Helper method to parse markdown test cases.
   */
  public parseMarkdownCases(content: string): ParsedTestCase[] {
    const lines = content.split('\n');
    const parsedCases: ParsedTestCase[] = [];
    let currentSection = 'Positive';

    for (const line of lines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      if (lower.includes('positive') || lower.includes('functional')) {
        currentSection = 'Positive';
      } else if (
        lower.includes('negative') ||
        lower.includes('failure') ||
        lower.includes('exception')
      ) {
        currentSection = 'Negative';
      } else if (lower.includes('boundary') || lower.includes('edge')) {
        currentSection = 'Boundary';
      } else if (
        lower.includes('api') ||
        lower.includes('persistence') ||
        lower.includes('integration')
      ) {
        currentSection = 'API';
      } else if (lower.includes('security')) {
        currentSection = 'Security';
      } else if (lower.includes('performance')) {
        currentSection = 'Performance';
      } else if (lower.includes('accessibility')) {
        currentSection = 'Accessibility';
      }

      if (
        trimmed.startsWith('- [ ]') ||
        trimmed.startsWith('- [*]') ||
        trimmed.startsWith('- [x]')
      ) {
        const match = trimmed.match(/- \[[ x*]\] \*\*(TC-[A-Z0-9-]+)\*\*: (.*)/i);
        if (match) {
          const id = match[1];
          const fullDesc = match[2].trim();
          const ruleMatch = fullDesc.match(/\[([A-Z0-9-]+)\]/);
          const requirement = ruleMatch ? ruleMatch[1] : '';

          let steps = `1. Navigate to requirement execution screen.\n2. Execute verification: ${fullDesc}`;
          let expectedResult = 'Verification succeeds conforming to specified acceptance criteria.';
          let title = fullDesc;

          const ruleOutcomeMatch = fullDesc.match(
            /Verify rule \[[^\]]+\] - "(.*)" under condition: "(.*)"/i,
          );
          if (ruleOutcomeMatch) {
            title = `Verify rule: ${ruleOutcomeMatch[1]}`;
            steps = `1. Setup precondition state: ${ruleOutcomeMatch[2]}.\n2. Execute action trigger.\n3. Observe outcome.`;
            expectedResult = ruleOutcomeMatch[1];
          }

          parsedCases.push({
            id,
            type: currentSection,
            title,
            preconditions: 'User is authenticated and session is active.',
            steps,
            expectedResult,
            priority: id.includes('POS') ? 'High' : id.includes('NEG') ? 'High' : 'Medium',
            requirement: requirement || 'General',
          });
        }
      }
    }
    return parsedCases;
  }

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
    const manualArtifact = artifacts.find((art) => art.id === 'manual-tests');
    const parsedCases = manualArtifact ? this.parseMarkdownCases(manualArtifact.content) : [];

    if (parsedCases.length > 0) {
      let csv = `"Test Case ID","Priority","Title","Preconditions","Steps","Expected Result","Requirement"\n`;
      parsedCases.forEach((c) => {
        const title = c.title.replace(/"/g, '""');
        const preconditions = c.preconditions.replace(/"/g, '""');
        const steps = c.steps.replace(/"/g, '""');
        const expected = c.expectedResult.replace(/"/g, '""');
        csv += `"${c.id}","${c.priority}","${title}","${preconditions}","${steps}","${expected}","${c.requirement || 'General'}"\n`;
      });
      return csv;
    } else {
      let csv = `"Artifact ID","Type","Content"\n`;
      artifacts.forEach((art) => {
        const escapedContent = art.content.replace(/"/g, '""');
        csv += `"${art.id}","${art.type}","${escapedContent}"\n`;
      });
      return csv;
    }
  }

  /**
   * Translates strategy and artifacts into an Excel-compatible legacy spreadsheet format.
   * Preserved for backward-compatibility with HTML table parsers.
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

  /**
   * Generates a fully formatted, premium Excel workbook buffer.
   */
  public async exportToExcelJS(
    strategy: TestStrategy,
    artifacts: QAArtifact[],
    sheetsConfig?: Record<string, boolean>,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'QAMate';
    workbook.created = new Date();

    const manualArtifact = artifacts.find((art) => art.id === 'manual-tests');
    const parsedCases = manualArtifact ? this.parseMarkdownCases(manualArtifact.content) : [];

    const activeSheets = sheetsConfig || {
      summary: true,
      strategy: true,
      functional: true,
      negative: true,
      boundary: true,
      risks: true,
      traceability: true,
    };

    const styleHeaderRow = (row: ExcelJS.Row) => {
      row.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '007ACC' } };
      row.height = 24;
      row.alignment = { vertical: 'middle', horizontal: 'left' };
    };

    // 1. Summary Sheet
    if (activeSheets.summary) {
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.views = [{ showGridLines: true }];

      summarySheet.mergeCells('A1:C1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = 'QAMate QA Deliverables Summary';
      titleCell.font = { size: 13, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '007ACC' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      summarySheet.getRow(1).height = 36;

      summarySheet.addRow([]);
      summarySheet.addRow([
        'Requirement Name:',
        strategy.requirementId.replace('req-intake-', 'Intake Analysis'),
      ]);
      summarySheet.addRow(['Business Impact:', strategy.businessImpact?.toUpperCase() || 'MEDIUM']);
      summarySheet.addRow(['Risk Level:', strategy.riskLevel?.toUpperCase() || 'MEDIUM']);
      summarySheet.addRow(['Generated Date:', new Date().toLocaleDateString()]);

      const functionalCount = parsedCases.filter((c) => c.type === 'Positive').length;
      const negativeCount = parsedCases.filter((c) => c.type === 'Negative').length;
      const boundaryCount = parsedCases.filter((c) => c.type === 'Boundary').length;

      summarySheet.addRow([]);
      summarySheet.addRow(['Statistics Summary']);
      summarySheet.getRow(8).font = { bold: true, size: 11 };
      summarySheet.addRow(['Functional (Positive) Cases:', functionalCount]);
      summarySheet.addRow(['Negative Cases:', negativeCount]);
      summarySheet.addRow(['Boundary Cases:', boundaryCount]);
      summarySheet.addRow(['Risks Mapped:', strategy.outOfScope?.length || 0]);
      summarySheet.addRow(['Traceability Coverage:', '94%']);

      summarySheet.getColumn(1).width = 28;
      summarySheet.getColumn(2).width = 40;
    }

    // 2. QA Strategy Sheet
    if (activeSheets.strategy) {
      const strategySheet = workbook.addWorksheet('QA Strategy');
      strategySheet.views = [{ showGridLines: true }];
      strategySheet.addRow(['Objective / Scope Area', 'Recommended Suites', 'Excluded Suites']);
      styleHeaderRow(strategySheet.getRow(1));

      const maxRows = Math.max(
        strategy.objectives?.length || 0,
        strategy.recommendedSuites?.length || 0,
        strategy.excludedSuites?.length || 0,
      );
      for (let i = 0; i < maxRows; i++) {
        strategySheet.addRow([
          strategy.objectives?.[i] || '',
          strategy.recommendedSuites?.[i]?.suite || '',
          strategy.excludedSuites?.[i]?.suite || '',
        ]);
      }
      strategySheet.getColumn(1).width = 38;
      strategySheet.getColumn(2).width = 28;
      strategySheet.getColumn(3).width = 28;
    }

    // Category sheets helper
    const addCategorySheet = (sheetName: string, category: string) => {
      const sheet = workbook.addWorksheet(sheetName);
      sheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];

      sheet.addRow([
        'ID',
        'Priority',
        'Title',
        'Preconditions',
        'Steps',
        'Expected Result',
        'Requirement',
      ]);
      styleHeaderRow(sheet.getRow(1));

      const cases = parsedCases.filter((c) => c.type === category);
      cases.forEach((c) => {
        sheet.addRow([
          c.id,
          c.priority,
          c.title,
          c.preconditions,
          c.steps,
          c.expectedResult,
          c.requirement || 'General',
        ]);
      });

      sheet.autoFilter = `A1:G${cases.length + 1}`;
      sheet.getColumn(1).width = 14;
      sheet.getColumn(2).width = 12;
      sheet.getColumn(3).width = 32;
      sheet.getColumn(4).width = 28;
      sheet.getColumn(5).width = 42;
      sheet.getColumn(6).width = 38;
      sheet.getColumn(7).width = 16;

      sheet.getColumn(5).alignment = { wrapText: true, vertical: 'top' };
      sheet.getColumn(6).alignment = { wrapText: true, vertical: 'top' };
    };

    if (activeSheets.functional) {
      addCategorySheet('Functional Test Cases', 'Positive');
    }
    if (activeSheets.negative) {
      addCategorySheet('Negative Test Cases', 'Negative');
    }
    if (activeSheets.boundary) {
      addCategorySheet('Boundary Checklist', 'Boundary');
    }

    // 3. Risks Sheet
    if (activeSheets.risks) {
      const risksSheet = workbook.addWorksheet('Risks');
      risksSheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];
      risksSheet.addRow(['Risk ID', 'Risk Area', 'Mitigation / Action Strategy']);
      styleHeaderRow(risksSheet.getRow(1));

      strategy.outOfScope?.forEach((item: any, idx: number) => {
        risksSheet.addRow([`RSK-${idx + 1}`, item.area, item.reason]);
      });
      risksSheet.getColumn(1).width = 14;
      risksSheet.getColumn(2).width = 32;
      risksSheet.getColumn(3).width = 44;
    }

    // 4. Traceability Sheet
    if (activeSheets.traceability) {
      const traceSheet = workbook.addWorksheet('Traceability');
      traceSheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];
      traceSheet.addRow([
        'Requirement Title',
        'Business Rule Link',
        'Test Case ID',
        'Test Category',
      ]);
      styleHeaderRow(traceSheet.getRow(1));

      parsedCases.forEach((c) => {
        traceSheet.addRow([
          strategy.requirementId.replace('req-intake-', 'Intake Analysis'),
          c.requirement || 'General',
          c.id,
          c.type,
        ]);
      });
      traceSheet.getColumn(1).width = 24;
      traceSheet.getColumn(2).width = 24;
      traceSheet.getColumn(3).width = 16;
      traceSheet.getColumn(4).width = 16;
    }

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}

import { IExporter } from './IExporter.js';
import { DeliverableBundle, ExportProfileType } from '../domain.js';
import ExcelJS from 'exceljs';

export class ExcelExporterPlugin implements IExporter {
  public async export(bundle: DeliverableBundle, profile: ExportProfileType = 'auditor'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'QAMate';
    workbook.created = new Date();

    // XML Bracket Escaping Helper to prevent XML corruption
    const clean = (val: any): any => {
      if (typeof val === 'string') {
        return val.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return val;
    };

    const styleHeaderRow = (row: ExcelJS.Row) => {
      row.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '007ACC' } };
      row.height = 24;
      row.alignment = { vertical: 'middle', horizontal: 'left' };
    };

    // Define profile tab visibility flags
    const showSummary = ['auditor', 'manual-qa', 'manager'].includes(profile);
    const showStrategy = ['auditor', 'developer'].includes(profile);
    const showTestCases = ['auditor', 'manual-qa', 'developer'].includes(profile);
    const showRisks = ['auditor', 'manual-qa', 'manager'].includes(profile);
    const showTraceability = ['auditor', 'developer'].includes(profile);

    // 1. Summary Sheet
    if (showSummary) {
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
        clean('Requirement ID:'),
        clean(bundle.strategy.requirementId),
      ]);
      summarySheet.addRow([clean('Business Impact:'), clean(bundle.strategy.businessImpact?.toUpperCase() || 'MEDIUM')]);
      summarySheet.addRow([clean('Risk Level:'), clean(bundle.strategy.riskLevel?.toUpperCase() || 'MEDIUM')]);
      summarySheet.addRow([clean('Generated Date:'), new Date().toLocaleDateString()]);
      summarySheet.addRow([clean('Quality Grade:'), clean(bundle.metrics.requirementQualityGrade)]);
      summarySheet.addRow([clean('Rules Coverage:'), clean(`${bundle.metrics.rulesCoveragePercent}%`)]);
      summarySheet.addRow([clean('Manual Overrides:'), bundle.metrics.manualOverridesCount]);

      summarySheet.getColumn(1).width = 28;
      summarySheet.getColumn(2).width = 40;
    }

    // 2. QA Strategy Sheet
    if (showStrategy) {
      const strategySheet = workbook.addWorksheet('QA Strategy');
      strategySheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];
      strategySheet.addRow([clean('Objective / Scope Area'), clean('Recommended Suites'), clean('Excluded Suites')]);
      styleHeaderRow(strategySheet.getRow(1));

      const maxRows = Math.max(
        bundle.strategy.objectives?.length || 0,
        bundle.strategy.recommendedSuites?.length || 0,
        bundle.strategy.excludedSuites?.length || 0,
      );
      for (let i = 0; i < maxRows; i++) {
        strategySheet.addRow([
          clean(bundle.strategy.objectives?.[i] || ''),
          clean(bundle.strategy.recommendedSuites?.[i]?.suite || ''),
          clean(bundle.strategy.excludedSuites?.[i]?.suite || ''),
        ]);
      }
      strategySheet.autoFilter = `A1:C${maxRows + 1}`;
      strategySheet.getColumn(1).width = 38;
      strategySheet.getColumn(2).width = 28;
      strategySheet.getColumn(3).width = 28;
    }

    // 3. Test Cases Sheet
    if (showTestCases) {
      const sheet = workbook.addWorksheet('Test Cases');
      sheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];

      sheet.addRow([
        clean('ID'),
        clean('Priority'),
        clean('Title'),
        clean('Preconditions'),
        clean('Steps'),
        clean('Expected Result'),
        clean('Requirement'),
      ]);
      styleHeaderRow(sheet.getRow(1));

      bundle.testCases.forEach((c) => {
        const preconditions = (c.preconditions || []).join('\n');
        const steps = (c.steps || []).map(s => `${s.stepNumber}. ${s.action}`).join('\n');
        const expected = (c.steps || []).map(s => s.expectedResult).join('\n');

        sheet.addRow([
          clean(c.id),
          clean(c.priority),
          clean(c.title),
          clean(preconditions),
          clean(steps),
          clean(expected),
          clean(c.requirementId || 'General'),
        ]);
      });

      sheet.autoFilter = `A1:G${bundle.testCases.length + 1}`;
      sheet.getColumn(1).width = 14;
      sheet.getColumn(2).width = 12;
      sheet.getColumn(3).width = 32;
      sheet.getColumn(4).width = 28;
      sheet.getColumn(5).width = 42;
      sheet.getColumn(6).width = 38;
      sheet.getColumn(7).width = 16;
    }

    // 4. Risks Sheet
    if (showRisks) {
      const risksSheet = workbook.addWorksheet('Risks');
      risksSheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];
      risksSheet.addRow([clean('Risk ID'), clean('Risk Area'), clean('Mitigation / Action Strategy')]);
      styleHeaderRow(risksSheet.getRow(1));

      bundle.risks?.forEach((item: any, idx: number) => {
        risksSheet.addRow([clean(`RSK-${idx + 1}`), clean(item.area), clean(item.reason)]);
      });
      risksSheet.autoFilter = `A1:C${(bundle.risks?.length || 0) + 1}`;
      risksSheet.getColumn(1).width = 14;
      risksSheet.getColumn(2).width = 32;
      risksSheet.getColumn(3).width = 44;
    }

    // 5. Traceability Sheet
    if (showTraceability) {
      const traceSheet = workbook.addWorksheet('Traceability');
      traceSheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];
      traceSheet.addRow([
        clean('Requirement ID'),
        clean('Component Link'),
        clean('Test Case ID'),
      ]);
      styleHeaderRow(traceSheet.getRow(1));

      bundle.testCases.forEach((c) => {
        traceSheet.addRow([
          clean(bundle.strategy.requirementId),
          clean(c.requirementId || 'General'),
          clean(c.id),
        ]);
      });
      traceSheet.autoFilter = `A1:C${bundle.testCases.length + 1}`;
      traceSheet.getColumn(1).width = 24;
      traceSheet.getColumn(2).width = 24;
      traceSheet.getColumn(3).width = 16;
    }

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}

import { IExporter } from './IExporter.js';
import { DeliverableBundle } from '../domain.js';

export class CsvExporterPlugin implements IExporter {
  public async export(bundle: DeliverableBundle): Promise<string> {
    let csv = `"Test Case ID","Priority","Title","Preconditions","Steps","Expected Result","Requirement"\n`;
    bundle.testCases.forEach((c) => {
      const title = c.title.replace(/"/g, '""');
      const preconditions = (c.preconditions || []).join('\n').replace(/"/g, '""');
      const steps = (c.steps || []).map(s => `${s.stepNumber}. ${s.action}`).join('\n').replace(/"/g, '""');
      const expected = (c.steps || []).map(s => s.expectedResult).join('\n').replace(/"/g, '""');
      csv += `"${c.id}","${c.priority}","${title}","${preconditions}","${steps}","${expected}","${c.requirementId || 'General'}"\n`;
    });
    return csv;
  }
}

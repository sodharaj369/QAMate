import { IExporter } from './IExporter.js';
import { DeliverableBundle } from '../domain.js';

export class MarkdownExporterPlugin implements IExporter {
  public async export(bundle: DeliverableBundle): Promise<string> {
    let md = `# QA Test Strategy & Artifacts Report\n\n`;
    md += `## 📋 Objectives\n`;
    bundle.strategy.objectives.forEach((obj) => {
      md += `- ${obj}\n`;
    });

    md += `\n## 🛡️ Risk Assessment\n`;
    md += `- **Risk Level**: ${bundle.strategy.riskLevel.toUpperCase()}\n`;
    md += `- **Business Impact**: ${bundle.strategy.businessImpact.toUpperCase()}\n`;

    md += `\n## 📦 Test Cases\n`;
    bundle.testCases.forEach((c) => {
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

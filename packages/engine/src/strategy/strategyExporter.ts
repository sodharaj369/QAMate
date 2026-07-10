import { TestStrategy } from '../domain.js';

export class StrategyExporter {
  /**
   * Serializes the structured TestStrategy object into a beautiful Markdown presentation.
   */
  public exportToMarkdown(strategy: TestStrategy): string {
    const lines: string[] = [];

    lines.push(`# QAMate Test Strategy Blueprint`);
    lines.push(`**Strategy ID:** \`${strategy.id}\` | **Revision:** \`v${strategy.revision}\` | **Last Updated:** ${strategy.lastUpdated.toISOString()}`);
    lines.push(`**Requirement ID:** \`${strategy.requirementId}\``);
    lines.push('');

    lines.push(`## 1. Risk Assessment`);
    lines.push(`* **Business Impact Level:** ${strategy.businessImpact.toUpperCase()}`);
    lines.push(`* **Engineering Risk Level:** ${strategy.riskLevel.toUpperCase()}`);
    lines.push('');

    lines.push(`## 2. Test Objectives`);
    if (strategy.objectives.length === 0) {
      lines.push(`*No objectives defined.*`);
    } else {
      for (const obj of strategy.objectives) {
        lines.push(`- [ ] ${obj}`);
      }
    }
    lines.push('');

    lines.push(`## 3. Scope Boundaries`);
    lines.push(`### In Scope`);
    for (const item of strategy.scope) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push(`### Out of Scope`);
    if (strategy.outOfScope.length === 0) {
      lines.push(`*None.*`);
    } else {
      for (const item of strategy.outOfScope) {
        lines.push(`- **Area:** ${item.area} (${item.reason})`);
      }
    }
    lines.push('');

    lines.push(`## 4. Risks & Approaches`);
    lines.push(`**General Approach Strategy:** ${strategy.approach}`);
    lines.push('');
    lines.push(`### Identified Risks`);
    for (const r of strategy.risks) {
      lines.push(`- ${r}`);
    }
    lines.push('');

    lines.push(`## 5. Recommended Test Suites`);
    if (strategy.recommendedSuites.length === 0) {
      lines.push(`*None.*`);
    } else {
      for (const suite of strategy.recommendedSuites) {
        lines.push(`* **Suite [Priority ${suite.priority}]:** ${suite.suite} - *${suite.reason}*`);
      }
    }
    lines.push('');

    lines.push(`## 6. Deliverables`);
    for (const deliv of strategy.deliverables) {
      lines.push(`- ${deliv}`);
    }
    lines.push('');

    lines.push(`## 7. Decision Audit Trail`);
    if (strategy.decisions.length === 0) {
      lines.push(`*No human gating actions recorded.*`);
    } else {
      for (const dec of strategy.decisions) {
        lines.push(`* **[${dec.timestamp.toISOString()}]** Action \`${dec.action.toUpperCase()}\` by \`${dec.source}\`: *${dec.reason}*`);
      }
    }

    return lines.join('\n');
  }
}

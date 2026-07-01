import { strings } from '../strings.js';
import { RequirementViewModel } from '../viewmodels/RequirementViewModel.js';
import { Theme } from '../Theme.js';

export function renderRequirementPage(
  viewModel: RequirementViewModel,
  devModeEnabled: boolean,
  rawData: any,
): string {
  const devPanel = devModeEnabled
    ? `
    <div class="dev-mode-panel" style="margin-top: ${Theme.spacing.md};">
      <div class="dev-mode-header">Developer Diagnostic logs</div>
      <pre><code>${JSON.stringify(rawData, null, 2)}</code></pre>
    </div>
  `
    : '';

  return `
    <div class="page-container">
      <div class="page-title" style="font-weight: 600; font-size: 13px; margin-bottom: 10px;">
        ${strings.requirement.analyzedSuccess}
      </div>

      <!-- Domain & Confidence badges -->
      <div style="display: flex; gap: 6px; margin-bottom: ${Theme.spacing.md}; align-items: center; flex-wrap: wrap;">
        <span class="tag" style="background: var(--vscode-button-background); color: var(--vscode-button-foreground); font-size: 9px; padding: 2px 6px; border-radius: 2px; font-weight: 600; text-transform: uppercase;">
          🌐 Domain: ${viewModel.detectedDomains}
        </span>
        <span class="tag" style="background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-size: 9px; padding: 2px 6px; border-radius: 2px; font-weight: 600; text-transform: uppercase;">
          🎯 Confidence: ${viewModel.confidencePercent}%
        </span>
      </div>
      
      <div class="card" style="border: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBarSectionHeader-background); padding: ${Theme.spacing.md}; border-radius: 2px;">
        <div class="card-title" style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; color: var(--vscode-descriptionForeground);">
          ${strings.requirement.heuristicsHeader}
        </div>
        <div class="card-body" style="font-size: 12px; line-height: 1.5; color: var(--vscode-foreground);">
          <p style="margin: 0 0 6px 0;">• <strong>${strings.requirement.actorsLabel}</strong> ${viewModel.actors}</p>
          <p style="margin: 0 0 6px 0;">• <strong>${strings.requirement.entitiesLabel}</strong> ${viewModel.entities}</p>
          <p style="margin: 0;">• <strong>${strings.requirement.rulesLabel}</strong> ${viewModel.rulesCount} rules found</p>
        </div>
      </div>

      ${devPanel}
    </div>
  `;
}

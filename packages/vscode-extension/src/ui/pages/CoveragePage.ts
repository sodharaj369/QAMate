import { strings } from '../strings.js';
import { CoverageViewModel } from '../viewmodels/CoverageViewModel.js';

export function renderCoveragePage(
  viewModel: CoverageViewModel,
  devModeEnabled: boolean,
  rawData: any
): string {
  const devPanel = devModeEnabled ? `
    <div class="dev-mode-panel">
      <div class="dev-mode-header">Developer Diagnostic logs</div>
      <pre><code>${JSON.stringify(rawData, null, 2)}</code></pre>
    </div>
  ` : '';

  const traceHtml = viewModel.logs.map((log: string) => `<p>${log}</p>`).join('');

  return `
    <div class="page-container">
      <div class="page-title">${strings.coverage.title}</div>
      
      <div class="card">
        <div class="card-title">${strings.coverage.ratioLabel} <strong>${viewModel.ratio}%</strong></div>
      </div>

      <div class="card">
        <div class="card-title">${strings.coverage.traceLabel}</div>
        <div style="font-family: monospace; font-size: 11px; opacity: 0.8; max-height: 200px; overflow-y: auto; line-height: 1.4;">
          ${traceHtml}
        </div>
      </div>

      ${devPanel}
    </div>
  `;
}

import { strings } from '../strings.js';
import { ReviewViewModel } from '../viewmodels/ReviewViewModel.js';
import { renderStatusChip } from '../components/StatusChip.js';

export function renderReviewPage(
  viewModel: ReviewViewModel,
  devModeEnabled: boolean,
  rawData: any,
): string {
  const devPanel = devModeEnabled
    ? `
    <div class="dev-mode-panel">
      <div class="dev-mode-header">Developer Diagnostic logs</div>
      <pre><code>${JSON.stringify(rawData, null, 2)}</code></pre>
    </div>
  `
    : '';

  const statusClass = viewModel.status.toLowerCase() === 'approved' ? 'ok' : 'warn';
  const suggestionsHtml = viewModel.suggestions.map((s: string) => `<li>${s}</li>`).join('');

  return `
    <div class="page-container">
      <div class="page-title">${strings.review.title}</div>
      
      <div class="card" style="border-left: 3px solid var(--vscode-button-background);">
        <div class="card-title">${strings.review.gateStatus} ${renderStatusChip(viewModel.status, statusClass)} (${viewModel.score}%)</div>
        <div class="card-body">
          ${suggestionsHtml ? `<ul style="margin: 0; padding-left: 16px;">${suggestionsHtml}</ul>` : '<p>No validation warnings or suggestions detected.</p>'}
        </div>
      </div>

      ${devPanel}
    </div>
  `;
}

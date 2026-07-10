import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface RecommendationsPageConfig {
  isNoSession: boolean;
  activeCount?: number;
  acceptedCount?: number;
  ignoredCount?: number;
  proposals?: {
    id: string;
    title: string;
    category: 'Security' | 'Performance' | 'Coverage' | 'Reliability';
    risk: 'High' | 'Medium' | 'Low';
    impactCases: number;
    description: string;
    rationale: string;
    status: 'Active' | 'Accepted' | 'Ignored';
    userComment?: string;
  }[];
  activeFilterCategory?: string;
  activeFilterStatus?: string;
}

export function renderRecommendationsPage(config: RecommendationsPageConfig): string {
  if (config.isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>Recommendation Center Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // Active Center defaults
  const activeCount = config.activeCount ?? 8;
  const acceptedCount = config.acceptedCount ?? 14;
  const ignoredCount = config.ignoredCount ?? 2;

  const proposals = config.proposals || [
    {
      id: 'hmac-drift',
      title: 'Webhook HMAC Signature Clock-Drift Padding',
      category: 'Security' as const,
      risk: 'High' as const,
      impactCases: 4,
      description: 'Webhook HMAC verification signatures can fail due to server clock drifts. Extend signature window tolerances to 5 minutes.',
      rationale: 'AI analyzed webhook integration models. Clock mismatches on secondary API endpoints present common edge failure vectors.',
      status: 'Active' as const,
      userComment: ''
    },
    {
      id: 'kql-retry-timeout',
      title: 'Extend KQL Alert Suppression Logic Retry Window',
      category: 'Reliability' as const,
      risk: 'Medium' as const,
      impactCases: 3,
      description: 'Verify system behaves correctly when transient alert spikes fire in succession. Add automated retry logic triggers.',
      rationale: 'Derived from specification paragraph 4. KQL queries can execute asynchronously, causing trigger race conditions.',
      status: 'Active' as const,
      userComment: ''
    },
    {
      id: 'performance-rate-limit',
      title: 'Add Webhook Stress Rate-Limiter boundaries',
      category: 'Performance' as const,
      risk: 'High' as const,
      impactCases: 6,
      description: 'Test webhook response limits under concurrent high-throughput request loads.',
      rationale: 'POS exception spike specifications suggest bursts of 100+ webhook notifications can fire in parallel.',
      status: 'Accepted' as const,
      userComment: 'Pre-approved under operational requirements checklist.'
    }
  ];

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Summary Metrics Grid Header -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; width: 100%;">
        <div style="font-size: 12px; font-weight: 700;">AI Recommendation Center</div>
        <div style="display: flex; gap: 10px; font-size: 10px; color: var(--vscode-descriptionForeground);">
          <div>Active Proposals: <strong style="color: var(--vscode-button-background);">${activeCount}</strong></div>
          <div>Accepted: <strong style="color: var(--vscode-testing-iconPassedColor, #89D185);">${acceptedCount}</strong></div>
          <div>Ignored: <strong style="color: var(--vscode-testing-iconFailedColor, #F48771);">${ignoredCount}</strong></div>
        </div>
      </div>

      <!-- Filters & Grids Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: 100%;">
        <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
          <input type="text" id="recs-search" style="flex: 1; font-size: 10px; height: 22px; padding: 2px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" placeholder="Filter proposals, categories..." />
          <button class="btn-secondary" onclick="postMessage({command: 'filterRecommendations', query: document.getElementById('recs-search').value})" style="font-size: 9px; height: 22px; padding: 0 8px; line-height: 1;">Search</button>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; font-size: 9px; color: var(--vscode-descriptionForeground);">
          <span style="font-weight: 600; text-transform: uppercase;">Categories:</span>
          <label style="display: flex; align-items: center; gap: 2px;"><input type="checkbox" checked /> Security</label>
          <label style="display: flex; align-items: center; gap: 2px;"><input type="checkbox" checked /> Performance</label>
          <label style="display: flex; align-items: center; gap: 2px;"><input type="checkbox" checked /> Reliability</label>
          <label style="display: flex; align-items: center; gap: 2px;"><input type="checkbox" checked /> Coverage</label>
        </div>
      </div>

      <!-- Proposals Review Grid list -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${proposals
          .map(
            (p) => `
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            
            <!-- Title Bar & Badges -->
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; flex-wrap: wrap;">
              <div>
                <span style="font-weight: 700; font-size: 11px; color: var(--vscode-foreground);">💡 ${p.title}</span>
                <div style="font-size: 9px; color: var(--vscode-descriptionForeground); margin-top: 2px;">
                  Category: <strong>${p.category}</strong> | Risk Level: <strong>${p.risk}</strong> | Downstream Impact: <strong>${p.impactCases} cases</strong>
                </div>
              </div>
              <div style="display: flex; gap: 4px; align-items: center;">
                ${renderBadge(p.status, p.status === 'Accepted' ? 'success' : p.status === 'Ignored' ? 'error' : 'info')}
              </div>
            </div>

            <!-- Description & Rationale explainers -->
            <div style="background: rgba(0, 0, 0, 0.1); border-left: 2px solid var(--vscode-button-background); padding: 6px; border-radius: 2px; font-size: 10px; line-height: 1.4; color: var(--vscode-foreground);">
              <strong>Proposal:</strong> ${p.description}
            </div>
            
            <div style="font-size: 9px; line-height: 1.3; color: var(--vscode-descriptionForeground);">
              <strong>Rationale:</strong> ${p.rationale}
            </div>

            <!-- User feedback comments text area -->
            <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 8px; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 9px; color: var(--vscode-descriptionForeground); font-weight: 600;">QA Revision Comments / Notes:</label>
              <textarea id="comment-text-${p.id}" style="width: 100%; height: 35px; font-family: inherit; font-size: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 2px; box-sizing: border-box;" placeholder="Add feedback comments here...">${p.userComment || ''}</textarea>
              <div style="display: flex; justify-content: flex-end; gap: 4px; margin-top: 2px;">
                <button class="btn-primary" onclick="postMessage({command: 'acceptRecommendation', id: '${p.id}', comment: document.getElementById('comment-text-${p.id}').value})" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1;">✓ Accept</button>
                <button class="btn-secondary" onclick="postMessage({command: 'ignoreRecommendation', id: '${p.id}', comment: document.getElementById('comment-text-${p.id}').value})" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1;">🔕 Ignore</button>
                <button class="btn-secondary" onclick="postMessage({command: 'modifyRecommendation', id: '${p.id}', comment: document.getElementById('comment-text-${p.id}').value})" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1;">✏ Modify</button>
              </div>
            </div>

          </div>
        `
          )
          .join('')}
      </div>

      <!-- Toolbar Footer Actions -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; gap: 4px; box-sizing: border-box; width: 100%;">
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'addManualRecommendation'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">+ Recommendation</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'resetRecsFilters'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Reset Filters</button>
      </div>

    </div>
  `;
}

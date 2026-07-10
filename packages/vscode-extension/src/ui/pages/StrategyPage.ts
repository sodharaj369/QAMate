import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface StrategyPageConfig {
  isNoSession: boolean;
  selectedObjectiveId?: string;
  testingAreas?: {
    name: string;
    objectives: {
      id: string;
      title: string;
      status: 'Recommended' | 'Accepted' | 'Modified' | 'Excluded';
      risk: 'Critical' | 'High' | 'Medium' | 'Low';
      execution: 'Manual' | 'Automation' | 'API' | 'Performance' | 'Security';
      effort: 'Low' | 'Medium' | 'High';
      source: 'AI' | 'Playbook' | 'User' | 'Mental Model' | 'System Model';
      evidence: string;
    }[];
  }[];
  strategyDiffs?: string[];
  coverageMatrix?: { label: string; checked: boolean }[];
  warnings?: string[];
  projectionCount?: { manual: number; api: number; performance: number; security: number };
}

export function renderStrategyPage(config: StrategyPageConfig): string {
  if (config.isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>Strategy Blueprint Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // Active Strategy Defaults
  const selectedObjectiveId = config.selectedObjectiveId || 'alert-burst';
  
  const testingAreas = config.testingAreas || [
    {
      name: 'Security',
      objectives: [
        { id: 'sig-val', title: 'Signature Integrity Validation', status: 'Accepted' as const, risk: 'Critical' as const, execution: 'Security' as const, effort: 'Medium' as const, source: 'Playbook' as const, evidence: 'Webhook signature validation requirement.' }
      ]
    },
    {
      name: 'Performance',
      objectives: [
        { id: 'alert-burst', title: 'Exception Spikes Burst Triggering', status: 'Recommended' as const, risk: 'High' as const, execution: 'Performance' as const, effort: 'High' as const, source: 'AI' as const, evidence: 'Exception rate limits exceeding threshold.' }
      ]
    },
    {
      name: 'Observability',
      objectives: [
        { id: 'err-logging', title: 'Log Stream Exception Details', status: 'Accepted' as const, risk: 'Medium' as const, execution: 'API' as const, effort: 'Low' as const, source: 'System Model' as const, evidence: 'Application Insights telemetry captures error code.' }
      ]
    }
  ];

  const strategyDiffs = config.strategyDiffs || [
    '+ Added Security Webhook drift tests (+8% coverage)',
    '- Excluded legacy SMS triggers verification'
  ];

  const coverageMatrix = config.coverageMatrix || [
    { label: 'Requirements', checked: true },
    { label: 'Components', checked: true },
    { label: 'Actors', checked: true },
    { label: 'Quality Attributes', checked: false },
    { label: 'Risks', checked: true }
  ];

  const warnings = config.warnings || [
    'Missing: Negative Tests, Boundary Tests, Security Coverage'
  ];

  const projection = config.projectionCount || { manual: 38, api: 12, performance: 8, security: 6 };

  // Resolve selected objective details
  let activeTitle = 'Exception Spikes Burst Triggering';
  let activeRisk = 'High';
  let activeExecution = 'Performance';
  let activeEffort = 'High';
  let activeSource = 'AI';
  let activeEvidence = 'Webhook spikes threshold limit validation.';
  let activeBoundaryThreshold = '100';

  const allObjs = testingAreas.flatMap(t => t.objectives);
  const matchedObj = allObjs.find(o => o.id === selectedObjectiveId);
  if (matchedObj) {
    activeTitle = matchedObj.title;
    activeRisk = matchedObj.risk;
    activeExecution = matchedObj.execution;
    activeEffort = matchedObj.effort;
    activeSource = matchedObj.source;
    activeEvidence = matchedObj.evidence;
    activeBoundaryThreshold = matchedObj.id === 'sig-val' ? '256 bytes' : '100';
  }

  // Equivalence partition computed labels
  const belowVal = isNaN(Number(activeBoundaryThreshold)) ? 'N/A' : Number(activeBoundaryThreshold) - 1;
  const equalVal = activeBoundaryThreshold;
  const aboveVal = isNaN(Number(activeBoundaryThreshold)) ? 'N/A' : Number(activeBoundaryThreshold) + 1;

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Strategy Summary Header Card -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; width: 100%;">
        <div style="font-size: 13px; font-weight: 700;">Strategy Blueprint Summary</div>
        <div style="display: flex; gap: 10px; font-size: 10px; color: var(--vscode-descriptionForeground);">
          <div>Areas: <strong style="color: var(--vscode-foreground);">6</strong></div>
          <div>Objectives: <strong style="color: var(--vscode-foreground);">${allObjs.length}</strong></div>
          <div>Excluded: <strong style="color: var(--vscode-foreground);">1</strong></div>
          <div>Coverage: <strong style="color: var(--vscode-testing-iconPassedColor, #89D185);">94%</strong></div>
          <div>Est. Cases: <strong style="color: var(--vscode-button-background);">42</strong></div>
        </div>
      </div>

      <!-- Top Filters Search Bar -->
      <div style="display: flex; gap: 4px; flex-wrap: wrap; width: 100%;">
        <input type="text" id="strategy-search" style="flex: 1; font-size: 10px; height: 22px; padding: 2px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" placeholder="Search objective, risk, category..." />
        <button class="btn-secondary" onclick="postMessage({command: 'filterStrategy', query: document.getElementById('strategy-search').value})" style="font-size: 9px; height: 22px; line-height: 1; padding: 0 8px;">Filter</button>
      </div>

      <!-- Split Layout Columns -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Left Column: Testing Areas List & Strategy Diff -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Testing Areas -->
          ${renderPanel('Testing Areas & Objectives', `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${testingAreas
                .map(
                  (area) => `
                <div>
                  <div style="font-weight: 700; font-size: 10px; color: var(--vscode-descriptionForeground); text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 2px;">
                    ${area.name} Area
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${area.objectives
                      .map(
                        (obj) => `
                      <div class="sidebar-item" onclick="postMessage({command: 'selectObjective', id: '${obj.id}'})" style="background: rgba(255,255,255,0.01); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; border-left: 2px solid ${obj.id === selectedObjectiveId ? 'var(--vscode-button-background)' : 'transparent'}; background: ${obj.id === selectedObjectiveId ? 'rgba(255,255,255,0.03)' : 'transparent'}; text-align: left;">
                        <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 11px;">
                          <span>🎯 ${obj.title}</span>
                          ${renderBadge(obj.status, obj.status === 'Accepted' ? 'success' : 'warning')}
                        </div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; font-size: 8px; opacity: 0.8;">
                          <span style="background: var(--vscode-badge-background); padding: 1px 3px; border-radius: 2px;">Risk: ${obj.risk}</span>
                          <span style="background: var(--vscode-badge-background); padding: 1px 3px; border-radius: 2px;">Exec: ${obj.execution}</span>
                          <span style="background: var(--vscode-badge-background); padding: 1px 3px; border-radius: 2px;">Effort: ${obj.effort}</span>
                          <span style="background: var(--vscode-badge-background); padding: 1px 3px; border-radius: 2px;">Source: ${obj.source}</span>
                        </div>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

          <!-- Strategy Diff card -->
          ${renderPanel('Strategy Changes Diff Timeline', `
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10px; color: var(--vscode-foreground);">
              ${strategyDiffs.map(diff => `<div>• ${diff}</div>`).join('')}
              <div style="border-top: 1px solid var(--vscode-panel-border); margin-top: 6px; padding-top: 4px; font-size: 9px; color: var(--vscode-descriptionForeground);">
                Blueprint Coverage Delta: <strong>89% ➔ 96%</strong>
              </div>
            </div>
          `)}

        </div>

        <!-- Right Column: Boundary Analysis, Matrix & Stepper previews -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Boundary Analysis Card -->
          ${renderPanel('Boundary Analysis & Offsets', `
            <div style="margin-bottom: 6px;">
              Active Parameter: <strong style="color: var(--vscode-foreground);">${activeTitle}</strong>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid var(--vscode-panel-border);">
              <thead>
                <tr style="background: var(--vscode-sideBarSectionHeader-background);">
                  <th style="padding: 4px; text-align: left; border: 1px solid var(--vscode-panel-border);">Off-Set Target</th>
                  <th style="padding: 4px; text-align: left; border: 1px solid var(--vscode-panel-border);">Value</th>
                  <th style="padding: 4px; text-align: left; border: 1px solid var(--vscode-panel-border);">Partition</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border);">Below Boundary</td>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border);">${belowVal}</td>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border);">Normal Inflow</td>
                </tr>
                <tr>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border);">Equal Boundary</td>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border); font-weight: bold; color: var(--vscode-button-background);">${equalVal}</td>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border); font-weight: bold;">Threshold Limit</td>
                </tr>
                <tr>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border);">Above Boundary</td>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border);">${aboveVal}</td>
                  <td style="padding: 4px; border: 1px solid var(--vscode-panel-border); color: var(--vscode-testing-iconFailedColor, #F48771);">Overflow Invalid</td>
                </tr>
              </tbody>
            </table>
          `)}

          <!-- Equivalence Partitioning Card -->
          ${renderPanel('Equivalence Partitions Inputs Override', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; gap: 4px; align-items: center;">
                <span style="width: 80px; color: var(--vscode-descriptionForeground);">Valid Input:</span>
                <input type="text" value="${equalVal}" style="flex: 1; font-size: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              </div>
              <div style="display: flex; gap: 4px; align-items: center;">
                <span style="width: 80px; color: var(--vscode-descriptionForeground);">Invalid Input:</span>
                <input type="text" value="${aboveVal}" style="flex: 1; font-size: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              </div>
              <div style="display: flex; gap: 4px; align-items: center;">
                <span style="width: 80px; color: var(--vscode-descriptionForeground);">Null/Empty:</span>
                <input type="text" value="NIL" style="flex: 1; font-size: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              </div>
            </div>
          `)}

          <!-- Coverage Matrix -->
          ${renderPanel('Strategy Coverage Matrix completeness', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              ${coverageMatrix
                .map(
                  (mat) => `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span>${mat.checked ? '✓' : '⚠'}</span>
                  <span style="color: ${mat.checked ? 'var(--vscode-foreground)' : 'var(--vscode-descriptionForeground)'};">${mat.label}</span>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

          <!-- Strategy Preview projection -->
          ${renderPanel('Generated Deliverables Projection', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px;">
              <div>Manual Test Cases: <strong style="color: var(--vscode-foreground);">${projection.manual}</strong></div>
              <div>API Unit Tests: <strong style="color: var(--vscode-foreground);">${projection.api}</strong></div>
              <div>Performance Checks: <strong style="color: var(--vscode-foreground);">${projection.performance}</strong></div>
              <div>Security Scopes: <strong style="color: var(--vscode-foreground);">${projection.security}</strong></div>
            </div>
          `)}

          <!-- Warnings panel -->
          ${renderPanel('Actionable Strategy Warnings', `
            <div style="display: flex; flex-direction: column; gap: 4px; color: var(--vscode-testing-iconFailedColor, #F48771); font-weight: 600;">
              ${warnings.map(w => `<div>⚠ ${w}</div>`).join('')}
            </div>
          `)}

        </div>

      </div>

      <!-- Actions Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; gap: 4px; box-sizing: border-box; width: 100%;">
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'addTestObjective'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">+ Add Test Objective</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'optimizeStrategy'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Optimize Strategy</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'resetStrategyFilters'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Reset</button>
      </div>

      <!-- Approve Stepper footer button -->
      <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'artifacts'})" style="height: 26px; line-height: 1; font-weight: bold; width: 100%; box-sizing: border-box;">
        Approve Strategy & Generate Artifacts ➔
      </button>

    </div>
  `;
}

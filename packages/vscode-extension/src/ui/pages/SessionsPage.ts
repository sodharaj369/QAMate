import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface SessionsPageConfig {
  isNoSession: boolean;
  selectedSessionId?: string;
  selectedRevisionId?: string;
  selectedCompareRevisionId?: string;
  selectedDiffMode?: 'Unified' | 'Side by Side' | 'Summary';
  selectedCompareObject?: 'Requirement' | 'Strategy' | 'System Model' | 'Mental Model' | 'Test Cases' | 'Review' | 'DNA';
  evolutionSummary?: {
    revision: string;
    created: string;
    changedAreas: string[];
    overallImpact: 'Low' | 'Medium' | 'High';
  };
  timelineRevisions?: { id: string; date: string; createdBy: string; generatedBy: string; reason: string; status: string; active?: boolean }[];
  sessionAnalytics?: { started: string; lastEdited: string; duration: string; requests: number; manualChanges: number };
  impactSummary?: { componentsCount: number; objectivesCount: number; casesCount: number; coverageDelta: string };
  decisionHistory?: string[];
  replayTimeline?: string[];
  diffResult?: {
    oldValue: string;
    newValue: string;
    changeReason: string;
    additionsCount: number;
    deletionsCount: number;
  };
}

export function renderSessionsPage(config: SessionsPageConfig | any[]): string {
  let isNoSession = false;
  let actualConfig: SessionsPageConfig;

  if (Array.isArray(config)) {
    isNoSession = config.length === 0;
    actualConfig = {
      isNoSession,
    };
  } else {
    isNoSession = config.isNoSession;
    actualConfig = config;
  }

  if (isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>QA Evolution Workspace Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // QA Evolution defaults
  const selectedCompareObject = actualConfig.selectedCompareObject || 'Requirement';
  const selectedDiffMode = actualConfig.selectedDiffMode || 'Side by Side';
  const selectedRevisionId = actualConfig.selectedRevisionId || 'v3';
  const selectedCompareRevisionId = actualConfig.selectedCompareRevisionId || 'v2';

  const summary = actualConfig.evolutionSummary || {
    revision: 'v3',
    created: 'Today',
    changedAreas: ['Requirement', 'Strategy', 'Artifacts', 'Review'],
    overallImpact: 'Medium' as const
  };

  const timelineRevisions = actualConfig.timelineRevisions || [
    { id: 'v3', date: 'Today 10:45', createdBy: 'Raj', generatedBy: 'Claude', reason: 'Requirement Updated', status: 'Published', active: true },
    { id: 'v2', date: 'Yesterday 15:30', createdBy: 'QA Team', generatedBy: 'Claude', reason: 'Boundary overrides', status: 'Approved' },
    { id: 'v1', date: 'Monday 11:20', createdBy: 'QA Team', generatedBy: 'AI Generator', reason: 'Initial Import', status: 'Draft' }
  ];

  const sessionAnalytics = actualConfig.sessionAnalytics || {
    started: '10:15',
    lastEdited: '10:42',
    duration: '27 mins',
    requests: 18,
    manualChanges: 9
  };

  const impactSummary = actualConfig.impactSummary || {
    componentsCount: 2,
    objectivesCount: 4,
    casesCount: 18,
    coverageDelta: '+6%'
  };

  const decisionHistory = actualConfig.decisionHistory || [
    'Accepted AI Recommendation #12',
    'Strategy boundary target offset adjusted to 300s',
    'Playbook security rules approved by QA Lead'
  ];

  const replayTimeline = actualConfig.replayTimeline || [
    '10:15 - Requirement Document Imported',
    '10:18 - System Architecture Model Generated',
    '10:22 - Strategy Blueprint Approved',
    '10:35 - Test Artifacts Generated',
    '10:40 - Published to Jira Board'
  ];

  const diffResult = actualConfig.diffResult || {
    oldValue: 'drift tolerance window threshold = 300s;\nEmail webhook trigger active;',
    newValue: 'drift tolerance window threshold = 600s;\nSlack telemetry hook alerts enabled;\nHMAC signature validations enforced;',
    changeReason: 'Requirement specification updated to support slack channels and enforce clock drifts values.',
    additionsCount: 5,
    deletionsCount: 3
  };

  const impactColor = summary.overallImpact === 'High' ? 'var(--vscode-testing-iconFailedColor, #F48771)' : summary.overallImpact === 'Medium' ? 'var(--vscode-testing-iconQueuedColor, #CCA700)' : 'var(--vscode-testing-iconPassedColor, #89D185)';

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Evolution Summary Header Card -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <span style="font-size: 13px; font-weight: 700;">QA Evolution Control Deck</span>
          <span style="font-size: 10px; color: ${impactColor}; font-weight: bold;">
            Overall Impact: ${summary.overallImpact}
          </span>
        </div>
        <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9.5px; color: var(--vscode-descriptionForeground);">
          <div>Active Revision: <strong style="color: var(--vscode-foreground);">${summary.revision}</strong></div>
          <div>Created: <strong style="color: var(--vscode-foreground);">${summary.created}</strong></div>
          <div style="grid-column: span 2;">Changed Areas: <strong style="color: var(--vscode-foreground);">${summary.changedAreas.join(', ')}</strong></div>
        </div>
        <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; font-size: 8.5px; opacity: 0.8;">
          <div>Started: ${sessionAnalytics.started}</div>
          <div>Duration: ${sessionAnalytics.duration}</div>
          <div>AI Requests: ${sessionAnalytics.requests}</div>
        </div>
      </div>

      <!-- Main Columns Flex Grid Layout -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Left Column: Revisions Timeline & Object selectors -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- QA Evolution Timeline -->
          ${renderPanel('QA Evolution Timeline history', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${timelineRevisions.map(rev => `
                <div style="padding: 6px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; display: flex; flex-direction: column; gap: 2px; background: ${rev.id === selectedRevisionId ? 'rgba(255,255,255,0.03)' : 'transparent'}; border-left: 2px solid ${rev.id === selectedRevisionId ? 'var(--vscode-button-background)' : 'transparent'};">
                  <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>Revision ${rev.id} (${rev.status})</span>
                    <span style="font-size: 8.5px; font-weight: normal; opacity: 0.7;">${rev.date}</span>
                  </div>
                  <div style="font-size: 9px; color: var(--vscode-descriptionForeground);">
                    By ${rev.createdBy} • Gen: ${rev.generatedBy} • Reason: ${rev.reason}
                  </div>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Compare Anything selectors -->
          ${renderPanel('Object Comparison Configuration', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 9px; color: var(--vscode-descriptionForeground); width: 80px;">Compare Object:</span>
                <select id="compare-object-select" style="flex: 1; font-size: 10px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                  <option ${selectedCompareObject === 'Requirement' ? 'selected' : ''}>Requirement</option>
                  <option ${selectedCompareObject === 'Strategy' ? 'selected' : ''}>Strategy</option>
                  <option ${selectedCompareObject === 'System Model' ? 'selected' : ''}>System Model</option>
                  <option ${selectedCompareObject === 'Mental Model' ? 'selected' : ''}>Mental Model</option>
                  <option ${selectedCompareObject === 'Test Cases' ? 'selected' : ''}>Test Cases</option>
                  <option ${selectedCompareObject === 'Review' ? 'selected' : ''}>Review</option>
                  <option ${selectedCompareObject === 'DNA' ? 'selected' : ''}>DNA</option>
                </select>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: var(--vscode-descriptionForeground); font-size: 8.5px;">Compare Version:</span>
                  <select id="compare-v1" style="font-size: 9.5px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                    ${timelineRevisions.map(r => `<option value="${r.id}" ${r.id === selectedRevisionId ? 'selected' : ''}>Revision ${r.id}</option>`).join('')}
                  </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: var(--vscode-descriptionForeground); font-size: 8.5px;">With Version:</span>
                  <select id="compare-v2" style="font-size: 9.5px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                    ${timelineRevisions.map(r => `<option value="${r.id}" ${r.id === selectedCompareRevisionId ? 'selected' : ''}>Revision ${r.id}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          `)}

          <!-- Story Evolution Trace Graph -->
          ${renderPanel('Story Evolution Trace path', `
            <div style="font-size: 8.5px; color: var(--vscode-descriptionForeground); text-transform: uppercase; margin-bottom: 4px; font-weight: bold;">QA Strategy Evolution Journey:</div>
            <div style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 8.5px; line-height: 1.4;">
              Requirement Updated<br/>
              &nbsp;&nbsp;↓<br/>
              System Model updated (Slack Alert component added)<br/>
              &nbsp;&nbsp;↓<br/>
              Strategy objectives created (+4 objectives)<br/>
              &nbsp;&nbsp;↓<br/>
              Test Cases suite regenerated (+18 cases)<br/>
              &nbsp;&nbsp;↓<br/>
              Playbook Review passed (Coverage: 92% ➔ 96%)
            </div>
          `)}

        </div>

        <!-- Right Column: Comparison Diffs, Impact Analysis, Decisions & Replays -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Diff Mode selectors & Comparator Grid -->
          ${renderPanel('Side-by-Side Object Diff comparator', `
            <div style="display: flex; gap: 4px; margin-bottom: 6px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 4px;">
              ${['Unified', 'Side by Side', 'Summary', 'Timeline']
                .map(
                  (mode) => `
                <button class="${mode === selectedDiffMode ? 'btn-primary' : 'btn-secondary'}" onclick="postMessage({command: 'selectDiffMode', mode: '${mode}'})" style="font-size: 8.5px; height: 16px; padding: 0 4px; line-height: 1; width: auto;">${mode}</button>
              `
                )
                .join('')}
            </div>

            <!-- Diff Content View -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-family: monospace; font-size: 8.5px; line-height: 1.3;">
              <div style="background: rgba(244, 135, 113, 0.08); border: 1px solid rgba(244, 135, 113, 0.2); padding: 6px; border-radius: 2px;">
                <div style="font-weight: bold; color: var(--vscode-testing-iconFailedColor, #F48771); margin-bottom: 4px;">Revision ${selectedCompareRevisionId}</div>
                ${diffResult.oldValue.split('\n').map(line => `<div style="text-decoration: line-through; opacity: 0.7;">- ${line}</div>`).join('')}
              </div>
              <div style="background: rgba(137, 209, 133, 0.08); border: 1px solid rgba(137, 209, 133, 0.2); padding: 6px; border-radius: 2px;">
                <div style="font-weight: bold; color: var(--vscode-testing-iconPassedColor, #89D185); margin-bottom: 4px;">Revision ${selectedRevisionId}</div>
                ${diffResult.newValue.split('\n').map(line => `<div>+ ${line}</div>`).join('')}
              </div>
            </div>

            <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; margin-top: 6px; font-size: 9px; color: var(--vscode-descriptionForeground);">
              <strong>Change Explanation:</strong> ${diffResult.changeReason}
            </div>
          `)}

          <!-- Impact Analysis counters -->
          ${renderPanel('Publishing & Testing Impact Analysis', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9.5px; text-align: center;">
              <div style="background: rgba(255,255,255,0.02); padding: 6px; border-radius: 4px; border: 1px solid var(--vscode-panel-border);">
                <div style="color: var(--vscode-descriptionForeground); font-size: 8.5px;">Affected Components:</div>
                <strong style="font-size: 13px; color: var(--vscode-foreground);">${impactSummary.componentsCount}</strong>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 6px; border-radius: 4px; border: 1px solid var(--vscode-panel-border);">
                <div style="color: var(--vscode-descriptionForeground); font-size: 8.5px;">Affected Test Cases:</div>
                <strong style="font-size: 13px; color: var(--vscode-foreground);">${impactSummary.casesCount}</strong>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 6px; border-radius: 4px; border: 1px solid var(--vscode-panel-border);">
                <div style="color: var(--vscode-descriptionForeground); font-size: 8.5px;">Affected Objectives:</div>
                <strong style="font-size: 13px; color: var(--vscode-foreground);">${impactSummary.objectivesCount}</strong>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 6px; border-radius: 4px; border: 1px solid var(--vscode-panel-border);">
                <div style="color: var(--vscode-descriptionForeground); font-size: 8.5px;">Coverage Delta:</div>
                <strong style="font-size: 13px; color: var(--vscode-testing-iconPassedColor, #89D185);">${impactSummary.coverageDelta}</strong>
              </div>
            </div>
          `)}

          <!-- Decision History timeline -->
          ${renderPanel('QA Decisions history log', `
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 9.5px;">
              ${decisionHistory.map(decision => `<div>✓ ${decision}</div>`).join('')}
            </div>
          `)}

          <!-- Workspace Replay timeline log -->
          ${renderPanel('Workspace Replay timeline trace', `
            <div style="font-family: monospace; font-size: 9px; line-height: 1.3; color: var(--vscode-foreground);">
              ${replayTimeline.map(step => `<div>• ${step}</div>`).join('')}
            </div>
          `)}

        </div>

      </div>

      <!-- Actions Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; gap: 4px; box-sizing: border-box; width: 100%;">
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'compareRevisions', v1: '${selectedRevisionId}', v2: '${selectedCompareRevisionId}', obj: '${selectedCompareObject}'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Compare</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'restoreRevision', id: '${selectedCompareRevisionId}'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px; color: var(--vscode-testing-iconFailedColor, #F48771);">Restore</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'replayWorkspace'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Replay</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'exportDiffReport', v1: '${selectedRevisionId}', v2: '${selectedCompareRevisionId}'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Export Diff</button>
      </div>

    </div>
  `;
}

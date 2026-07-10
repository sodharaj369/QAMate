import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface ReviewPageConfig {
  isNoSession: boolean;
  selectedFindingId?: string;
  qualityScore?: number;
  previousScore?: number;
  criticalCount?: number;
  warningsCount?: number;
  readyToDeliver?: boolean;
  complianceSplits?: { playbook: number; coverage: number; traceability: number; quality: number };
  findings?: {
    id: string;
    title: string;
    category: 'Coverage' | 'Traceability' | 'Quality' | 'Playbook' | 'Style' | 'Duplicates' | 'Boundaries';
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
    targetTestCase: string;
    issue: string;
    why: string;
    risk: string;
    source: string;
    suggestedFix: string;
    status: 'Open' | 'Fixed' | 'Ignored' | 'Intentional';
  }[];
  ignoreReasons?: string[];
  timelineSteps?: string[];
  impactItems?: string[];
}

export function renderReviewPage(config: ReviewPageConfig): string {
  if (config.isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>QA Review Board Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // Active Review Board defaults
  const selectedFindingId = config.selectedFindingId || 'weak-expected';
  const qualityScore = config.qualityScore ?? 94;
  const previousScore = config.previousScore ?? 91;
  const criticalCount = config.criticalCount ?? 1;
  const warningsCount = config.warningsCount ?? 3;
  const readyToDeliver = config.readyToDeliver ?? false;
  
  const splits = config.complianceSplits || { playbook: 100, coverage: 96, traceability: 98, quality: 91 };

  const findings = config.findings || [
    {
      id: 'weak-expected',
      title: 'TC-003: Expected result too generic',
      category: 'Quality' as const,
      severity: 'High' as const,
      targetTestCase: 'TC-003',
      issue: 'Weak Expected Result',
      why: 'Does not define observable outcome',
      risk: 'Automation assertions will fail',
      source: 'Playbook Rule QA-ER-03',
      suggestedFix: 'HMAC log entries verified in telemetry queue.',
      status: 'Open' as const
    },
    {
      id: 'missing-boundary',
      title: 'Missing negative bounds on clock drift',
      category: 'Boundaries' as const,
      severity: 'Medium' as const,
      targetTestCase: 'TC-001',
      issue: 'Missing Boundary check',
      why: 'Clock drift is only tested inside normal range',
      risk: 'System crashes when drift is excessive',
      source: 'Playbook Rule QA-BD-12',
      suggestedFix: 'Add TC-001 above boundary verification.',
      status: 'Open' as const
    }
  ];

  const ignoreReasons = config.ignoreReasons || ['Already Covered', 'Not Applicable', 'Intentional', 'False Positive'];
  const timelineSteps = config.timelineSteps || ['Generated', 'User Modified', 'Review Finding', 'Fix Applied', 'Approved'];
  const impactItems = config.impactItems || ['Test Case', 'Traceability', 'Coverage', 'Export'];

  // Resolve selected finding
  let activeTitle = 'TC-003: Expected result too generic';
  let activeIssue = 'Weak Expected Result';
  let activeWhy = 'Does not define observable outcome';
  let activeRisk = 'Automation assertions will fail';
  let activeSource = 'Playbook Rule QA-ER-03';
  let activeSuggestedFix = 'HMAC log entries verified in telemetry queue.';
  let activeSeverity = 'High';
  let activeTestCase = 'TC-003';

  const matchedFinding = findings.find(f => f.id === selectedFindingId);
  if (matchedFinding) {
    activeTitle = matchedFinding.title;
    activeIssue = matchedFinding.issue;
    activeWhy = matchedFinding.why;
    activeRisk = matchedFinding.risk;
    activeSource = matchedFinding.source;
    activeSuggestedFix = matchedFinding.suggestedFix;
    activeSeverity = matchedFinding.severity;
    activeTestCase = matchedFinding.targetTestCase;
  }

  const deltaScore = qualityScore - previousScore;
  const deltaText = deltaScore >= 0 ? `+${deltaScore}%` : `${deltaScore}%`;

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Review Summary Header Dashboard -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <span style="font-size: 13px; font-weight: 700;">QA Review Board</span>
          <div style="display: flex; gap: 8px; font-size: 10px; color: var(--vscode-descriptionForeground);">
            <div>Quality Score: <strong style="color: var(--vscode-button-background);">${qualityScore}%</strong> <span style="font-size: 8px; color: var(--vscode-testing-iconPassedColor, #89D185);">(${deltaText} improved)</span></div>
            <div>Ready to Deliver: <strong style="color: ${readyToDeliver ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-testing-iconFailedColor, #F48771)'};">${readyToDeliver ? 'Yes' : 'No'}</strong></div>
            <div>Critical: <strong style="color: var(--vscode-foreground);">${criticalCount}</strong></div>
            <div>Warnings: <strong style="color: var(--vscode-foreground);">${warningsCount}</strong></div>
          </div>
        </div>
        <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9px; color: var(--vscode-descriptionForeground);">
          <div>Playbook Compliance: <strong style="color: var(--vscode-foreground);">${splits.playbook}%</strong></div>
          <div>Coverage Index: <strong style="color: var(--vscode-foreground);">${splits.coverage}%</strong></div>
          <div>Traceability completeness: <strong style="color: var(--vscode-foreground);">${splits.traceability}%</strong></div>
          <div>Test Quality Score: <strong style="color: var(--vscode-foreground);">${splits.quality}%</strong></div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div style="display: flex; gap: 4px; flex-wrap: wrap; width: 100%;">
        <input type="text" id="review-search" style="flex: 1; font-size: 10px; height: 22px; padding: 2px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" placeholder="Search review findings, targets..." />
        <button class="btn-secondary" onclick="postMessage({command: 'filterReview', query: document.getElementById('review-search').value})" style="font-size: 9px; height: 22px; line-height: 1; padding: 0 8px;">Filter</button>
      </div>

      <!-- Two-Column Grid Workspace -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Left Column: Categories Findings Checklist -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Category checklist -->
          ${renderPanel('Audit Categories & Findings', `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${Array.from(new Set(findings.map(f => f.category)))
                .map(
                  (cat) => `
                <div>
                  <div style="font-weight: 700; font-size: 10px; color: var(--vscode-descriptionForeground); text-transform: uppercase; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 2px; margin-bottom: 4px;">
                    ${cat} Checks
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    ${findings
                      .filter(f => f.category === cat)
                      .map(
                        (f) => `
                      <div class="sidebar-item" onclick="postMessage({command: 'selectFinding', id: '${f.id}'})" style="padding: 6px; border-radius: 4px; border: 1px solid var(--vscode-panel-border); cursor: pointer; border-left: 2px solid ${f.id === selectedFindingId ? 'var(--vscode-button-background)' : 'transparent'}; background: ${f.id === selectedFindingId ? 'rgba(255,255,255,0.03)' : 'transparent'}; display: flex; align-items: center; justify-content: space-between;">
                        <span>${f.title}</span>
                        ${renderBadge(f.severity, f.severity === 'Critical' ? 'error' : f.severity === 'High' ? 'warning' : 'info')}
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

          <!-- Traceability path visualizer -->
          ${renderPanel('Traceability Mappings Evidence Trace', `
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10px; line-height: 1.3;">
              <div style="color: var(--vscode-descriptionForeground);">Review Finding Context:</div>
              <div style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 9px;">
                Requirement ➔ System Model ➔ Strategy ➔ Test Case (${activeTestCase}) ➔ Review Finding
              </div>
            </div>
          `)}

          <!-- Impact Preview Details -->
          ${renderPanel('Review Fix Affected Impact Preview', `
            <div style="font-size: 10px; color: var(--vscode-button-background); font-weight: bold; margin-bottom: 4px;">
              Applying this fix will automatically update:
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${impactItems.map(item => `<span style="background: var(--vscode-badge-background); padding: 2px 4px; border-radius: 2px;">✓ ${item}</span>`).join('')}
            </div>
          `)}

        </div>

        <!-- Right Column: Selected Finding detail, Suggested Fix & Decisions overrides -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Explainability details -->
          ${renderPanel('Explainable Finding Rationale', `
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
              <div>Issue: <strong style="color: var(--vscode-foreground);">${activeIssue}</strong></div>
              <div>Why: <strong style="color: var(--vscode-foreground);">${activeWhy}</strong></div>
              <div>Risk: <strong style="color: var(--vscode-foreground);">${activeRisk}</strong></div>
              <div>Source: <strong style="color: var(--vscode-textLink-foreground);">${activeSource}</strong></div>
            </div>
          `)}

          <!-- Suggested Improvement -->
          ${renderPanel('Suggested Improvement (Recommended Fix)', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <textarea id="suggested-fix-text" style="width: 100%; height: 45px; font-family: inherit; font-size: 10.5px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 4px; box-sizing: border-box;">${activeSuggestedFix}</textarea>
              
              <!-- Decision toolbar buttons -->
              <div style="display: flex; gap: 4px; justify-content: flex-end; align-items: center; border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; margin-top: 2px;">
                <button class="btn-primary" onclick="postMessage({command: 'acceptReviewFix', id: '${selectedFindingId}', fix: document.getElementById('suggested-fix-text').value})" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1;">Accept Fix</button>
                <button class="btn-secondary" onclick="postMessage({command: 'modifyReviewFix', id: '${selectedFindingId}', fix: document.getElementById('suggested-fix-text').value})" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1;">Modify Fix</button>
                <button class="btn-secondary" onclick="postMessage({command: 'ignoreReviewRule', id: '${selectedFindingId}'})" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1; color: var(--vscode-testing-iconFailedColor, #F48771);">Ignore</button>
              </div>
            </div>
          `)}

          <!-- Ignore Reason capture selector -->
          ${renderPanel('Audit Ignore Reason (DNA Feedback Loop)', `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 9px; color: var(--vscode-descriptionForeground); width: 80px;">Ignore Reason:</span>
              <select id="ignore-reason-select" style="flex: 1; font-size: 10px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                ${ignoreReasons.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
          `)}

          <!-- Timeline -->
          ${renderPanel('Audit Action Timeline', `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9px; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px;">
              ${timelineSteps
                .map(
                  (step, idx) => `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                  <span>${step}</span>
                  <span style="font-size: 8px; opacity: 0.6;">${idx === timelineSteps.length - 1 ? '✓' : '➔'}</span>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

        </div>

      </div>

      <!-- Actions Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; gap: 4px; box-sizing: border-box; width: 100%;">
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'applyAllSafeFixes'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Apply All Safe</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'ignoreAllInfo'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Ignore Info</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'runReviewAudit'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Run Audit Again</button>
      </div>

      <!-- Approve footer action button -->
      <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'deliver'})" style="height: 26px; line-height: 1; font-weight: bold; width: 100%; box-sizing: border-box;">
        Approve Review & Prepare Deliverables ➔
      </button>

    </div>
  `;
}

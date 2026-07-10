import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface ArtifactsPageConfig {
  isNoSession: boolean;
  selectedTestCaseId?: string;
  testCases?: {
    id: string;
    health: 'Strong' | 'Needs Review' | 'Weak';
    title: string;
    expected: string;
    steps?: string;
    preconditions?: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    status: 'Draft' | 'Reviewed' | 'Approved' | 'Automation Ready' | 'Deprecated';
    origin: 'AI' | 'User' | 'Playbook' | 'Recommendation';
    evidence: string;
  }[];
  qualityScore?: number;
  strategyUpdated?: boolean;
  warnings?: string[];
}

export function renderArtifactsPage(config: ArtifactsPageConfig): string {
  if (config.isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>Test Design Workspace Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // Active Test Studio Defaults
  const selectedTestCaseId = config.selectedTestCaseId || 'tc-001';
  const qualityScore = config.qualityScore ?? 92;
  const strategyUpdated = config.strategyUpdated ?? true;

  const testCases = config.testCases || [
    {
      id: 'tc-001',
      health: 'Strong' as const,
      title: 'Verify Stripe Webhook Clock-Drift Tolerances',
      expected: 'Webhook processes transaction signatures successfully.',
      steps: '1. Config signature tolerance drift.\n2. Post Stripe webhook payload.\n3. Validate status code.',
      preconditions: 'HMAC keys configured. Server clock synchronized.',
      priority: 'Critical' as const,
      status: 'Draft' as const,
      origin: 'AI' as const,
      evidence: 'Section 4: Clock drift window threshold.'
    },
    {
      id: 'tc-002',
      health: 'Needs Review' as const,
      title: 'Verify Exception Spike Alarm Alerts Notification',
      expected: 'Notification email sent to Ops group.',
      steps: '1. Burst webhook spike above 100 limit.\n2. Poll mailer queue.',
      preconditions: 'Ops groups configured. KQL alert queries active.',
      priority: 'High' as const,
      status: 'Reviewed' as const,
      origin: 'Recommendation' as const,
      evidence: 'Paragraph 3: Mailer notification webhook.'
    },
    {
      id: 'tc-003',
      health: 'Weak' as const,
      title: 'Verify Logging captures payload metadata logs',
      expected: 'Metadata log files created.',
      steps: '1. Process webhook transaction.\n2. Inspect log files.',
      preconditions: 'None.',
      priority: 'Medium' as const,
      status: 'Approved' as const,
      origin: 'Playbook' as const,
      evidence: 'Default playbook audit standards.'
    }
  ];

  const warnings = config.warnings || [
    'Expected Result too generic',
    'Missing negative validation boundary checks',
    'No cleanup step defined'
  ];

  // Resolve selected case
  let activeTitle = 'Verify Stripe Webhook Clock-Drift Tolerances';
  let activeExpected = 'Webhook processes transaction signatures successfully.';
  let activeSteps = '1. Config signature tolerance drift.\n2. Post Stripe webhook payload.\n3. Validate status code.';
  let activePreconditions = 'HMAC keys configured. Server clock synchronized.';
  let activePriority = 'Critical';
  let activeStatus = 'Draft';
  let activeOrigin = 'AI';
  let activeEvidence = 'Section 4: Clock drift window threshold.';
  let activeHealth = 'Strong';

  const matchedCase = testCases.find(tc => tc.id === selectedTestCaseId);
  if (matchedCase) {
    activeTitle = matchedCase.title;
    activeExpected = matchedCase.expected;
    activeSteps = matchedCase.steps || '';
    activePreconditions = matchedCase.preconditions || '';
    activePriority = matchedCase.priority;
    activeStatus = matchedCase.status;
    activeOrigin = matchedCase.origin;
    activeEvidence = matchedCase.evidence;
    activeHealth = matchedCase.health;
  }

  const healthColor = activeHealth === 'Strong' ? 'var(--vscode-testing-iconPassedColor, #89D185)' : activeHealth === 'Needs Review' ? 'var(--vscode-testing-iconQueuedColor, #CCA700)' : 'var(--vscode-testing-iconFailedColor, #F48771)';

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Suite Summary Header Card -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; width: 100%;">
        <div style="font-size: 13px; font-weight: 700;">Test Suite Summary</div>
        <div style="display: flex; gap: 10px; font-size: 10px; color: var(--vscode-descriptionForeground);">
          <div>Strategy: <strong style="color: var(--vscode-foreground);">Security Verification</strong></div>
          <div>Total Cases: <strong style="color: var(--vscode-foreground);">${testCases.length}</strong></div>
          <div>Coverage: <strong style="color: var(--vscode-testing-iconPassedColor, #89D185);">94%</strong></div>
          <div>Quality Score: <strong style="color: var(--vscode-button-background);">${qualityScore}%</strong></div>
        </div>
      </div>

      <!-- Views & Grouping Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
          <div style="display: flex; gap: 4px;">
            <button class="btn-primary" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1; width: auto;">Table View</button>
            <button class="btn-secondary" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1; width: auto;">Grouped</button>
            <button class="btn-secondary" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1; width: auto;">Scenario</button>
          </div>
          <div style="display: flex; gap: 4px; align-items: center; font-size: 9px; color: var(--vscode-descriptionForeground);">
            <span>Group By:</span>
            <select style="font-size: 9px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
              <option>Requirement</option>
              <option>Component</option>
              <option>Risk</option>
              <option>Testing Area</option>
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
          <input type="text" id="studio-search" style="flex: 1; font-size: 10px; height: 22px; padding: 2px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" placeholder="Search Test Cases, tags..." />
          <button class="btn-secondary" onclick="postMessage({command: 'filterStudio', query: document.getElementById('studio-search').value})" style="font-size: 9px; height: 22px; line-height: 1; padding: 0 8px;">Filter</button>
        </div>
      </div>

      <!-- Strategy Update Warning Banner -->
      ${strategyUpdated ? `
        <div style="background: rgba(244, 135, 113, 0.15); border: 1px solid var(--vscode-testing-iconFailedColor, #F48771); border-radius: 4px; padding: 8px; font-weight: 700; color: var(--vscode-testing-iconFailedColor, #F48771);">
          ⚠ Strategy Updated (8 Affected Test Cases - Review Required)
        </div>
      ` : ''}

      <!-- Main Columns Flex Grid -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Left Column: Test Case Grid Table -->
        <div style="flex: 1;">
          ${renderPanel('Test Suite Cases Grid', `
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid var(--vscode-panel-border);">
              <thead>
                <tr style="background: var(--vscode-sideBarSectionHeader-background);">
                  <th style="padding: 4px; border: 1px solid var(--vscode-panel-border); text-align: left;">ID</th>
                  <th style="padding: 4px; border: 1px solid var(--vscode-panel-border); text-align: left;">Health</th>
                  <th style="padding: 4px; border: 1px solid var(--vscode-panel-border); text-align: left;">Test Title Spec</th>
                  <th style="padding: 4px; border: 1px solid var(--vscode-panel-border); text-align: left;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${testCases
                  .map(
                    (tc) => `
                  <tr onclick="postMessage({command: 'selectTestCase', id: '${tc.id}'})" style="cursor: pointer; background: ${tc.id === selectedTestCaseId ? 'rgba(255,255,255,0.03)' : 'transparent'}; border-bottom: 1px solid var(--vscode-panel-border);">
                    <td style="padding: 4px; border: 1px solid var(--vscode-panel-border); font-weight: bold;">${tc.id.toUpperCase()}</td>
                    <td style="padding: 4px; border: 1px solid var(--vscode-panel-border);">
                      <span style="color: ${tc.health === 'Strong' ? 'var(--vscode-testing-iconPassedColor, #89D185)' : tc.health === 'Needs Review' ? 'var(--vscode-testing-iconQueuedColor, #CCA700)' : 'var(--vscode-testing-iconFailedColor, #F48771)'}; font-weight: bold;">
                        ${tc.health}
                      </span>
                    </td>
                    <td style="padding: 4px; border: 1px solid var(--vscode-panel-border); font-weight: 600;">${tc.title}</td>
                    <td style="padding: 4px; border: 1px solid var(--vscode-panel-border);">${tc.status}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `)}
        </div>

        <!-- Right Column: Case Properties, Explainability & Trace Warnings -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Test Case Explainability -->
          ${renderPanel('Test Case Generation Explainability', `
            <div style="font-size: 9px; color: var(--vscode-descriptionForeground); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Why does this test exist?</div>
            <div style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 8px; line-height: 1.4;">
              Requirement (AC-3)<br/>
              &nbsp;&nbsp;↓<br/>
              System Component (Stripe Webhook Gateway)<br/>
              &nbsp;&nbsp;↓<br/>
              Strategy Objective (Clock Drift signature tolerances)<br/>
              &nbsp;&nbsp;↓<br/>
              Test Case (${selectedTestCaseId.toUpperCase()})
            </div>
          `)}

          <!-- Quality Warnings review logs -->
          ${renderPanel('Design Quality Warnings checklist', `
            <div style="display: flex; flex-direction: column; gap: 4px; color: var(--vscode-testing-iconFailedColor, #F48771); font-weight: 600;">
              ${warnings.map(w => `<div>⚠ ${w}</div>`).join('')}
            </div>
          `)}

          <!-- Properties Editor Form -->
          ${renderPanel('Test Case Properties Editor', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; gap: 4px; flex-direction: column;">
                <span style="font-weight: 600; color: var(--vscode-descriptionForeground);">Test Case Title:</span>
                <input type="text" id="tc-title-input" value="${activeTitle}" style="font-size: 11px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              </div>
              <div style="display: flex; gap: 4px; flex-direction: column;">
                <span style="font-weight: 600; color: var(--vscode-descriptionForeground);">Preconditions:</span>
                <input type="text" id="tc-pre-input" value="${activePreconditions}" style="font-size: 11px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              </div>
              <div style="display: flex; gap: 4px; flex-direction: column;">
                <span style="font-weight: 600; color: var(--vscode-descriptionForeground);">Steps Action:</span>
                <textarea id="tc-steps-input" style="font-size: 11px; height: 50px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px; box-sizing: border-box;">${activeSteps}</textarea>
              </div>
              <div style="display: flex; gap: 4px; flex-direction: column;">
                <span style="font-weight: 600; color: var(--vscode-descriptionForeground);">Expected Outcome:</span>
                <input type="text" id="tc-exp-input" value="${activeExpected}" style="font-size: 11px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              </div>
              <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center; border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; margin-top: 4px;">
                <span style="font-size: 9px; color: var(--vscode-descriptionForeground); margin-right: auto;">Source: 🤖 ${activeOrigin} | Health: <strong style="color: ${healthColor};">${activeHealth}</strong></span>
                <button class="btn-primary" onclick="postMessage({command: 'updateTestCase', id: '${selectedTestCaseId}', title: document.getElementById('tc-title-input').value, expected: document.getElementById('tc-exp-input').value, steps: document.getElementById('tc-steps-input').value, preconditions: document.getElementById('tc-pre-input').value})" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1;">Save Changes</button>
              </div>
            </div>
          `)}

          <!-- Traceability Linkages -->
          ${renderPanel('Traceability Linkages', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div>Requirement: <strong style="color: var(--vscode-foreground);">AC-3 Exception spikes</strong></div>
              <div>Component: <strong style="color: var(--vscode-foreground);">Stripe Webhook Gateway</strong></div>
              <div>Evidence Source: <strong style="color: var(--vscode-foreground);">${activeEvidence}</strong></div>
            </div>
          `)}

          <!-- Version history timeline -->
          ${renderPanel('Test Case Revision History', `
            <div style="font-family: monospace; font-size: 9px; line-height: 1.4; color: var(--vscode-foreground);">
              v1 Generated (AI)<br/>
              &nbsp;&nbsp;↓<br/>
              v2 User Modified (User overrides steps)<br/>
              &nbsp;&nbsp;↓<br/>
              v3 Review Updated (Approved by QA Lead)
            </div>
          `)}

        </div>

      </div>

      <!-- Actions Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; gap: 4px; box-sizing: border-box; width: 100%;">
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'addTestCase'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">+ Add Test Case</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'bulkEditCases'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Bulk Edit</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'duplicateTestCase', id: '${selectedTestCaseId}'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Duplicate</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'exportSelectedCases'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Export Selected</button>
      </div>

      <!-- Stepper navigation button -->
      <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'review'})" style="height: 26px; line-height: 1; font-weight: bold; width: 100%; box-sizing: border-box;">
        Review Test Suite ➔
      </button>

    </div>
  `;
}

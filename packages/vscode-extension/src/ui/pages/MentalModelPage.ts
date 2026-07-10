import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface MentalModelPageConfig {
  isNoSession: boolean;
  selectedItemId?: string;
  selectedItemType?: 'unknown' | 'assumption' | 'fact';
  unknowns?: { id: string; text: string; impact: 'High' | 'Medium' | 'Low'; status: string }[];
  assumptions?: { id: string; text: string; source: string; confidence: number; origin: 'AI' | 'User' | 'DNA' | 'Imported'; rationale: string }[];
  facts?: { id: string; text: string; origin: 'AI' | 'User' | 'DNA' | 'Imported' }[];
  readyStatus?: { ready: boolean; blockingCount: number; warningsCount: number; resolvedCount: number; totalCount: number };
}

export function renderMentalModelPage(config: MentalModelPageConfig): string {
  if (config.isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>QA Understanding Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // Active QA Understanding Defaults
  const selectedItemId = config.selectedItemId || 'alert-mandatory';
  const selectedItemType = config.selectedItemType || 'assumption';

  const ready = config.readyStatus || { ready: false, blockingCount: 2, warningsCount: 1, resolvedCount: 12, totalCount: 14 };

  const unknowns = config.unknowns || [
    { id: 'suppression-timeout', text: 'Alert suppression window timeout threshold.', impact: 'High' as const, status: 'Unknown' },
    { id: 'recipient-groups', text: 'Notification recipient groups setup & mapping.', impact: 'Medium' as const, status: 'Unknown' }
  ];

  const assumptions = config.assumptions || [
    { id: 'alert-mandatory', text: 'Alert rules are mandatory for POS exception spikes.', source: 'Paragraph 3', confidence: 0.87, origin: 'AI' as const, rationale: 'Application Insights and KQL rules detected in spec. No UI elements found.' },
    { id: 'email-client', text: 'Email client configurations default to internal SMTP.', source: 'Paragraph 5', confidence: 0.75, origin: 'Imported' as const, rationale: 'Common default set in Project DNA playbook profile.' }
  ];

  const facts = config.facts || [
    { id: 'hmac-signatures', text: 'Webhook transaction uses HMAC signature validation.', origin: 'DNA' as const },
    { id: 'webhook-200', text: 'Stripe webhook returns 200 OK signature immediately.', origin: 'AI' as const }
  ];

  // Resolve active selected item details
  let activeText = 'Alert rules are mandatory for POS exception spikes.';
  let activeRationale = 'Application Insights and KQL rules detected in spec. No UI elements found.';
  let activeEvidence = 'Paragraph 3: "Webhook triggers alert rules on transaction exception spikes."';
  let activeConfidenceVal = 0.87;
  let activeOrigin = 'AI';

  const matchedAssumption = assumptions.find(a => a.id === selectedItemId);
  if (matchedAssumption) {
    activeText = matchedAssumption.text;
    activeRationale = matchedAssumption.rationale;
    activeEvidence = `Evidence source requirement ${matchedAssumption.source}`;
    activeConfidenceVal = matchedAssumption.confidence;
    activeOrigin = matchedAssumption.origin;
  } else {
    const matchedUnknown = unknowns.find(u => u.id === selectedItemId);
    if (matchedUnknown) {
      activeText = matchedUnknown.text;
      activeRationale = 'Unmapped parameter. AI found no context in specification.';
      activeEvidence = 'No evidence trace found in raw text.';
      activeConfidenceVal = 0.3;
      activeOrigin = 'AI';
    }
  }

  // Draw Confidence bar representation
  const activeConfidencePercent = Math.round(activeConfidenceVal * 100);
  const barsCount = Math.round(activeConfidenceVal * 10);
  const confidenceBars = '█'.repeat(barsCount) + '░'.repeat(10 - barsCount);

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Top Diagnostic Ready Card -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
        <div style="font-size: 13px; font-weight: 700;">QA Understanding</div>
        <div style="display: flex; gap: 10px; font-size: 10px; color: var(--vscode-descriptionForeground);">
          <div>Ready for Strategy: <strong style="color: ${ready.ready ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-testing-iconFailedColor, #F48771)'};">${ready.ready ? 'Yes' : 'No'}</strong></div>
          <div>Blocking: <strong style="color: var(--vscode-foreground);">${ready.blockingCount}</strong></div>
          <div>Warnings: <strong style="color: var(--vscode-foreground);">${ready.warningsCount}</strong></div>
          <div>Resolved: <strong style="color: var(--vscode-foreground);">${ready.resolvedCount}/${ready.totalCount}</strong></div>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div style="display: flex; gap: 4px; flex-wrap: wrap; width: 100%;">
        <input type="text" id="reasoning-search" style="flex: 1; font-size: 10px; height: 22px; padding: 2px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" placeholder="Search assumptions, evidence..." />
        <button class="btn-secondary" onclick="postMessage({command: 'searchReasoning', query: document.getElementById('reasoning-search').value})" style="font-size: 9px; height: 22px; line-height: 1; padding: 0 8px;">Filter</button>
      </div>

      <!-- Sync Column Layout Grid -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Left Column: Priority Gating List (Unknowns > Assumptions > Facts) -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Unknowns -->
          ${renderPanel('⚠ Unknown Gaps (Need Attention)', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${unknowns
                .map(
                  (u) => `
                <div style="background: rgba(244, 135, 113, 0.05); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 700; font-size: 10px; color: var(--vscode-testing-iconFailedColor, #F48771);">❓ ${u.text}</div>
                    <div style="font-size: 9px; color: var(--vscode-descriptionForeground); margin-top: 2px;">Impact: <strong>${u.impact}</strong></div>
                  </div>
                  <button class="btn-primary" onclick="postMessage({command: 'selectNode', id: '${u.id}', type: 'unknown'})" style="font-size: 9px; height: 18px; padding: 0 6px; width: auto; line-height: 1;">Resolve</button>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

          <!-- Assumptions -->
          ${renderPanel('⚠ Assumptions (Need Confirmation)', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${assumptions
                .map(
                  (a) => `
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; text-align: left; border-left: 2px solid ${a.id === selectedItemId ? 'var(--vscode-button-background)' : 'transparent'};">
                  <div style="font-weight: 600; font-size: 11px; color: var(--vscode-foreground); margin-bottom: 4px;">"${a.text}"</div>
                  <div style="font-size: 9px; color: var(--vscode-descriptionForeground); margin-bottom: 6px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
                    <span style="color: var(--vscode-textLink-foreground); cursor: pointer;" onclick="postMessage({command: 'selectEvidence', source: '${a.source}'})">Evidence: ${a.source} [Open Source]</span>
                    <span>Confidence: <strong style="color: var(--vscode-button-background);">${Math.round(a.confidence * 100)}%</strong></span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; margin-top: 4px;">
                    <span style="font-size: 9px; color: var(--vscode-descriptionForeground);">Source: 🤖 ${a.origin}</span>
                    <div style="display: flex; gap: 4px;">
                      <button class="btn-primary" onclick="postMessage({command: 'confirmAssumption', id: '${a.id}'})" style="font-size: 8px; height: 16px; padding: 0 4px; line-height: 1;">✓ Confirm</button>
                      <button class="btn-secondary" onclick="postMessage({command: 'modifyAssumption', id: '${a.id}'})" style="font-size: 8px; height: 16px; padding: 0 4px; line-height: 1;">✏ Modify</button>
                      <button class="btn-secondary" onclick="postMessage({command: 'rejectAssumption', id: '${a.id}'})" style="font-size: 8px; height: 16px; padding: 0 4px; line-height: 1; color: var(--vscode-testing-iconFailedColor, #F48771);">✗ Reject</button>
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

          <!-- Facts -->
          ${renderPanel('✓ Facts (Verified)', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${facts
                .map(
                  (f) => `
                <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 6px; display: flex; align-items: center; justify-content: space-between;">
                  <span>✓ ${f.text}</span>
                  ${renderBadge(f.origin, 'success')}
                </div>
              `
                )
                .join('')}
            </div>
          `)}

        </div>

        <!-- Right Column: Explainability, Evidence & Trace Resolver -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Explainability card -->
          ${renderPanel('AI Inference Explainability Rationale', `
            <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px; color: var(--vscode-descriptionForeground);">Why AI Thinks This?</div>
            <div style="font-size: 10px; line-height: 1.4; color: var(--vscode-foreground); margin-bottom: 8px;">
              ${activeRationale}
            </div>
            
            <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; margin-top: 6px;">
              <div style="font-size: 9px; color: var(--vscode-descriptionForeground); font-weight: 600; text-transform: uppercase;">Confidence Meter:</div>
              <div style="font-family: monospace; font-size: 12px; color: var(--vscode-button-background); margin-top: 2px;">
                ${confidenceBars} ${activeConfidencePercent}%
              </div>
            </div>
          `)}

          <!-- Evidence Quote card -->
          ${renderPanel('Evidence Trace Quote', `
            <div style="font-size: 10px; font-style: italic; color: var(--vscode-foreground); line-height: 1.4; display: flex; flex-direction: column; gap: 6px;">
              <span>"${activeEvidence}"</span>
              <span style="color: var(--vscode-textLink-foreground); cursor: pointer; text-decoration: underline;" onclick="postMessage({command: 'selectEvidence', source: '${activeEvidence}'})">Open Original Source</span>
            </div>
          `)}

          <!-- Manual Override Resolver -->
          ${renderPanel('Manual Override Resolver', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 9px; color: var(--vscode-descriptionForeground); font-weight: 600;">Override Statement / Answer:</label>
              <textarea id="resolver-override-text" style="width: 100%; height: 50px; font-family: inherit; font-size: 11px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 4px; box-sizing: border-box;">${activeText}</textarea>
              <div style="display: flex; justify-content: flex-end; gap: 4px; margin-top: 4px;">
                <button class="btn-primary" onclick="postMessage({command: 'submitOverride', id: '${selectedItemId}', text: document.getElementById('resolver-override-text').value})" style="font-size: 10px; height: 22px; line-height: 1; padding: 0 8px;">Confirm Update</button>
              </div>
            </div>
          `)}

          <!-- Reasoning Trace Map -->
          ${renderPanel('QA Reasoning Trace', `
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10px; line-height: 1.3;">
              <div style="color: var(--vscode-descriptionForeground);">Requirement Component Mapping Trace:</div>
              <div style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 9px;">
                Requirement<br/>
                &nbsp;&nbsp;↓<br/>
                System Component<br/>
                &nbsp;&nbsp;↓<br/>
                Evidence Trace Quote<br/>
                &nbsp;&nbsp;↓<br/>
                Logic Reasoning<br/>
                &nbsp;&nbsp;↓<br/>
                QA Strategy objectives<br/>
                &nbsp;&nbsp;↓<br/>
                Generated Test Cases
              </div>
            </div>
          `)}

        </div>

      </div>

      <!-- Actions Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; gap: 4px; box-sizing: border-box; width: 100%;">
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'addAssumption'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">+ Assumption</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'auditGaps'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Audit Gaps</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'resolveAllAssumptions'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Resolve All</button>
      </div>

      <!-- Build Strategy Stepper button -->
      <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'strategy'})" style="height: 26px; line-height: 1; font-weight: bold; width: 100%; box-sizing: border-box;">
        Build Strategy from Approved Understanding ➔
      </button>

    </div>
  `;
}

import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface RequirementPageConfig {
  isNoSession: boolean;
  detectedFileName: string;
  aiStatus: string;
  adoConnected: boolean;
  jiraConnected: boolean;
  sessionsCount: number;
  hasGeneratedSuite: boolean;
  lastSessionHtml: string;
  requirementText?: string;
  requirementTitle?: string;
  healthScore?: number;
  confidenceScore?: number;
  questionsCount?: number;
  rulesCount?: number;
  componentsCount?: number;
  actorsCount?: number;
  gapsCount?: number;
  isReadOnly?: boolean;
  annotations?: { text: string; note: string }[];
  businessRules?: { text: string; source: string; confidence: string }[];
  detectedInfo?: {
    goals: string[];
    actors: string[];
    components: string[];
    integrations: string[];
  };
  unknowns?: { text: string; status: string }[];
}

export function renderRequirementPage(config: RequirementPageConfig): string {
  if (config.isNoSession) {
    // Onboarding / Create Session state
    return `
      <div style="animation: fade-in 0.2s ease-out; font-size: 11px;">
        <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 12px; margin-bottom: 12px;">
          <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px;">Create QA Session</div>
          <p style="margin: 0; color: var(--vscode-descriptionForeground); line-height: 1.4;">
            Import your requirement specification below. QAMate will parse the text and formulate system boundaries.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          
          <!-- Paste Box -->
          ${renderPanel('1. Paste Raw Text Specification', `
            <textarea id="paste-req-text" style="width: 100%; height: 90px; font-family: inherit; font-size: 11px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 6px; box-sizing: border-box;" placeholder="Paste requirement text here..."></textarea>
            <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
              <button class="btn-primary" onclick="postMessage({command: 'analyzeActive', text: document.getElementById('paste-req-text').value})" style="font-size: 10px; height: 22px; line-height: 1;">Analyze Raw Spec ➔</button>
            </div>
          `)}

          <!-- File Drag and Drop zone -->
          ${renderPanel('2. Upload Local Spec File', `
            <div id="spec-dropzone" style="border: 2px dashed var(--vscode-panel-border); border-radius: 4px; padding: 20px; text-align: center; color: var(--vscode-descriptionForeground); cursor: pointer;" onclick="postMessage({command: 'triggerFileUpload'})">
              Drag & Drop Specification (.md, .txt, .pdf) or Click to Browse
            </div>
          `)}

          <!-- Board Integrations connects -->
          ${renderPanel('3. Connect to Boards', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; gap: 4px; align-items: center;">
                <input type="text" id="jira-ticket-id" style="flex: 1; font-size: 10px; height: 22px; padding: 2px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" placeholder="Jira Ticket ID (e.g. PM-102)" />
                <button class="btn-secondary" onclick="postMessage({command: 'importJira', id: document.getElementById('jira-ticket-id').value})" style="font-size: 10px; height: 22px; line-height: 1; padding: 0 8px;">Import</button>
              </div>
              <div style="display: flex; gap: 4px; align-items: center;">
                <input type="text" id="ado-item-id" style="flex: 1; font-size: 10px; height: 22px; padding: 2px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" placeholder="ADO Item ID (e.g. 23412)" />
                <button class="btn-secondary" onclick="postMessage({command: 'importADO', id: document.getElementById('ado-item-id').value})" style="font-size: 10px; height: 22px; line-height: 1; padding: 0 8px;">Import</button>
              </div>
            </div>
          `)}

          <!-- Recent sessions -->
          ${config.lastSessionHtml ? config.lastSessionHtml : ''}

        </div>
      </div>
    `;
  }

  // Active Session Layout variables defaults
  const isReadOnly = config.isReadOnly !== undefined ? config.isReadOnly : true;
  const healthScore = config.healthScore !== undefined ? config.healthScore : 100;
  const isReady = healthScore >= 70;
  const healthGrade = healthScore >= 90 ? 'A' : healthScore >= 75 ? 'B' : healthScore >= 60 ? 'C' : 'F';

  const annotations = config.annotations || [
    { text: 'threshold depends on SLA', note: 'Customer SLA values dictate warning trigger timeouts.' }
  ];

  const businessRules = config.businessRules || [
    { text: 'Alert when exception threshold exceeded.', source: 'Acceptance Criteria 2', confidence: 'High' },
    { text: 'Authenticate Stripe webhook endpoints.', source: 'Security Section 1.2', confidence: 'High' }
  ];

  const info = config.detectedInfo || {
    goals: ['Detect tenant exception spikes.'],
    actors: ['System Administrator', 'Operations Team'],
    components: ['Application Insights', 'Azure Function', 'Alert Rule'],
    integrations: ['KQL', 'Application Insights API']
  };

  const unknowns = config.unknowns || [
    { text: 'Alert suppression window timeout.', status: 'Unknown' },
    { text: 'Notification recipient groups setup.', status: 'Unknown' }
  ];

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Top Metadata Header -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
        <div>ID: <strong style="color: var(--vscode-foreground);">REQ-2034</strong></div>
        <div>Source: <strong style="color: var(--vscode-foreground);">Azure DevOps</strong></div>
        <div>Priority: <strong style="color: var(--vscode-foreground);">High</strong></div>
        <div>Owner: <strong style="color: var(--vscode-foreground);">Raj</strong></div>
      </div>

      <!-- Split panels grid wrapper -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        
        <!-- Left Panel: Requirement Text Editor/Viewer & Annotations -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          ${renderPanel(`Requirement Specification [${isReadOnly ? 'Read-Only' : 'Editable'}]`, `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 6px; gap: 4px;">
              <button class="btn-secondary" onclick="postMessage({command: 'toggleReadOnly'})" style="font-size: 9px; height: 18px; padding: 0 6px; line-height: 1;">
                ${isReadOnly ? '🔓 Unlock to Edit' : '🔒 Lock (Read-Only)'}
              </button>
            </div>
            ${
              isReadOnly
                ? `
              <div style="font-family: monospace; font-size: 11px; white-space: pre-wrap; background: var(--vscode-textCodeBlock-background); padding: 8px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; max-height: 250px; overflow-y: auto;">${config.requirementText || 'Webhook transactions must be authenticated and alert administrators when failures threshold is exceeded.'}</div>
            `
                : `
              <textarea id="edit-req-textarea" style="width: 100%; height: 180px; font-family: monospace; font-size: 11px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 6px; box-sizing: border-box;">${config.requirementText || 'Webhook transactions must be authenticated and alert administrators when failures threshold is exceeded.'}</textarea>
              <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                <button class="btn-primary" onclick="postMessage({command: 'saveRequirement', text: document.getElementById('edit-req-textarea').value})" style="font-size: 10px; height: 22px; line-height: 1;">Save & Reanalyze</button>
              </div>
            `
            }
          `)}

          <!-- Annotations & Highlights -->
          ${renderPanel('Requirement Annotations', `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;">
              ${annotations
                .map(
                  (ann) => `
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 6px;">
                  <div style="font-size: 10px; color: var(--vscode-button-background); font-weight: 700;">📌 "${ann.text}"</div>
                  <div style="font-size: 10px; color: var(--vscode-foreground); margin-top: 2px;">Note: ${ann.note}</div>
                </div>
              `
                )
                .join('')}
            </div>
            
            <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 9px; color: var(--vscode-descriptionForeground); font-weight: 600;">Add Context Annotation:</div>
              <input type="text" id="new-annotation-text" placeholder="Highlight text / keyword" style="font-size: 10px; height: 20px; padding: 2px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" />
              <input type="text" id="new-annotation-note" placeholder="Add annotation note (Context feeds AI later)" style="font-size: 10px; height: 20px; padding: 2px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" />
              <button class="btn-secondary" onclick="postMessage({command: 'addAnnotation', text: document.getElementById('new-annotation-text').value, note: document.getElementById('new-annotation-note').value})" style="font-size: 10px; height: 22px; margin-top: 2px; line-height: 1;">Add Note</button>
            </div>
          `)}

          <!-- Footer Next Action Button -->
          <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'system'})" style="height: 26px; line-height: 1; font-weight: bold; width: 100%;">
            Continue to System Model ➔
          </button>

        </div>

        <!-- Right Panel: Understanding Insights & Scans -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Quality Card -->
          <div style="display: flex; gap: 6px; width: 100%;">
            ${renderMetric('Quality Grade', healthGrade, `${healthScore}%`)}
            ${renderMetric('Blocking Gaps', config.questionsCount || 0)}
            ${renderMetric('Ready Status', isReady ? 'Ready' : 'No')}
          </div>

          <!-- Analysis Summary -->
          ${renderPanel('Analysis Summary', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; line-height: 1.4;">
              <div>Business Rules: <strong>${config.rulesCount || 12}</strong></div>
              <div>Actors Found: <strong>${config.actorsCount || 2}</strong></div>
              <div>System Components: <strong>${config.componentsCount || 6}</strong></div>
              <div>Detected Unknowns: <strong>${config.gapsCount || 3}</strong></div>
              <div>Estimated Complexity: <strong>Medium</strong></div>
            </div>
          `)}

          <!-- Business Rules Cards -->
          ${renderPanel('Detected Business Rules', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${businessRules
                .map(
                  (rule) => `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; text-align: left;">
                  <div style="font-weight: 700; font-size: 10px; color: var(--vscode-foreground); margin-bottom: 2px;">Business Rule</div>
                  <div style="font-size: 10px; margin-bottom: 4px; line-height: 1.3;">"${rule.text}"</div>
                  <div style="font-size: 9px; color: var(--vscode-descriptionForeground); display: flex; justify-content: space-between;">
                    <span>Source: ${rule.source}</span>
                    <span>Confidence: <strong style="color: var(--vscode-button-background);">${rule.confidence}</strong></span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

          <!-- Detected System Information -->
          ${renderPanel('Detected Information Insights', `
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px; line-height: 1.4;">
              <div>🎯 <strong>Business Goals:</strong> ${info.goals.join(', ')}</div>
              <div>👥 <strong>Actors:</strong> ${info.actors.join(', ')}</div>
              <div>🏗 <strong>Components:</strong> ${info.components.join(', ')}</div>
              <div>🔌 <strong>Integrations:</strong> ${info.integrations.join(', ')}</div>
            </div>
          `)}

          <!-- Actionable Unknowns -->
          ${renderPanel('Actionable Gaps & Unknowns', `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${unknowns
                .map(
                  (gap) => `
                <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 700; font-size: 10px; color: var(--vscode-editorWarning-foreground, #CCA700);">${gap.text}</div>
                    <div style="font-size: 8px; color: var(--vscode-descriptionForeground); margin-top: 2px;">Status: ${gap.status}</div>
                  </div>
                  <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'mental'})" style="font-size: 9px; height: 18px; padding: 0 8px; width: auto; line-height: 1;">[ Resolve ]</button>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

        </div>

      </div>

      <!-- Footer History -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; font-size: 9px; color: var(--vscode-descriptionForeground); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px; margin-top: 4px; box-sizing: border-box; width: 100%;">
        <span>Imported From: <strong>Azure DevOps</strong> | Story: <strong>#234</strong></span>
        <div style="display: flex; gap: 4px;">
          <button class="btn-secondary" onclick="postMessage({command: 'refreshImport'})" style="font-size: 8px; height: 16px; padding: 0 4px; line-height: 1;">Refresh</button>
          <button class="btn-secondary" onclick="postMessage({command: 'reimportSpec'})" style="font-size: 8px; height: 16px; padding: 0 4px; line-height: 1;">Reimport</button>
        </div>
      </div>

    </div>
  `;
}

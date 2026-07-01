import { Theme } from '../Theme.js';
import { icons } from '../icons.js';

export interface WelcomePageConfig {
  detectedFileName: string;
  recentSessionsHtml: string;
  aiStatus: string;
  adoStatus: string;
  jiraStatus: string;
  adoConnected: boolean;
  jiraConnected: boolean;
  selectedAIProvider: string;
  sessionsCount: number;
  hasGeneratedSuite: boolean;
  lastSessionHtml: string;
}

export function renderWelcomePage(config: WelcomePageConfig): string {
  // Onboarding Intro Welcome Card
  const welcomeChecklistHtml =
    config.sessionsCount === 0
      ? `
    <div class="card onboarding-checklist-card" style="margin-bottom: ${Theme.spacing.md}; border: 1px solid var(--vscode-button-background); background: rgba(255,255,255,0.03); padding: 12px; border-radius: 4px;">
      <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-foreground); display: flex; align-items: center; gap: 4px;">
        <span>Welcome to QAMate</span>
      </div>
      <p style="font-size: 11px; color: var(--vscode-foreground); margin: 0 0 8px 0; line-height: 1.4;">
        Paste a requirement specification below to get started. QAMate will immediately scan the document.
      </p>
      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10px; color: var(--vscode-descriptionForeground);">
        <div>✓ Understand business rules & actor profiles</div>
        <div>✓ Identify logic risks and exceptions</div>
        <div>✓ Detect missing acceptance details</div>
        <div>✓ Formulate your QA test strategy</div>
      </div>
    </div>
  `
      : '';

  // 2x2 Balanced Cards Grid (nested inside details)
  const importGridHtml = `
    <div class="import-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px;">
      <!-- Active Editor -->
      <div class="card grid-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 10px; margin: 0; min-height: 90px; border-radius: 4px; border: 1px solid var(--vscode-panel-border);">
        <div>
          <div style="font-weight: 600; font-size: 10px; text-transform: uppercase; color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            ${icons.file} Active File
          </div>
          <div style="font-size: 10px; color: var(--vscode-foreground); margin-bottom: 8px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${config.detectedFileName ? config.detectedFileName : 'No active file open'}
          </div>
        </div>
        <button class="btn-primary" onclick="postMessage({command: 'analyzeActive'})" style="font-size: 10px; padding: 4px; margin: 0; width: 100%; height: 22px; line-height: 1;" ${config.detectedFileName ? '' : 'disabled'}>
          Analyze Active
        </button>
      </div>

      <!-- Local Spec -->
      <div class="card grid-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 10px; margin: 0; min-height: 90px; border-radius: 4px; border: 1px solid var(--vscode-panel-border);">
        <div>
          <div style="font-weight: 600; font-size: 10px; text-transform: uppercase; color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            ${icons.file} Local Spec
          </div>
          <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; line-height: 1.3;">
            Upload local requirement spec
          </div>
        </div>
        <button class="btn-secondary" onclick="triggerFileUpload()" style="font-size: 10px; padding: 4px; margin: 0; width: 100%; height: 22px; line-height: 1;">
          Upload File
        </button>
      </div>

      <!-- Azure DevOps -->
      <div class="card grid-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 10px; margin: 0; min-height: 90px; border-radius: 4px; border: 1px solid var(--vscode-panel-border);">
        <div>
          <div style="font-weight: 600; font-size: 10px; text-transform: uppercase; color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            ${icons.azure} Azure DevOps
          </div>
          <div style="font-size: 10px; margin-bottom: 8px; line-height: 1.3; color: ${config.adoConnected ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'}; font-weight: 500;">
            ● ${config.adoConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <button class="btn-secondary" onclick="postMessage({command: 'importAzureStory'})" style="font-size: 10px; padding: 4px; margin: 0; width: 100%; height: 22px; line-height: 1;">
          Import Story
        </button>
      </div>

      <!-- Jira Board -->
      <div class="card grid-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 10px; margin: 0; min-height: 90px; border-radius: 4px; border: 1px solid var(--vscode-panel-border);">
        <div>
          <div style="font-weight: 600; font-size: 10px; text-transform: uppercase; color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            ${icons.jira} Jira Board
          </div>
          <div style="font-size: 10px; margin-bottom: 8px; line-height: 1.3; color: ${config.jiraConnected ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'}; font-weight: 500;">
            ● ${config.jiraConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <button class="btn-secondary" onclick="postMessage({command: 'importJiraIssue'})" style="font-size: 10px; padding: 4px; margin: 0; width: 100%; height: 22px; line-height: 1;">
          Import Issue
        </button>
      </div>
    </div>
  `;

  // Workspace Status Box
  const hasAIAvailable = config.selectedAIProvider !== 'mock' || config.aiStatus.includes('VS Code LM');
  const aiStatusColor = hasAIAvailable ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)';

  const systemStatusHtml = `
    <div style="font-size: 11px; line-height: 1.4;">
      <div class="status-item" style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; text-align: left;">
        <span>AI Engine:</span>
        <strong style="color: ${aiStatusColor}">
          ${hasAIAvailable ? 'Connected' : 'Offline Analysis'}
        </strong>
      </div>
      <div style="font-size: 9px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; text-align: left; line-height: 1.3;">
        ${config.aiStatus}
      </div>
      <div class="status-item" style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; text-align: left;">
        <span>Azure DevOps:</span>
        <strong style="color: ${config.adoConnected ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'}">${config.adoConnected ? 'Active' : 'Setup Available'}</strong>
      </div>
      <div class="status-item" style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; text-align: left;">
        <span>Jira Boards:</span>
        <strong style="color: ${config.jiraConnected ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'}">${config.jiraConnected ? 'Active' : 'Setup Available'}</strong>
      </div>
      <div style="text-align: right; border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; margin-top: 6px;">
        <span class="settings-link" onclick="postMessage({command: 'switchTab', tab: 'settings'})" style="cursor: pointer; font-size: 11px; color: var(--vscode-textLink-foreground); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">Configure ${icons.gear}</span>
      </div>
    </div>
  `;

  // Recent Sessions list
  const recentSessionsContent = config.recentSessionsHtml
    ? config.recentSessionsHtml
    : `
    <div style="text-align: center; padding: 12px; color: var(--vscode-descriptionForeground); font-size: 11px; line-height: 1.4;">
      <div style="font-size: 18px; margin-bottom: 4px; opacity: 0.5;">🕒</div>
      <strong>No previous analyses yet.</strong><br/>
      Analyze your first requirement to build your history.
    </div>
  `;

  return `
    <style>
      details summary::-webkit-details-marker {
        display: none;
      }
      details summary {
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        color: var(--vscode-descriptionForeground);
        user-select: none;
        padding: 2px 0;
      }
      .summary-chevron {
        display: inline-flex;
        align-items: center;
        transition: transform 0.1s ease;
        opacity: 0.8;
      }
      details[open] .summary-chevron {
        transform: rotate(90deg);
      }
    </style>

    <div class="page-container" style="animation: fade-in 0.18s ease-out;">
      <!-- Welcome Intro Card -->
      ${welcomeChecklistHtml}

      <!-- Persistence: Continue Last Session -->
      ${config.lastSessionHtml || ''}

      <!-- Conversational Alive Header -->
      <div style="margin-bottom: ${Theme.spacing.md}; position: relative;">
        <!-- Why QAMate Link in top-right -->
        <span onclick="toggleWhyModal(true)" style="position: absolute; right: 0; top: 0; font-size: 10px; color: var(--vscode-textLink-foreground); cursor: pointer; text-decoration: underline; font-weight: 500;">Why QAMate?</span>
        
        <h2 style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--vscode-foreground); padding-right: 80px;">No requirement loaded.</h2>
        <p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0 0 10px 0; line-height: 1.4;">
          Paste a requirement below or import one from your tools.
        </p>

        <!-- Pipeline tracks expectation preview -->
        <div style="display: flex; align-items: center; gap: 4px; font-size: 8px; font-weight: 700; color: var(--vscode-descriptionForeground); text-transform: uppercase; border-top: 1px solid var(--vscode-panel-border); padding-top: 6px;">
          <span>Understand</span> <span style="font-size: 6px; opacity: 0.5;">➔</span>
          <span>Prepare</span> <span style="font-size: 6px; opacity: 0.5;">➔</span>
          <span>Plan</span> <span style="font-size: 6px; opacity: 0.5;">➔</span>
          <span>Generate</span> <span style="font-size: 6px; opacity: 0.5;">➔</span>
          <span>Review</span>
        </div>
      </div>

      <!-- Paste intake block -->
      <div class="card" id="drop-zone" style="margin-bottom: ${Theme.spacing.md};">
        <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 4px;">
          ${icons.terminal} Paste Requirement
        </div>
        <textarea id="intake-paste-area" oninput="detectIntakeType(this.value)" placeholder="Paste raw requirement text or user story format here..." style="width: 100%; height: 70px; font-size: 11px; resize: vertical; margin-bottom: 8px; font-family: inherit;"></textarea>
        
        <div id="intake-detection-badge" class="tag" style="display: none; margin-bottom: 8px; font-size: 9px; width: fit-content; padding: 2px 6px; border-radius: 2px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-weight: 600; text-transform: uppercase;">
          Format: <span id="detected-type-label">None</span>
        </div>
        
        <button id="intake-analyze-btn" class="btn-primary" onclick="submitIntakeText()" style="font-size: 12px; font-weight: 600;" disabled>
          Analyze Requirement
        </button>
      </div>

      <!-- Premium Collapsible Import options -->
      <details class="card" style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border);">
        <summary>
          <span>Other Sources</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 10px;">
          ${importGridHtml}
        </div>
      </details>

      <!-- Premium Collapsible Recent Sessions -->
      <details class="card" style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border);" ${config.sessionsCount > 0 ? 'open' : ''}>
        <summary>
          <span style="display: flex; align-items: center; gap: 4px;">
            Recent Sessions
            ${config.sessionsCount > 0 ? `<span style="font-size: 9px; opacity: 0.7; font-weight: 500;">(${config.sessionsCount})</span>` : ''}
          </span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 10px;">
          ${recentSessionsContent}
        </div>
      </details>

      <!-- Premium Collapsible Workspace Status -->
      <details class="card" style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border);">
        <summary>
          <span>Workspace Status</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 10px;">
          ${systemStatusHtml}
        </div>
      </details>
    </div>

    <!-- Hidden file input for uploading -->
    <input type="file" id="hidden-file-input" style="display: none;" onchange="handleFileSelected(event)" />

    <!-- Why QAMate Overlay Modal -->
    <div id="why-qamate-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.65); z-index: 2000; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box;">
      <div class="card" style="max-width: 280px; border: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBar-background); padding: 14px; border-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.5);">
        <div style="font-weight: 600; font-size: 11px; margin-bottom: 8px; color: var(--vscode-foreground); border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 6px; display: flex; align-items: center; gap: 4px;">
          💡 Why QAMate exists
        </div>
        <p style="font-size: 11px; color: var(--vscode-foreground); line-height: 1.45; margin: 0 0 10px 0;">
          QAMate is <strong>not</strong> an AI chat bot. It is an outcomes-focused QA workspace built to transform software specifications into trusted QA deliverables.
        </p>
        <p style="font-size: 10px; color: var(--vscode-descriptionForeground); line-height: 1.4; margin: 0 0 12px 0;">
          ✓ Offline-first heuristics scanning.<br/>
          ✓ QA gaps & ambiguities checker.<br/>
          ✓ Dynamic test coverage mapping.
        </p>
        <button class="btn-primary" onclick="toggleWhyModal(false)" style="font-size: 11px; padding: 4px 8px; height: 24px; line-height: 1;">Got it</button>
      </div>
    </div>

    <script>
      function toggleWhyModal(show) {
        document.getElementById('why-qamate-modal').style.display = show ? 'flex' : 'none';
      }

      function triggerFileUpload() {
        document.getElementById('hidden-file-input').click();
      }

      function handleFileSelected(event) {
        if (event.target.files && event.target.files.length > 0) {
          var file = event.target.files[0];
          var reader = new FileReader();
          reader.onload = function(evt) {
            var text = evt.target.result;
            postMessage({ command: 'submitIntake', text: text, type: 'Plain Text Requirement' });
          };
          reader.readAsText(file);
        }
      }

      function detectIntakeType(text) {
        const badge = document.getElementById('intake-detection-badge');
        const label = document.getElementById('detected-type-label');
        const btn = document.getElementById('intake-analyze-btn');
        
        const val = text.trim();
        if (!val) {
          badge.style.display = 'none';
          btn.disabled = true;
          btn.innerText = 'Analyze Requirement';
          return;
        }
        
        badge.style.display = 'block';
        btn.disabled = false;
        
        const lowerVal = val.toLowerCase();
        const isJiraUrl = val.indexOf('atlassian.net/browse/') !== -1;
        const isJiraKey = /^[A-Z]+-[0-9]+$/.test(val);
        const isAdoUrl = val.indexOf('dev.azure.com/') !== -1 && val.indexOf('/_workitems/edit/') !== -1;
        const isAdoId = /^[0-9]+$/.test(val);
        const isUserStory = (lowerVal.indexOf('as a') !== -1 || lowerVal.indexOf('as an') !== -1) && lowerVal.indexOf('i want to') !== -1;
        const isMarkdown = val.startsWith('#') || val.indexOf('\\n#') !== -1 || val.indexOf('**') !== -1;

        let type = 'Requirement';
        if (isJiraUrl || isJiraKey) {
          type = 'Jira Issue';
          label.innerText = 'Jira Issue';
        } else if (isAdoUrl || isAdoId) {
          type = 'Azure DevOps ID';
          label.innerText = 'Azure DevOps ID';
        } else if (isUserStory) {
          type = 'User Story';
          label.innerText = 'User Story';
        } else if (isMarkdown) {
          type = 'Markdown Spec';
          label.innerText = 'Markdown Spec';
        } else {
          type = 'Requirement';
          label.innerText = 'Plain Text Requirement';
        }

        btn.innerText = 'Analyze ' + type;
      }

      function submitIntakeText() {
        const text = document.getElementById('intake-paste-area').value;
        const label = document.getElementById('detected-type-label').innerText;
        postMessage({ command: 'submitIntake', text, type: label });
      }

      // Re-setup drag and drop dropzone
      setTimeout(function() {
        var dropZone = document.getElementById('drop-zone');
        if (dropZone) {
          dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--vscode-button-background)';
            dropZone.style.background = 'rgba(0,0,0,0.06)';
          });
          
          dropZone.addEventListener('dragleave', function() {
            dropZone.style.borderColor = 'var(--vscode-panel-border)';
            dropZone.style.background = 'transparent';
          });
          
          dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--vscode-panel-border)';
            dropZone.style.background = 'transparent';
            
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              var file = e.dataTransfer.files[0];
              var reader = new FileReader();
              reader.onload = function(evt) {
                var text = evt.target.result;
                postMessage({ command: 'submitIntake', text: text, type: 'Plain Text Requirement' });
              };
              reader.readAsText(file);
            }
          });
        }
      }, 100);
    </script>
  `;
}

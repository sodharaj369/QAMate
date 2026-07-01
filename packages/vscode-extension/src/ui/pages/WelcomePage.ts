import { Theme } from '../Theme.js';
import { strings } from '../strings.js';

export interface WelcomePageConfig {
  detectedFileName: string;
  recentSessionsHtml: string;
  aiStatus: string;
  adoStatus: string;
  jiraStatus: string;
  selectedPersona: string;
  detectedTheme: string;
  selectedAIProvider: string;
  selectedAIModel: string;
  selectedAIEndpoint: string;
  hasAIKey: boolean;
  adoOrg: string;
  adoProject: string;
  hasAdoPat: boolean;
  jiraDomain: string;
  jiraEmail: string;
  hasJiraToken: boolean;
  adoConnected: boolean;
  jiraConnected: boolean;
}

export function renderWelcomePage(config: WelcomePageConfig): string {
  const personas = [
    { value: 'manual-qa', label: 'Manual QA Engineer' },
    { value: 'automation-qa', label: 'Automation QA Engineer' },
    { value: 'backend-developer', label: 'Backend Developer' },
    { value: 'frontend-developer', label: 'Frontend Developer' },
    { value: 'tech-lead', label: 'QA Tech Lead' },
    { value: 'security-tester', label: 'Security Tester' },
    { value: 'performance-tester', label: 'Performance Tester' }
  ];

  const personaOptionsHtml = personas.map(p => {
    const selected = p.value === config.selectedPersona ? 'selected' : '';
    return `<option value="${p.value}" ${selected}>${p.label}</option>`;
  }).join('');

  // System Connections widget
  const connectionsWidgetHtml = `
    <div class="card" style="margin-bottom: ${Theme.spacing.md}; border-left: 3px solid var(--vscode-button-background);">
      <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground);">
        🔌 System Connections
      </div>
      <div class="connection-item">
        <span class="status-dot ${config.selectedAIProvider !== 'mock' ? 'active' : 'offline'}">●</span>
        <span class="connection-label">AI Status:</span>
        <span class="connection-val">${config.aiStatus}</span>
      </div>
      <div class="connection-item">
        <span class="status-dot ${config.adoConnected ? 'active' : 'inactive'}">●</span>
        <span class="connection-label">Azure DevOps:</span>
        <span class="connection-val">${config.adoStatus}</span>
      </div>
      <div class="connection-item">
        <span class="status-dot ${config.jiraConnected ? 'active' : 'inactive'}">●</span>
        <span class="connection-label">Jira:</span>
        <span class="connection-val">${config.jiraStatus}</span>
      </div>
      <div class="connection-item">
        <span class="status-dot theme">●</span>
        <span class="connection-label">VS Code Theme:</span>
        <span class="connection-val">${config.detectedTheme}</span>
      </div>
      <div class="connection-item">
        <span class="status-dot active">●</span>
        <span class="connection-label">Offline Rules:</span>
        <span class="connection-val">Enabled (Fail-Safe Heuristics)</span>
      </div>
    </div>
  `;

  // Connection settings collapsible editor
  const editConnectionsHtml = `
    <details class="card" style="margin-bottom: ${Theme.spacing.md};">
      <summary style="cursor: pointer; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground);">
        ⚙️ Edit Connection Settings
      </summary>
      
      <!-- AI Settings -->
      <div style="margin-top: 10px; border-top: 1px solid var(--vscode-panel-border); padding-top: 10px;">
        <div style="font-weight: 600; font-size: 11px; margin-bottom: 6px; color: var(--vscode-foreground);">AI PROVIDER SETTINGS</div>
        
        <label style="font-size: 11px; display: block; margin-bottom: 2px;">Provider:</label>
        <select id="config-ai-provider" onchange="toggleAIFields(this.value)" style="margin-bottom: 6px; font-size: 11px; width:100%;">
          <option value="mock" ${config.selectedAIProvider === 'mock' ? 'selected' : ''}>Rule-Based Heuristics (Offline)</option>
          <option value="openai" ${config.selectedAIProvider === 'openai' ? 'selected' : ''}>OpenAI GPT</option>
          <option value="gemini" ${config.selectedAIProvider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
          <option value="claude" ${config.selectedAIProvider === 'claude' ? 'selected' : ''}>Anthropic Claude</option>
          <option value="ollama" ${config.selectedAIProvider === 'ollama' ? 'selected' : ''}>Ollama Local Server</option>
        </select>
        
        <div id="ai-apikey-container" style="display: ${config.selectedAIProvider === 'openai' || config.selectedAIProvider === 'gemini' || config.selectedAIProvider === 'claude' ? 'block' : 'none'};">
          <label style="font-size: 11px; display: block; margin-bottom: 2px;">API Key:</label>
          <input type="password" id="config-ai-key" placeholder="${config.hasAIKey ? '••••••••••••••••' : 'Enter API Key...'}" style="margin-bottom: 6px; font-size: 11px; width:100%;" />
        </div>

        <div id="ai-model-container" style="display: ${config.selectedAIProvider !== 'mock' ? 'block' : 'none'};">
          <label style="font-size: 11px; display: block; margin-bottom: 2px;">Model Name:</label>
          <input type="text" id="config-ai-model" value="${config.selectedAIModel}" placeholder="e.g. gpt-4o, gemini-1.5-pro, claude-3-5-sonnet" style="margin-bottom: 6px; font-size: 11px; width:100%;" />
        </div>

        <div id="ai-endpoint-container" style="display: ${config.selectedAIProvider === 'ollama' ? 'block' : 'none'};">
          <label style="font-size: 11px; display: block; margin-bottom: 2px;">Endpoint URL:</label>
          <input type="text" id="config-ai-endpoint" value="${config.selectedAIEndpoint}" placeholder="e.g. http://localhost:11434" style="margin-bottom: 6px; font-size: 11px; width:100%;" />
        </div>

        <div style="display: flex; gap: 4px; margin-top: 6px;">
          <button class="btn-primary" onclick="saveAIConfig()" style="font-size: 11px; padding: 4px 8px; flex: 1;">Connect AI</button>
          ${config.selectedAIProvider !== 'mock' ? `<button class="btn-secondary" onclick="disconnectAI()" style="font-size: 11px; padding: 4px 8px; margin-top: 0; width: auto; flex: 1;">Disconnect</button>` : ''}
        </div>
      </div>

      <!-- ADO Settings -->
      <div style="margin-top: 12px; border-top: 1px dashed var(--vscode-panel-border); padding-top: 10px;">
        <div style="font-weight: 600; font-size: 11px; margin-bottom: 6px; color: var(--vscode-foreground);">AZURE DEVOPS SETTINGS</div>
        
        <label style="font-size: 11px; display: block; margin-bottom: 2px;">Organization Name:</label>
        <input type="text" id="config-ado-org" value="${config.adoOrg}" placeholder="Enter Organization..." style="margin-bottom: 6px; font-size: 11px; width:100%;" />
        
        <label style="font-size: 11px; display: block; margin-bottom: 2px;">Project Name:</label>
        <input type="text" id="config-ado-project" value="${config.adoProject}" placeholder="Enter Project..." style="margin-bottom: 6px; font-size: 11px; width:100%;" />
        
        <label style="font-size: 11px; display: block; margin-bottom: 2px;">Personal Access Token (PAT):</label>
        <input type="password" id="config-ado-pat" placeholder="${config.hasAdoPat ? '••••••••••••••••' : 'Enter PAT...'}" style="margin-bottom: 6px; font-size: 11px; width:100%;" />

        <div style="display: flex; gap: 4px; margin-top: 6px;">
          <button class="btn-primary" onclick="saveAdoConfig()" style="font-size: 11px; padding: 4px 8px; flex: 1;">Connect ADO</button>
          ${config.adoConnected ? `<button class="btn-secondary" onclick="disconnectAdo()" style="font-size: 11px; padding: 4px 8px; margin-top: 0; width: auto; flex: 1;">Disconnect</button>` : ''}
        </div>
      </div>

      <!-- Jira Settings -->
      <div style="margin-top: 12px; border-top: 1px dashed var(--vscode-panel-border); padding-top: 10px;">
        <div style="font-weight: 600; font-size: 11px; margin-bottom: 6px; color: var(--vscode-foreground);">JIRA SETTINGS</div>
        
        <label style="font-size: 11px; display: block; margin-bottom: 2px;">Host/Domain URL:</label>
        <input type="text" id="config-jira-domain" value="${config.jiraDomain}" placeholder="e.g. company.atlassian.net" style="margin-bottom: 6px; font-size: 11px; width:100%;" />
        
        <label style="font-size: 11px; display: block; margin-bottom: 2px;">Email Address:</label>
        <input type="text" id="config-jira-email" value="${config.jiraEmail}" placeholder="Enter Email..." style="margin-bottom: 6px; font-size: 11px; width:100%;" />
        
        <label style="font-size: 11px; display: block; margin-bottom: 2px;">API Token:</label>
        <input type="password" id="config-jira-token" placeholder="${config.hasJiraToken ? '••••••••••••••••' : 'Enter API Token...'}" style="margin-bottom: 6px; font-size: 11px; width:100%;" />

        <div style="display: flex; gap: 4px; margin-top: 6px;">
          <button class="btn-primary" onclick="saveJiraConfig()" style="font-size: 11px; padding: 4px 8px; flex: 1;">Connect Jira</button>
          ${config.jiraConnected ? `<button class="btn-secondary" onclick="disconnectJira()" style="font-size: 11px; padding: 4px 8px; margin-top: 0; width: auto; flex: 1;">Disconnect</button>` : ''}
        </div>
      </div>
    </details>
  `;

  // Preference details card
  const preferencesWidgetHtml = `
    <div class="card" style="margin-bottom: ${Theme.spacing.md};">
      <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground);">
        ⚙️ Workspace Preferences
      </div>
      <label for="persona-select" style="font-size: 11px; display: block; margin-bottom: 4px; color: var(--vscode-foreground);">QA Perspective:</label>
      <select id="persona-select" onchange="postMessage({command: 'savePersona', persona: this.value})" style="font-size: 12px; width: 100%; padding: 4px; margin-bottom: 6px;">
        ${personaOptionsHtml}
      </select>
      <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 4px;">
        Determines strategy scoring priorities and test case code formatting templates. Caches automatically.
      </div>
    </div>
  `;

  // Paste Requirement or URL area (Sprint PF-3)
  const pasteIntakeWidgetHtml = `
    <div class="card" style="margin-bottom: ${Theme.spacing.md};">
      <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground);">
        📥 Paste Requirement or URL
      </div>
      <textarea id="intake-paste-area" oninput="detectIntakeType(this.value)" placeholder="Paste requirement text, User Story, Jira/ADO URL, or Issue Key..." style="width: 100%; height: 60px; font-size: 11px; resize: vertical; margin-bottom: 6px; font-family: var(--vscode-font-family, sans-serif);"></textarea>
      
      <div id="intake-detection-badge" class="tag tag-info" style="display: none; margin-bottom: 6px; font-size: 10px; width: fit-content; text-transform: uppercase;">
        Format: <span id="detected-type-label" style="font-weight: 600;">None</span>
      </div>
      
      <button id="intake-analyze-btn" class="btn-primary" onclick="submitIntakeText()" style="font-size: 11px; padding: 4px 8px;" disabled>
        Analyze Input
      </button>
    </div>
  `;

  // Active spec intake flow vs empty state
  const intakeHtml = config.detectedFileName ? `
    <div class="card active-spec-card" style="border: 1px solid var(--vscode-button-background); margin-bottom: ${Theme.spacing.md};">
      <div style="font-weight: 600; color: var(--vscode-button-background); margin-bottom: 4px;">📂 Active Spec Detected</div>
      <p style="margin: 0 0 10px 0; font-size: 12px;">Active editor: <strong>${config.detectedFileName}</strong></p>
      <button class="btn-primary" onclick="postMessage({command: 'analyzeActive'})">🎯 Run Diagnostics Analysis</button>
    </div>
  ` : `
    <div class="card empty-spec-card" id="drop-zone" style="margin-bottom: ${Theme.spacing.md}; text-align: center; padding: 24px 16px; border: 1px dashed var(--vscode-panel-border); transition: border-color 0.2s ease-in-out, background 0.2s ease-in-out;">
      <div style="font-size: 28px; opacity: 0.6; margin-bottom: 8px;">📑</div>
      <div style="font-weight: 500; font-size: 13px; margin-bottom: 4px;">No Specification Open</div>
      <p style="margin: 0; font-size: 11px; color: var(--vscode-descriptionForeground); line-height: 1.4;">
        Open a spec file or <strong>drag and drop a file here</strong> (.md, .feature, .txt, .docx, .pdf, .json) to analyze.
      </p>
    </div>
  `;

  // Recent QA sessions list
  const recentSessionsWidgetHtml = `
    <div class="card">
      <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground);">
        🕒 Recent Sessions
      </div>
      <div class="recent-sessions-list">
        ${config.recentSessionsHtml}
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${strings.landing.welcomeTitle}</title>
    <style>
        body {
            font-family: var(--vscode-font-family, sans-serif);
            font-size: var(--vscode-font-size, 13px);
            padding: ${Theme.spacing.md};
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
            line-height: 1.5;
        }
        h1, h2, h3, h4 { color: var(--vscode-foreground); margin-top: 0; margin-bottom: ${Theme.spacing.xs}; font-weight: 600; }
        
        .welcome-header {
            margin-bottom: ${Theme.spacing.lg};
            text-align: left;
        }
        .welcome-title {
            font-size: 20px;
            font-weight: 600;
            line-height: 1.2;
            margin-bottom: 6px;
        }
        .welcome-subtitle {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.4;
        }

        .card {
            border: 1px solid var(--vscode-panel-border);
            background: var(--vscode-sideBarSectionHeader-background, #2d2d2d);
            border-radius: 2px;
            padding: ${Theme.spacing.md};
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .connection-item {
            display: flex;
            align-items: center;
            font-size: 11px;
            margin-bottom: 4px;
        }
        .status-dot {
            font-size: 8px;
            margin-right: 6px;
        }
        .status-dot.active { color: var(--vscode-testing-iconPassedColor, #89D185); }
        .status-dot.inactive { color: var(--vscode-testing-iconFailedColor, #F48771); }
        .status-dot.theme { color: var(--vscode-textLink-foreground, #3794FF); }
        .status-dot.offline { color: var(--vscode-descriptionForeground); }

        .connection-label {
            font-weight: 500;
            margin-right: 4px;
            color: var(--vscode-descriptionForeground);
        }
        .connection-val {
            color: var(--vscode-foreground);
        }

        input, select, textarea {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border, #454545);
            padding: 5px;
            border-radius: 2px;
            box-sizing: border-box;
        }
        button {
            border: 0;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
            font-weight: 500;
            font-size: 12px;
            width: 100%;
            transition: background ${Theme.animation.fast} ease-in-out;
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-primary:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
        }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            margin-top: 4px;
        }
        .btn-secondary:hover:not(:disabled) {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .session-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            border-bottom: 1px dotted var(--vscode-panel-border);
            font-size: 11px;
        }
        .session-item:last-child {
            border-bottom: 0;
        }
        .session-link-resume {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
        }
        .session-link-resume:hover {
            text-decoration: underline;
        }
        .session-link-delete {
            color: var(--vscode-testing-iconFailedColor, #F48771);
            text-decoration: none;
            cursor: pointer;
            margin-left: 8px;
            font-size: 10px;
        }
        .session-link-delete:hover {
            text-decoration: underline;
        }
        .empty-text {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            font-size: 11px;
        }

        .tag {
            padding: 2px 6px;
            border-radius: 2px;
            font-size: 9px;
            font-weight: 600;
        }
        .tag-info {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }
    </style>
</head>
<body>
    <div class="welcome-header">
        <div class="welcome-title">${strings.landing.welcomeTitle}</div>
        <div class="welcome-subtitle">${strings.landing.welcomeSubtitle}</div>
    </div>

    ${connectionsWidgetHtml}

    ${editConnectionsHtml}

    ${preferencesWidgetHtml}

    ${pasteIntakeWidgetHtml}

    ${intakeHtml}

    ${recentSessionsWidgetHtml}

    <script>
      const vscode = acquireVsCodeApi();
      function postMessage(data) {
        vscode.postMessage(data);
      }

      function detectIntakeType(text) {
        const badge = document.getElementById('intake-detection-badge');
        const label = document.getElementById('detected-type-label');
        const btn = document.getElementById('intake-analyze-btn');
        
        const val = text.trim();
        if (!val) {
          badge.style.display = 'none';
          btn.disabled = true;
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
        const isMarkdown = val.startsWith('#') || val.indexOf('\n#') !== -1 || val.indexOf('**') !== -1;

        if (isJiraUrl) {
          label.innerText = 'Jira Work Item URL';
        } else if (isJiraKey) {
          label.innerText = 'Jira Issue Key';
        } else if (isAdoUrl) {
          label.innerText = 'Azure DevOps Work Item URL';
        } else if (isAdoId) {
          label.innerText = 'Azure DevOps ID';
        } else if (isUserStory) {
          label.innerText = 'User Story Format';
        } else if (isMarkdown) {
          label.innerText = 'Markdown Specification';
        } else {
          label.innerText = 'Plain Text Requirement';
        }
      }

      function submitIntakeText() {
        const text = document.getElementById('intake-paste-area').value;
        const label = document.getElementById('detected-type-label').innerText;
        postMessage({ command: 'submitIntake', text, type: label });
      }

      function toggleAIFields(provider) {
        document.getElementById('ai-apikey-container').style.display = (provider === 'openai' || provider === 'gemini' || provider === 'claude') ? 'block' : 'none';
        document.getElementById('ai-model-container').style.display = (provider !== 'mock') ? 'block' : 'none';
        document.getElementById('ai-endpoint-container').style.display = (provider === 'ollama') ? 'block' : 'none';
      }

      function saveAIConfig() {
        const provider = document.getElementById('config-ai-provider').value;
        const key = document.getElementById('config-ai-key') ? document.getElementById('config-ai-key').value : '';
        const model = document.getElementById('config-ai-model') ? document.getElementById('config-ai-model').value : '';
        const endpoint = document.getElementById('config-ai-endpoint') ? document.getElementById('config-ai-endpoint').value : '';
        postMessage({ command: 'connectAI', provider, key, model, endpoint });
      }

      function disconnectAI() {
        postMessage({ command: 'disconnectAI' });
      }

      function saveAdoConfig() {
        const org = document.getElementById('config-ado-org').value;
        const project = document.getElementById('config-ado-project').value;
        const pat = document.getElementById('config-ado-pat').value;
        postMessage({ command: 'connectADO', org, project, pat });
      }

      function disconnectAdo() {
        postMessage({ command: 'disconnectADO' });
      }

      function saveJiraConfig() {
        const domain = document.getElementById('config-jira-domain').value;
        const email = document.getElementById('config-jira-email').value;
        const token = document.getElementById('config-jira-token').value;
        postMessage({ command: 'connectJira', domain, email, token });
      }

      function disconnectJira() {
        postMessage({ command: 'disconnectJira' });
      }

      // Drag and drop listeners
      setTimeout(function() {
        var dropZone = document.getElementById('drop-zone');
        if (dropZone) {
          dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--vscode-button-background)';
            dropZone.style.background = 'rgba(0,0,0,0.15)';
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
</body>
</html>`;
}

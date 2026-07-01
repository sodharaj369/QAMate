import { Theme } from '../Theme.js';
import { icons } from '../icons.js';

export interface SettingsPageConfig {
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
  selectedPersona: string;
  devModeEnabled: boolean;
  aiStatus: string;
}

export function renderSettingsPage(config: SettingsPageConfig): string {
  const personas = [
    { value: 'manual-qa', label: 'Manual QA Engineer' },
    { value: 'automation-qa', label: 'Automation QA Engineer' },
    { value: 'backend-developer', label: 'Backend Developer' },
    { value: 'frontend-developer', label: 'Frontend Developer' },
    { value: 'tech-lead', label: 'QA Tech Lead' },
    { value: 'security-tester', label: 'Security Tester' },
    { value: 'performance-tester', label: 'Performance Tester' },
  ];

  const personaOptionsHtml = personas
    .map((p) => {
      const selected = p.value === config.selectedPersona ? 'selected' : '';
      return `<option value="${p.value}" ${selected}>${p.label}</option>`;
    })
    .join('');

  // Determine states of each provider
  const isVSCodeLMActive =
    config.selectedAIProvider === 'mock' && config.aiStatus.includes('VS Code LM');
  const isOpenAIActive = config.selectedAIProvider === 'openai' && config.hasAIKey;
  const isClaudeActive = config.selectedAIProvider === 'claude' && config.hasAIKey;
  const isGeminiActive = config.selectedAIProvider === 'gemini' && config.hasAIKey;
  const isOllamaActive = config.selectedAIProvider === 'ollama';

  const aiSectionHtml = `
    <div style="margin-bottom: 12px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 12px;">
      <div style="font-weight: 700; font-size: 10px; text-transform: uppercase; margin-bottom: 8px; color: var(--vscode-foreground); display: flex; align-items: center; gap: 4px;">
        ${icons.rocket} AI Providers Priority List
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <!-- VS Code LM -->
        <div style="padding: 6px; border: 1px solid ${isVSCodeLMActive ? 'var(--vscode-button-background)' : 'var(--vscode-panel-border)'}; border-radius: 4px; background: ${isVSCodeLMActive ? 'rgba(0,122,204,0.05)' : 'transparent'}; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; font-size: 11px;">VS Code Language Model API</span>
            <span style="font-size: 9px; font-weight: 700; color: ${isVSCodeLMActive ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'};">
              ${isVSCodeLMActive ? 'Active' : 'Priority 1 (Auto)'}
            </span>
          </div>
          <div style="font-size: 9px; color: var(--vscode-descriptionForeground);">
            Uses Copilot/VS Code default AI. No key needed.
          </div>
        </div>

        <!-- OpenAI -->
        <div style="padding: 6px; border: 1px solid ${isOpenAIActive ? 'var(--vscode-button-background)' : 'var(--vscode-panel-border)'}; border-radius: 4px; background: ${isOpenAIActive ? 'rgba(0,122,204,0.05)' : 'transparent'}; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; font-size: 11px;">OpenAI GPT</span>
            <span style="font-size: 9px; font-weight: 700; color: ${isOpenAIActive ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'};">
              ${isOpenAIActive ? 'Active' : 'Not Configured'}
            </span>
          </div>
          <div style="font-size: 9px; color: var(--vscode-descriptionForeground); display: flex; justify-content: space-between; align-items: center;">
            <span>Custom developer-provided key.</span>
            <span style="color: var(--vscode-textLink-foreground); cursor: pointer;" onclick="postMessage({command: 'configureAIWizard'})">Configure</span>
          </div>
        </div>

        <!-- Claude -->
        <div style="padding: 6px; border: 1px solid ${isClaudeActive ? 'var(--vscode-button-background)' : 'var(--vscode-panel-border)'}; border-radius: 4px; background: ${isClaudeActive ? 'rgba(0,122,204,0.05)' : 'transparent'}; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; font-size: 11px;">Anthropic Claude</span>
            <span style="font-size: 9px; font-weight: 700; color: ${isClaudeActive ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'};">
              ${isClaudeActive ? 'Active' : 'Not Configured'}
            </span>
          </div>
          <div style="font-size: 9px; color: var(--vscode-descriptionForeground); display: flex; justify-content: space-between; align-items: center;">
            <span>Custom developer-provided key.</span>
            <span style="color: var(--vscode-textLink-foreground); cursor: pointer;" onclick="postMessage({command: 'configureAIWizard'})">Configure</span>
          </div>
        </div>

        <!-- Gemini -->
        <div style="padding: 6px; border: 1px solid ${isGeminiActive ? 'var(--vscode-button-background)' : 'var(--vscode-panel-border)'}; border-radius: 4px; background: ${isGeminiActive ? 'rgba(0,122,204,0.05)' : 'transparent'}; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; font-size: 11px;">Google Gemini</span>
            <span style="font-size: 9px; font-weight: 700; color: ${isGeminiActive ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'};">
              ${isGeminiActive ? 'Active' : 'Not Configured'}
            </span>
          </div>
          <div style="font-size: 9px; color: var(--vscode-descriptionForeground); display: flex; justify-content: space-between; align-items: center;">
            <span>Custom developer-provided key.</span>
            <span style="color: var(--vscode-textLink-foreground); cursor: pointer;" onclick="postMessage({command: 'configureAIWizard'})">Configure</span>
          </div>
        </div>

        <!-- Ollama -->
        <div style="padding: 6px; border: 1px solid ${isOllamaActive ? 'var(--vscode-button-background)' : 'var(--vscode-panel-border)'}; border-radius: 4px; background: ${isOllamaActive ? 'rgba(0,122,204,0.05)' : 'transparent'}; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-weight: 600; font-size: 11px;">Ollama Local</span>
            <span style="font-size: 9px; font-weight: 700; color: ${isOllamaActive ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'};">
              ${isOllamaActive ? 'Active' : 'Not Configured'}
            </span>
          </div>
          <div style="font-size: 9px; color: var(--vscode-descriptionForeground); display: flex; justify-content: space-between; align-items: center;">
            <span>Offline-friendly local LLM endpoint.</span>
            <span style="color: var(--vscode-textLink-foreground); cursor: pointer;" onclick="postMessage({command: 'configureAIWizard'})">Configure</span>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 10px; display: flex; gap: 4px;">
        <button class="btn-secondary" onclick="postMessage({command: 'configureAIWizard'})" style="font-size: 10px; padding: 4px 8px; margin: 0; flex: 1;">Connect Custom AI</button>
        ${config.selectedAIProvider !== 'mock' ? `<button class="btn-secondary" onclick="postMessage({command: 'disconnectAI'})" style="font-size: 10px; padding: 4px 8px; margin: 0; width: auto; flex: 1; border-color: var(--vscode-testing-iconFailedColor, #F48771); color: var(--vscode-testing-iconFailedColor, #F48771);">Disconnect Custom</button>` : ''}
      </div>
    </div>
  `;

  // Azure DevOps Section
  const adoSectionHtml = `
    <div style="margin-bottom: 12px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 12px;">
      <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; color: var(--vscode-foreground); display: flex; align-items: center; gap: 4px;">
        ${icons.azure} Azure DevOps
      </div>
      <div style="font-size: 10px; color: ${config.adoConnected ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'}; font-weight: 500; margin-bottom: 4px;">
        Status: <strong>${config.adoConnected ? `Connected (${config.adoProject})` : 'Disconnected'}</strong>
      </div>
      <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; line-height: 1.4;">
        Sync test cases directly into Azure DevOps stories and epics.
      </div>
      
      <div style="display: flex; gap: 4px;">
        <button class="btn-secondary" onclick="postMessage({command: 'configureAzureWizard'})" style="font-size: 10px; padding: 4px 8px; margin: 0; flex: 1;">Configure Azure</button>
        ${config.adoConnected ? `<button class="btn-secondary" onclick="postMessage({command: 'disconnectADO'})" style="font-size: 10px; padding: 4px 8px; margin: 0; width: auto; flex: 1; border-color: var(--vscode-testing-iconFailedColor, #F48771); color: var(--vscode-testing-iconFailedColor, #F48771);">Disconnect</button>` : ''}
      </div>
    </div>
  `;

  // Jira Section
  const jiraSectionHtml = `
    <div style="margin-bottom: 12px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 12px;">
      <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; color: var(--vscode-foreground); display: flex; align-items: center; gap: 4px;">
        ${icons.jira} Jira Connection
      </div>
      <div style="font-size: 10px; color: ${config.jiraConnected ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'}; font-weight: 500; margin-bottom: 4px;">
        Status: <strong>${config.jiraConnected ? `Connected (${config.jiraDomain})` : 'Disconnected'}</strong>
      </div>
      <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; line-height: 1.4;">
        Link and sync Gherkin scenarios to your Jira board work items.
      </div>
      
      <div style="display: flex; gap: 4px;">
        <button class="btn-secondary" onclick="postMessage({command: 'configureJiraWizard'})" style="font-size: 10px; padding: 4px 8px; margin: 0; flex: 1;">Configure Jira</button>
        ${config.jiraConnected ? `<button class="btn-secondary" onclick="postMessage({command: 'disconnectJira'})" style="font-size: 10px; padding: 4px 8px; margin: 0; width: auto; flex: 1; border-color: var(--vscode-testing-iconFailedColor, #F48771); color: var(--vscode-testing-iconFailedColor, #F48771);">Disconnect</button>` : ''}
      </div>
    </div>
  `;

  // Developer Tools Section (collapsible details panel)
  const developerSectionHtml = config.devModeEnabled
    ? `
    <div class="card" style="margin-top: ${Theme.spacing.md}; border-left: 3px solid var(--vscode-testing-iconQueuedColor, #CCA700);">
      <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 4px;">
        ${icons.gear} Developer Diagnostics (Active)
      </div>
      
      <details style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border); padding: 4px 8px; border-radius: 4px;">
        <summary>
          <span>Logs & History</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 6px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px;">
          <pre style="margin: 0; font-size: 10px; overflow-x: auto; max-height: 120px; white-space: pre-wrap;"><code>[INFO] QAMate VS Code Extension activated.
[INFO] SQLite cache storage connected.
[DEBUG] Loaded 4 core rule heuristics.</code></pre>
        </div>
      </details>

      <details style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border); padding: 4px 8px; border-radius: 4px;">
        <summary>
          <span>Engine Events</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 6px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px;">
          <div style="font-size: 10px; line-height: 1.4;">
            ● session.created: Session conv-intake-1283<br/>
            ● analyzer.rules_mapped: Rules 1, 3, 4 matched<br/>
            ● context.validation: Health scorecard compiled
          </div>
        </div>
      </details>

      <details style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border); padding: 4px 8px; border-radius: 4px;">
        <summary>
          <span>Reasoning Trace</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 6px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px;">
          <div style="font-size: 10px; line-height: 1.4;">
            1. Parse story token nodes<br/>
            2. Match semantic domain keywords against database<br/>
            3. Detect customer actors context
          </div>
        </div>
      </details>

      <details style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border); padding: 4px 8px; border-radius: 4px;">
        <summary>
          <span>AI Requests</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 6px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px;">
          <div style="font-size: 10px; line-height: 1.4;">
            Provider: <strong>${config.selectedAIProvider}</strong><br/>
            Model: <strong>${config.selectedAIModel || 'Offline Mode'}</strong><br/>
            Last call latency: <strong>0ms (Cache hit)</strong>
          </div>
        </div>
      </details>

      <details style="margin-bottom: 4px; border: 1px solid var(--vscode-panel-border); padding: 4px 8px; border-radius: 4px;">
        <summary>
          <span>Performance & Diagnostics</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 6px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px;">
          <div style="font-size: 10px; line-height: 1.4;">
            Memory allocation: <strong>14.2 MB</strong><br/>
            Database connection state: <strong>Idle</strong><br/>
            Cache hits ratio: <strong>100%</strong>
          </div>
        </div>
      </details>
    </div>
  `
    : '';

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
      <h2 style="font-size: 15px; font-weight: 600; margin-bottom: 12px; color: var(--vscode-foreground); display: flex; align-items: center; gap: 4px;">
        ${icons.gear} Settings
      </h2>

      <!-- Connections Drawer -->
      <div class="card" style="margin-bottom: ${Theme.spacing.md};">
        <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; color: var(--vscode-descriptionForeground);">
          🔌 Integrations Setup
        </div>
        <div>
          ${aiSectionHtml}
          ${adoSectionHtml}
          ${jiraSectionHtml}
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="card" style="margin-bottom: ${Theme.spacing.md};">
        <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; color: var(--vscode-descriptionForeground);">
          Preferences
        </div>
        
        <label for="persona-select" style="font-size: 11px; display: block; margin-bottom: 2px;">Default QA Focus:</label>
        <select id="persona-select" onchange="postMessage({command: 'savePersona', persona: this.value})" style="font-size: 11px; width: 100%; padding: 4px; margin-bottom: 8px; height: 24px;">
          ${personaOptionsHtml}
        </select>
        
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-top: 10px;">
          <span>Enable Developer Mode:</span>
          <input type="checkbox" id="devmode-check" ${config.devModeEnabled ? 'checked' : ''} onchange="postMessage({command: 'toggleDevMode'})" style="width: auto; cursor: pointer;" />
        </div>
      </div>

      <!-- Developer mode details -->
      ${developerSectionHtml}
    </div>
  `;
}

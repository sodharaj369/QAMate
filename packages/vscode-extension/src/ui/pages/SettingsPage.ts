import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface SettingsPageConfig {
  isNoSession: boolean;
  selectedSectionId?: string;
  projectOverview?: {
    name: string;
    domain: string;
    architecture: string;
    language: string;
    testing: string;
    version: string;
    baseline: string;
    modified: string;
    changesCount: number;
  };
  healthPercentage?: number;
  healthMetrics?: { label: string; status: 'Passed' | 'Warning' }[];
  techStack?: { label: string; value: string }[];
  architectures?: { label: string; checked: boolean }[];
  qualityPriorities?: { label: string; priority: 'Critical' | 'High' | 'Medium' | 'Low' }[];
  testingStandards?: { label: string; checked: boolean }[];
  glossary?: { term: string; meaning: string; alias: string; source: string }[];
  providers?: { name: string; capability: string; rating: string; status: string; priority: string }[];
  thinkingRules?: { label: string; checked: boolean }[];
  knowledgeMemory?: { label: string; count: number }[];
  workspaceScan?: { label: string; status: 'Detected' | 'New' | 'Missing' }[];
  integrations?: { name: string; connected: boolean }[];
  promptWeights?: { label: string; weight: number }[];
  historyLogs?: string[];
  // Legacy / Test Compatibility parameters
  selectedAIProvider?: string;
  selectedAIModel?: string;
  selectedAIEndpoint?: string;
  selectedPersona?: string;
  hasAIKey?: boolean;
  adoOrg?: string;
  adoProject?: string;
  hasAdoPat?: boolean;
  jiraDomain?: string;
  jiraEmail?: string;
  hasJiraToken?: boolean;
  adoConnected?: boolean;
  jiraConnected?: boolean;
  devModeEnabled?: boolean;
  aiStatus?: string;
}

export function renderSettingsPage(config: SettingsPageConfig): string {
  if (config.isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>Project DNA Workspace Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // DNA Cockpit Defaults
  const overview = config.projectOverview || {
    name: 'ParentPay POS',
    domain: 'Payments',
    architecture: 'Microservices',
    language: '.NET + MAUI',
    testing: 'Manual + Playwright',
    version: '3.1',
    baseline: 'Sprint 14',
    modified: 'Today',
    changesCount: 8
  };

  const healthPercentage = config.healthPercentage ?? 87;
  
  const healthMetrics = config.healthMetrics || [
    { label: 'Technology Stack config', status: 'Passed' as const },
    { label: 'Architecture models profile', status: 'Warning' as const },
    { label: 'Business Glossary glossary', status: 'Passed' as const },
    { label: 'QA Playbooks specifications', status: 'Passed' as const },
    { label: 'Connected Integrations status', status: 'Warning' as const },
    { label: 'Quality Attributes priorities', status: 'Passed' as const }
  ];

  const techStack = config.techStack || [
    { label: 'Frontend UI', value: 'React' },
    { label: 'Backend API', value: '.NET Core' },
    { label: 'Database schema', value: 'SQL Server' },
    { label: 'Cloud Hosting', value: 'Azure' },
    { label: 'Messaging queue', value: 'RabbitMQ' },
    { label: 'Auth Gateway', value: 'Azure AD' }
  ];

  const architectures = config.architectures || [
    { label: 'Microservices architecture', checked: true },
    { label: 'Monolith layout', checked: false },
    { label: 'Serverless backend', checked: false },
    { label: 'API Only scope', checked: false }
  ];

  const qualityPriorities = config.qualityPriorities || [
    { label: 'Security checkouts', priority: 'Critical' as const },
    { label: 'Performance limits', priority: 'High' as const },
    { label: 'Reliability metrics', priority: 'High' as const },
    { label: 'Accessibility WCAG', priority: 'Medium' as const }
  ];

  const testingStandards = config.testingStandards || [
    { label: 'ISTQB compliance standards', checked: true },
    { label: 'OWASP vulnerability checks', checked: true },
    { label: 'PCI DSS security compliance', checked: true },
    { label: 'WCAG compliance', checked: false }
  ];

  const glossary = config.glossary || [
    { term: 'Tenant', meaning: 'Customer Organization profile', alias: 'School client', source: 'Requirement section 3' },
    { term: 'Settlement', meaning: 'Payment reconciliation logs', alias: 'Clearing process', source: 'Requirement paragraph 1' }
  ];

  const providers = config.providers || [
    { name: 'Claude', capability: 'Reasoning', rating: '★★★★★', status: 'Connected', priority: 'Preferred' },
    { name: 'GPT', capability: 'Generation', rating: '★★★★★', status: 'Disconnected', priority: 'Fallback' },
    { name: 'Gemini', capability: 'Analysis', rating: '★★★★☆', status: 'No API Key', priority: 'Disabled' },
    { name: 'Ollama', capability: 'Offline', rating: '★★★☆☆', status: 'Running', priority: 'Fallback' }
  ];

  const thinkingRules = config.thinkingRules || [
    { label: 'Challenge rules assumptions', checked: true },
    { label: 'Preserve literal spec meaning', checked: true },
    { label: 'Use Project DNA profiles', checked: true },
    { label: 'Avoid test suite duplicates', checked: true },
    { label: 'Prioritize business risk items', checked: true }
  ];

  const knowledgeMemory = config.knowledgeMemory || [
    { label: 'User corrections logged', count: 18 },
    { label: 'Known bug signatures', count: 9 },
    { label: 'Learned recommendations rules', count: 14 },
    { label: 'Playbook rules overrides', count: 3 }
  ];

  const workspaceScan = config.workspaceScan || [
    { label: 'React frontend framework', status: 'Detected' as const },
    { label: '.NET backend framework', status: 'Detected' as const },
    { label: 'Docker compose files', status: 'Detected' as const },
    { label: 'Playwright E2E tests', status: 'New' as const },
    { label: 'RabbitMQ messaging client', status: 'Missing' as const }
  ];

  const integrations = config.integrations || [
    { name: 'Jira Software connections', connected: true },
    { name: 'Azure DevOps Boards connection', connected: true },
    { name: 'GitHub Actions repository', connected: true },
    { name: 'Slack channel notifications', connected: false }
  ];

  const promptWeights = config.promptWeights || [
    { label: 'Project DNA profile', weight: 32 },
    { label: 'Requirements text context', weight: 28 },
    { label: 'System Model specifications', weight: 18 },
    { label: 'Mental Model assumptions', weight: 15 },
    { label: 'Learned Memory logs', weight: 7 }
  ];

  const historyLogs = config.historyLogs || [
    'Playbook changed (v3.0)',
    'Glossary mapped terms (v3.1)',
    'Provider connection active (Claude)'
  ];

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Project Overview Header Card -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <span style="font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 4px;">🧬 Project DNA Cockpit</span>
          <span style="font-size: 10px; color: var(--vscode-descriptionForeground);">Version: <strong>${overview.version}</strong> (Baseline: ${overview.baseline})</span>
        </div>
        <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9.5px; color: var(--vscode-descriptionForeground);">
          <div>Project: <strong style="color: var(--vscode-foreground);">${overview.name}</strong></div>
          <div>Domain: <strong style="color: var(--vscode-foreground);">${overview.domain}</strong></div>
          <div>Architecture: <strong style="color: var(--vscode-foreground);">${overview.architecture}</strong></div>
          <div>Language: <strong style="color: var(--vscode-foreground);">${overview.language}</strong></div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; font-size: 8.5px; opacity: 0.8; margin-top: 2px;">
          <span>Modified: ${overview.modified}</span>
          <span>•</span>
          <span>Pending Changes: <strong>${overview.changesCount}</strong></span>
          <span>•</span>
          <a href="#" onclick="postMessage({command: 'restoreBaseline'})" style="color: var(--vscode-textLink-foreground); text-decoration: none;">Restore Previous</a>
        </div>
      </div>

      <!-- DNA Health Indicator cockpit -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; margin-bottom: 4px;">
          <span>DNA Health Status completeness</span>
          <span style="color: var(--vscode-button-background);">${healthPercentage}%</span>
        </div>
        <div style="background: var(--vscode-panel-border); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
          <div style="background: var(--vscode-button-background); width: ${healthPercentage}%; height: 100%;"></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9px; color: var(--vscode-descriptionForeground);">
          ${healthMetrics.map(m => `
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: ${m.status === 'Passed' ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-testing-iconFailedColor, #F48771)'}; font-weight: bold;">
                ${m.status === 'Passed' ? '✓' : '⚠'}
              </span>
              <span>${m.label}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Main Columns Flex Grid Layout -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Left Column: Environment Stack & Architecture specifications -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Technology Stack -->
          ${renderPanel('Technology Stack Profile', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${techStack.map(t => `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: var(--vscode-descriptionForeground); font-size: 9px;">${t.label}:</span>
                  <input type="text" value="${t.value}" style="font-size: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px;" />
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Architecture dropdown selects -->
          ${renderPanel('Architecture design models', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${architectures.map(arch => `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" ${arch.checked ? 'checked' : ''} />
                  <span>${arch.label}</span>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Quality Attributes Priorities -->
          ${renderPanel('Quality Attributes priorities', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${qualityPriorities.map(q => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0;">
                  <span>${q.label}</span>
                  <select style="font-size: 9px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                    <option ${q.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                    <option ${q.priority === 'High' ? 'selected' : ''}>High</option>
                    <option ${q.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option ${q.priority === 'Low' ? 'selected' : ''}>Low</option>
                  </select>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Testing Standards Rulesets -->
          ${renderPanel('Testing Standards rulesets', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${testingStandards.map(std => `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" ${std.checked ? 'checked' : ''} />
                  <span>${std.label}</span>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Environment Profiles Base URLs -->
          ${renderPanel('Deployment Environment profiles base URLs', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 9px; color: var(--vscode-descriptionForeground); width: 40px;">QA:</span>
                <input type="text" value="https://qa.pay.local" style="flex: 1; font-size: 10px; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 9px; color: var(--vscode-descriptionForeground); width: 40px;">Staging:</span>
                <input type="text" value="https://staging.pay.local" style="flex: 1; font-size: 10px; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              </div>
            </div>
          `)}

        </div>

        <!-- Right Column: Glossary, Providers, Rules & Scanner -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Business Glossary mappings table -->
          ${renderPanel('Business Glossary term mappings', `
            <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; border: 1px solid var(--vscode-panel-border); margin-bottom: 6px;">
              <thead>
                <tr style="background: var(--vscode-sideBarSectionHeader-background); border-bottom: 1px solid var(--vscode-panel-border);">
                  <th style="padding: 3px; text-align: left;">Term</th>
                  <th style="padding: 3px; text-align: left;">Alias</th>
                  <th style="padding: 3px; text-align: left;">Meaning</th>
                </tr>
              </thead>
              <tbody>
                ${glossary.map(g => `
                  <tr style="border-bottom: 1px solid var(--vscode-panel-border);">
                    <td style="padding: 3px; font-weight: bold; border-right: 1px solid var(--vscode-panel-border);">${g.term}</td>
                    <td style="padding: 3px; border-right: 1px solid var(--vscode-panel-border);">${g.alias}</td>
                    <td style="padding: 3px;">${g.meaning}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="display: flex; gap: 3px;">
              <input type="text" id="glossary-term-new" placeholder="Term..." style="flex: 1; font-size: 9.5px; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); padding: 2px;" />
              <button class="btn-primary" onclick="postMessage({command: 'addGlossaryTerm', term: document.getElementById('glossary-term-new').value})" style="font-size: 8px; padding: 0 4px; line-height: 1; width: auto; height: 18px;">+ Add</button>
            </div>
          `)}

          <!-- AI Provider Connection & Fallbacks -->
          ${renderPanel('AI Fallback Providers capability configurations', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${providers.map(p => `
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--vscode-panel-border); padding: 4px 0;">
                  <div>
                    <strong style="color: var(--vscode-foreground);">${p.name}</strong> 
                    <span style="font-size: 8px; color: var(--vscode-descriptionForeground);">(${p.capability} ${p.rating})</span>
                  </div>
                  <div style="display: flex; gap: 4px; align-items: center;">
                    <span style="font-size: 8px; opacity: 0.7;">${p.status}</span>
                    <select style="font-size: 9px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                      <option ${p.priority === 'Preferred' ? 'selected' : ''}>Preferred</option>
                      <option ${p.priority === 'Fallback' ? 'selected' : ''}>Fallback</option>
                      <option ${p.priority === 'Disabled' ? 'selected' : ''}>Disabled</option>
                    </select>
                  </div>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Thinking Rules checkboxes -->
          ${renderPanel('QA Reasoning Thinking Rules', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${thinkingRules.map(rule => `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" ${rule.checked ? 'checked' : ''} />
                  <span>${rule.label}</span>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Project Knowledge Memory learnt counts -->
          ${renderPanel('Project Knowledge memory learnt rules', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${knowledgeMemory.map(k => `
                <div>
                  <span style="color: var(--vscode-descriptionForeground); font-size: 9px;">${k.label}:</span>
                  <strong style="color: var(--vscode-foreground);">${k.count}</strong>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Workspace Detection repository scanner alerts -->
          ${renderPanel('Workspace Scan Auto-Detection alerts', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${workspaceScan.map(item => `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>${item.label}</span>
                  <span style="color: ${item.status === 'Detected' ? 'var(--vscode-testing-iconPassedColor, #89D185)' : item.status === 'New' ? 'var(--vscode-testing-iconQueuedColor, #CCA700)' : 'var(--vscode-testing-iconFailedColor, #F48771)'}; font-weight: bold;">
                    ${item.status}
                  </span>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Integrations connected status -->
          ${renderPanel('Workspace Connected Integrations', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${integrations.map(integ => `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="color: ${integ.connected ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-testing-iconFailedColor, #F48771)'}; font-weight: bold;">
                    ${integ.connected ? '✓' : '⚠'}
                  </span>
                  <span>${integ.name}</span>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Prompt Context contribution weight breakdown preview -->
          ${renderPanel('AI Prompt Context Weight contribution', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${promptWeights.map(w => `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: var(--vscode-descriptionForeground); margin-bottom: 2px;">
                    <span>${w.label}</span>
                    <span>${w.weight}%</span>
                  </div>
                  <div style="background: var(--vscode-panel-border); height: 4px; border-radius: 2px; overflow: hidden;">
                    <div style="background: var(--vscode-button-background); width: ${w.weight}%; height: 100%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- DNA revision timeline logs -->
          ${renderPanel('DNA Changes Timeline history', `
            <div style="font-family: monospace; font-size: 9px; line-height: 1.3;">
              ${historyLogs.map(l => `<div>• ${l}</div>`).join('')}
            </div>
          `)}

          <!-- Developer Diagnostics Panel -->
          ${config.selectedPersona || config.adoProject || config.jiraDomain ? renderPanel('Developer Diagnostics', `
            <div style="font-family: monospace; font-size: 9px; line-height: 1.4; color: var(--vscode-foreground);">
              Persona: ${config.selectedPersona || ''}<br/>
              ADO Project: ${config.adoProject || ''}<br/>
              Jira Domain: ${config.jiraDomain || ''}
            </div>
          `) : ''}

        </div>

      </div>

      <!-- Actions Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; gap: 4px; box-sizing: border-box; width: 100%;">
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'discardDNA'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Discard</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'rescanWorkspace'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Rescan Repo</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'exportDNA'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Export DNA</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'cloneDNA'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Clone DNA</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'compareDNA'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Compare DNA</button>
      </div>

      <!-- Save DNA Configuration footer button -->
      <button class="btn-primary" onclick="postMessage({command: 'saveProjectDNA'})" style="height: 26px; line-height: 1; font-weight: bold; width: 100%; box-sizing: border-box;">
        Save Project DNA ➔
      </button>

    </div>
  `;
}

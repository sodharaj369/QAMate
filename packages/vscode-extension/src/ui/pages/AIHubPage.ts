import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface AIHubPageConfig {
  isNoSession: boolean;
  selectedPreviewTab?: 'Markdown' | 'Excel' | 'Jira' | 'Azure DevOps' | 'JSON';
  isAdvancedMode?: boolean;
  activeProvider?: string;
  connectedCount?: number;
  healthyCount?: number;
  offlineCount?: number;
  requestsToday?: number;
  workspaceMode?: 'AI Connected' | 'AI Limited' | 'Manual Mode' | 'Offline';
  latencyAvg?: number;
  monthlySpend?: number;
  monthlyLimit?: number;
  capabilities?: { label: string; model: string; capability: string; rating: string }[];
  providers?: { name: string; status: string; latency: number; availability: number; context: string; jsonSupport: boolean; cost: string }[];
  routingRules?: { label: string; provider: string }[];
  failoverChain?: string[];
  connectionsTest?: { label: string; status: 'Passed' | 'Failed' | 'Warning' }[];
  keyStatuses?: { label: string; status: 'Configured' | 'Missing' | 'Local' }[];
  promptProfiles?: { label: string; mode: 'Strict' | 'Deterministic' | 'Balanced' | 'Creative' }[];
  usageStats?: { label: string; value: string }[];
  costSettings?: { label: string; value: string }[];
  timelineLogs?: { time: string; provider: string; operation: string; latency: number; status: string; fallback: string; reason: string }[];
  securitySettings?: { label: string; status: boolean }[];
  capabilityTests?: { label: string; status: boolean }[];
  recommendations?: { project: string; model: string; reason: string }[];
  explainabilityChain?: string[];
}

export function renderAIHubPage(config: AIHubPageConfig): string {
  if (config.isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>AI Hub Workspace Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // AI Hub defaults
  const activeProvider = config.activeProvider || 'Claude';
  const connectedCount = config.connectedCount ?? 5;
  const healthyCount = config.healthyCount ?? 4;
  const offlineCount = config.offlineCount ?? 1;
  const requestsToday = config.requestsToday ?? 284;
  const workspaceMode = config.workspaceMode || 'AI Connected';
  const latencyAvg = config.latencyAvg ?? 230;
  const monthlySpend = config.monthlySpend ?? 42.50;
  const monthlyLimit = config.monthlyLimit ?? 150.00;
  const isAdvancedMode = config.isAdvancedMode ?? false;

  const capabilities = config.capabilities || [
    { label: 'Reasoning tasks', model: 'Claude 3.5 Sonnet', capability: 'Reasoning', rating: '★★★★★' },
    { label: 'Generation tasks', model: 'GPT-5 Preview', capability: 'Generation', rating: '★★★★★' },
    { label: 'Review audits', model: 'Claude 3.5 Sonnet', capability: 'Review', rating: '★★★★★' },
    { label: 'Vision inputs', model: 'Gemini 1.5 Pro', capability: 'Vision', rating: '★★★★☆' },
    { label: 'Offline execution', model: 'DeepSeek Coder', capability: 'Offline', rating: '★★★☆☆' }
  ];

  const providers = config.providers || [
    { name: 'Claude', status: 'Connected', latency: 240, availability: 99, context: '200k', jsonSupport: true, cost: 'Low' },
    { name: 'GPT-4o', status: 'Connected', latency: 380, availability: 98, context: '128k', jsonSupport: true, cost: 'Medium' },
    { name: 'Gemini', status: 'No API Key', latency: 410, availability: 95, context: '1M', jsonSupport: true, cost: 'Low' },
    { name: 'Ollama', status: 'Running', latency: 150, availability: 100, context: '8k', jsonSupport: false, cost: 'Free' }
  ];

  const routingRules = config.routingRules || [
    { label: 'Requirement Analysis', provider: 'Claude' },
    { label: 'System Model Mapping', provider: 'Claude' },
    { label: 'Strategy Objectives', provider: 'Claude' },
    { label: 'Test Cases Generation', provider: 'GPT' },
    { label: 'Playbook Review Gate', provider: 'Claude' }
  ];

  const failoverChain = config.failoverChain || ['Claude (Primary)', 'GPT (Fallback)', 'Gemini (Fallback)', 'Ollama (Offline)'];

  const connectionsTest = config.connectionsTest || [
    { label: 'Claude', status: 'Passed' as const },
    { label: 'GPT-4o', status: 'Passed' as const },
    { label: 'Gemini Pro', status: 'Failed' as const },
    { label: 'Ollama local', status: 'Passed' as const }
  ];

  const keyStatuses = config.keyStatuses || [
    { label: 'Claude key status', status: 'Configured' as const },
    { label: 'GPT key status', status: 'Configured' as const },
    { label: 'Gemini key status', status: 'Missing' as const },
    { label: 'Ollama key status', status: 'Local' as const }
  ];

  const promptProfiles = config.promptProfiles || [
    { label: 'Requirement Analysis profile', mode: 'Strict' as const },
    { label: 'Playbook Review Gate profile', mode: 'Deterministic' as const },
    { label: 'Test Cases Generation profile', mode: 'Balanced' as const }
  ];

  const usageStats = config.usageStats || [
    { label: 'Requests Today', value: '284' },
    { label: 'Tokens Exchanged', value: '4.5M' },
    { label: 'Average Response Time', value: '2.1s' },
    { label: 'Transaction Failures', value: '1' }
  ];

  const timelineLogs = config.timelineLogs || [
    { time: '10:42', provider: 'Claude', operation: 'Strategy Gen', latency: 2500, status: 'Timeout', fallback: 'GPT-4o', reason: 'Threshold limit reached' },
    { time: '10:45', provider: 'GPT-4o', operation: 'Test Case Gen', latency: 890, status: 'Success', fallback: 'None', reason: 'Normal query load' }
  ];

  const securitySettings = config.securitySettings || [
    { label: 'API Keys Stored Securely', status: true },
    { label: 'Project Data Masking active', status: true },
    { label: 'Local Execution Sandboxed', status: true }
  ];

  const capabilityTests = config.capabilityTests || [
    { label: 'Reasoning capabilities', status: true },
    { label: 'Generation capabilities', status: true },
    { label: 'Review capabilities', status: true },
    { label: 'Vision inputs', status: false },
    { label: 'Embeddings arrays', status: true }
  ];

  const recommendations = config.recommendations || [
    { project: 'Payments Microservices', model: 'Claude Sonnet', reason: 'Large context window capacity and strong reasoning logic.' }
  ];

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- AI Hub Overview Header Dashboard -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <span style="font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 4px;">🤖 AI Hub Control Center</span>
          <span style="font-size: 10px; color: var(--vscode-testing-iconPassedColor, #89D185); font-weight: bold;">
            ${workspaceMode}
          </span>
        </div>
        <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9.5px; color: var(--vscode-descriptionForeground);">
          <div>Preferred AI: <strong style="color: var(--vscode-foreground);">${activeProvider}</strong></div>
          <div>Latency Avg: <strong style="color: var(--vscode-foreground);">${latencyAvg}ms</strong></div>
          <div>Requests Today: <strong style="color: var(--vscode-foreground);">${requestsToday}</strong></div>
          <div>Connected Models: <strong style="color: var(--vscode-foreground);">${connectedCount} (${healthyCount} healthy, ${offlineCount} offline)</strong></div>
        </div>
      </div>

      <!-- Mode Toggler checkbox -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box;">
        <span style="font-weight: 700; color: var(--vscode-descriptionForeground);">Advanced Settings Router</span>
        <div style="display: flex; align-items: center; gap: 4px;">
          <input type="checkbox" id="mode-advanced-toggle" ${isAdvancedMode ? 'checked' : ''} onclick="postMessage({command: 'toggleAIHubMode', advanced: this.checked})" />
          <span>Advanced Mode</span>
        </div>
      </div>

      <!-- Main Columns Flex Grid Layout -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Left Column: Capabilities & Routing configurations -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- AI Capabilities mapping -->
          ${renderPanel('AI Capabilities Mappings', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${capabilities.map(c => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0;">
                  <span>${c.label} (${c.capability}):</span>
                  <div style="display: flex; gap: 4px; align-items: center;">
                    <span style="font-size: 9px; font-weight: bold; color: var(--vscode-foreground);">${c.model}</span>
                    <span style="font-size: 8px; opacity: 0.7;">${c.rating}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Advanced: Custom Routing Rules -->
          ${isAdvancedMode ? renderPanel('Custom Routing Rules (Advanced)', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${routingRules.map(r => `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span>${r.label}:</span>
                  <select style="font-size: 9px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                    <option ${r.provider === 'Claude' ? 'selected' : ''}>Claude Sonnet</option>
                    <option ${r.provider === 'GPT' ? 'selected' : ''}>GPT-5 Preview</option>
                    <option ${r.provider === 'Gemini' ? 'selected' : ''}>Gemini Pro</option>
                    <option ${r.provider === 'Ollama' ? 'selected' : ''}>Ollama Local</option>
                  </select>
                </div>
              `).join('')}
            </div>
          `) : ''}

          <!-- Prompt Profiles -->
          ${renderPanel('Prompt Profiles configuration', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${promptProfiles.map(p => `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span>${p.label}:</span>
                  <select style="font-size: 9px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
                    <option ${p.mode === 'Strict' ? 'selected' : ''}>Strict</option>
                    <option ${p.mode === 'Deterministic' ? 'selected' : ''}>Deterministic</option>
                    <option ${p.mode === 'Balanced' ? 'selected' : ''}>Balanced</option>
                    <option ${p.mode === 'Creative' ? 'selected' : ''}>Creative</option>
                  </select>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Secure Connection Keys Config -->
          ${renderPanel('Secure Connection Keys config', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${keyStatuses.map(k => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0;">
                  <span>${k.label}:</span>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <span style="font-weight: bold; color: ${k.status === 'Configured' ? 'var(--vscode-testing-iconPassedColor, #89D185)' : k.status === 'Local' ? 'var(--vscode-testing-iconQueuedColor, #CCA700)' : 'var(--vscode-testing-iconFailedColor, #F48771)'};">
                      ${k.status}
                    </span>
                    <a href="#" onclick="postMessage({command: 'configureProviderKey', provider: '${k.label}'})" style="color: var(--vscode-textLink-foreground); text-decoration: none;">edit</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `)}

        </div>

        <!-- Right Column: Health, Usage & Transaction Diagnostics Logs -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Provider Health & Comparison table -->
          ${renderPanel('Provider Health & Capabilities Comparison', `
            <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid var(--vscode-panel-border);">
              <thead>
                <tr style="background: var(--vscode-sideBarSectionHeader-background); border-bottom: 1px solid var(--vscode-panel-border);">
                  <th style="padding: 2px; text-align: left;">Name</th>
                  <th style="padding: 2px; text-align: left;">Lat</th>
                  <th style="padding: 2px; text-align: left;">Avail</th>
                  <th style="padding: 2px; text-align: left;">Context</th>
                  <th style="padding: 2px; text-align: left;">JSON</th>
                </tr>
              </thead>
              <tbody>
                ${providers.map(p => `
                  <tr style="border-bottom: 1px solid var(--vscode-panel-border);">
                    <td style="padding: 2px; font-weight: bold;">${p.name}</td>
                    <td style="padding: 2px;">${p.latency}ms</td>
                    <td style="padding: 2px;">${p.availability}%</td>
                    <td style="padding: 2px;">${p.context}</td>
                    <td style="padding: 2px;">${p.jsonSupport ? '✓' : '✕'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}

          <!-- Failover Visual Chain -->
          ${renderPanel('Failover Chain routing flowchart', `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px;">
              ${failoverChain.map((step, idx) => `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                  <span>${step}</span>
                  <span style="font-size: 8px; opacity: 0.6;">${idx === failoverChain.length - 1 ? '✓' : '➔'}</span>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- AI Connection & Capability Tests -->
          ${renderPanel('AI Connection & Capability diagnostics tests', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <div>
                <div style="font-weight: 700; color: var(--vscode-descriptionForeground); margin-bottom: 2px;">Connection tests:</div>
                ${connectionsTest.map(c => `
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="color: ${c.status === 'Passed' ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-testing-iconFailedColor, #F48771)'}; font-weight: bold;">
                      ${c.status === 'Passed' ? '✓' : '✕'}
                    </span>
                    <span>${c.label}</span>
                  </div>
                `).join('')}
              </div>
              <div>
                <div style="font-weight: 700; color: var(--vscode-descriptionForeground); margin-bottom: 2px;">Capabilities tests:</div>
                ${capabilityTests.map(c => `
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="color: ${c.status ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-testing-iconFailedColor, #F48771)'}; font-weight: bold;">
                      ${c.status ? '✓' : '✕'}
                    </span>
                    <span>${c.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `)}

          <!-- Usage Cost Settings Limit Indicator -->
          ${renderPanel('Monthly Spend budget limits', `
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
              <span>Spent Limit Gauge</span>
              <span>$${monthlySpend.toFixed(2)} / $${monthlyLimit.toFixed(2)}</span>
            </div>
            <div style="background: var(--vscode-panel-border); height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
              <div style="background: var(--vscode-button-background); width: ${(monthlySpend / monthlyLimit) * 100}%; height: 100%;"></div>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <input type="checkbox" checked />
              <span>Suspend non-critical requests if limit reached</span>
            </div>
          `)}

          <!-- Usage stats totals -->
          ${renderPanel('Transaction usage metrics', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${usageStats.map(stat => `
                <div>
                  <span style="color: var(--vscode-descriptionForeground); font-size: 8.5px;">${stat.label}:</span>
                  <strong style="color: var(--vscode-foreground);">${stat.value}</strong>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Diagnostics Transaction Logs -->
          ${renderPanel('Diagnostics Transaction logs', `
            <div style="display: flex; flex-direction: column; gap: 4px; font-family: monospace; font-size: 8.5px;">
              ${timelineLogs.map(log => `
                <div style="border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 2px;">
                  [${log.time}] <strong>${log.provider}</strong>: ${log.operation} ➔ ${log.status} (${log.latency}ms) ${log.fallback !== 'None' ? `[Fallback: ${log.fallback} - ${log.reason}]` : ''}
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Security & Privacy settings -->
          ${renderPanel('Security & Data Privacy audit', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${securitySettings.map(sec => `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="color: var(--vscode-testing-iconPassedColor, #89D185); font-weight: bold;">✓</span>
                  <span>${sec.label}</span>
                </div>
              `).join('')}
            </div>
          `)}

          <!-- Workspace AI Provider Recommendation -->
          ${renderPanel('Workspace AI Provider Recommendation', `
            ${recommendations.map(r => `
              <div style="font-size: 9.5px;">
                <div>Project Profile: <strong style="color: var(--vscode-foreground);">${r.project}</strong></div>
                <div style="margin: 2px 0;">Recommendation Model: <strong style="color: var(--vscode-button-background);">${r.model}</strong></div>
                <div style="color: var(--vscode-descriptionForeground);">Reason: ${r.reason}</div>
              </div>
            `).join('')}
          `)}

        </div>

      </div>

      <!-- Actions Toolbar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; display: flex; gap: 4px; box-sizing: border-box; width: 100%;">
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'testAIHubConnections'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Test Connections</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'resetHubMetrics'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Reset Metrics</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'reconnectAIHub'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Reconnect</button>
      </div>

      <!-- Stepper save configs button -->
      <button class="btn-primary" onclick="postMessage({command: 'saveAIHubConfig'})" style="height: 26px; line-height: 1; font-weight: bold; width: 100%; box-sizing: border-box;">
        Save AI Hub Config ➔
      </button>

    </div>
  `;
}

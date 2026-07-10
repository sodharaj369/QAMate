import { renderPanel, renderBadge, renderMetric } from '../components/Library.js';

export interface SystemPageConfig {
  isNoSession: boolean;
  selectedNodeId?: string;
  selectedNodeType?: 'component' | 'flow' | 'actor' | 'integration';
  components?: { id: string; name: string; type: string; status: 'Verified' | 'Assumed' | 'Unknown'; source: 'AI' | 'User' | 'DNA' | 'Imported' }[];
  flows?: { id: string; name: string; nodes: string[] }[];
  actors?: { id: string; name: string; role: string }[];
  integrations?: { id: string; name: string; type: string }[];
  qualityAttributes?: { name: string; checked: boolean }[];
  validationIssues?: string[];
  unknownComponents?: string[];
  impactItems?: string[];
}

export function renderSystemPage(config: SystemPageConfig): string {
  if (config.isNoSession) {
    return `
      <div style="animation: fade-in 0.2s ease-out; padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
        <h3>System Architecture Blueprint Empty</h3>
        <p style="font-size: 11px;">No active session loaded. Click on the 📄 <strong>Requirement</strong> sidebar icon to analyze a spec first.</p>
      </div>
    `;
  }

  // Active Blueprint Defaults
  const selectedNodeId = config.selectedNodeId || 'azure-function';
  const selectedNodeType = config.selectedNodeType || 'component';

  const components = config.components || [
    { id: 'app-insights', name: 'Application Insights', type: 'Telemetry pipeline', status: 'Verified' as const, source: 'AI' as const },
    { id: 'azure-function', name: 'Azure Function', type: 'Serverless trigger', status: 'Assumed' as const, source: 'AI' as const },
    { id: 'stripe-webhook', name: 'Stripe Webhook Gateway', type: 'Payment listener', status: 'Verified' as const, source: 'DNA' as const },
    { id: 'alert-rule', name: 'Alert Rule', type: 'KQL alert processor', status: 'Unknown' as const, source: 'AI' as const }
  ];

  const flows = config.flows || [
    { id: 'alert-flow', name: 'Exception Alert Flow', nodes: ['Exception', 'Application Insights', 'KQL Query', 'Alert Rule', 'Azure Function', 'Email Alert'] }
  ];

  const actors = config.actors || [
    { id: 'admin', name: 'System Administrator', role: 'Configures alerting thresholds' },
    { id: 'operations', name: 'Operations Team', role: 'Receives warning emails' }
  ];

  const integrations = config.integrations || [
    { id: 'stripe-api', name: 'Stripe API Webhook', type: 'HTTPS Post' }
  ];

  const attributes = config.qualityAttributes || [
    { name: 'Observability', checked: true },
    { name: 'Security', checked: true },
    { name: 'Availability', checked: false },
    { name: 'Performance', checked: false },
    { name: 'Scalability', checked: false }
  ];

  const unknownComponents = config.unknownComponents || ['Threshold Store', 'Retry Queue', 'Notification Service'];
  const validationIssues = config.validationIssues || ['Connected: ✓', 'Actors mapped: ✓', 'Integrations: ⚠ Unknown', 'Flows complete: ✓'];
  const impactItems = config.impactItems || ['Mental Model Gaps', 'Test Strategy Cases', 'Export Deliverables'];

  // Resolve active selected node metadata
  let activeName = 'Azure Function';
  let activeType = 'Serverless Function';
  let activeSource = 'AI';
  let activeStatus = 'Assumed';
  let activeCodeLocation = 'src/functions/alert.ts';
  let activeConfidence = '████████░░ 80%';
  let activeEvidence = 'Requirement paragraph 4: "Azure function handles notification triggers."';

  const matchedComp = components.find(c => c.id === selectedNodeId);
  if (matchedComp) {
    activeName = matchedComp.name;
    activeType = matchedComp.type;
    activeSource = matchedComp.source;
    activeStatus = matchedComp.status;
    activeCodeLocation = `src/components/${matchedComp.id}.ts`;
    activeConfidence = matchedComp.status === 'Verified' ? '██████████ 100%' : matchedComp.status === 'Assumed' ? '████████░░ 80%' : '████░░░░░░ 40%';
    activeEvidence = `AI derived component ${matchedComp.name} based on specification context.`;
  }

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: 100%;">
      
      <!-- Top Filters & Search bar -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: 100%;">
        <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
          <input type="text" id="blueprint-search" style="flex: 1; font-size: 10px; height: 22px; padding: 2px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);" placeholder="Search Blueprint Components..." />
          <button class="btn-secondary" onclick="postMessage({command: 'searchBlueprint', query: document.getElementById('blueprint-search').value})" style="font-size: 9px; height: 22px; line-height: 1; padding: 0 8px;">Find</button>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 9px; color: var(--vscode-descriptionForeground);">
          <label style="display: flex; align-items: center; gap: 3px;"><input type="checkbox" checked /> Components</label>
          <label style="display: flex; align-items: center; gap: 3px;"><input type="checkbox" checked /> Flows</label>
          <label style="display: flex; align-items: center; gap: 3px;"><input type="checkbox" checked /> Actors</label>
        </div>
      </div>

      <!-- Sync Column Layout Grid -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Left Column: Structure Tree & Attributes -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          ${renderPanel('System Components Tree', `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${components
                .map(
                  (c) => `
                <div class="sidebar-item" onclick="postMessage({command: 'selectNode', id: '${c.id}', type: 'component'})" style="padding: 4px 6px; border-radius: 2px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; border-left: 2px solid ${c.id === selectedNodeId ? 'var(--vscode-button-background)' : 'transparent'}; background: ${c.id === selectedNodeId ? 'rgba(255,255,255,0.03)' : 'transparent'};">
                  <span>📦 ${c.name}</span>
                  <div style="display: flex; gap: 3px; align-items: center;">
                    ${renderBadge(c.status, c.status === 'Verified' ? 'success' : c.status === 'Assumed' ? 'warning' : 'error')}
                    <span style="font-size: 8px; opacity: 0.6;">(${c.source})</span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

          ${renderPanel('Functional Flows & Actors', `
            <div style="font-weight: 600; color: var(--vscode-descriptionForeground); margin-bottom: 4px; font-size: 9px; text-transform: uppercase;">Mapped Flows:</div>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
              ${flows
                .map(
                  (f) => `
                <div onclick="postMessage({command: 'selectNode', id: '${f.id}', type: 'flow'})" style="cursor: pointer; padding: 4px; display: flex; align-items: center; gap: 4px;">
                  <span> Alert Path: <strong>${f.name}</strong></span>
                </div>
              `
                )
                .join('')}
            </div>
            <div style="font-weight: 600; color: var(--vscode-descriptionForeground); margin-bottom: 4px; font-size: 9px; text-transform: uppercase; border-top: 1px solid var(--vscode-panel-border); padding-top: 6px;">Mapped Actor Roles:</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${actors
                .map(
                  (a) => `
                <div onclick="postMessage({command: 'selectNode', id: '${a.id}', type: 'actor'})" style="cursor: pointer; padding: 4px; display: flex; flex-direction: column; gap: 2px;">
                  <span>👥 ${a.name}</span>
                  <span style="font-size: 9px; color: var(--vscode-descriptionForeground);">${a.role}</span>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

          ${renderPanel('System Quality Attributes Focus', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              ${attributes
                .map(
                  (attr) => `
                <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none;">
                  <input type="checkbox" ${attr.checked ? 'checked' : ''} onchange="postMessage({command: 'toggleAttribute', name: '${attr.name}'})" />
                  <span>${attr.name}</span>
                </label>
              `
                )
                .join('')}
            </div>
          `)}

        </div>

        <!-- Center Column: Flow Sequence Canvas -->
        <div style="flex: 1;">
          ${renderPanel('Active Blueprint Flow Sequence', `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px; background: rgba(0,0,0,0.1); border-radius: 4px;">
              ${flows[0].nodes
                .map(
                  (node, index) => `
                <div class="flow-node" onclick="postMessage({command: 'selectNode', id: '${node.toLowerCase().replace(/\\s+/g, '-')}', type: 'component'})" style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 6px 12px; width: 140px; text-align: center; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  ${node}
                </div>
                ${index < flows[0].nodes.length - 1 ? '<div style="font-size: 14px; color: var(--vscode-button-background);">↓</div>' : ''}
              `
                )
                .join('')}
            </div>
            <div style="font-size: 9px; color: var(--vscode-descriptionForeground); text-align: center; margin-top: 6px;">
              Click sequence nodes above to highlight dependencies & load blueprint properties.
            </div>
          `)}
        </div>

        <!-- Right Column: Properties, Evidence & Impact Downstreams -->
        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          
          <!-- Properties Grid -->
          ${renderPanel('Component Properties & Confidence', `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px;">
              <div>Name: <strong style="color: var(--vscode-foreground);">${activeName}</strong></div>
              <div>Type: <strong style="color: var(--vscode-foreground);">${activeType}</strong></div>
              <div>Source: <strong style="color: var(--vscode-foreground);">${activeSource}</strong></div>
              <div>Code Location: <strong style="color: var(--vscode-foreground);">${activeCodeLocation}</strong></div>
            </div>
            <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; margin-top: 6px;">
              <div style="font-size: 9px; color: var(--vscode-descriptionForeground); font-weight: 600; text-transform: uppercase;">Confidence Meter:</div>
              <div style="font-family: monospace; font-size: 12px; color: var(--vscode-button-background); margin-top: 2px;">
                ${activeConfidence} (${activeStatus})
              </div>
            </div>
          `)}

          <!-- Evidence & Tracing -->
          ${renderPanel('QA Blueprint Evidence Tracing', `
            <div style="font-size: 10px; font-style: italic; color: var(--vscode-foreground); line-height: 1.4;">
              "${activeEvidence}"
            </div>
          `)}

          <!-- Impact Card -->
          ${renderPanel('Downstream Impact Preview', `
            <div style="font-size: 10px; color: var(--vscode-testing-iconFailedColor, #F48771); margin-bottom: 4px; font-weight: bold;">
              ⚠ Modifying or deleting this node will require re-validating:
            </div>
            <div style="display: flex; flex-direction: column; gap: 3px;">
              ${impactItems.map(item => `<div>• ${item}</div>`).join('')}
            </div>
          `)}

          <!-- Validation Tracker -->
          ${renderPanel('Blueprint Validation Status', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px;">
              ${validationIssues
                .map(
                  (issue) => `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span>${issue}</span>
                </div>
              `
                )
                .join('')}
            </div>
          `)}

          <!-- Unknown Components list -->
          ${renderPanel('Unknown Components (Assumed Gaps)', `
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px;">
              ${unknownComponents
                .map(
                  (uc) => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.1); padding: 4px 6px; border-radius: 2px;">
                  <span>❓ ${uc}</span>
                  <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'mental'})" style="font-size: 8px; height: 16px; padding: 0 6px; width: auto; line-height: 1;">Resolve</button>
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
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'addComponent'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">+ Component</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'addFlow'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">+ Flow</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'importBlueprint'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Import</button>
        <button class="qamate-toolbar-btn" onclick="postMessage({command: 'validateBlueprint'})" style="flex: 1; padding: 4px; font-size: 9px; height: 22px; line-height: 1; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; border-radius: 2px;">Validate</button>
      </div>

      <!-- Build Mental Model Stepper button -->
      <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'mental'})" style="height: 26px; line-height: 1; font-weight: bold; width: 100%; box-sizing: border-box;">
        Build QA Mental Model ➔
      </button>

    </div>
  `;
}

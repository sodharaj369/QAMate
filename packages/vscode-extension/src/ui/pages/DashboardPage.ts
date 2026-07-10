import { renderMetric, renderPanel, renderBadge } from '../components/Library.js';

export interface DashboardConfig {
  isNoSession: boolean;
  detectedFileName: string;
  aiStatus: string;
  selectedAIProvider: string;
  adoConnected: boolean;
  jiraConnected: boolean;
  sessionsCount: number;
  hasGeneratedSuite: boolean;
  requirementTitle?: string;
  currentStep?: string;
  projectName?: string;
  healthScore?: number;
  confidenceScore?: number;
  questionsCount?: number;
  recommendationsCount?: number;
  componentsCount?: number;
  flowsCount?: number;
  actorsCount?: number;
  integrationsCount?: number;
  recentDecisions?: string[];
}

export function renderDashboardPage(config: DashboardConfig): string {
  if (config.isNoSession) {
    // 2. Onboarding Empty State (No Session Active)
    return `
      <div style="animation: fade-in 0.2s ease-out; font-size: 11px;">
        
        <!-- Welcome Jumbotron -->
        <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 16px; text-align: center; margin-bottom: 12px; box-sizing: border-box;">
          <h2 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--vscode-foreground);">Welcome to QAMate</h2>
          <p style="margin: 0; color: var(--vscode-descriptionForeground); font-size: 12px; line-height: 1.4;">
            QAMate is an AI-powered QA reasoning workspace that analyzes requirements, models systems, clarifies logic assumptions, and structures test strategies.
          </p>
        </div>

        <!-- Onboarding Actions Cards -->
        <div style="font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 6px; font-size: 9px; letter-spacing: 0.5px;">Choose how you'd like to start</div>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
          
          <!-- Paste requirement card -->
          <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); padding: 10px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-weight: 700; font-size: 11px;">📝 Paste Requirement Specification</div>
            <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">Paste your raw specs or Gherkin description to parse instantly.</div>
            <button class="btn-primary" onclick="postMessage({command: 'switchTab', tab: 'requirement'})" style="font-size: 10px; height: 22px; line-height: 1; padding: 0 10px; width: fit-content; margin-top: 4px;">Open Editor ➔</button>
          </div>

          <!-- JIRA import card -->
          <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); padding: 10px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-weight: 700; font-size: 11px;">🎫 Connect Jira User Story</div>
            <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">Fetch user stories and acceptance criteria from Jira backlog.</div>
            <button class="btn-secondary" onclick="postMessage({command: 'switchTab', tab: 'settings'})" style="font-size: 10px; height: 22px; line-height: 1; padding: 0 10px; width: fit-content; margin-top: 4px;">Connect Jira</button>
          </div>

          <!-- ADO import card -->
          <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); padding: 10px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-weight: 700; font-size: 11px; datatest: ado-card">⚡ Import Azure DevOps Work Item</div>
            <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">Import epic descriptions and requirements sheets directly.</div>
            <button class="btn-secondary" onclick="postMessage({command: 'switchTab', tab: 'settings'})" style="font-size: 10px; height: 22px; line-height: 1; padding: 0 10px; width: fit-content; margin-top: 4px;">Connect Azure DevOps</button>
          </div>

          <!-- File upload card -->
          <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); padding: 10px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-weight: 700; font-size: 11px;">📂 Upload Specification File</div>
            <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">Supports PDF, DOCX, Markdown, or JSON export file sheets.</div>
            <button class="btn-secondary" onclick="postMessage({command: 'switchTab', tab: 'requirement'})" style="font-size: 10px; height: 22px; line-height: 1; padding: 0 10px; width: fit-content; margin-top: 4px;">Upload File</button>
          </div>

          <!-- Resume Session card -->
          <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); padding: 10px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-weight: 700; font-size: 11px;">📚 Resume Recent QA Session</div>
            <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">Pick up where you left off from your past execution sessions.</div>
            <button class="btn-secondary" onclick="postMessage({command: 'switchTab', tab: 'sessions'})" style="font-size: 10px; height: 22px; line-height: 1; padding: 0 10px; width: fit-content; margin-top: 4px;">View Sessions</button>
          </div>

        </div>

      </div>
    `;
  }

  // Calculate Health Grade
  const healthScore = config.healthScore !== undefined ? config.healthScore : 100;
  let healthGrade = 'A';
  if (healthScore >= 90) healthGrade = 'A';
  else if (healthScore >= 75) healthGrade = 'B';
  else if (healthScore >= 60) healthGrade = 'C';
  else healthGrade = 'F';

  // Calculate Understanding percent
  const understandingPercent = config.confidenceScore !== undefined ? Math.round(config.confidenceScore * 100) : 92;

  // Calculate Strategy Status
  const isStrategyReady = healthScore >= 70;
  const strategyStatus = isStrategyReady ? 'Ready' : 'Pending';

  // Stepper Stage Items
  const currentStepName = config.currentStep || 'Understand';
  const stepsList = [
    { label: 'Requirement Imported', done: true },
    { label: 'System Modeled', done: currentStepName !== 'NoSession' },
    { label: 'Mental Model Built', done: currentStepName === 'Plan' || currentStepName === 'Review' || currentStepName === 'Deliver' },
    { label: 'Strategy Approved', done: currentStepName === 'Review' || currentStepName === 'Deliver' },
    { label: 'Test Cases Generated', done: currentStepName === 'Review' || currentStepName === 'Deliver' },
    { label: 'Review Approved', done: currentStepName === 'Deliver' }
  ];

  // Decisions list defaults
  const decisions = config.recentDecisions || [
    '✓ AI inferred POS transaction router.',
    '✓ User confirmed Stripe billing assumptions.',
    '✓ Playbook DNA rules active.',
    '✓ Strategy compiled successfully.'
  ];

  return `
    <div style="animation: fade-in 0.2s ease-out; font-size: 11px; display: flex; flex-direction: column; gap: 10px;">
      
      <!-- Card 1: Workspace Snapshot -->
      <div style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; box-sizing: border-box;">
        <div style="font-size: 8px; text-transform: uppercase; color: var(--vscode-descriptionForeground); font-weight: 700; margin-bottom: 2px;">Current Workspace</div>
        <div style="font-size: 13px; font-weight: 700; color: var(--vscode-foreground); word-break: break-all; margin-bottom: 6px;">${config.requirementTitle || 'Tenant Exception Alerting'}</div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 10px; color: var(--vscode-descriptionForeground); border-top: 1px solid var(--vscode-panel-border); padding-top: 6px;">
          <div>Stage: <strong style="color: var(--vscode-foreground);">${currentStepName}</strong></div>
          <div>Provider: <strong style="color: var(--vscode-foreground);">${config.selectedAIProvider === 'mock' ? 'Offline' : config.selectedAIProvider}</strong></div>
          <div>Project: <strong style="color: var(--vscode-foreground);">${config.projectName || 'ParentPay POS'}</strong></div>
        </div>
      </div>

      <!-- Card 2: Metrics Row -->
      <div style="display: flex; gap: 6px; width: 100%;">
        ${renderMetric('Req Health', healthGrade, `${healthScore}%`)}
        ${renderMetric('Understanding', `${understandingPercent}%`)}
        ${renderMetric('Blocking Gaps', config.questionsCount || 0)}
        ${renderMetric('Strategy', strategyStatus)}
      </div>

      <!-- Card 3: Current Stage Stepper checklist -->
      ${renderPanel('Current Stage Progress', `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; line-height: 1.4;">
          ${stepsList
            .map(
              (step) => `
            <div style="display: flex; align-items: center; gap: 4px; color: ${step.done ? 'var(--vscode-foreground)' : 'var(--vscode-descriptionForeground)'};">
              <span style="color: ${step.done ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-descriptionForeground)'}; font-weight: bold;">
                ${step.done ? '✓' : '○'}
              </span>
              <span>${step.label}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `)}

      <!-- Row for System Summary and Decisions Feed -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
        
        <!-- System Summary -->
        ${renderPanel('System Summary', `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
            <div>Components: <strong style="color: var(--vscode-foreground);">${config.componentsCount || 7}</strong></div>
            <div>Actors: <strong style="color: var(--vscode-foreground);">${config.actorsCount || 2}</strong></div>
            <div>Flows: <strong style="color: var(--vscode-foreground);">${config.flowsCount || 5}</strong></div>
            <div>Integrations: <strong style="color: var(--vscode-foreground);">${config.integrationsCount || 3}</strong></div>
          </div>
          <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 6px; font-size: 10px;">
            <div style="font-weight: 600; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">Quality Attributes Focus:</div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${renderBadge('Security', 'info')}
              ${renderBadge('Performance', 'info')}
              ${renderBadge('Reliability', 'info')}
            </div>
          </div>
        `)}

        <!-- Decisions Feed -->
        ${renderPanel('Recent QA Decisions', `
          <div style="display: flex; flex-direction: column; gap: 5px; font-size: 10px; line-height: 1.3;">
            ${decisions
              .map(
                (dec) => `
              <div style="border-left: 2px solid var(--vscode-button-background); padding-left: 6px; color: var(--vscode-foreground);">
                ${dec}
              </div>
            `
              )
              .join('')}
          </div>
        `)}

      </div>

      <!-- Card 4: Quick Actions Grid -->
      ${renderPanel('Quick Actions', `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <button class="qamate-toolbar-btn" onclick="postMessage({command: 'analyzeActive'})" style="padding: 4px 6px; font-size: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; height: 24px; border-radius: 2px;">
            🔍 Analyze Spec
          </button>
          <button class="qamate-toolbar-btn" onclick="postMessage({command: 'switchTab', tab: 'mental'})" style="padding: 4px 6px; font-size: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; height: 24px; border-radius: 2px;">
            🧠 Assumptions
          </button>
          <button class="qamate-toolbar-btn" onclick="postMessage({command: 'switchTab', tab: 'strategy'})" style="padding: 4px 6px; font-size: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; height: 24px; border-radius: 2px;">
            📋 Open Strategy
          </button>
          <button class="qamate-toolbar-btn" onclick="postMessage({command: 'executeNext'})" style="padding: 4px 6px; font-size: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; height: 24px; border-radius: 2px;">
            ⚡ Generate Cases
          </button>
          <button class="qamate-toolbar-btn" onclick="postMessage({command: 'switchTab', tab: 'deliver'})" style="padding: 4px 6px; font-size: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; height: 24px; border-radius: 2px; grid-column: span 2;">
            📤 Export Deliverables
          </button>
        </div>
      `)}

      <!-- Card 5: AI Provider Switcher card -->
      ${renderPanel('Active AI Provider Hub', `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span>Active: <strong>${config.selectedAIProvider === 'mock' ? 'Offline Rule Engine' : config.selectedAIProvider.toUpperCase()}</strong></span>
          ${renderBadge('Provider Healthy', 'success')}
        </div>
        <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 4px; display: flex; gap: 6px; align-items: center;">
          <span>Available alternative: </span>
          <span style="color: var(--vscode-textLink-foreground); cursor: pointer;" onclick="postMessage({command: 'switchTab', tab: 'settings'})">Settings ➔</span>
        </div>
      `)}

      <!-- Card 6: Workspace Diagnostics -->
      ${renderPanel('Workspace Status Diagnostics', `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="color: var(--vscode-testing-iconPassedColor, #89D185);">✓</span>
            <span>AI Connected</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="color: var(--vscode-testing-iconPassedColor, #89D185);">✓</span>
            <span>Project DNA Loaded</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="color: var(--vscode-testing-iconPassedColor, #89D185);">✓</span>
            <span>Knowledge Loaded</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="color: var(--vscode-testing-iconPassedColor, #89D185);">✓</span>
            <span>Playbook Active</span>
          </div>
        </div>
        <div style="border-top: 1px solid var(--vscode-panel-border); padding-top: 4px; margin-top: 6px; font-size: 9px; color: var(--vscode-descriptionForeground);">
          Active playbook revision: <strong>v4</strong>
        </div>
      `)}

    </div>
  `;
}

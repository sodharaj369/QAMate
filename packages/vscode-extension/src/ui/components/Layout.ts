import { Theme } from '../Theme.js';
import { strings } from '../strings.js';

export interface StageData {
  id: string;
  title: string;
  status: 'locked' | 'active' | 'completed';
  statusLabel: string;
  contentHtml: string;
  suggestedPrompts: string[];
}

export function renderLayout(
  stages: StageData[],
  devModeEnabled: boolean,
  isAnalyzing: boolean,
  timelineHtml: string,
  sessionTitle: string,
  sessionStatus: string,
  sessionMetadata: string,
  promptPlaceholder: string
): string {
  // 1. Command Bar
  const commandBarHtml = `
    <div class="command-bar" style="margin-bottom: 12px;">
      <button class="cmd-btn" onclick="postMessage({command: 'analyzeActive'})">Analyze</button>
      <button class="cmd-btn" onclick="postMessage({command: 'executeNext'})">Continue</button>
      <button class="cmd-btn" onclick="postMessage({command: 'startNew'})">Reset</button>
    </div>
  `;

  // 2. Session Header
  const sessionHeaderHtml = `
    <div class="session-header" style="margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid var(--vscode-panel-border);">
      <div class="session-title" style="font-size: 14px; font-weight: 600; color: var(--vscode-foreground);">${sessionTitle}</div>
      <div class="session-status-row" style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
        <span class="session-status-dot" style="color: var(--vscode-button-background); font-size: 8px;">●</span>
        <span class="session-status-text" style="font-size: 10px; font-weight: 500; color: var(--vscode-foreground);">${sessionStatus}</span>
        <span style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-left: auto;">${sessionMetadata}</span>
      </div>
    </div>
  `;

  // 3. Step Progress Header Tracker
  const stepsList = [
    { label: 'Intake', step: 'Requirement' },
    { label: 'Health', step: 'Validation' },
    { label: 'Intel', step: 'Intelligence' },
    { label: 'Gaps', step: 'Clarifications' },
    { label: 'Strategy', step: 'Strategy' },
    { label: 'Specs', step: 'Artifacts' },
    { label: 'Review', step: 'Review' },
    { label: 'Coverage', step: 'Coverage' }
  ];

  const activeStage = stages.find(s => s.status === 'active') || stages[0];
  const activeIndex = stepsList.findIndex(s => s.step === activeStage?.id);

  const progressStepsHtml = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; font-size: 8px; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; box-sizing: border-box; width: 100%;">
      ${stepsList.map((step, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;
        const color = isActive 
          ? 'var(--vscode-button-background)' 
          : isPast 
            ? 'var(--vscode-testing-iconPassedColor, #89D185)' 
            : 'var(--vscode-descriptionForeground)';
        return `<span style="color: ${color}; opacity: ${isActive ? 1 : 0.8};">${step.label}</span>`;
      }).join('<span style="opacity: 0.4; color: var(--vscode-descriptionForeground); font-size: 6px;">➔</span>')}
    </div>
  `;

  // 4. Next Best Action recommendation
  let nextBestActionText = '';
  switch (activeStage?.id) {
    case 'Requirement':
      nextBestActionText = 'Paste requirement description or open a specification file to analyze.';
      break;
    case 'Validation':
      nextBestActionText = 'Heuristics audit complete. Click "Continue" to extract requirement intelligence.';
      break;
    case 'Intelligence':
      nextBestActionText = 'Intelligence report ready. Click "Continue" to investigate requirement gaps.';
      break;
    case 'Clarifications':
      nextBestActionText = 'Resolve questions or click "Skip" to formulate the test strategy.';
      break;
    case 'Strategy':
      nextBestActionText = 'Review test strategy objectives. Click "Save & Continue" to generate test suite scripts.';
      break;
    case 'Artifacts':
      nextBestActionText = 'Review test suite scripts in "Cases" tab. Click "Continue to Review" to run safety checks.';
      break;
    case 'Review':
      nextBestActionText = 'Audit logs ready. Click "Continue" to verify final requirement rule coverage.';
      break;
    case 'Coverage':
      nextBestActionText = 'Trace coverage matrix verified. Click "Complete" to finalize the session.';
      break;
    default:
      nextBestActionText = 'Proceed to the next workflow step.';
  }

  // 5. Active center stage card
  let activeCardHtml = '';
  if (activeStage) {
    const suggestionsHtml = (activeStage.suggestedPrompts && activeStage.suggestedPrompts.length > 0) ? `
      <div class="suggested-prompts-container" style="margin-top: ${Theme.spacing.sm}; border-top: 1px dotted var(--vscode-panel-border); padding-top: 6px;">
        <span class="suggested-label" style="font-size: 10px; color: var(--vscode-descriptionForeground); display: block; margin-bottom: 4px;">Suggested prompts:</span>
        <div class="suggested-pills" style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${activeStage.suggestedPrompts.map(p => `<span class="suggested-pill" onclick="applySuggestedPrompt('${p.replace(/'/g, "\\'")}')" style="font-size: 10px; color: var(--vscode-textLink-foreground); cursor: pointer; padding: 2px 6px; background: var(--vscode-sideBarSectionHeader-background); border-radius: 2px; border: 1px solid var(--vscode-panel-border);">• ${p}</span>`).join('')}
        </div>
      </div>
    ` : '';

    activeCardHtml = `
      <div class="stage-card card-active" style="border: 1px solid var(--vscode-button-background); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); border-radius: 4px; overflow: hidden; background: var(--vscode-sideBarSectionHeader-background);">
        <div class="stage-header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--vscode-panel-border);">
          <div style="display: flex; align-items: center; gap: ${Theme.spacing.sm};">
            <span class="skeleton-pulse-dot">●</span>
            <span class="stage-title-text">${activeStage.title}</span>
          </div>
          <span class="tag tag-warn" style="padding: 2px 6px; border-radius: 2px; font-size: 8px; font-weight: 700; background: var(--vscode-inputValidation-warningBackground, #E58E26); color: #FFF;">ACTIVE</span>
        </div>
        <div class="stage-body" style="padding: 10px; background: var(--vscode-sideBar-background);">
          ${activeStage.contentHtml}
          ${suggestionsHtml}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QAMate Workspace Wizard</title>
    <style>
        body {
            font-family: var(--vscode-font-family, sans-serif);
            font-size: var(--vscode-font-size, 13px);
            padding: ${Theme.spacing.md};
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
            line-height: 1.5;
            padding-bottom: 120px; /* Leave space for docked prompt */
        }
        h1, h2, h3, h4 { color: var(--vscode-foreground); margin-top: 0; margin-bottom: ${Theme.spacing.xs}; font-weight: 600; }

        /* Command Bar */
        .command-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: ${Theme.spacing.sm};
            margin-bottom: ${Theme.spacing.md};
        }
        .cmd-btn {
            background: var(--vscode-button-secondaryBackground, #3a3a3a);
            color: var(--vscode-button-secondaryForeground, #fff);
            padding: 4px 8px;
            font-size: 11px;
            width: auto;
            flex: 1;
            text-align: center;
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            cursor: pointer;
        }
        .cmd-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground, #4a4a4a);
        }
        
        .wizard-container {
            display: flex;
            flex-direction: column;
            gap: ${Theme.spacing.md};
        }

        /* Docked Prompt Input */
        .docked-prompt-box {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--vscode-sideBar-background);
            border-top: 1px solid var(--vscode-panel-border);
            padding: ${Theme.spacing.md};
            box-sizing: border-box;
            z-index: 100;
        }
        .prompt-input-container {
            display: flex;
            align-items: center;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border, #454545);
            border-radius: 2px;
            padding: 4px;
        }
        .prompt-input-container input {
            border: 0;
            background: transparent;
            padding: 6px;
            color: var(--vscode-input-foreground);
            width: 100%;
            outline: none;
            font-size: 12px;
        }

        input, select, textarea {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border, #454545);
            padding: 6px;
            border-radius: 2px;
            width: 100%;
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
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            margin-top: 4px;
            border: 1px solid var(--vscode-input-border);
        }
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 8px;
            border-radius: 2px;
            overflow-x: auto;
            margin: ${Theme.spacing.sm} 0;
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: var(--vscode-editor-font-size, 11px);
            border: 1px solid var(--vscode-panel-border);
        }

        /* History drawer */
        .history-drawer {
            margin-top: ${Theme.spacing.md};
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: ${Theme.spacing.sm};
        }
        .history-summary-header {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            cursor: pointer;
            font-weight: 600;
            text-transform: uppercase;
        }
        .history-summary-header:hover {
            text-decoration: underline;
        }
        .history-content {
            display: none;
            margin-top: ${Theme.spacing.sm};
        }
        .history-expanded .history-content {
            display: block;
        }

        .timeline-item {
            display: flex;
            align-items: center;
            gap: ${Theme.spacing.sm};
            margin-bottom: 6px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        .timeline-icon {
            display: flex;
            align-items: center;
            opacity: 0.7;
        }

        .dev-mode-panel {
            margin-top: ${Theme.spacing.lg};
            border-top: 1px dotted var(--vscode-panel-border);
            padding-top: ${Theme.spacing.sm};
        }
        .dev-mode-header {
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }

        .settings-footer {
            margin-top: ${Theme.spacing.md};
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: ${Theme.spacing.sm};
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        .settings-link {
            cursor: pointer;
            color: var(--vscode-textLink-foreground);
        }
        .settings-link:hover {
            text-decoration: underline;
        }
        .skeleton-pulse-dot {
            animation: pulse-dot 1.2s infinite ease-in-out;
            color: var(--vscode-button-background);
        }
        @keyframes pulse-dot {
            0% { opacity: 0.4; }
            50% { opacity: 1.0; }
            100% { opacity: 0.4; }
        }
    </style>
</head>
<body>
    ${commandBarHtml}

    ${sessionHeaderHtml}

    <!-- Horizontal step progress header -->
    ${progressStepsHtml}

    <div class="wizard-container">
      ${activeCardHtml}
    </div>

    ${timelineHtml}

    <!-- Docked Assistant Prompt Box & Next Best Action Tracker -->
    <div class="docked-prompt-box">
      <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 6px; display: flex; align-items: center; gap: 4px; line-height: 1.3;">
        <span style="color: var(--vscode-button-background); font-weight: bold;">➡️</span> 
        <strong>Next action:</strong> <span id="nba-tracker-text">${nextBestActionText}</span>
      </div>
      <div class="prompt-input-container">
        <input type="text" id="chat-prompt-input" placeholder="${promptPlaceholder}" onkeydown="handlePromptKey(event)" />
        <button style="width: auto; padding: 4px 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground);" onclick="submitPromptQuery()">Send</button>
      </div>
      <!-- Settings diagnostics toggles -->
      <div class="settings-footer">
        <span>${strings.settings.developerMode}: <strong>${devModeEnabled ? strings.settings.statusOn : strings.settings.statusOff}</strong></span>
        <span class="settings-link" onclick="postMessage({command: 'toggleDevMode'})">Diagnostics</span>
      </div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      function postMessage(data) {
        vscode.postMessage(data);
      }
      function toggleHistory() {
        const drawer = document.getElementById('history-drawer-container');
        if (drawer) {
          drawer.classList.toggle('history-expanded');
        }
      }
      function applySuggestedPrompt(text) {
        const input = document.getElementById('chat-prompt-input');
        if (input) {
          input.value = text;
          input.focus();
        }
      }
      function submitPromptQuery() {
        const input = document.getElementById('chat-prompt-input');
        if (input && input.value) {
          const text = input.value;
          input.value = '';
          postMessage({ command: 'submitPromptQuery', text });
        }
      }
      function handlePromptKey(event) {
        if (event.key === 'Enter') {
          submitPromptQuery();
        }
      }
    </script>
</body>
</html>`;
}

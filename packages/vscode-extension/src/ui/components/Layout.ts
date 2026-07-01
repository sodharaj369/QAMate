import { Theme } from '../Theme.js';
import { icons } from '../icons.js';

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
  promptPlaceholder: string,
  activeTab: 'home' | 'sessions' | 'settings' | 'help' = 'home',
): string {
  // Global 4-Item Navigation Bar
  const navigationBarHtml = `
    <div class="global-nav-bar" style="display: flex; align-items: center; justify-content: space-around; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; margin-bottom: 12px;">
      <span class="nav-item ${activeTab === 'home' ? 'active' : ''}" onclick="postMessage({command: 'switchTab', tab: 'home'})" style="cursor: pointer; font-weight: ${activeTab === 'home' ? '700' : '500'}; color: ${activeTab === 'home' ? 'var(--vscode-button-background)' : 'var(--vscode-descriptionForeground)'}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">${icons.home} Home</span>
      <span class="nav-item ${activeTab === 'sessions' ? 'active' : ''}" onclick="postMessage({command: 'switchTab', tab: 'sessions'})" style="cursor: pointer; font-weight: ${activeTab === 'sessions' ? '700' : '500'}; color: ${activeTab === 'sessions' ? 'var(--vscode-button-background)' : 'var(--vscode-descriptionForeground)'}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">${icons.history} Sessions</span>
      <span class="nav-item ${activeTab === 'settings' ? 'active' : ''}" onclick="postMessage({command: 'switchTab', tab: 'settings'})" style="cursor: pointer; font-weight: ${activeTab === 'settings' ? '700' : '500'}; color: ${activeTab === 'settings' ? 'var(--vscode-button-background)' : 'var(--vscode-descriptionForeground)'}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">${icons.gear} Settings</span>
      <span class="nav-item ${activeTab === 'help' ? 'active' : ''}" onclick="postMessage({command: 'switchTab', tab: 'help'})" style="cursor: pointer; font-weight: ${activeTab === 'help' ? '700' : '500'}; color: ${activeTab === 'help' ? 'var(--vscode-button-background)' : 'var(--vscode-descriptionForeground)'}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">${icons.help} Help</span>
    </div>
  `;

  const isPreSession = sessionTitle === '' || sessionTitle === 'No Session Active';
  const showSessionWidgets = activeTab === 'home' && !isPreSession;

  // 1. Command Bar
  const commandBarHtml = showSessionWidgets
    ? `
    <div class="command-bar" style="margin-bottom: 12px;">
      <button class="cmd-btn" onclick="postMessage({command: 'analyzeActive'})">Analyze</button>
      <button class="cmd-btn" onclick="postMessage({command: 'executeNext'})">Continue</button>
      <button class="cmd-btn" onclick="postMessage({command: 'startNew'})">Reset</button>
    </div>
  `
    : '';

  // 2. Session Header
  const sessionHeaderHtml = showSessionWidgets
    ? `
    <div class="session-header" style="margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid var(--vscode-panel-border);">
      <div class="session-title" style="font-size: 14px; font-weight: 600; color: var(--vscode-foreground);">${sessionTitle}</div>
      <div class="session-status-row" style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
        <span class="session-status-dot" style="color: var(--vscode-button-background); font-size: 8px;">●</span>
        <span class="session-status-text" style="font-size: 10px; font-weight: 500; color: var(--vscode-foreground);">${sessionStatus}</span>
        <span style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-left: auto;">${sessionMetadata}</span>
      </div>
    </div>
  `
    : '';

  // 3. Outcome Stepper Progress Header
  const stepsList = [
    { label: 'Understand', step: 'Understand' },
    { label: 'Prepare', step: 'Prepare' },
    { label: 'Plan', step: 'Plan' },
    { label: 'Generate', step: 'Generate' },
    { label: 'Review', step: 'Review' },
    { label: 'Deliver', step: 'Deliver' },
  ];

  const activeStage = stages.find((s) => s.status === 'active') || stages[0];
  const activeIndex = stepsList.findIndex((s) => s.step === activeStage?.id);

  const progressStepsHtml = showSessionWidgets
    ? `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; font-size: 8px; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; box-sizing: border-box; width: 100%;">
      ${stepsList
        .map((step, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;
          const color = isActive
            ? 'var(--vscode-button-background)'
            : isPast
              ? 'var(--vscode-testing-iconPassedColor, #89D185)'
              : 'var(--vscode-descriptionForeground)';
          return `<span style="color: ${color}; opacity: ${isActive ? 1 : 0.8};">${step.label}</span>`;
        })
        .join(
          '<span style="opacity: 0.4; color: var(--vscode-descriptionForeground); font-size: 6px;">➔</span>',
        )}
    </div>
  `
    : '';

  // 4. Next Best Action recommendations
  let nextBestActionText = '';
  switch (activeStage?.id) {
    case 'Understand':
      nextBestActionText = 'Review health metrics, actors, and rules. Click "Continue" to prepare.';
      break;
    case 'Prepare':
      nextBestActionText = 'Complete QA Readiness check or click "Skip" to view strategy.';
      break;
    case 'Plan':
      nextBestActionText =
        'Review Strategic parameters. Click "Approve Strategy" to generate test suite.';
      break;
    case 'Generate':
      nextBestActionText =
        'Generating test scenarios... Click "Continue" to open Results review workspace.';
      break;
    case 'Review':
      nextBestActionText =
        'Search, edit, and audit scenarios. Click "Proceed to Deliver" to export.';
      break;
    case 'Deliver':
      nextBestActionText = 'Export approved deliverables or synchronize directly with ADO/Jira.';
      break;
    default:
      nextBestActionText = 'Proceed to the next workflow outcome.';
  }

  // 5. Active center stage card
  let activeCardHtml = '';
  if (activeStage) {
    const suggestionsHtml =
      showSessionWidgets && activeStage.suggestedPrompts && activeStage.suggestedPrompts.length > 0
        ? `
      <div class="suggested-prompts-container" style="margin-top: ${Theme.spacing.sm}; border-top: 1px dotted var(--vscode-panel-border); padding-top: 6px;">
        <span class="suggested-label" style="font-size: 10px; color: var(--vscode-descriptionForeground); display: block; margin-bottom: 4px;">Suggested prompts:</span>
        <div class="suggested-pills" style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${activeStage.suggestedPrompts.map((p) => `<span class="suggested-pill" onclick="applySuggestedPrompt('${p.replace(/'/g, "\\'")}')" style="font-size: 10px; color: var(--vscode-textLink-foreground); cursor: pointer; padding: 2px 6px; background: var(--vscode-sideBarSectionHeader-background); border-radius: 2px; border: 1px solid var(--vscode-panel-border);">• ${p}</span>`).join('')}
        </div>
      </div>
    `
        : '';

    activeCardHtml = `
      <div class="stage-card" style="${showSessionWidgets ? 'border: 1px solid var(--vscode-button-background);' : ''} border-radius: 4px; overflow: hidden; background: var(--vscode-sideBarSectionHeader-background);">
        ${
          showSessionWidgets
            ? `
        <div class="stage-header" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--vscode-panel-border);">
          <div style="display: flex; align-items: center; gap: ${Theme.spacing.sm};">
            <span class="skeleton-pulse-dot">●</span>
            <span class="stage-title-text">${activeStage.title}</span>
          </div>
          <span class="tag tag-warn" style="padding: 2px 6px; border-radius: 2px; font-size: 8px; font-weight: 700; background: var(--vscode-inputValidation-warningBackground, #E58E26); color: #FFF;">ACTIVE</span>
        </div>
        `
            : ''
        }
        <div class="stage-body" style="padding: 10px; background: var(--vscode-sideBar-background);">
          ${activeStage.contentHtml}
          ${suggestionsHtml}
        </div>
      </div>
    `;
  }

  // Next Best Action Docked Tray
  const dockedPromptHtml = showSessionWidgets
    ? `
    <div class="docked-prompt-box">
      <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 6px; display: flex; align-items: center; gap: 4px; line-height: 1.3;">
        <span style="color: var(--vscode-button-background); font-weight: bold;">➡️</span> 
        <strong>Next action:</strong> <span id="nba-tracker-text">${nextBestActionText}</span>
      </div>
      <div class="prompt-input-container">
        <input type="text" id="chat-prompt-input" placeholder="${promptPlaceholder}" onkeydown="handlePromptKey(event)" />
        <button style="width: auto; padding: 4px 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground);" onclick="submitPromptQuery()">Send</button>
      </div>
    </div>
  `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QAMate Workspace</title>
    <style>
        body {
            font-family: var(--vscode-font-family, sans-serif);
            font-size: var(--vscode-font-size, 13px);
            padding: ${Theme.spacing.md};
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
            line-height: 1.5;
            padding-bottom: ${showSessionWidgets ? '120px' : '40px'};
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

        /* Timeline / logs */
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

        .skeleton-pulse-dot {
            animation: pulse-dot 1.2s infinite ease-in-out;
            color: var(--vscode-button-background);
        }
        @keyframes pulse-dot {
            0% { opacity: 0.4; }
            50% { opacity: 1.0; }
            100% { opacity: 0.4; }
        }

        /* Inline toast */
        .inline-toast {
            position: fixed;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            padding: 6px 16px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            max-width: 90%;
            text-align: center;
        }
        .inline-toast.show {
            opacity: 1;
        }
        .inline-toast.success {
            background: var(--vscode-testing-iconPassed, #388a34);
            color: #fff;
        }
        .inline-toast.error {
            background: var(--vscode-testing-iconFailed, #f44747);
            color: #fff;
        }
        .inline-toast.info {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }
        .btn-saving {
            opacity: 0.6;
            cursor: wait !important;
            pointer-events: none;
        }

        /* Styling active nav bar states */
        .global-nav-bar .nav-item {
            padding: 4px 8px;
            border-radius: 2px;
            transition: background 0.15s ease-in-out;
        }
        .global-nav-bar .nav-item:hover {
            background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.05));
        }
    </style>
</head>
<body>
    <div id="inline-toast" class="inline-toast"></div>

    <!-- Navigation Header -->
    ${navigationBarHtml}

    ${commandBarHtml}

    ${sessionHeaderHtml}

    <!-- Horizontal step progress header -->
    ${progressStepsHtml}

    <div class="wizard-container">
      ${activeCardHtml}
    </div>

    ${activeTab === 'home' && devModeEnabled ? timelineHtml : ''}

    <!-- Docked Assistant Prompt Box & Next Best Action Tracker -->
    ${dockedPromptHtml}

    <script>
      const vscode = acquireVsCodeApi();
      function postMessage(data) {
        vscode.postMessage(data);
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

      // Helper toast messages for settings/sessions pages inside the layout context
      function showToast(message, type) {
        type = type || 'info';
        var toast = document.getElementById('inline-toast');
        if (!toast) return;
        toast.className = 'inline-toast ' + type;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function() {
          toast.classList.remove('show');
        }, 3000);
      }
    </script>
</body>
</html>`;
}

import { Theme } from '../Theme.js';
import { icons } from '../icons.js';
import { renderStatusBar, renderBadge } from './Library.js';

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
  activeTab: any = 'dashboard',
): string {
  // Map tab IDs to labels and icons/emojis
  const sidebarTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'requirement', label: 'Requirement', icon: '📄' },
    { id: 'system', label: 'System Model', icon: '🏗' },
    { id: 'mental', label: 'Mental Model', icon: '🧠' },
    { id: 'strategy', label: 'Strategy', icon: '📋' },
    { id: 'artifacts', label: 'Artifacts', icon: '🧪' },
    { id: 'review', label: 'Review', icon: '✔' },
    { id: 'deliver', label: 'Deliver', icon: '📦' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' },
    { id: 'sessions', label: 'Evolution', icon: '📚' },
    { id: 'settings', label: 'Project DNA', icon: '🧬' },
    { id: 'hub', label: 'AI Hub', icon: '🤖' },
  ];

  // Resolve current active stage content
  const activeStage = stages.find((s) => s.status === 'active') || stages[0];
  const activeContentHtml = activeStage ? activeStage.contentHtml : '';

  // Breadcrumbs text
  const breadcrumbProject = 'QAMate';
  const breadcrumbSession = sessionTitle || 'No Session Active';
  const breadcrumbActive = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  // Status Bar items configuration
  const statusBarHtml = renderStatusBar([
    { label: 'AI', value: isAnalyzing ? 'Analyzing...' : 'Claude', icon: '🟢' },
    { label: 'DNA', value: 'Loaded', icon: '🟢' },
    { label: 'Review', value: 'Passed', icon: '🟢' },
    { label: 'Revision', value: 'v3' },
    { label: 'Session', value: 'Saved', icon: '✓' }
  ]);

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
      padding: 0;
      margin: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      overflow: hidden;
      height: 100vh;
      box-sizing: border-box;
    }

    /* Grid layout structure */
    .workspace-shell {
      display: grid;
      grid-template-rows: 40px 1fr 24px;
      height: 100vh;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* Header Panel styling */
    .workspace-header {
      grid-row: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--vscode-sideBarSectionHeader-background);
      border-bottom: 1px solid var(--vscode-panel-border);
      padding: 0 10px;
      box-sizing: border-box;
    }

    /* Breadcrumbs navigation */
    .workspace-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 40%;
    }
    .workspace-breadcrumbs strong {
      color: var(--vscode-foreground);
    }

    /* Top Command bar button groups */
    .workspace-commands {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .command-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 600;
      border-radius: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
      height: 20px;
      line-height: 1;
    }
    .command-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .command-btn:disabled {
      background: var(--vscode-button-secondaryBackground, #3a3a3a);
      color: var(--vscode-descriptionForeground);
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Notification indicator */
    .notification-bell {
      cursor: pointer;
      position: relative;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 2px;
    }
    .notification-bell:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.05));
    }
    .notification-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 6px;
      height: 6px;
      background: var(--vscode-testing-iconFailedColor, #f44747);
      border-radius: 50%;
    }

    /* Body area grid splitting left navigation, active host, and context drawer */
    .workspace-main {
      grid-row: 2;
      display: grid;
      grid-template-columns: 48px 1fr var(--context-width, 220px);
      overflow: hidden;
      transition: grid-template-columns 0.2s ease;
      box-sizing: border-box;
      width: 100%;
    }

    /* Sidebar navigation icons column */
    .workspace-sidebar {
      grid-column: 1;
      background: var(--vscode-sideBarSectionHeader-background);
      border-right: 1px solid var(--vscode-panel-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding-top: 10px;
      box-sizing: border-box;
    }
    .sidebar-item {
      cursor: pointer;
      font-size: 15px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      color: var(--vscode-descriptionForeground);
      position: relative;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .sidebar-item:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.05));
      color: var(--vscode-foreground);
    }
    .sidebar-item.active {
      color: var(--vscode-button-background);
      background: rgba(255, 255, 255, 0.04);
      border-left: 2px solid var(--vscode-button-background);
      border-radius: 0 4px 4px 0;
    }

    /* Active Workspace Viewport */
    .workspace-host {
      grid-column: 2;
      overflow-y: auto;
      padding: 10px;
      box-sizing: border-box;
      background: var(--vscode-sideBar-background);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Right Context drawer */
    .workspace-drawer {
      grid-column: 3;
      background: var(--vscode-sideBarSectionHeader-background);
      border-left: 1px solid var(--vscode-panel-border);
      overflow-y: auto;
      padding: 10px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Footer diagnostics panel styling */
    .workspace-footer {
      grid-row: 3;
      box-sizing: border-box;
    }

    /* Dynamic overlay for notifications dropdown */
    .notification-dropdown {
      display: none;
      position: absolute;
      top: 36px;
      right: 10px;
      background: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      width: 220px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      z-index: 250;
      padding: 8px;
      box-sizing: border-box;
    }

    /* Hover tooltips styling */
    .sidebar-item[title]::after {
      content: attr(title);
      position: absolute;
      left: 42px;
      background: var(--vscode-sideBarSectionHeader-background);
      color: var(--vscode-foreground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 2px;
      padding: 2px 6px;
      font-size: 10px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
      z-index: 300;
    }
    .sidebar-item:hover::after {
      opacity: 1;
    }

    /* Splitter Layout styling */
    .workspace-splitter {
      width: 4px;
      cursor: col-resize;
      background: var(--vscode-panel-border);
      transition: background 0.1s ease;
      z-index: 100;
    }
    .workspace-splitter:hover {
      background: var(--vscode-button-background) !important;
    }

    /* Modal Overlay panels styling */
    .qamate-modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.4);
      z-index: 500;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .qamate-modal-content {
      background: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      width: 320px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      box-sizing: border-box;
    }

    /* Toast overlay styling */
    .qamate-toast-container {
      position: fixed;
      bottom: 26px;
      right: 12px;
      z-index: 600;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: none;
    }
    .qamate-toast {
      background: var(--vscode-notifications-background, var(--vscode-sideBar-background));
      border: 1px solid var(--vscode-notifications-border, var(--vscode-panel-border));
      color: var(--vscode-notifications-foreground, var(--vscode-foreground));
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      animation: fade-in 0.2s ease-out;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Tabbed Header Context styles */
    .drawer-tab {
      cursor: pointer;
      padding: 2px 6px;
      border-bottom: 2px solid transparent;
      font-size: 9px;
      opacity: 0.7;
    }
    .drawer-tab.active {
      border-bottom: 2px solid var(--vscode-button-background);
      font-weight: bold;
      opacity: 1;
    }

    /* Responsive collapsible layout configuration rules */
    @media (max-width: 480px) {
      .workspace-main {
        grid-template-columns: 40px 1fr 0px !important;
      }
      .workspace-drawer {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="workspace-shell">
    
    <!-- Top Header -->
    <div class="workspace-header">
      <div class="workspace-breadcrumbs">
        <span>${breadcrumbProject}</span>
        <span>${icons.chevronRight}</span>
        <span title="${breadcrumbSession}">${breadcrumbSession.substring(0, 15)}${breadcrumbSession.length > 15 ? '...' : ''}</span>
        <span>${icons.chevronRight}</span>
        <span>Evolution</span>
        <span>${icons.chevronRight}</span>
        <strong>${breadcrumbActive}</strong>
      </div>
      
      <!-- Command Bar Actions -->
      <div class="workspace-commands">
        <button class="command-btn" onclick="postMessage({command: 'analyzeActive'})" title="Parse requirements and system scopes">Analyze</button>
        <button class="command-btn" onclick="postMessage({command: 'executeNext'})" title="Process next wizard state">Generate</button>
        <button class="command-btn" onclick="postMessage({command: 'switchTab', tab: 'review'})" title="Verify objectives coverage">Review</button>
        <button class="command-btn" onclick="postMessage({command: 'switchTab', tab: 'deliver'})" title="Export compiled deliverables">Export</button>
        
        <!-- Zoom controls -->
        <button class="command-btn" onclick="adjustZoom(-10)" title="Zoom Out font size" style="font-family: monospace; font-weight: bold;">A-</button>
        <button class="command-btn" onclick="adjustZoom(0)" title="Reset default zoom size" style="font-family: monospace; font-weight: bold;">A</button>
        <button class="command-btn" onclick="adjustZoom(10)" title="Zoom In font size" style="font-family: monospace; font-weight: bold;">A+</button>
        
        <!-- Keyboard shortcuts modal guide launcher button -->
        <button class="command-btn" onclick="toggleModal('shortcuts-modal')" title="Show keyboard shortcuts help panel" style="font-size: 11px;">⌨</button>

        <!-- Command Palette launcher button -->
        <button class="command-btn" onclick="toggleModal('palette-modal')" title="Open Command Palette" style="font-size: 11px;">🔍</button>
        
        <!-- Notification center toggler bell -->
        <div class="notification-bell" onclick="toggleNotifications()">
          🔔
          <div class="notification-badge"></div>
        </div>
      </div>
    </div>

    <!-- Main Workspace body grids splitting columns -->
    <div class="workspace-main" id="workspace-main-panel">
      
      <!-- Left navigation buttons column -->
      <div class="workspace-sidebar">
        ${sidebarTabs
          .map(
            (tab) => `
          <div class="sidebar-item ${tab.id === activeTab ? 'active' : ''}" 
               title="${tab.label}" 
               onclick="postMessage({command: 'switchTab', tab: '${tab.id}'})">
             ${tab.icon}
          </div>
        `
          )
          .join('')}
      </div>

      <!-- Center active workspace host -->
      <div class="workspace-host">
        ${activeContentHtml}
      </div>

      <!-- Splitter Element -->
      <div class="workspace-splitter" id="workspace-splitter"></div>

      <!-- Right Context panel drawer -->
      <div class="workspace-drawer" id="workspace-context-drawer">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--vscode-descriptionForeground); border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 4px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
          <span>Workspace Context</span>
          <span style="cursor: pointer; opacity: 0.7;" onclick="toggleContextDrawer()">◀</span>
        </div>

        <!-- Tabbed drawer header navigation -->
        <div style="display: flex; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 2px; margin-bottom: 4px; gap: 2px;">
          <div class="drawer-tab active" id="tab-health" onclick="switchDrawerTab('health')">Health</div>
          <div class="drawer-tab" id="tab-recs" onclick="switchDrawerTab('recs')">Recs</div>
          <div class="drawer-tab" id="tab-logs" onclick="switchDrawerTab('logs')">Logs</div>
          <div class="drawer-tab" id="tab-ai" onclick="switchDrawerTab('ai')">AI</div>
        </div>
        
        <!-- Tab: Health widget -->
        <div id="drawer-panel-health" class="drawer-panel" style="display: flex; flex-direction: column; gap: 4px;">
          <div style="background: var(--vscode-sideBarSectionHeader-background); padding: 8px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; font-weight: 600;">QA Health:</span>
            ${renderBadge('94%', 'success')}
          </div>
        </div>

        <!-- Tab: Recommendations widget -->
        <div id="drawer-panel-recs" class="drawer-panel" style="display: none; flex-direction: column; gap: 4px;">
          <div style="background: var(--vscode-sideBarSectionHeader-background); padding: 8px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; font-weight: 600;">Recommendations:</span>
            ${renderBadge('8 Active', 'info')}
          </div>
        </div>

        <!-- Tab: Logs timeline -->
        <div id="drawer-panel-logs" class="drawer-panel" style="display: none; flex-direction: column; gap: 4px;">
          <div style="font-family: monospace; font-size: 8px; line-height: 1.3; opacity: 0.8;">
            <div>10:15 - Req parsed</div>
            <div>10:18 - System Model created</div>
            <div>10:22 - Strategy generated</div>
          </div>
        </div>

        <!-- Tab: AI Provider Status -->
        <div id="drawer-panel-ai" class="drawer-panel" style="display: none; flex-direction: column; gap: 4px;">
          <div style="font-size: 9.5px; opacity: 0.8;">
            Active Provider: <strong>Claude 3.5</strong><br/>
            Latency: <strong>230ms</strong><br/>
            Requests today: <strong>284</strong>
          </div>
        </div>

        <div style="font-size: 9px; color: var(--vscode-descriptionForeground); margin-top: auto; line-height: 1.3;">
          Click Left sidebar options to edit workspace items. Drag splitter to resize panel drawer.
        </div>
      </div>
    </div>

    <!-- Bottom Status Bar -->
    <div class="workspace-footer">
      ${statusBarHtml}
    </div>

    <!-- Notifications Dropdown Popup -->
    <div class="notification-dropdown" id="notification-dropdown-panel">
      <div style="font-size: 10px; font-weight: 700; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 4px; margin-bottom: 6px;">Notifications</div>
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
        <div style="border-left: 2px solid var(--vscode-testing-iconPassedColor, #89D185); padding-left: 4px;">
          <strong>Requirement Loaded:</strong> ${breadcrumbSession}
        </div>
        <div style="border-left: 2px solid var(--vscode-button-background); padding-left: 4px;">
          <strong>Workspace Health:</strong> Strategy compiled successfully.
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts Modal Help Dialog -->
    <div class="qamate-modal-overlay" id="shortcuts-modal" onclick="closeModalsOnOutsideClick(event, 'shortcuts-modal')">
      <div class="qamate-modal-content">
        <div style="font-size: 11px; font-weight: bold; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span>Workspace Keyboard Shortcuts</span>
          <span style="cursor: pointer;" onclick="toggleModal('shortcuts-modal')">✕</span>
        </div>
        <table style="width: 100%; font-size: 9.5px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid var(--vscode-panel-border);"><td style="padding: 3px 0;"><strong>Ctrl+Shift+A</strong></td><td style="padding: 3px 0; text-align: right;">Parse Spec & Analyze</td></tr>
          <tr style="border-bottom: 1px solid var(--vscode-panel-border);"><td style="padding: 3px 0;"><strong>Ctrl+Shift+G</strong></td><td style="padding: 3px 0; text-align: right;">Generate Strategy</td></tr>
          <tr style="border-bottom: 1px solid var(--vscode-panel-border);"><td style="padding: 3px 0;"><strong>Ctrl+Shift+R</strong></td><td style="padding: 3px 0; text-align: right;">Open Review Workspace</td></tr>
          <tr style="border-bottom: 1px solid var(--vscode-panel-border);"><td style="padding: 3px 0;"><strong>Ctrl+Shift+D</strong></td><td style="padding: 3px 0; text-align: right;">Open Dashboard Tab</td></tr>
          <tr style="border-bottom: 1px solid var(--vscode-panel-border);"><td style="padding: 3px 0;"><strong>Ctrl+Shift+H</strong></td><td style="padding: 3px 0; text-align: right;">Show Keyboard Help</td></tr>
          <tr style="border-bottom: 1px solid var(--vscode-panel-border);"><td style="padding: 3px 0;"><strong>Ctrl+Shift+P</strong></td><td style="padding: 3px 0; text-align: right;">Open Command Palette</td></tr>
          <tr style="border-bottom: 1px solid var(--vscode-panel-border);"><td style="padding: 3px 0;"><strong>Ctrl+Shift+F</strong></td><td style="padding: 3px 0; text-align: right;">Global Search Workspace</td></tr>
        </table>
      </div>
    </div>

    <!-- Command Palette Modal Dialog -->
    <div class="qamate-modal-overlay" id="palette-modal" onclick="closeModalsOnOutsideClick(event, 'palette-modal')">
      <div class="qamate-modal-content">
        <div style="font-size: 11px; font-weight: bold; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 6px; margin-bottom: 8px;">Command Palette</div>
        <input type="text" placeholder="Type a workspace action..." style="width: 100%; font-size: 10px; padding: 4px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; margin-bottom: 8px;" id="palette-search-input" onkeyup="filterPalette()" />
        <div id="palette-commands-list" style="display: flex; flex-direction: column; gap: 4px; font-size: 9.5px; max-height: 120px; overflow-y: auto;">
          <div onclick="triggerPaletteCommand('analyzeActive')" style="cursor: pointer; padding: 4px; border-radius: 2px; background: rgba(255,255,255,0.02);">QAMate: Analyze Requirement</div>
          <div onclick="triggerPaletteCommand('executeNext')" style="cursor: pointer; padding: 4px; border-radius: 2px;">QAMate: Generate Strategy Blueprint</div>
          <div onclick="triggerPaletteCommand('switchTab', 'review')" style="cursor: pointer; padding: 4px; border-radius: 2px;">QAMate: Open Review Board</div>
          <div onclick="triggerPaletteCommand('switchTab', 'deliver')" style="cursor: pointer; padding: 4px; border-radius: 2px;">QAMate: Open Deliveries Center</div>
          <div onclick="triggerPaletteCommand('switchTab', 'settings')" style="cursor: pointer; padding: 4px; border-radius: 2px;">QAMate: Open Project DNA Cockpit</div>
          <div onclick="triggerPaletteCommand('switchTab', 'hub')" style="cursor: pointer; padding: 4px; border-radius: 2px;">QAMate: Open AI Hub Center</div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications Container Overlay -->
    <div class="qamate-toast-container" id="toast-container"></div>

  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function postMessage(data) {
      vscode.postMessage(data);
    }

    // Toast Notifications trigger helper
    function showToast(message) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'qamate-toast';
      toast.innerHTML = '<span>✓</span> <span>' + message + '</span>';
      container.appendChild(toast);
      setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.2s ease';
        setTimeout(function() {
          toast.remove();
        }, 200);
      }, 2500);
    }

    // Toggle Notifications dropdown panel
    function toggleNotifications() {
      const panel = document.getElementById('notification-dropdown-panel');
      if (panel.style.display === 'block') {
        panel.style.display = 'none';
      } else {
        panel.style.display = 'block';
      }
    }

    // Switch right context tabs
    function switchDrawerTab(tabId) {
      document.querySelectorAll('.drawer-tab').forEach(function(el) {
        el.classList.remove('active');
      });
      document.querySelectorAll('.drawer-panel').forEach(function(el) {
        el.style.display = 'none';
      });
      document.getElementById('tab-' + tabId).classList.add('active');
      document.getElementById('drawer-panel-' + tabId).style.display = 'flex';
    }

    // Toggle modal panels
    function toggleModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal.style.display === 'flex') {
        modal.style.display = 'none';
      } else {
        modal.style.display = 'flex';
        if (modalId === 'palette-modal') {
          setTimeout(function() { document.getElementById('palette-search-input').focus(); }, 50);
        }
      }
    }

    function closeModalsOnOutsideClick(e, modalId) {
      if (e.target.id === modalId) {
        toggleModal(modalId);
      }
    }

    // Command palette handlers
    function filterPalette() {
      const input = document.getElementById('palette-search-input').value.toLowerCase();
      const items = document.getElementById('palette-commands-list').children;
      for (let i = 0; i < items.length; i++) {
        const text = items[i].textContent.toLowerCase();
        items[i].style.display = text.indexOf(input) !== -1 ? 'block' : 'none';
      }
    }

    function triggerPaletteCommand(cmd, tab) {
      toggleModal('palette-modal');
      if (cmd === 'switchTab') {
        postMessage({command: cmd, tab: tab});
        showToast('Navigating tab ' + tab);
      } else {
        postMessage({command: cmd});
        showToast('Executing command ' + cmd);
      }
    }

    // Adjust zoom levels
    let currentZoom = 100;
    function adjustZoom(delta) {
      if (delta === 0) {
        currentZoom = 100;
      } else {
        currentZoom += delta;
      }
      document.body.style.zoom = currentZoom + '%';
      showToast('Zoom size: ' + currentZoom + '%');
    }

    // Resizable splitter logic
    (function() {
      const splitter = document.getElementById('workspace-splitter');
      const mainPanel = document.getElementById('workspace-main-panel');
      const drawer = document.getElementById('workspace-context-drawer');
      let isDragging = false;

      // Restore persisted width if exists
      const savedWidth = localStorage.getItem('qamate-context-drawer-width');
      if (savedWidth) {
        mainPanel.style.setProperty('--context-width', savedWidth + 'px');
      }

      splitter.addEventListener('mousedown', function(e) {
        isDragging = true;
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
      });

      document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const width = window.innerWidth - e.clientX;
        if (width > 120 && width < 450) {
          mainPanel.style.setProperty('--context-width', width + 'px');
          localStorage.setItem('qamate-context-drawer-width', width);
        }
      });

      document.addEventListener('mouseup', function() {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = 'default';
        }
      });
    })();

    // Collapse and expand right context drawer panel
    let contextExpanded = true;
    function toggleContextDrawer() {
      const main = document.getElementById('workspace-main-panel');
      const drawer = document.getElementById('workspace-context-drawer');
      const splitter = document.getElementById('workspace-splitter');
      if (contextExpanded) {
        main.style.gridTemplateColumns = '48px 1fr 0px';
        drawer.style.display = 'none';
        splitter.style.display = 'none';
        contextExpanded = false;
      } else {
        const savedWidth = localStorage.getItem('qamate-context-drawer-width') || '220';
        main.style.gridTemplateColumns = '48px 1fr var(--context-width, ' + savedWidth + 'px)';
        drawer.style.display = 'flex';
        splitter.style.display = 'block';
        contextExpanded = true;
      }
    }

    // Keydown shortcuts binding
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.shiftKey) {
        const key = e.key.toUpperCase();
        if (key === 'A') {
          e.preventDefault();
          postMessage({command: 'analyzeActive'});
          showToast('Triggered specs analysis');
        } else if (key === 'G') {
          e.preventDefault();
          postMessage({command: 'executeNext'});
          showToast('Triggered strategy compilation');
        } else if (key === 'R') {
          e.preventDefault();
          postMessage({command: 'switchTab', tab: 'review'});
          showToast('Opening review board');
        } else if (key === 'D') {
          e.preventDefault();
          postMessage({command: 'switchTab', tab: 'dashboard'});
          showToast('Opening dashboard cockpit');
        } else if (key === 'H') {
          e.preventDefault();
          toggleModal('shortcuts-modal');
        } else if (key === 'P') {
          e.preventDefault();
          toggleModal('palette-modal');
        }
      }
    });
  </script>
</body>
</html>`;
}

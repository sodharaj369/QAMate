export function renderCard(title: string, content: string, action?: string): string {
  return `
    <div class="qamate-card" style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; margin-bottom: 8px; box-sizing: border-box;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 4px;">${title}</div>
      <div style="font-size: 12px; color: var(--vscode-foreground);">${content}</div>
      ${action ? `<div style="margin-top: 8px;">${action}</div>` : ''}
    </div>
  `;
}

export function renderPanel(title: string, children: string): string {
  return `
    <div class="qamate-panel" style="border: 1px solid var(--vscode-panel-border); border-radius: 4px; overflow: hidden; margin-bottom: 12px; box-sizing: border-box; background: var(--vscode-sideBar-background);">
      <div style="background: var(--vscode-sideBarSectionHeader-background); padding: 6px 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; justify-content: space-between;">
        <span>${title}</span>
      </div>
      <div style="padding: 10px;">${children}</div>
    </div>
  `;
}

export function renderMetric(label: string, value: string | number, grade?: string): string {
  return `
    <div class="qamate-metric-card" style="background: var(--vscode-sideBarSectionHeader-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; display: flex; flex-direction: column; align-items: flex-start; min-width: 80px; flex: 1; box-sizing: border-box;">
      <span style="font-size: 9px; text-transform: uppercase; color: var(--vscode-descriptionForeground); font-weight: 600; line-height: 1.2;">${label}</span>
      <div style="display: flex; align-items: baseline; gap: 4px; margin-top: 4px;">
        <span style="font-size: 18px; font-weight: 700; color: var(--vscode-foreground);">${value}</span>
        ${grade ? `<span style="font-size: 10px; font-weight: 700; color: var(--vscode-button-background);">${grade}</span>` : ''}
      </div>
    </div>
  `;
}

export function renderBadge(text: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): string {
  const backgrounds = {
    success: 'var(--vscode-testing-iconPassed, #388a34)',
    warning: 'var(--vscode-inputValidation-warningBackground, #E58E26)',
    error: 'var(--vscode-testing-iconFailed, #f44747)',
    info: 'var(--vscode-badge-background, #2d2d2d)'
  };
  const bg = backgrounds[type] || backgrounds.info;
  return `
    <span class="qamate-badge" style="display: inline-block; padding: 2px 6px; border-radius: 2px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #FFF; background: ${bg}; word-break: keep-all; white-space: nowrap;">${text}</span>
  `;
}

export function renderToolbar(actions: { label: string; command: string; disabled?: boolean }[]): string {
  return `
    <div class="qamate-toolbar" style="display: flex; gap: 4px; margin-bottom: 10px;">
      ${actions
        .map(
          (act) => `
        <button class="qamate-toolbar-btn" 
                onclick="${act.disabled ? '' : `postMessage({command: '${act.command}'})`}" 
                ${act.disabled ? 'disabled' : ''}
                style="flex: 1; padding: 4px 6px; font-size: 10px; background: ${act.disabled ? 'var(--vscode-button-secondaryBackground, #3a3a3a)' : 'var(--vscode-button-background)'}; color: ${act.disabled ? 'var(--vscode-descriptionForeground)' : 'var(--vscode-button-foreground)'}; border: 1px solid var(--vscode-panel-border); cursor: ${act.disabled ? 'not-allowed' : 'pointer'}; opacity: ${act.disabled ? 0.5 : 1}; height: 24px; border-radius: 2px;">
          ${act.label}
        </button>
      `
        )
        .join('')}
    </div>
  `;
}

export function renderTabs(tabs: { id: string; label: string }[], activeTab: string): string {
  return `
    <div class="qamate-tabs" style="display: flex; gap: 2px; border-bottom: 1px solid var(--vscode-panel-border); margin-bottom: 10px; padding-bottom: 4px; box-sizing: border-box; overflow-x: auto;">
      ${tabs
        .map(
          (t) => `
        <span class="qamate-tab-item ${t.id === activeTab ? 'active' : ''}" 
              onclick="postMessage({command: 'switchTab', tab: '${t.id}'})"
              style="padding: 4px 8px; font-size: 11px; cursor: pointer; border-radius: 2px; font-weight: ${t.id === activeTab ? '700' : '500'}; color: ${t.id === activeTab ? 'var(--vscode-button-background)' : 'var(--vscode-descriptionForeground)'}; background: ${t.id === activeTab ? 'var(--vscode-sideBarSectionHeader-background)' : 'transparent'}; white-space: nowrap;">
          ${t.label}
        </span>
      `
        )
        .join('')}
    </div>
  `;
}

export function renderTree(nodes: { label: string; icon?: string; children?: { label: string; icon?: string }[] }[]): string {
  const renderNode = (n: any, indent = 0): string => {
    let html = `
      <div class="qamate-tree-node" style="padding-left: ${indent * 12}px; display: flex; align-items: center; gap: 6px; font-size: 11px; height: 20px; line-height: 20px; color: var(--vscode-foreground);">
        ${n.icon ? `<span>${n.icon}</span>` : ''}
        <span>${n.label}</span>
      </div>
    `;
    if (n.children) {
      html += n.children.map((child: any) => renderNode(child, indent + 1)).join('');
    }
    return html;
  };
  return `
    <div class="qamate-tree" style="display: flex; flex-direction: column; background: var(--vscode-sideBar-background); padding: 4px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; box-sizing: border-box;">
      ${nodes.map((n) => renderNode(n)).join('')}
    </div>
  `;
}

export function renderTable(headers: string[], rows: (string | number)[][]): string {
  return `
    <table class="qamate-table" style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; text-align: left;">
      <thead>
        <tr style="background: var(--vscode-sideBarSectionHeader-background); color: var(--vscode-foreground); border-bottom: 1px solid var(--vscode-panel-border);">
          ${headers.map((h) => `<th style="padding: 6px; font-weight: 600;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr style="border-bottom: 1px solid var(--vscode-panel-border);">
            ${row.map((cell) => `<td style="padding: 6px; color: var(--vscode-foreground);">${cell}</td>`).join('')}
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

export function renderPropertyGrid(properties: { name: string; value: string | number }[]): string {
  return `
    <div class="qamate-property-grid" style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
      ${properties
        .map(
          (prop) => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted var(--vscode-panel-border); padding-bottom: 2px;">
          <span style="color: var(--vscode-descriptionForeground); font-weight: 500;">${prop.name}</span>
          <span style="color: var(--vscode-foreground); font-weight: 600; text-align: right;">${prop.value}</span>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

export function renderStatusBar(items: { label: string; value: string; icon?: string }[]): string {
  return `
    <div class="qamate-status-bar" style="display: flex; align-items: center; justify-content: space-between; background: var(--vscode-sideBarSectionHeader-background); border-top: 1px solid var(--vscode-panel-border); padding: 4px 8px; font-size: 10px; color: var(--vscode-descriptionForeground); box-sizing: border-box; height: 24px; line-height: 16px;">
      ${items
        .map(
          (item) => `
        <div style="display: flex; align-items: center; gap: 4px;">
          ${item.icon ? `<span>${item.icon}</span>` : ''}
          <span>${item.label}: <strong style="color: var(--vscode-foreground);">${item.value}</strong></span>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

export function renderDrawer(title: string, content: string, open = false): string {
  return `
    <div class="qamate-drawer" style="display: ${open ? 'flex' : 'none'}; flex-direction: column; position: fixed; top: 0; right: 0; bottom: 0; width: 220px; background: var(--vscode-sideBar-background); border-left: 1px solid var(--vscode-panel-border); z-index: 150; box-shadow: -2px 0 5px rgba(0,0,0,0.2); box-sizing: border-box;">
      <div style="background: var(--vscode-sideBarSectionHeader-background); padding: 8px 10px; font-weight: 700; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; justify-content: space-between;">
        <span>${title}</span>
        <span style="cursor: pointer; font-weight: 700;" onclick="toggleDrawer()">✕</span>
      </div>
      <div style="padding: 10px; overflow-y: auto; flex: 1;">${content}</div>
    </div>
  `;
}

export function renderDialog(title: string, content: string, visible = false): string {
  return `
    <div class="qamate-dialog-overlay" style="display: ${visible ? 'flex' : 'none'}; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); align-items: center; justify-content: center; z-index: 200; box-sizing: border-box;">
      <div class="qamate-dialog" style="background: var(--vscode-sideBar-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; width: 85%; max-width: 400px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); overflow: hidden;">
        <div style="background: var(--vscode-sideBarSectionHeader-background); padding: 8px 10px; font-weight: 700; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; justify-content: space-between;">
          <span>${title}</span>
          <span style="cursor: pointer;" onclick="closeDialog()">✕</span>
        </div>
        <div style="padding: 12px; font-size: 12px; color: var(--vscode-foreground);">${content}</div>
      </div>
    </div>
  `;
}

export function renderEmptyState(title: string, description: string): string {
  return `
    <div class="qamate-empty-state" style="padding: 24px 16px; text-align: center; color: var(--vscode-descriptionForeground); border: 1px dashed var(--vscode-panel-border); border-radius: 4px; box-sizing: border-box;">
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px; color: var(--vscode-foreground);">${title}</div>
      <div style="font-size: 11px; line-height: 1.4;">${description}</div>
    </div>
  `;
}

export function renderLoadingState(label: string): string {
  return `
    <div class="qamate-loading-state" style="padding: 20px; text-align: center; box-sizing: border-box;">
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 8px;">${label}</div>
      <div style="height: 2px; width: 100%; background: var(--vscode-panel-border); position: relative; overflow: hidden; border-radius: 2px;">
        <div style="position: absolute; height: 100%; width: 30%; background: var(--vscode-button-background); animation: qamate-shimmer-progress 1.5s infinite ease-in-out;"></div>
      </div>
      <style>
        @keyframes qamate-shimmer-progress {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      </style>
    </div>
  `;
}

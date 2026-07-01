export interface SessionItem {
  id: string;
  title: string;
  timestamp: string;
  step?: string;
}

export function renderSessionsPage(sessions: SessionItem[]): string {
  const sessionsListHtml =
    sessions.length > 0
      ? sessions
          .map((s) => {
            return `
        <div class="card session-card" style="margin-bottom: 8px; border-left: 2px solid var(--vscode-button-background); display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <strong class="session-title-label" style="font-size: 12px; color: var(--vscode-foreground); cursor: pointer;" onclick="postMessage({command: 'loadSession', sessionId: '${s.id}'})">
              ${s.title}
            </strong>
            <span style="font-size: 9px; color: var(--vscode-descriptionForeground); font-style: italic;">
              ${s.step || 'Understand'}
            </span>
          </div>
          <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px;">
            ${s.timestamp}
          </div>
          <div style="display: flex; gap: 8px; font-size: 10px; border-top: 1px solid var(--vscode-panel-border); padding-top: 4px; margin-top: 2px;">
            <span class="session-action" onclick="postMessage({command: 'loadSession', sessionId: '${s.id}'})" style="color: var(--vscode-textLink-foreground); cursor: pointer;">Resume</span>
            <span class="session-action" onclick="renameSessionPrompt('${s.id}', '${s.title.replace(/'/g, "\\'")}')" style="color: var(--vscode-textLink-foreground); cursor: pointer;">Rename</span>
            <span class="session-action" onclick="postMessage({command: 'duplicateSession', sessionId: '${s.id}'})" style="color: var(--vscode-textLink-foreground); cursor: pointer;">Duplicate</span>
            <span class="session-action" onclick="postMessage({command: 'deleteSession', sessionId: '${s.id}'})" style="color: var(--vscode-testing-iconFailedColor, #F48771); cursor: pointer; margin-left: auto;">Delete</span>
          </div>
        </div>
      `;
          })
          .join('')
      : `<div class="empty-text" style="padding: 20px 0; text-align: center; color: var(--vscode-descriptionForeground);">No sessions found. Start a new session from the Home tab.</div>`;

  return `
    <div class="page-container" style="animation: fade-in 0.18s ease-out;">
      <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--vscode-foreground);">📂 Sessions</h2>
      
      <div class="sessions-container">
        ${sessionsListHtml}
      </div>
    </div>

    <script>
      function renameSessionPrompt(id, currentTitle) {
        // Use prompt from webview context
        var newTitle = prompt("Enter new title for session:", currentTitle);
        if (newTitle && newTitle.trim()) {
          postMessage({ command: 'renameSession', sessionId: id, title: newTitle.trim() });
          showToast('✅ Session renamed', 'success');
        }
      }
    </script>
  `;
}

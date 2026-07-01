export function renderSkeleton(pageName: string, logs: string[]): string {
  const stepsHtml = logs.map((log) => `<p class="skeleton-log" style="font-family: monospace; font-size: 10px; opacity: 0.85; margin: 4px 0;">⏱️ ${log}</p>`).join('');
  
  return `
    <style>
      @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: 200px 0; }
      }
      .shimmer-line {
        height: 10px;
        margin-bottom: 8px;
        border-radius: 2px;
        background: linear-gradient(90deg, var(--vscode-sideBarSectionHeader-background) 25%, var(--vscode-panel-border) 50%, var(--vscode-sideBarSectionHeader-background) 75%);
        background-size: 200px 100%;
        animation: shimmer 1.5s infinite linear;
      }
    </style>

    <div class="skeleton-container" style="padding: 10px 0;">
      <div class="skeleton-header" style="font-size: 12px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; color: var(--vscode-descriptionForeground);">Processing QAMate Engine (${pageName})...</div>
      
      <!-- Shimmering skeleton loading bars -->
      <div class="shimmer-line" style="width: 75%; height: 14px; margin-bottom: 12px;"></div>
      <div class="shimmer-line" style="width: 90%;"></div>
      <div class="shimmer-line" style="width: 85%;"></div>
      <div class="shimmer-line" style="width: 65%; margin-bottom: 16px;"></div>

      <div class="skeleton-logs" style="border-top: 1px dotted var(--vscode-panel-border); padding-top: 8px;">
        ${stepsHtml}
      </div>
      <div class="skeleton-pulse" style="height: 2px; background: var(--vscode-button-background); width: 100%; margin-top: 12px; opacity: 0.8;"></div>
    </div>
  `;
}

import { Theme } from '../Theme.js';
import { icons } from '../icons.js';

export function renderHelpPage(workspaceRoot: string): string {
  const rootPrefix = workspaceRoot
    ? `file:///${workspaceRoot.replace(/\\/g, '/')}`
    : 'file:///d:/QAMate';

  const docLinks = [
    { label: 'Roadmap Spec', path: `${rootPrefix}/docs/ROADMAP.md` },
    { label: 'Product Vision', path: `${rootPrefix}/docs/PRODUCT_VISION.md` },
    { label: 'UX Principles', path: `${rootPrefix}/docs/UX_PRINCIPLES.md` },
    { label: 'Engineering Rules', path: `${rootPrefix}/ENGINEERING_RULES.md` },
    { label: 'Sprint Board', path: `${rootPrefix}/SPRINT.md` },
  ];

  const docLinksHtml = docLinks
    .map((doc) => {
      return `
      <div style="margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
        ● <a href="${doc.path}" style="color: var(--vscode-textLink-foreground); text-decoration: none; font-size: 11px;">
          ${doc.label}
        </a>
      </div>
    `;
    })
    .join('');

  return `
    <style>
      details summary::-webkit-details-marker {
        display: none;
      }
      details summary {
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        color: var(--vscode-descriptionForeground);
        user-select: none;
        padding: 2px 0;
      }
      .summary-chevron {
        display: inline-flex;
        align-items: center;
        transition: transform 0.1s ease;
        opacity: 0.8;
      }
      details[open] .summary-chevron {
        transform: rotate(90deg);
      }
    </style>

    <div class="page-container" style="animation: fade-in 0.18s ease-out; font-size: 11px; line-height: 1.5;">
      <h2 style="font-size: 15px; font-weight: 600; margin-bottom: 12px; color: var(--vscode-foreground); display: flex; align-items: center; gap: 4px;">
        ${icons.help} Help & Resources
      </h2>

      <!-- Quick Start Guide -->
      <div class="card" style="margin-bottom: ${Theme.spacing.md};">
        <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">
          🚀 Quick Start
        </div>
        <p style="margin: 0 0 6px 0; font-size: 11px;">
          To scan a requirement, paste raw text in the Home page intake area, or click the Active Editor card to scan your currently opened editor document.
        </p>
        <p style="margin: 0; font-size: 11px;">
          Complete the outcome stages from left to right: Heuristics scorecard check, clarification review, test scoping, BDD suite generation, and board sync.
        </p>
      </div>

      <!-- Keyboard Shortcuts -->
      <div class="card" style="margin-bottom: ${Theme.spacing.md};">
        <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">
          ⌨️ Keyboard Shortcuts
        </div>
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 6px; font-size: 10px;">
          <span>Analyze Active Document:</span>
          <strong><code>Ctrl+Alt+A</code></strong>
          <span>Approve Active Step:</span>
          <strong><code>Ctrl+Alt+C</code></strong>
          <span>Reset Session (Return Home):</span>
          <strong><code>Ctrl+Alt+N</code></strong>
        </div>
      </div>

      <!-- Project Documentation -->
      <div class="card" style="margin-bottom: ${Theme.spacing.md};">
        <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">
          📖 Project Documentation
        </div>
        <div style="margin-top: 6px;">
          ${docLinksHtml}
        </div>
      </div>

      <!-- GitHub & Source Repository -->
      <div class="card" style="margin-bottom: ${Theme.spacing.md};">
        <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">
          🌐 GitHub Repository
        </div>
        <p style="margin: 0 0 6px 0; font-size: 11px;">
          Access the source code, review pull requests, or collaborate on features:
        </p>
        <a href="https://github.com/sodharaj369/QAMate" style="color: var(--vscode-textLink-foreground); text-decoration: none; font-weight: 600; font-size: 11px;">
          ➔ github.com/sodharaj369/QAMate
        </a>
      </div>

      <!-- Collapsible Release Notes & Bug Reports -->
      <details class="card" style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border);">
        <summary>
          <span>Release Notes</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 8px; font-size: 10px; line-height: 1.4;">
          <strong>v1.0.0 (Product Design Freeze)</strong><br/>
          - Outcomes-based progressive QA workflow.<br/>
          - Redesigned collapsible tab layouts.<br/>
          - Connections setup wizards.<br/>
          - Interactive BDD grid results workbench.
        </div>
      </details>

      <details class="card" style="margin-bottom: 8px; border: 1px solid var(--vscode-panel-border);">
        <summary>
          <span>Report Bug</span>
          <span class="summary-chevron">${icons.chevronRight}</span>
        </summary>
        <div style="margin-top: 8px; font-size: 10px; line-height: 1.4;">
          Encountered a bug or have visual design feedback? Let us know:
          <button class="btn-secondary" onclick="postMessage({command: 'reportIssue'})" style="font-size: 10px; padding: 4px; margin-top: 6px;">Open Issues Board</button>
        </div>
      </details>
    </div>
  `;
}

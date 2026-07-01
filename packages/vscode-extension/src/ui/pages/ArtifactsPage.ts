import { strings } from '../strings.js';
import { Theme } from '../Theme.js';
import { CoverageViewModel } from '../viewmodels/CoverageViewModel.js';
import { ReviewViewModel } from '../viewmodels/ReviewViewModel.js';

export function renderArtifactsPage(
  artifacts: any[],
  devModeEnabled: boolean,
  rawData: any,
): string {
  const devPanel = devModeEnabled
    ? `
    <div class="dev-mode-panel" style="margin-top: ${Theme.spacing.md};">
      <div class="dev-mode-header">Developer Diagnostic logs</div>
      <pre><code>${JSON.stringify(rawData, null, 2)}</code></pre>
    </div>
  `
    : '';

  // Extract Strategy metadata
  const strategy = rawData?.generatedStrategy || {};
  const riskLabel = strategy?.riskLevel || 'MEDIUM';
  const businessImpact = strategy?.businessImpact || 'MEDIUM';
  const objectives = strategy?.objectives || [];
  const primaryFocus = strategy?.primaryFocus || [];

  const objectivesHtml =
    objectives.length > 0
      ? objectives
          .map((o: any) => `<li style="margin-bottom: 4px;">${o.description || o}</li>`)
          .join('')
      : '<li>No objectives defined.</li>';

  const primaryFocusHtml =
    primaryFocus.length > 0
      ? primaryFocus
          .map(
            (f: string) =>
              `<span style="display: inline-block; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-size: 9px; padding: 2px 6px; border-radius: 2px; margin-right: 4px; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">${f}</span>`,
          )
          .join('')
      : '<span class="empty-text">None</span>';

  // Render editable cases list
  const casesHtml = artifacts
    .map((art: any, idx: number) => {
      return `
      <div class="card artifact-card" id="art-card-${idx}" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px; background: var(--vscode-sideBarSectionHeader-background);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 11px; color: var(--vscode-button-background); text-transform: uppercase;">
            📄 ${art.type || `Artifact ${idx + 1}`}
          </span>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary" id="btn-edit-${idx}" onclick="toggleEditMode(${idx})" style="font-size: 9px; padding: 1px 6px;">Edit</button>
            <button class="btn-primary" id="btn-save-${idx}" onclick="saveArtifactContent(${idx}, '${art.id}')" style="font-size: 9px; padding: 1px 6px; display: none;">Save</button>
          </div>
        </div>

        <!-- Render read mode preview -->
        <pre id="pre-view-${idx}" style="margin: 0; padding: 6px; font-size: 11px; line-height: 1.4; background: rgba(0,0,0,0.15); border-radius: 2px; overflow-x: auto; white-space: pre-wrap; font-family: var(--vscode-editor-font-family, monospace); color: var(--vscode-foreground);"><code id="code-content-${idx}">${art.content}</code></pre>

        <!-- Render edit mode editor -->
        <textarea id="editor-field-${idx}" style="display: none; width: 100%; height: 180px; font-size: 11px; font-family: var(--vscode-editor-font-family, monospace); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 6px; resize: vertical; box-sizing: border-box;">${art.content}</textarea>
      </div>
    `;
    })
    .join('');

  // Coverage Tab HTML
  let coverageTabHtml = '<p class="empty-text">No coverage metrics generated yet.</p>';
  if (rawData) {
    const covViewModel = new CoverageViewModel(rawData);
    const traceLogsHtml = covViewModel.logs
      .map(
        (log: string) =>
          `<p style="margin: 0 0 4px 0; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 2px;">${log}</p>`,
      )
      .join('');
    coverageTabHtml = `
      <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
        <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">Requirement Traceability:</div>
        <div style="font-size: 14px; font-weight: 700; color: var(--vscode-testing-iconPassedColor, #89D185);">${covViewModel.ratio}% Rules Covered</div>
      </div>
      <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
        <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">Trace Verification Logs:</div>
        <div style="font-family: monospace; font-size: 10px; line-height: 1.4; max-height: 150px; overflow-y: auto; background: rgba(0,0,0,0.15); padding: 6px; border-radius: 2px;">
          ${traceLogsHtml || '<p class="empty-text">No trace logs recorded.</p>'}
        </div>
      </div>
    `;
  }

  // Review Tab HTML
  let reviewTabHtml = '<p class="empty-text">No safety review compiled.</p>';
  if (rawData) {
    const revViewModel = new ReviewViewModel(rawData);
    const suggestionsHtml = revViewModel.suggestions
      .map(
        (s: string) =>
          `<li style="margin-bottom: 4px; color: var(--vscode-editorWarning-foreground, #CCA700);">${s}</li>`,
      )
      .join('');
    const statusColor =
      revViewModel.status.toLowerCase() === 'approved'
        ? 'var(--vscode-testing-iconPassedColor, #89D185)'
        : 'var(--vscode-editorWarning-foreground, #CCA700)';

    reviewTabHtml = `
      <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 3px solid ${statusColor};">
        <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">QA Gate Verification:</div>
        <div style="font-size: 13px; font-weight: 700; color: ${statusColor}; margin-bottom: 4px;">
          Status: ${revViewModel.status.toUpperCase()} (${revViewModel.score}% Score)
        </div>
        <div style="font-size: 11px; margin-top: 8px;">
          ${suggestionsHtml ? `<ul style="margin: 0; padding-left: 14px;">${suggestionsHtml}</ul>` : '<p style="color: var(--vscode-testing-iconPassedColor, #89D185); margin:0;">✓ No logic flaws or duplicate warnings detected.</p>'}
        </div>
      </div>
    `;
  }

  return `
    <div class="page-container">
      <div class="page-title" style="font-weight: 600; font-size: 13px; margin-bottom: 10px;">
        🔍 Results Workspace
      </div>

      <!-- Tab Buttons (4 items: Strategy, Test Cases, Coverage, Review) -->
      <div style="display: flex; border-bottom: 1px solid var(--vscode-panel-border); margin-bottom: ${Theme.spacing.md}; overflow-x: auto; gap: 4px;">
        <button class="tab-btn active" id="tab-strategy" onclick="switchWorkspaceTab('strategy')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 10px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid var(--vscode-button-background); font-weight: 600; text-transform: uppercase;">Strategy</button>
        <button class="tab-btn" id="tab-cases" onclick="switchWorkspaceTab('cases')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 10px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7; text-transform: uppercase; white-space: nowrap;">Test Cases</button>
        <button class="tab-btn" id="tab-coverage" onclick="switchWorkspaceTab('coverage')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 10px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7; text-transform: uppercase;">Coverage</button>
        <button class="tab-btn" id="tab-review" onclick="switchWorkspaceTab('review')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 10px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7; text-transform: uppercase;">Review</button>
      </div>

      <!-- Tab Content 1: Strategy -->
      <div class="tab-content" id="content-strategy" style="display: block;">
        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
          <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">Overall Risk Rating:</div>
          <div style="font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <span>Risk Level: ${riskLabel}</span>
            <span style="font-size: 10px; font-weight: 500; opacity: 0.8;">| Impact: ${businessImpact}</span>
          </div>
        </div>

        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
          <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">Strategic Focus Areas:</div>
          <div>${primaryFocusHtml}</div>
        </div>

        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
          <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">Objectives Matrix Checklist:</div>
          <ul style="margin: 0; padding-left: 14px; font-size: 11px; line-height: 1.4;">
            ${objectivesHtml}
          </ul>
        </div>
      </div>

      <!-- Tab Content 2: Cases & Editor -->
      <div class="tab-content" id="content-cases" style="display: none;">
        <!-- Search bar filter -->
        <input type="text" id="cases-search" onkeyup="filterWorkspaceCases()" placeholder="Search test cases content..." style="width: 100%; padding: 6px; font-size: 11px; margin-bottom: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; box-sizing: border-box;" />

        <div id="workspace-cases-list">
          ${casesHtml || `<p class="empty-text">${strings.artifacts.noArtifacts}</p>`}
        </div>
      </div>

      <!-- Tab Content 3: Coverage -->
      <div class="tab-content" id="content-coverage" style="display: none;">
        ${coverageTabHtml}
      </div>

      <!-- Tab Content 4: Review Logs -->
      <div class="tab-content" id="content-review" style="display: none;">
        ${reviewTabHtml}
      </div>

      <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: ${Theme.spacing.md};">Proceed to Deliver</button>

      ${devPanel}
    </div>

    <script>
      function switchWorkspaceTab(tabId) {
        var tabs = ['strategy', 'cases', 'coverage', 'review'];
        tabs.forEach(function(t) {
          var btn = document.getElementById('tab-' + t);
          var content = document.getElementById('content-' + t);
          if (t === tabId) {
            btn.classList.add('active');
            btn.style.borderBottom = '2px solid var(--vscode-button-background)';
            btn.style.opacity = '1';
            content.style.display = 'block';
          } else {
            btn.classList.remove('active');
            btn.style.borderBottom = '2px solid transparent';
            btn.style.opacity = '0.7';
            content.style.display = 'none';
          }
        });
      }

      function filterWorkspaceCases() {
        var query = document.getElementById('cases-search').value.toLowerCase();
        var cards = document.getElementsByClassName('artifact-card');
        for (var i = 0; i < cards.length; i++) {
          var text = cards[i].innerText.toLowerCase();
          cards[i].style.display = text.indexOf(query) > -1 ? 'block' : 'none';
        }
      }

      function toggleEditMode(idx) {
        var pre = document.getElementById('pre-view-' + idx);
        var textarea = document.getElementById('editor-field-' + idx);
        var editBtn = document.getElementById('btn-edit-' + idx);
        var saveBtn = document.getElementById('btn-save-' + idx);

        if (textarea.style.display === 'none') {
          pre.style.display = 'none';
          textarea.style.display = 'block';
          editBtn.innerText = 'Cancel';
          saveBtn.style.display = 'inline-block';
        } else {
          pre.style.display = 'block';
          textarea.style.display = 'none';
          editBtn.innerText = 'Edit';
          saveBtn.style.display = 'none';
          textarea.value = document.getElementById('code-content-' + idx).innerText;
        }
      }

      function saveArtifactContent(idx, artifactId) {
        var textarea = document.getElementById('editor-field-' + idx);
        var pre = document.getElementById('pre-view-' + idx);
        var code = document.getElementById('code-content-' + idx);
        var editBtn = document.getElementById('btn-edit-' + idx);
        var saveBtn = document.getElementById('btn-save-' + idx);

        var newContent = textarea.value;
        code.innerText = newContent;

        pre.style.display = 'block';
        textarea.style.display = 'none';
        editBtn.innerText = 'Edit';
        saveBtn.style.display = 'none';

        postMessage({
          command: 'updateArtifact',
          artifactId: artifactId,
          content: newContent
        });
      }
    </script>
  `;
}

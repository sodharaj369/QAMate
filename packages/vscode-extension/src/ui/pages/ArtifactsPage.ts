import { strings } from '../strings.js';
import { Theme } from '../Theme.js';

export function renderArtifactsPage(
  artifacts: any[],
  devModeEnabled: boolean,
  rawData: any
): string {
  const devPanel = devModeEnabled ? `
    <div class="dev-mode-panel" style="margin-top: ${Theme.spacing.md};">
      <div class="dev-mode-header">Developer Diagnostic logs</div>
      <pre><code>${JSON.stringify(rawData, null, 2)}</code></pre>
    </div>
  ` : '';

  // Extract Strategy metadata
  const strategy = rawData?.generatedStrategy || {};
  const riskLabel = strategy?.riskLevel || 'MEDIUM';
  const businessImpact = strategy?.businessImpact || 'MEDIUM';
  const objectives = strategy?.objectives || [];
  const primaryFocus = strategy?.primaryFocus || [];

  const objectivesHtml = objectives.length > 0
    ? objectives.map((o: any) => `<li style="margin-bottom: 4px;">${o.description || o}</li>`).join('')
    : '<li>No objectives defined.</li>';

  const primaryFocusHtml = primaryFocus.length > 0
    ? primaryFocus.map((f: string) => `<span style="display: inline-block; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-size: 9px; padding: 2px 6px; border-radius: 2px; margin-right: 4px; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">${f}</span>`).join('')
    : '<span class="empty-text">None</span>';

  // Render editable cases list
  const casesHtml = artifacts.map((art: any, idx: number) => {
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
  }).join('');

  return `
    <div class="page-container">
      <div class="page-title" style="font-weight: 600; font-size: 13px; margin-bottom: 10px;">
        ${strings.artifacts.title}
      </div>

      <!-- Tab Buttons -->
      <div style="display: flex; border-bottom: 1px solid var(--vscode-panel-border); margin-bottom: ${Theme.spacing.md};">
        <button class="tab-btn active" id="tab-strategy" onclick="switchWorkspaceTab('strategy')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 11px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid var(--vscode-button-background); font-weight: 600;">Strategy</button>
        <button class="tab-btn" id="tab-cases" onclick="switchWorkspaceTab('cases')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 11px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7;">Cases</button>
        <button class="tab-btn" id="tab-review" onclick="switchWorkspaceTab('review')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 11px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7;">Review</button>
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

      <!-- Tab Content 3: Review Logs & Exports -->
      <div class="tab-content" id="content-review" style="display: none;">
        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 3px solid var(--vscode-testing-iconPassedColor, #89D185);">
          <div style="font-weight: 600; font-size: 10px; color: var(--vscode-testing-iconPassedColor, #89D185); text-transform: uppercase; margin-bottom: 4px;">✓ QA Artifact Audit Status</div>
          <div style="font-size: 11px; line-height: 1.4;">
            Checklists compiled and structured cases loaded correctly in workspace memory. Ready for Gherkin review audit.
          </div>
        </div>

        <!-- Export & Integrations Card -->
        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px; background: var(--vscode-sideBarSectionHeader-background);">
          <div style="font-weight: 600; font-size: 10px; color: var(--vscode-button-background); text-transform: uppercase; margin-bottom: 6px;">🌐 Export approved deliverables</div>
          
          <div style="margin-bottom: 8px;">
            <label style="font-size: 10px; display: block; margin-bottom: 2px; color: var(--vscode-foreground);">Export format:</label>
            <select id="export-format-selector" style="width: 100%; font-size: 11px; padding: 2px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;">
              <option value="md">Markdown (.md)</option>
              <option value="csv">CSV Spreadsheet (.csv)</option>
              <option value="xls">Excel Spreadsheet (.xls)</option>
              <option value="html">HTML Report (.html)</option>
              <option value="json">JSON Configuration (.json)</option>
            </select>
          </div>
          <button class="btn-secondary" onclick="triggerDownload()" style="width: 100%; font-size: 11px; padding: 4px 0; margin-bottom: 10px;">Download deliverable file</button>

          <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); text-transform: uppercase; margin-bottom: 6px;">Publish to tracking boards</div>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary" onclick="postMessage({ command: 'syncToADO' })" style="flex: 1; font-size: 10px; padding: 4px 0;">Sync ADO</button>
            <button class="btn-secondary" onclick="postMessage({ command: 'syncToJira' })" style="flex: 1; font-size: 10px; padding: 4px 0;">Sync Jira</button>
          </div>
        </div>
      </div>

      <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: ${Theme.spacing.md};">Continue to Review</button>

      ${devPanel}
    </div>

    <script>
      function switchWorkspaceTab(tabId) {
        var tabs = ['strategy', 'cases', 'review'];
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
          // Revert changes
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

        // Post message to update artifact in backend storage
        postMessage({
          command: 'updateArtifact',
          artifactId: artifactId,
          content: newContent
        });
      }

      function triggerDownload() {
        var format = document.getElementById('export-format-selector').value;
        postMessage({
          command: 'downloadReport',
          format: format
        });
      }
    </script>
  `;
}

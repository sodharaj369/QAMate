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

  // Retrieve test cases from conversation context
  const testCasesList = rawData?.testCases || [];
  const testCasesJsonString = JSON.stringify(testCasesList);

  // QA Health Indicators
  const coverageRatio = rawData ? new CoverageViewModel(rawData).ratio : 0;
  const healthPercent = Math.round(coverageRatio * 0.95); // Adjusted QA Health index

  return `
    <div class="page-container">
      <div class="page-title" style="font-weight: 600; font-size: 13px; margin-bottom: 10px;">
        🔍 Living Results Workspace
      </div>

      <!-- QA Health Header Card Dashboard -->
      <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 12px; margin-bottom: 12px; border-radius: 6px; background: var(--vscode-sideBarSectionHeader-background);">
        <div style="font-weight: 700; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">QA Health Dashboard:</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;">
          <div style="border-right: 1px solid var(--vscode-panel-border);">
            <div style="font-size: 16px; font-weight: 800; color: var(--vscode-testing-iconPassedColor, #89D185);">${healthPercent}%</div>
            <div style="font-size: 8px; opacity: 0.8; text-transform: uppercase;">Health</div>
          </div>
          <div style="border-right: 1px solid var(--vscode-panel-border);">
            <div style="font-size: 16px; font-weight: 800; color: var(--vscode-button-background);">${testCasesList.length}</div>
            <div style="font-size: 8px; opacity: 0.8; text-transform: uppercase;">Cases</div>
          </div>
          <div style="border-right: 1px solid var(--vscode-panel-border);">
            <div style="font-size: 16px; font-weight: 800; color: var(--vscode-testing-iconPassedColor, #89D185);">${coverageRatio}%</div>
            <div style="font-size: 8px; opacity: 0.8; text-transform: uppercase;">Covered</div>
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: var(--vscode-editorWarning-foreground, #CCA700);">2</div>
            <div style="font-size: 8px; opacity: 0.8; text-transform: uppercase;">Warnings</div>
          </div>
        </div>
      </div>

      <!-- Tab Buttons Grid -->
      <div style="display: flex; border-bottom: 1px solid var(--vscode-panel-border); margin-bottom: ${Theme.spacing.md}; overflow-x: auto; gap: 4px;">
        <button class="tab-btn active" id="tab-overview" onclick="switchWorkspaceTab('overview')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 9px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid var(--vscode-button-background); font-weight: 600; text-transform: uppercase; white-space: nowrap;">Overview</button>
        <button class="tab-btn" id="tab-cases" onclick="switchWorkspaceTab('cases')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 9px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7; text-transform: uppercase; white-space: nowrap;">Test Cases</button>
        <button class="tab-btn" id="tab-risks" onclick="switchWorkspaceTab('risks')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 9px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7; text-transform: uppercase; white-space: nowrap;">Risks</button>
        <button class="tab-btn" id="tab-coverage" onclick="switchWorkspaceTab('coverage')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 9px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7; text-transform: uppercase; white-space: nowrap;">Coverage</button>
        <button class="tab-btn" id="tab-warnings" onclick="switchWorkspaceTab('warnings')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 9px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7; text-transform: uppercase; white-space: nowrap;">Warnings</button>
        <button class="tab-btn" id="tab-review" onclick="switchWorkspaceTab('review')" style="flex: 1; border: none; background: none; color: var(--vscode-foreground); font-size: 9px; padding: 6px 0; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; opacity: 0.7; text-transform: uppercase; white-space: nowrap;">Review</button>
      </div>

      <!-- Tab Content 1: Overview -->
      <div class="tab-content" id="content-overview" style="display: block;">
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

      <!-- Tab Content 2: Test Cases (Structured Spreadsheet Table Grid) -->
      <div class="tab-content" id="content-cases" style="display: none;">
        <!-- Filters Toolbar -->
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <input type="text" id="cases-search" onkeyup="filterCasesGrid()" placeholder="Search cases, steps..." style="flex: 1; padding: 4px 6px; font-size: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;" />
          
          <select id="priority-filter" onchange="filterCasesGrid()" style="padding: 4px; font-size: 10px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border);">
            <option value="">All Priorities</option>
            <option value="P0">P0 Only</option>
            <option value="P1">P1 Only</option>
            <option value="P2">P2 Only</option>
            <option value="P3">P3 Only</option>
          </select>

          <button class="btn-secondary" onclick="toggleColumnChooser()" style="font-size: 9px; padding: 2px 6px;">Columns</button>
        </div>

        <!-- Column Chooser checklist drawer -->
        <div id="column-chooser" style="display: none; background: rgba(0,0,0,0.15); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; margin-bottom: 8px; font-size: 10px;">
          <div style="font-weight: 700; margin-bottom: 4px;">Visible Columns:</div>
          <label style="margin-right: 10px;"><input type="checkbox" checked onchange="toggleGridColumn('col-id', this.checked)"> ID</label>
          <label style="margin-right: 10px;"><input type="checkbox" checked onchange="toggleGridColumn('col-priority', this.checked)"> Priority</label>
          <label style="margin-right: 10px;"><input type="checkbox" checked onchange="toggleGridColumn('col-title', this.checked)"> Title</label>
          <label style="margin-right: 10px;"><input type="checkbox" checked onchange="toggleGridColumn('col-preconditions', this.checked)"> Preconditions</label>
          <label style="margin-right: 10px;"><input type="checkbox" checked onchange="toggleGridColumn('col-steps', this.checked)"> Actions / Steps</label>
          <label style="margin-right: 10px;"><input type="checkbox" checked onchange="toggleGridColumn('col-tags', this.checked)"> Tags</label>
        </div>

        <!-- Bulk Actions menu -->
        <div style="display: flex; gap: 4px; margin-bottom: 8px; align-items: center; background: rgba(0,0,0,0.05); padding: 4px; border-radius: 4px;">
          <span style="font-size: 9px; font-weight: 600; margin-right: 4px;">Actions:</span>
          <button class="btn-secondary" onclick="bulkSetPriority('P0')" style="font-size: 8px; padding: 1px 4px;">Set P0</button>
          <button class="btn-secondary" onclick="bulkSetPriority('P1')" style="font-size: 8px; padding: 1px 4px;">Set P1</button>
          <button class="btn-secondary" onclick="bulkSetPriority('P2')" style="font-size: 8px; padding: 1px 4px;">Set P2</button>
          <button class="btn-secondary" onclick="bulkDelete()" style="font-size: 8px; padding: 1px 4px; background: rgba(200,50,50,0.2);">Delete Selected</button>
          
          <div style="margin-left: auto; display: flex; gap: 4px;">
            <button class="btn-secondary" id="btn-undo" onclick="undo()" style="font-size: 8px; padding: 2px 6px;">Undo (Ctrl+Z)</button>
            <button class="btn-secondary" id="btn-redo" onclick="redo()" style="font-size: 8px; padding: 2px 6px;">Redo (Ctrl+Y)</button>
          </div>
        </div>

        <!-- Spreadsheet Grid Container -->
        <div style="overflow-x: auto; max-height: 400px; border: 1px solid var(--vscode-panel-border); border-radius: 4px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;" id="test-cases-table">
            <thead>
              <tr style="background: var(--vscode-sideBarSectionHeader-background); border-bottom: 1.5px solid var(--vscode-panel-border);">
                <th style="padding: 6px; width: 25px;"><input type="checkbox" onchange="toggleSelectAll(this.checked)" /></th>
                <th class="col-id" style="padding: 6px; text-align: left;">ID</th>
                <th class="col-priority" style="padding: 6px; text-align: left;">Priority</th>
                <th class="col-title" style="padding: 6px; text-align: left;">Title</th>
                <th class="col-preconditions" style="padding: 6px; text-align: left;">Preconditions</th>
                <th class="col-steps" style="padding: 6px; text-align: left;">Steps & Expected Outcomes</th>
                <th class="col-tags" style="padding: 6px; text-align: left;">Tags</th>
                <th style="padding: 6px; text-align: center; width: 40px;">Actions</th>
              </tr>
            </thead>
            <tbody id="test-cases-rows">
              <!-- Rendered dynamically in Webview JS context -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Content 3: Risks -->
      <div class="tab-content" id="content-risks" style="display: none;">
        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
          <div style="font-weight: 700; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 6px; text-transform: uppercase;">Assessed QA Risk Matrix:</div>
          <ul style="margin: 0; padding-left: 14px; font-size: 11px; line-height: 1.4;">
            <li>Security access boundaries require public lockdown restrictions validation rules.</li>
            <li>SLA performance latency metrics must respond under 200ms threshold under peak load.</li>
            <li>SAS auth parameter expiry logic vulnerabilities checklist required.</li>
          </ul>
        </div>
      </div>

      <!-- Tab Content 4: Coverage -->
      <div class="tab-content" id="content-coverage" style="display: none;">
        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
          <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">Requirement Traceability:</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--vscode-testing-iconPassedColor, #89D185);">${coverageRatio}% Rules Covered</div>
        </div>
        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
          <div style="font-weight: 600; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; text-transform: uppercase;">Trace Verification Logs:</div>
          <div style="font-family: monospace; font-size: 10px; line-height: 1.4; max-height: 150px; overflow-y: auto; background: rgba(0,0,0,0.15); padding: 6px; border-radius: 2px;">
            ${rawData ? new CoverageViewModel(rawData).logs.map((log: string) => `<p style="margin: 0 0 4px 0; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 2px;">${log}</p>`).join('') : ''}
          </div>
        </div>
      </div>

      <!-- Tab Content 5: Warnings Drawer -->
      <div class="tab-content" id="content-warnings" style="display: none;">
        <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 3px solid var(--vscode-editorWarning-foreground, #CCA700);">
          <div style="font-weight: 700; font-size: 10px; color: var(--vscode-editorWarning-foreground, #CCA700); margin-bottom: 4px; text-transform: uppercase;">Warnings Log:</div>
          <ul style="margin: 0; padding-left: 14px; font-size: 11px; line-height: 1.5;">
            <li><strong>Low Token Budget Alert</strong>: Current session token consumption is near the 85% warning threshold.</li>
            <li><strong>Missing Negative Pathways</strong>: Authentication denial logic requires additional manual exceptions validation.</li>
          </ul>
        </div>
      </div>

      <!-- Tab Content 6: Review & Final Gate -->
      <div class="tab-content" id="content-review" style="display: none;">
        ${rawData ? (() => {
          const revViewModel = new ReviewViewModel(rawData);
          const suggestionsHtml = revViewModel.suggestions.map((s: string) => `<li style="margin-bottom: 4px; color: var(--vscode-editorWarning-foreground, #CCA700);">${s}</li>`).join('');
          const statusColor = revViewModel.status.toLowerCase() === 'approved' ? 'var(--vscode-testing-iconPassedColor, #89D185)' : 'var(--vscode-editorWarning-foreground, #CCA700)';
          return `
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
        })() : ''}
      </div>

      <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: ${Theme.spacing.md};">Proceed to Deliver</button>

      ${devPanel}
    </div>

    <!-- Client-side spreadsheet renderer script -->
    <script>
      // Load initial test cases list from extension
      var testCases = ${testCasesJsonString} || [];
      var historyStack = [];
      var redoStack = [];
      var selectedIds = new Set();

      function switchWorkspaceTab(tabId) {
        var tabs = ['overview', 'cases', 'risks', 'coverage', 'warnings', 'review'];
        tabs.forEach(function(t) {
          var btn = document.getElementById('tab-' + t);
          var content = document.getElementById('content-' + t);
          if (t === tabId) {
            btn.classList.add('active');
            btn.style.borderBottom = '2px solid var(--vscode-button-background)';
            btn.style.opacity = '1';
            content.style.display = 'block';
            if (t === 'cases') {
              renderCasesRows();
            }
          } else {
            btn.classList.remove('active');
            btn.style.borderBottom = '2px solid transparent';
            btn.style.opacity = '0.7';
            content.style.display = 'none';
          }
        });
      }

      function pushToHistory() {
        historyStack.push(JSON.stringify(testCases));
        redoStack = []; // Reset redo
      }

      function undo() {
        if (historyStack.length > 0) {
          redoStack.push(JSON.stringify(testCases));
          testCases = JSON.parse(historyStack.pop());
          renderCasesRows();
          saveChangesBackToExtension();
        }
      }

      function redo() {
        if (redoStack.length > 0) {
          historyStack.push(JSON.stringify(testCases));
          testCases = JSON.parse(redoStack.pop());
          renderCasesRows();
          saveChangesBackToExtension();
        }
      }

      // Keystroke listeners for Ctrl+Z / Ctrl+Y
      window.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'z') {
          undo();
        } else if (event.ctrlKey && event.key === 'y') {
          redo();
        }
      });

      function toggleColumnChooser() {
        var chooser = document.getElementById('column-chooser');
        chooser.style.display = chooser.style.display === 'none' ? 'block' : 'none';
      }

      function toggleGridColumn(colClass, isChecked) {
        var elements = document.getElementsByClassName(colClass);
        for (var i = 0; i < elements.length; i++) {
          elements[i].style.display = isChecked ? '' : 'none';
        }
      }

      function toggleSelectAll(isChecked) {
        selectedIds.clear();
        if (isChecked) {
          testCases.forEach(function(c) { selectedIds.add(c.id); });
        }
        renderCasesRows();
      }

      function toggleCaseSelection(caseId, isChecked) {
        if (isChecked) {
          selectedIds.add(caseId);
        } else {
          selectedIds.delete(caseId);
        }
      }

      function bulkSetPriority(prio) {
        if (selectedIds.size === 0) return;
        pushToHistory();
        testCases.forEach(function(c) {
          if (selectedIds.has(c.id)) {
            c.priority = prio;
          }
        });
        renderCasesRows();
        saveChangesBackToExtension();
      }

      function bulkDelete() {
        if (selectedIds.size === 0) return;
        pushToHistory();
        testCases = testCases.filter(function(c) {
          return !selectedIds.has(c.id);
        });
        selectedIds.clear();
        renderCasesRows();
        saveChangesBackToExtension();
      }

      function deleteCase(idx) {
        pushToHistory();
        testCases.splice(idx, 1);
        renderCasesRows();
        saveChangesBackToExtension();
      }

      function duplicateCase(idx) {
        pushToHistory();
        var original = testCases[idx];
        var clone = JSON.parse(JSON.stringify(original));
        clone.id = clone.id + '-CLONE-' + Math.floor(Math.random() * 100);
        testCases.splice(idx + 1, 0, clone);
        renderCasesRows();
        saveChangesBackToExtension();
      }

      function saveChangesBackToExtension() {
        postMessage({
          command: 'updateTestCases',
          testCases: testCases
        });
      }

      function makeCellEditable(element, idx, fieldName, subIdx) {
        var currentText = element.innerText;
        var textarea = document.createElement('textarea');
        textarea.value = currentText;
        textarea.style.width = '100%';
        textarea.style.height = '60px';
        textarea.style.fontSize = '10px';
        textarea.style.fontFamily = 'monospace';
        
        textarea.onblur = function() {
          var newValue = textarea.value;
          element.innerHTML = '';
          element.innerText = newValue;
          
          if (newValue !== currentText) {
            pushToHistory();
            if (fieldName === 'preconditions') {
              testCases[idx].preconditions = newValue.split('\\n').filter(Boolean);
            } else if (fieldName === 'steps') {
              testCases[idx].steps[subIdx].action = newValue;
            } else if (fieldName === 'expected') {
              testCases[idx].steps[subIdx].expectedOutcome = newValue;
            } else {
              testCases[idx][fieldName] = newValue;
            }
            saveChangesBackToExtension();
          }
        };

        element.innerHTML = '';
        element.appendChild(textarea);
        textarea.focus();
      }

      function renderCasesRows() {
        var tbody = document.getElementById('test-cases-rows');
        tbody.innerHTML = '';

        testCases.forEach(function(c, idx) {
          var isSelected = selectedIds.has(c.id);
          
          var tr = document.createElement('tr');
          tr.className = 'grid-row';
          tr.style.borderBottom = '1px solid var(--vscode-panel-border)';
          
          // Checkbox cell
          var tdCheck = document.createElement('td');
          tdCheck.style.padding = '6px';
          tdCheck.style.textAlign = 'center';
          tdCheck.innerHTML = '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onchange="toggleCaseSelection(\\'' + c.id + '\\', this.checked)" />';
          tr.appendChild(tdCheck);

          // ID cell
          var tdId = document.createElement('td');
          tdId.className = 'col-id';
          tdId.style.padding = '6px';
          tdId.style.fontWeight = '700';
          tdId.innerText = c.id;
          tr.appendChild(tdId);

          // Priority cell
          var tdPriority = document.createElement('td');
          tdPriority.className = 'col-priority';
          tdPriority.style.padding = '6px';
          var color = '#CCA700';
          if (c.priority === 'P0') color = '#F48771';
          if (c.priority === 'P2') color = '#3794FF';
          if (c.priority === 'P3') color = '#89D185';
          tdPriority.innerHTML = '<span style="background: ' + color + '; color: #1e1e1e; font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; text-transform: uppercase;">' + c.priority + '</span>';
          tdPriority.ondblclick = function() {
            pushToHistory();
            var prios = ['P0', 'P1', 'P2', 'P3'];
            var curIdx = prios.indexOf(c.priority);
            c.priority = prios[(curIdx + 1) % 4];
            renderCasesRows();
            saveChangesBackToExtension();
          };
          tr.appendChild(tdPriority);

          // Title cell
          var tdTitle = document.createElement('td');
          tdTitle.className = 'col-title';
          tdTitle.style.padding = '6px';
          tdTitle.innerText = c.title;
          tdTitle.ondblclick = function() { makeCellEditable(tdTitle, idx, 'title'); };
          tr.appendChild(tdTitle);

          // Preconditions cell
          var tdPre = document.createElement('td');
          tdPre.className = 'col-preconditions';
          tdPre.style.padding = '6px';
          tdPre.innerText = (c.preconditions || []).join('\\n');
          tdPre.ondblclick = function() { makeCellEditable(tdPre, idx, 'preconditions'); };
          tr.appendChild(tdPre);

          // Steps list cell
          var tdSteps = document.createElement('td');
          tdSteps.className = 'col-steps';
          tdSteps.style.padding = '6px';
          
          var stepsDiv = document.createElement('div');
          (c.steps || []).forEach(function(s, sIdx) {
            var stepItem = document.createElement('div');
            stepItem.style.marginBottom = '4px';
            stepItem.innerHTML = '<strong>' + s.stepNumber + '.</strong> <span id="action-' + idx + '-' + sIdx + '">' + s.action + '</span><br/><span style="opacity: 0.7;" id="expected-' + idx + '-' + sIdx + '">→ ' + s.expectedOutcome + '</span>';
            
            // Wire double click on steps text specifically
            var actionSpan = stepItem.querySelector('#action-' + idx + '-' + sIdx);
            actionSpan.ondblclick = function(e) {
              e.stopPropagation();
              makeCellEditable(actionSpan, idx, 'steps', sIdx);
            };
            
            var expectedSpan = stepItem.querySelector('#expected-' + idx + '-' + sIdx);
            expectedSpan.ondblclick = function(e) {
              e.stopPropagation();
              makeCellEditable(expectedSpan, idx, 'expected', sIdx);
            };

            stepsDiv.appendChild(stepItem);
          });
          tdSteps.appendChild(stepsDiv);
          tr.appendChild(tdSteps);

          // Tags cell
          var tdTags = document.createElement('td');
          tdTags.className = 'col-tags';
          tdTags.style.padding = '6px';
          tdTags.innerHTML = (c.tags || []).map(function(t) { return '<span style="background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-size: 8px; padding: 1px 3px; border-radius: 2px; margin-right: 2px;">' + t + '</span>'; }).join('');
          tr.appendChild(tdTags);

          // Individual Actions cell
          var tdActions = document.createElement('td');
          tdActions.style.padding = '6px';
          tdActions.style.textAlign = 'center';
          tdActions.innerHTML = '<span style="cursor: pointer; color: var(--vscode-button-background); margin-right: 6px;" onclick="duplicateCase(' + idx + ')">📋</span><span style="cursor: pointer; color: var(--vscode-editorError-foreground, #F48771);" onclick="deleteCase(' + idx + ')">🗑️</span>';
          tr.appendChild(tdActions);

          tbody.appendChild(tr);
        });
      }

      function filterCasesGrid() {
        var query = document.getElementById('cases-search').value.toLowerCase();
        var prioFilter = document.getElementById('priority-filter').value;
        var rows = document.getElementsByClassName('grid-row');
        
        testCases.forEach(function(c, idx) {
          var textMatch = c.id.toLowerCase().indexOf(query) > -1 || 
                          c.title.toLowerCase().indexOf(query) > -1 || 
                          c.preconditions.join(' ').toLowerCase().indexOf(query) > -1 ||
                          c.steps.map(function(s){ return s.action + ' ' + s.expectedOutcome; }).join(' ').toLowerCase().indexOf(query) > -1;
          
          var prioMatch = !prioFilter || c.priority === prioFilter;
          
          rows[idx].style.display = (textMatch && prioMatch) ? '' : 'none';
        });
      }
    </script>
  `;
}

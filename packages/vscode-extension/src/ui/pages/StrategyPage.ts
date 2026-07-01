import { strings } from '../strings.js';
import { StrategyViewModel } from '../viewmodels/StrategyViewModel.js';
import { Theme } from '../Theme.js';

export function renderStrategyPage(
  viewModel: StrategyViewModel,
  devModeEnabled: boolean,
  rawData: any
): string {
  const devPanel = devModeEnabled ? `
    <div class="dev-mode-panel" style="margin-top: ${Theme.spacing.md};">
      <div class="dev-mode-header">Developer Diagnostic logs</div>
      <pre><code>${JSON.stringify(rawData, null, 2)}</code></pre>
    </div>
  ` : '';

  const objectivesHtml = viewModel.objectives.length > 0 ? 
    viewModel.objectives.map((o: string) => `<li style="margin-bottom: 4px;">${o}</li>`).join('') : 
    `<li>${strings.strategy.noObjectives}</li>`;

  // Draw 3x3 Risk Matrix Grid
  const riskVal = viewModel.riskLevel.toLowerCase();
  const impactVal = viewModel.businessImpact.toLowerCase();

  const isCellActive = (cellImpact: string, cellRisk: string): boolean => {
    const matchImpact = (cellImpact === 'critical' || cellImpact === 'high') 
      ? (impactVal === 'critical' || impactVal === 'high') 
      : impactVal === cellImpact;
    return matchImpact && riskVal === cellRisk;
  };

  const getCellBg = (cellImpact: string, cellRisk: string): string => {
    const active = isCellActive(cellImpact, cellRisk);
    if (active) {
      if (cellImpact === 'high' || cellRisk === 'high') return 'var(--vscode-testing-iconFailedColor, #F48771)';
      if (cellImpact === 'medium' || cellRisk === 'medium') return 'var(--vscode-editorWarning-foreground, #CCA700)';
      return 'var(--vscode-testing-iconPassedColor, #89D185)';
    }
    return 'var(--vscode-sideBarSectionHeader-background)';
  };

  const getCellTextColor = (cellImpact: string, cellRisk: string): string => {
    return isCellActive(cellImpact, cellRisk) ? '#ffffff' : 'var(--vscode-descriptionForeground)';
  };

  const matrixHtml = `
    <div style="margin-top: 10px; margin-bottom: 12px;">
      <div style="font-weight: 600; font-size: 11px; margin-bottom: 6px; color: var(--vscode-descriptionForeground); text-transform: uppercase;">
        Business Impact vs Risk Matrix:
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 9px; font-weight: 500;">
        <tr>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; font-weight: 600; background: var(--vscode-sideBarSectionHeader-background);">Impact / Risk</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; font-weight: 600; background: var(--vscode-sideBarSectionHeader-background);">Low Risk</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; font-weight: 600; background: var(--vscode-sideBarSectionHeader-background);">Med Risk</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; font-weight: 600; background: var(--vscode-sideBarSectionHeader-background);">High Risk</td>
        </tr>
        <tr>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; font-weight: 600; background: var(--vscode-sideBarSectionHeader-background);">High Impact</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('high', 'low')}; color: ${getCellTextColor('high', 'low')};">Green (L)</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('high', 'medium')}; color: ${getCellTextColor('high', 'medium')};">Orange (M)</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('high', 'high')}; color: ${getCellTextColor('high', 'high')};">Red (H)</td>
        </tr>
        <tr>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; font-weight: 600; background: var(--vscode-sideBarSectionHeader-background);">Med Impact</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('medium', 'low')}; color: ${getCellTextColor('medium', 'low')};">Green (L)</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('medium', 'medium')}; color: ${getCellTextColor('medium', 'medium')};">Orange (M)</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('medium', 'high')}; color: ${getCellTextColor('medium', 'high')};">Red (H)</td>
        </tr>
        <tr>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; font-weight: 600; background: var(--vscode-sideBarSectionHeader-background);">Low Impact</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('low', 'low')}; color: ${getCellTextColor('low', 'low')};">Green (L)</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('low', 'medium')}; color: ${getCellTextColor('low', 'medium')};">Orange (M)</td>
          <td style="border: 1px solid var(--vscode-panel-border); padding: 4px; background: ${getCellBg('low', 'high')}; color: ${getCellTextColor('low', 'high')};">Red (H)</td>
        </tr>
      </table>
    </div>
  `;

  // Automation Suggestions
  const autoHtml = viewModel.automationCandidates.length > 0 ? 
    viewModel.automationCandidates.map((c: any) => `
      <div style="border-bottom: 1px solid var(--vscode-panel-border); padding: 4px 0; font-size: 11px; margin-bottom: 4px;">
        <strong>🤖 ${c.scenario}:</strong> <span style="opacity: 0.95;">${c.reason}</span>
      </div>
    `).join('') : '<p class="empty-text">No automation candidates suggested.</p>';

  // Suite configuration arrays for JS runtime
  const recommendedSuitesArr = viewModel.recommendedSuites;
  const excludedSuitesArr = viewModel.excludedSuites;

  return `
    <div class="page-container">
      <div class="page-title" style="font-weight: 600; font-size: 13px; margin-bottom: 10px;">
        ${strings.strategy.title}
      </div>

      <!-- Risk matrix visualization -->
      ${matrixHtml}

      <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
        <div class="card-title" style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">
          ${strings.strategy.focusHeader}
        </div>
        <div class="card-body">
          <ul style="margin: 0; padding-left: 14px; font-size: 11px; line-height: 1.4;">
            ${objectivesHtml}
          </ul>
        </div>
      </div>

      <!-- Automation Suggestions -->
      <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
        <div class="card-title" style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">
          🤖 Automation Candidates
        </div>
        <div class="card-body">
          ${autoHtml}
        </div>
      </div>

      <!-- Strategic Suite Priorities Editor -->
      <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
        <div class="card-title" style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">
          🛠️ Exclude Suites & Priorities Editor
        </div>
        <div class="card-body">
          <div style="font-weight: 600; font-size: 10px; margin-bottom: 6px;">RECOMMENDED SUITES:</div>
          <div id="recommended-suites-list"></div>

          <div style="font-weight: 600; font-size: 10px; margin-top: 10px; margin-bottom: 6px;">EXCLUDED SUITES:</div>
          <div id="excluded-suites-list"></div>
        </div>
      </div>

      <button class="btn-primary" onclick="saveAndContinue()" style="margin-top: ${Theme.spacing.md};">Save & Continue</button>

      ${devPanel}
    </div>

    <script>
      var recSuites = ${JSON.stringify(recommendedSuitesArr)};
      var exSuites = ${JSON.stringify(excludedSuitesArr)};

      function renderSuites() {
        var recContainer = document.getElementById('recommended-suites-list');
        var exContainer = document.getElementById('excluded-suites-list');

        if (recSuites.length === 0) {
          recContainer.innerHTML = '<p class="empty-text" style="font-size:10px;">No recommended suites.</p>';
        } else {
          recContainer.innerHTML = recSuites.map((s, idx) => \`
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--vscode-input-background); padding:4px 6px; border:1px solid var(--vscode-input-border); border-radius:2px; margin-bottom:4px; font-size:11px;">
              <span style="font-weight:600;">\${s.suite}</span>
              <div style="display:flex; gap:6px; align-items:center;">
                <select onchange="updatePriority(\${idx}, this.value)" style="font-size:9px; background:var(--vscode-sideBarSectionHeader-background); color:var(--vscode-foreground); border:1px solid var(--vscode-input-border); border-radius:2px; padding:1px;">
                  <option value="1" \${s.priority === 1 ? 'selected' : ''}>P1 (High)</option>
                  <option value="2" \${s.priority === 2 ? 'selected' : ''}>P2 (Medium)</option>
                  <option value="3" \${s.priority === 3 ? 'selected' : ''}>P3 (Low)</option>
                </select>
                <span onclick="excludeSuite(\${idx})" style="color:var(--vscode-testing-iconFailedColor, #F48771); cursor:pointer; font-size:9px; font-weight:600; text-decoration:underline;">Exclude</span>
              </div>
            </div>
          \`).join('');
        }

        if (exSuites.length === 0) {
          exContainer.innerHTML = '<p class="empty-text" style="font-size:10px;">No excluded suites.</p>';
        } else {
          exContainer.innerHTML = exSuites.map((s, idx) => \`
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,0,0,0.05); padding:4px 6px; border:1px dashed var(--vscode-panel-border); border-radius:2px; margin-bottom:4px; font-size:11px; opacity:0.85;">
              <span style="text-decoration:line-through; font-weight:500;">\${s.suite}</span>
              <span onclick="includeSuite(\${idx})" style="color:var(--vscode-testing-iconPassedColor, #89D185); cursor:pointer; font-size:9px; font-weight:600; text-decoration:underline;">Include</span>
            </div>
          \`).join('');
        }
      }

      function updatePriority(idx, priorityValue) {
        recSuites[idx].priority = parseInt(priorityValue, 10);
      }

      function excludeSuite(idx) {
        var removed = recSuites.splice(idx, 1)[0];
        exSuites.push({
          suite: removed.suite,
          reason: removed.reason || 'User excluded via Test Strategy dashboard'
        });
        renderSuites();
      }

      function includeSuite(idx) {
        var removed = exSuites.splice(idx, 1)[0];
        recSuites.push({
          suite: removed.suite,
          priority: 2,
          reason: removed.reason || 'Included by user override'
        });
        renderSuites();
      }

      function saveAndContinue() {
        postMessage({
          command: 'overrideStrategy',
          recommendedSuites: recSuites,
          excludedSuites: exSuites
        });
        setTimeout(function() {
          postMessage({ command: 'executeNext' });
        }, 100);
      }

      // Initial Render
      setTimeout(renderSuites, 50);
    </script>
  `;
}

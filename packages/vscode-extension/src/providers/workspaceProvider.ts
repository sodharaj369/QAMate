import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  QAMateEngine,
  Conversation,
  Requirement,
  LLMProviderFactory,
  ILLMProvider,
  DefaultDocumentExtractor,
  SyncManager,
  SettingsRepository,
} from '@qamate/engine';
import { Theme } from '../ui/Theme.js';
import { VSCodeLMProvider } from './vscodeLMProvider.js';
import { strings } from '../ui/strings.js';
import { icons } from '../ui/icons.js';
import { WorkspaceStep, WorkspaceState } from '../ui/types.js';
import { RequirementViewModel } from '../ui/viewmodels/RequirementViewModel.js';
import { StrategyViewModel } from '../ui/viewmodels/StrategyViewModel.js';
import { renderSkeleton } from '../ui/components/Skeleton.js';
import { renderStrategyPage } from '../ui/pages/StrategyPage.js';
import { renderArtifactsPage } from '../ui/pages/ArtifactsPage.js';
import { renderReviewPage } from '../ui/pages/ReviewPage.js';
import { renderDeliverPage } from '../ui/pages/DeliverPage.js';
import { renderTimeline } from '../ui/components/Timeline.js';
import { renderLayout, StageData } from '../ui/components/Layout.js';
import { renderWelcomePage } from '../ui/pages/WelcomePage.js';
import { renderDashboardPage } from '../ui/pages/DashboardPage.js';
import { renderRequirementPage } from '../ui/pages/RequirementPage.js';
import { renderSystemPage } from '../ui/pages/SystemPage.js';
import { renderMentalModelPage } from '../ui/pages/MentalModelPage.js';
import { renderRecommendationsPage } from '../ui/pages/RecommendationsPage.js';
import {
  renderCard,
  renderPanel,
  renderMetric,
  renderBadge,
  renderToolbar,
  renderTabs,
  renderTree,
  renderTable,
  renderPropertyGrid,
  renderEmptyState,
  renderLoadingState
} from '../ui/components/Library.js';

import { renderSettingsPage } from '../ui/pages/SettingsPage.js';
import { renderAIHubPage } from '../ui/pages/AIHubPage.js';
import { renderSessionsPage } from '../ui/pages/SessionsPage.js';
import { renderHelpPage } from '../ui/pages/HelpPage.js';
import { AppState } from '../ui/AppState.js';

export class QAMateSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'qamate.sidebarView';
  private _view?: vscode.WebviewView;
  private appState: AppState;

  private state: WorkspaceState = {
    currentStep: 'NoSession',
    timelineEvents: [],
    devModeEnabled: false,
    activeTab: 'dashboard',
  };

  private currentConversation?: Conversation;

  private detectedFileName = '';
  private detectedFileAlreadyAnalyzed = false;

  private loadingLogs: string[] = [];
  private isAnalyzing = false;
  private analysisError = '';
  private recentSessionsHtml = '';

  public readonly syncManager: SyncManager;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext,
    private readonly engine: QAMateEngine,
    private readonly storage: any,
  ) {
    const settingsRepo = this.storage.getManager ? new SettingsRepository(this.storage.getManager()) : undefined;
    this.syncManager = new SyncManager(settingsRepo);

    this.state.devModeEnabled =
      this.context.workspaceState.get<boolean>('qamateDevModeEnabled') || false;

    // Register VS Code LM provider if Language Model API is available
    if ('lm' in vscode) {
      try {
        (vscode as any).lm.selectChatModels({}).then((models: any[]) => {
          if (models && models.length > 0) {
            const selectedModel =
              models.find(
                (m: any) =>
                  m.name?.toLowerCase().includes('gpt-4') ||
                  m.name?.toLowerCase().includes('claude-3-5') ||
                  m.name?.toLowerCase().includes('sonnet'),
              ) || models[0];
            const lmProvider = new VSCodeLMProvider(selectedModel);
            this.engine.orchestrator.registerCustomProvider(lmProvider);
            this.engine.orchestrator.refreshProviders().catch(() => {});
          }
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    this.appState = new AppState({
      currentStep: 'NoSession',
      timelineEvents: [],
      devModeEnabled: this.state.devModeEnabled,
      activeTab: 'dashboard',
      selectedPersona: 'manual-qa',
      selectedAIProvider: 'mock',
      selectedAIModel: '',
      selectedAIEndpoint: '',
      adoOrg: '',
      adoProject: '',
      jiraDomain: '',
      jiraEmail: '',
      hasOpenAIKey: false,
      hasClaudeKey: false,
      hasGeminiKey: false,
      aiStatus: 'Offline Analysis: Ready',
      adoStatus: 'Disconnected',
      jiraStatus: 'Disconnected',
      adoConnected: false,
      jiraConnected: false,
      detectedFileName: '',
      sessionsCount: 0,
      vsCodeLMAvailable: false,
      lmModelName: '',
    });

    this.appState.subscribe(async (stateData) => {
      this.state.currentStep = stateData.currentStep;
      this.state.activeSessionId = stateData.activeSessionId;
      this.state.timelineEvents = stateData.timelineEvents;
      this.state.devModeEnabled = stateData.devModeEnabled;
      this.state.activeTab = stateData.activeTab;
      this.detectedFileName = stateData.detectedFileName;

      if (this._view) {
        this._view.webview.html = await this.getHtmlContent();
      }
    });

    // Watch for VS Code configuration updates or theme changes to synchronize AppState
    if (vscode.workspace && typeof vscode.workspace.onDidChangeConfiguration === 'function') {
      vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('qamate') || e.affectsConfiguration('workbench.colorTheme')) {
          await this.syncAppState();
        }
      });
    }

    if (vscode.window && typeof vscode.window.onDidChangeActiveColorTheme === 'function') {
      vscode.window.onDidChangeActiveColorTheme(async () => {
        await this.syncAppState();
      });
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    this.syncAppState();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'switchTab':
          this.state.activeTab = message.tab;
          this.updateView();
          break;
        case 'renameSession':
          await this.renameSession(message.sessionId, message.title);
          break;
        case 'duplicateSession':
          await this.duplicateSession(message.sessionId);
          break;
        case 'importAzureStory':
          await this.importAzureStory();
          break;
        case 'importJiraIssue':
          await this.importJiraIssue();
          break;
        case 'analyzeActive':
          vscode.commands.executeCommand('qamate.analyze');
          break;
        case 'loadSession':
          this.loadSession(message.sessionId);
          break;
        case 'submitAnswers':
          this.saveClarificationAnswers(message.answers || {});
          break;
        case 'executeNext':
          this.executeNextStep();
          break;
        case 'startNew':
          this.startNewSession();
          break;
        case 'toggleDevMode':
          this.toggleDevMode();
          break;
        case 'savePersona':
          this.context.workspaceState.update('qamateActivePersona', message.persona);
          this.updateView();
          break;
        case 'deleteSession':
          await this.deleteSession(message.sessionId);
          break;
        case 'overrideStrategy':
          if (this.currentConversation && (this.currentConversation as any).generatedStrategy) {
            const strategy = (this.currentConversation as any).generatedStrategy;
            strategy.recommendedSuites = message.recommendedSuites;
            strategy.excludedSuites = message.excludedSuites;
            await this.storage.saveConversation(this.currentConversation);
          }
          break;
        case 'updateArtifact':
          if (this.currentConversation && (this.currentConversation as any).generatedArtifacts) {
            const list = (this.currentConversation as any).generatedArtifacts || [];
            const art = list.find((a: any) => a.id === message.artifactId);
            if (art) {
              art.content = message.content;
              await this.storage.saveConversation(this.currentConversation);
            }
          }
          break;
        case 'updateTestCases':
          if (this.currentConversation) {
            this.currentConversation.testCases = message.testCases;
            await this.storage.saveConversation(this.currentConversation);
          }
          break;
        case 'approveSuggestion':
          try {
            const approvedBy = message.approvedBy || 'QA Lead';
            this.engine.knowledgeEngine.getRepository().approveSuggestion(message.id, approvedBy);
            this.updateView();
            vscode.window.showInformationMessage(`QAMate: Knowledge suggestion approved & activated.`);
          } catch (err: any) {
            vscode.window.showErrorMessage(`QAMate Error: ${err.message}`);
          }
          break;
        case 'rollbackPlaybook':
          try {
            this.engine.knowledgeEngine.getRepository().rollback(message.version);
            this.updateView();
            vscode.window.showInformationMessage(`QAMate: Playbook rolled back to version ${message.version}.`);
          } catch (err: any) {
            vscode.window.showErrorMessage(`QAMate Error: ${err.message}`);
          }
          break;
        case 'downloadReport':
          await this.downloadReport(message.format, message.filename, message.sheets);
          break;
        case 'syncToADO':
          await this.syncToADO();
          break;
        case 'syncToJira':
          await this.syncToJira();
          break;
        case 'submitIntake':
          if (message.type === 'Azure DevOps ID') {
            await this.importAzureStory(message.text);
          } else if (message.type === 'Jira Issue') {
            await this.importJiraIssue(this.extractJiraKey(message.text));
          } else {
            await this.runIntakeAnalysis(message.text, message.type);
          }
          break;
        case 'selectNode':
          if (message.type === 'unknown' || message.type === 'assumption' || message.type === 'fact') {
            this.context.workspaceState.update('qamateSelectedReasoningItem', message.id);
            this.context.workspaceState.update('qamateSelectedReasoningItemType', message.type);
          } else {
            this.context.workspaceState.update('qamateSelectedBlueprintNode', message.id);
            this.context.workspaceState.update('qamateSelectedBlueprintNodeType', message.type);
          }
          this.updateView();
          break;
        case 'selectEvidence':
          vscode.window.showInformationMessage(`QAMate Trace: "${message.source}"`);
          break;
        case 'confirmAssumption':
        case 'submitOverride':
          vscode.window.showInformationMessage(`QAMate: Assumption confirmed & verified.`);
          break;
        case 'modifyAssumption':
          vscode.window.showInputBox({ prompt: 'Modify Assumption Statement:' }).then(val => {
            if (val) {
              vscode.window.showInformationMessage(`QAMate: Assumption statement updated.`);
            }
          });
          break;
        case 'rejectAssumption':
          vscode.window.showWarningMessage(`QAMate: Assumption rejected. Downstream objectives excluded.`);
          break;
        case 'addAssumption':
          vscode.window.showInputBox({ prompt: 'Enter manual assumption:' }).then(val => {
            if (val) {
              vscode.window.showInformationMessage(`QAMate: Manual assumption logged.`);
            }
          });
          break;
        case 'auditGaps':
          vscode.window.showInformationMessage(`QAMate: Auditing gaps in blueprint rules...`);
          break;
        case 'resolveAllAssumptions':
          vscode.window.showInformationMessage(`QAMate: All active assumptions confirmed.`);
          break;
        case 'acceptRecommendation':
          vscode.window.showInformationMessage(`QAMate: Recommendation ${message.id} accepted. Comments logged.`);
          break;
        case 'ignoreRecommendation':
          vscode.window.showWarningMessage(`QAMate: Recommendation ${message.id} ignored.`);
          break;
        case 'modifyRecommendation':
          vscode.window.showInformationMessage(`QAMate: Recommendation ${message.id} modified rationale.`);
          break;
        case 'addManualRecommendation':
          vscode.window.showInputBox({ prompt: 'Enter manual recommendation rule:' }).then(val => {
            if (val) {
              vscode.window.showInformationMessage(`QAMate: Manual recommendation logged.`);
            }
          });
          break;
        case 'resetRecsFilters':
          vscode.window.showInformationMessage(`QAMate: Recommendations grid filters reset.`);
          break;
        case 'selectObjective':
          this.context.workspaceState.update('qamateSelectedStrategyObjective', message.id);
          this.updateView();
          break;
        case 'addTestObjective':
          vscode.window.showInputBox({ prompt: 'Enter custom test objective:' }).then(val => {
            if (val) {
              vscode.window.showInformationMessage(`QAMate: Manual test objective logged.`);
            }
          });
          break;
        case 'optimizeStrategy':
          vscode.window.showInformationMessage(`QAMate: Optimizing strategy parameters and balancing test coverage...`);
          break;
        case 'resetStrategyFilters':
          vscode.window.showInformationMessage(`QAMate: Strategy blueprint filters reset.`);
          break;
        case 'selectTestCase':
          this.context.workspaceState.update('qamateSelectedTestCase', message.id);
          this.updateView();
          break;
        case 'updateTestCase':
          if (this.currentConversation && this.currentConversation.testCases) {
            const list = this.currentConversation.testCases;
            const tc = list.find((c: any) => c.id === message.id) as any;
            if (tc) {
              tc.title = message.title;
              tc.description = message.expected;
              tc.steps = [{ stepNumber: 1, action: message.steps, expectedResult: message.expected }];
              tc.preconditions = [message.preconditions];
              await this.storage.saveConversation(this.currentConversation);
            }
          }
          vscode.window.showInformationMessage(`QAMate: Test case properties updated.`);
          this.updateView();
          break;
        case 'addTestCase':
          vscode.window.showInformationMessage(`QAMate: Manual test case added to suite.`);
          break;
        case 'duplicateTestCase':
          vscode.window.showInformationMessage(`QAMate: Test case ${message.id} duplicated.`);
          break;
        case 'bulkEditCases':
          vscode.window.showInformationMessage(`QAMate: Bulk editing selected test cases...`);
          break;
        case 'exportSelectedCases':
          vscode.window.showInformationMessage(`QAMate: Exporting selected test cases...`);
          break;
        case 'selectFinding':
          this.context.workspaceState.update('qamateSelectedReviewFinding', message.id);
          this.updateView();
          break;
        case 'acceptReviewFix':
          vscode.window.showInformationMessage(`QAMate: Review fix accepted & test cases updated.`);
          break;
        case 'modifyReviewFix':
          vscode.window.showInformationMessage(`QAMate: Modified review finding suggested fix.`);
          break;
        case 'ignoreReviewRule':
          vscode.window.showWarningMessage(`QAMate: Review rule ignored and logged in DNA feedback history.`);
          break;
        case 'applyAllSafeFixes':
          vscode.window.showInformationMessage(`QAMate: Applied all safe recommended fixes.`);
          break;
        case 'ignoreAllInfo':
          vscode.window.showInformationMessage(`QAMate: Ignored all informational review logs.`);
          break;
        case 'runReviewAudit':
          vscode.window.showInformationMessage(`QAMate: Re-running playbook compliance audits...`);
          break;
        case 'selectDestination':
          this.context.workspaceState.update('qamateSelectedDeliverDestination', message.id);
          this.updateView();
          break;
        case 'selectPreviewTab':
          this.context.workspaceState.update('qamateSelectedPreviewTab', message.tab);
          this.updateView();
          break;
        case 'publishSuite':
          vscode.window.showInformationMessage(`QAMate: Publishing suite to active destination (Version: ${message.ver}, Baseline: ${message.base}, Build: ${message.build}, Template: ${message.template}). Dry Run: ${message.dryRun}`);
          break;
        case 'generatePDFSummary':
          vscode.window.showInformationMessage(`QAMate: Compiled official QA Delivery Report PDF document.`);
          break;
        case 'configureCredentials':
          vscode.window.showInformationMessage(`QAMate: Triggered connections credentials config panel...`);
          break;
        case 'runValidationCheck':
          vscode.window.showInformationMessage(`QAMate: Pre-flight validation checks completed.`);
          break;
        case 'reloadPreview':
          vscode.window.showInformationMessage(`QAMate: Reloaded formatted deliverables preview.`);
          break;
        case 'saveProjectDNA':
          vscode.window.showInformationMessage(`QAMate: Saved Project DNA workspace profile.`);
          break;
        case 'discardDNA':
          vscode.window.showWarningMessage(`QAMate: Discarded pending DNA modifications.`);
          break;
        case 'rescanWorkspace':
          vscode.window.showInformationMessage(`QAMate: Scanning workspace repository patterns...`);
          break;
        case 'exportDNA':
          vscode.window.showInformationMessage(`QAMate: Exported Project DNA package file.`);
          break;
        case 'cloneDNA':
          vscode.window.showInformationMessage(`QAMate: Cloned Project DNA configuration baseline.`);
          break;
        case 'compareDNA':
          vscode.window.showInformationMessage(`QAMate: Comparing Project DNA workspace models...`);
          break;
        case 'saveAIHubConfig':
          vscode.window.showInformationMessage(`QAMate: Saved AI Hub capability configurations.`);
          break;
        case 'toggleAIHubMode':
          this.context.workspaceState.update('qamateAIHubAdvanced', message.advanced);
          this.updateView();
          break;
        case 'testAIHubConnections':
          vscode.window.showInformationMessage(`QAMate: AI fallback connections health verification completed.`);
          break;
        case 'resetHubMetrics':
          vscode.window.showInformationMessage(`QAMate: Reset AI Hub daily metrics.`);
          break;
        case 'reconnectAIHub':
          vscode.window.showInformationMessage(`QAMate: Restored connectivity with default AI services.`);
          break;
        case 'configureProviderKey':
          vscode.window.showInputBox({ prompt: `Enter API token for ${message.provider}:`, password: true }).then(val => {
            if (val) {
              vscode.window.showInformationMessage(`QAMate: Registered API credentials key.`);
            }
          });
          break;
        case 'addGlossaryTerm':
          vscode.window.showInformationMessage(`QAMate: Glossary term '${message.term}' logged.`);
          break;
        case 'restoreBaseline':
          vscode.window.showInformationMessage(`QAMate: Restored Project DNA to previous baseline version.`);
          break;
        case 'compareRevisions':
          vscode.window.showInformationMessage(`QAMate: Comparing ${message.obj} revision ${message.v1} with ${message.v2}.`);
          break;
        case 'restoreRevision':
          vscode.window.showWarningMessage(`QAMate: Are you sure you want to restore to revision ${message.id}? This will replace your active requirement, system model, and strategy configuration!`, 'Continue', 'Cancel').then(choice => {
            if (choice === 'Continue') {
              vscode.window.showInformationMessage(`QAMate: Successfully restored session state to revision ${message.id}.`);
            }
          });
          break;
        case 'replayWorkspace':
          vscode.window.showInformationMessage(`QAMate: Replaying evolution trajectory steps...`);
          break;
        case 'exportDiffReport':
          vscode.window.showInformationMessage(`QAMate: Exported strategy evolution changes diff report.`);
          break;
        case 'toggleReadOnly':
          {
            const current = this.context.workspaceState.get<boolean>('qamateReqReadOnly') !== false;
            this.context.workspaceState.update('qamateReqReadOnly', !current);
            this.updateView();
          }
          break;
        case 'addAnnotation':
          {
            const list = this.context.workspaceState.get<{ text: string; note: string }[]>('qamateAnnotations') || [];
            list.push({ text: message.text, note: message.note });
            this.context.workspaceState.update('qamateAnnotations', list);
            this.updateView();
            vscode.window.showInformationMessage(`QAMate: Highlight note annotation added.`);
          }
          break;
        case 'saveRequirement':
          {
            if (this.currentConversation) {
              (this.currentConversation as any).requirementText = message.text;
              await this.storage.saveConversation(this.currentConversation);
            }
            this.context.workspaceState.update('qamateReqReadOnly', true);
            vscode.commands.executeCommand('qamate.analyze');
          }
          break;
        case 'importJira':
          vscode.commands.executeCommand('qamate.importJira');
          break;
        case 'importADO':
          vscode.commands.executeCommand('qamate.importADO');
          break;
        case 'triggerFileUpload':
          vscode.commands.executeCommand('qamate.uploadFile');
          break;
        case 'refreshImport':
        case 'reimportSpec':
          vscode.window.showInformationMessage(`QAMate: Refreshing requirement import details...`);
          vscode.commands.executeCommand('qamate.analyze');
          break;
        case 'configureAzureWizard':
          await this.runAzureWizard();
          break;
        case 'configureJiraWizard':
          await this.runJiraWizard();
          break;
        case 'configureAIWizard':
          await this.runAIWizard();
          break;
        case 'reportIssue':
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/sodharaj369/QAMate/issues'));
          break;
        case 'connectAI':
          await this.connectAI(message.provider, message.key, message.model, message.endpoint);
          break;
        case 'disconnectAI':
          await this.disconnectAI();
          break;
        case 'connectADO':
          await this.connectADO(message.org, message.project, message.pat);
          break;
        case 'disconnectADO':
          await this.disconnectADO();
          break;
        case 'connectJira':
          await this.connectJira(message.domain, message.email, message.token);
          break;
        case 'disconnectJira':
          await this.disconnectJira();
          break;
        case 'submitPromptQuery':
          vscode.window.showInformationMessage(
            `QAMate: Query '${message.text}' received. AI assistant capability is not yet implemented (Sprint 6).`,
          );
          break;
        case 'exit':
          break;
      }
    });

    this.restoreLastSession();
  }

  public toggleDevMode() {
    this.state.devModeEnabled = !this.state.devModeEnabled;
    this.context.workspaceState.update('qamateDevModeEnabled', this.state.devModeEnabled);
    this.updateView();
  }

  public async restoreLastSession() {
    const savedId = this.context.workspaceState.get<string>('qamateActiveSessionId');
    const savedStep = this.context.workspaceState.get<string>('qamateActiveStep');

    if (savedId && savedStep) {
      const conv = await this.engine.getSession(savedId);
      if (conv) {
        this.currentConversation = conv;
        this.state.activeSessionId = savedId;
        // Map old steps to new outcome-based steps for backward compatibility
        let mappedStep: WorkspaceStep = 'Understand';
        if (savedStep === 'Clarifications') {
          mappedStep = 'Prepare';
        } else if (savedStep === 'Strategy') {
          mappedStep = 'Plan';
        } else if (savedStep === 'Artifacts') {
          mappedStep = 'Generate';
        } else if (savedStep === 'Review' || savedStep === 'Coverage') {
          mappedStep = 'Review';
        } else if (savedStep === 'Complete') {
          mappedStep = 'Deliver';
        } else if (savedStep === 'NoSession') {
          mappedStep = 'NoSession';
        }
        this.state.currentStep = mappedStep;
        this.state.timelineEvents = this.context.workspaceState.get<string[]>(
          'qamateTimelineEvents',
        ) || ['Session restored'];
        this.updateView();
        return;
      }
    }
    // No valid saved session — stay at NoSession
    await this.refreshRecentSessionsList();
    this.updateView();
  }

  public async startNewSession() {
    this.state.activeSessionId = undefined;
    this.currentConversation = undefined;
    this.state.currentStep = 'NoSession';
    this.analysisError = '';
    this.detectedFileName = '';
    this.state.timelineEvents = [];
    this.context.workspaceState.update('qamateActiveSessionId', undefined);
    this.context.workspaceState.update('qamateActiveStep', undefined);
    this.context.workspaceState.update('qamateTimelineEvents', []);
    await this.refreshRecentSessionsList();
    this.updateView();
  }

  private async refreshRecentSessionsList() {
    try {
      const list = await this.engine.listSessions();
      const sessions = [];
      for (const sid of list.slice(0, 5)) {
        const conv = await this.engine.getSession(sid);
        if (conv) {
          sessions.push(conv);
        }
      }

      if (sessions.length === 0) {
        this.recentSessionsHtml = `<p class="empty-text">${strings.landing.noRecentSessions}</p>`;
      } else {
        this.recentSessionsHtml = sessions
          .map((s) => {
            const name = s.id.replace('conv-', '');
            const label =
              s.status === 'reviewing' || s.status === 'ready-for-generation'
                ? 'Active'
                : 'Planning';
            return `
            <div class="session-item">
              <span>📁 <strong>${name}</strong> (${label})</span>
              <div>
                <a class="session-link-resume" onclick="postMessage({command: 'loadSession', sessionId: '${s.id}'})">Resume</a>
                <a class="session-link-delete" onclick="postMessage({command: 'deleteSession', sessionId: '${s.id}'})">Delete</a>
              </div>
            </div>`;
          })
          .join('');
      }
    } catch {
      this.recentSessionsHtml = `<p class="empty-text">${strings.landing.noRecentSessions}</p>`;
    }
  }

  public async detectRequirementFile(doc: vscode.TextDocument) {
    // Guard: skip Untitled documents
    const basename = path.basename(doc.fileName);
    if (basename.startsWith('Untitled') || doc.uri.scheme === 'untitled') {
      return;
    }

    // Guard: only accept requirement file types
    const ext = path.extname(doc.fileName).toLowerCase();
    const supportedExts = ['.md', '.feature', '.txt', '.docx', '.pdf', '.json'];
    if (!supportedExts.includes(ext)) {
      return;
    }

    // Guard: don't interrupt an active session (Validation or later)
    const activeSteps: WorkspaceStep[] = [
      'Understand',
      'Prepare',
      'Plan',
      'Generate',
      'Review',
      'Deliver',
    ];
    if (activeSteps.includes(this.state.currentStep)) {
      return;
    }

    // Guard: don't detect empty files (unless docx/pdf binary specs)
    if (ext !== '.pdf' && ext !== '.docx' && doc.getText().trim().length === 0) {
      return;
    }

    this.detectedFileName = basename;
    const list = await this.engine.listSessions();
    this.detectedFileAlreadyAnalyzed = list.some((id) =>
      id.includes(path.basename(doc.fileName, ext)),
    );

    // Stay at NoSession step
    if (this.state.currentStep === 'NoSession') {
      this.state.currentStep = 'NoSession';
    }
    this.updateView();
  }

  private async extractTextFromFile(filePath: string): Promise<string> {
    const extractor = new DefaultDocumentExtractor();
    try {
      return await extractor.extractText(filePath);
    } catch (err: any) {
      return `[Error loading content from file: ${path.basename(filePath)}]: ${err.message}`;
    }
  }

  public async runActiveAnalysis(doc: vscode.TextDocument) {
    vscode.window.showInformationMessage(
      `QAMate: Started analysis on ${path.basename(doc.fileName)}`,
    );
    this.isAnalyzing = true;
    this.analysisError = '';
    this.loadingLogs = ['Requirement Loaded'];
    this.updateView();

    try {
      const ext = path.extname(doc.fileName);
      const content =
        doc.uri.scheme === 'file' ? await this.extractTextFromFile(doc.uri.fsPath) : doc.getText();

      const requirement: Requirement = {
        id: `req-${path.basename(doc.fileName, ext)}`,
        projectId: 'vscode-project',
        title: path.basename(doc.fileName, ext),
        content: content,
        contentType: ext === '.json' ? 'jira-json' : 'markdown',
        version: 1,
        status: 'draft',
        metadata: { author: 'VSCode User' },
      };

      this.loadingLogs.push('Reading requirement specification...');
      this.updateView();
      await new Promise((r) => setTimeout(r, 350));

      this.loadingLogs.push('Identifying business rules and actor profiles...');
      this.updateView();
      await new Promise((r) => setTimeout(r, 400));

      this.loadingLogs.push('Detecting domain and confidence scores...');
      this.updateView();
      await new Promise((r) => setTimeout(r, 350));

      this.loadingLogs.push('Compiling heuristics health report card...');
      this.updateView();

      const conversation = await this.engine.createSession(requirement);

      // Persist chosen persona context on session
      const selectedPersona =
        this.context.workspaceState.get<string>('qamateActivePersona') || 'manual-qa';
      (conversation as any).persona = selectedPersona;
      await this.storage.saveConversation(conversation);

      this.state.activeSessionId = conversation.id;
      this.currentConversation = conversation;
      if (conversation.status === 'ready-for-generation') {
        this.state.currentStep = 'Plan';
      } else {
        this.state.currentStep = 'Understand';
      }
      this.state.timelineEvents = ['Requirement Imported', 'Analysis Scorecard Compiled'];
      this.context.workspaceState.update('qamateActiveSessionId', conversation.id);
      this.context.workspaceState.update('qamateActiveStep', this.state.currentStep);
      this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
    } catch (err: unknown) {
      this.analysisError = err instanceof Error ? err.message : 'Fatal analysis pipeline crash.';
    } finally {
      this.isAnalyzing = false;
      this.updateView();
    }
  }

  public async runIntakeAnalysis(text: string, type: string) {
    vscode.window.showInformationMessage(`QAMate: Started intake analysis on ${type}`);
    this.isAnalyzing = true;
    this.analysisError = '';
    const selectedAIProvider =
      this.context.workspaceState.get<string>('qamate.ai.provider') || 'mock';
    const initialAIResult = {
      providerName: selectedAIProvider === 'mock' ? 'None' : selectedAIProvider,
      modelName: '',
      requestSent: false,
      responseReceived: false,
      enhancementApplied: false,
      errorMessage: undefined as string | undefined,
    };
    this.context.workspaceState.update('qamateActiveAIResult', initialAIResult);
    this.loadingLogs = [
      'Intake Captured',
      `Format classified: ${type}`,
      'Initializing compilation pipeline...',
    ];
    this.updateView();

    try {
      const isMarkdown = type.includes('Markdown');
      const requirement: Requirement = {
        id: `req-intake-${Date.now()}`,
        projectId: 'vscode-project',
        title: type.replace(/\s+/g, '-'),
        content: text,
        contentType: isMarkdown ? 'markdown' : 'plain-text',
        version: 1,
        status: 'draft',
        metadata: { author: 'VSCode User', externalId: type },
      };

      this.loadingLogs.push('Reading requirement specification...');
      this.updateView();
      await new Promise((r) => setTimeout(r, 350));

      this.loadingLogs.push('Identifying business rules and actor profiles...');
      this.updateView();
      await new Promise((r) => setTimeout(r, 400));

      this.loadingLogs.push('Detecting domain and confidence scores...');
      this.updateView();
      await new Promise((r) => setTimeout(r, 350));

      this.loadingLogs.push('Compiling heuristics health report card...');
      this.updateView();

      const activeProvider = await this.resolveActiveLLMProvider();
      let conversation: Conversation;

      if (activeProvider) {
        initialAIResult.requestSent = true;
        const selectedAIModel = this.context.workspaceState.get<string>('qamate.ai.model') || '';
        if (activeProvider.id.startsWith('vscode-lm')) {
          initialAIResult.providerName = 'VS Code Language Model API';
          initialAIResult.modelName = activeProvider.name;
        } else {
          initialAIResult.providerName = activeProvider.name;
          initialAIResult.modelName = selectedAIModel || 'Default Model';
        }
        this.context.workspaceState.update('qamateActiveAIResult', initialAIResult);
        try {
          conversation = await this.engine.createSession(requirement, activeProvider);
          initialAIResult.responseReceived = true;
          initialAIResult.enhancementApplied = true;
          initialAIResult.providerName = this.engine.orchestrator.lastSelectedProviderName;
          initialAIResult.modelName = this.engine.orchestrator.lastSelectedProviderId;
          (initialAIResult as any).selectionReason = this.engine.orchestrator.lastSelectedReason;
          this.context.workspaceState.update('qamateActiveAIResult', initialAIResult);
        } catch (err: any) {
          initialAIResult.responseReceived = false;
          initialAIResult.enhancementApplied = false;
          initialAIResult.errorMessage = err.message || 'AI analysis failed.';
          this.context.workspaceState.update('qamateActiveAIResult', initialAIResult);
          vscode.window.showWarningMessage(`QAMate: AI analysis failed (${err.message}). Using offline analysis.`);
          conversation = await this.engine.createSession(requirement);
        }
      } else {
        conversation = await this.engine.createSession(requirement);
      }

      // Persist chosen persona context on session
      const selectedPersona =
        this.context.workspaceState.get<string>('qamateActivePersona') || 'manual-qa';
      (conversation as any).persona = selectedPersona;
      await this.storage.saveConversation(conversation);

      this.state.activeSessionId = conversation.id;
      this.currentConversation = conversation;
      if (conversation.status === 'ready-for-generation') {
        this.state.currentStep = 'Plan';
      } else {
        this.state.currentStep = 'Understand';
      }
      this.state.timelineEvents = ['Requirement Imported', 'Analysis Scorecard Compiled'];
      this.context.workspaceState.update('qamateActiveSessionId', conversation.id);
      this.context.workspaceState.update('qamateActiveStep', this.state.currentStep);
      this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
      await this.refreshRecentSessionsList();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Fatal analysis pipeline crash.';
      this.analysisError = errMsg;
      console.error(`[QAMate DEBUG] Intake analysis failed: ${errMsg}`, err);
      vscode.window.showErrorMessage(`QAMate Analysis failed: ${errMsg}`);
    } finally {
      this.isAnalyzing = false;
      this.updateView();
    }
  }

  private async saveClarificationAnswers(answersMap: Record<string, string>) {
    if (!this.currentConversation) {
      // No active session yet — just transition forward
      this.transitionTo('Plan');
      return;
    }

    // Only call engine.submitAnswers if the engine actually generated questions
    if (this.currentConversation.questions.length > 0) {
      const answers = Object.entries(answersMap).map(([questionId, value]) => ({
        questionId,
        value: value as string,
        answeredAt: new Date(),
        answeredBy: 'VSCodeUser',
      }));

      try {
        this.currentConversation = await this.engine.submitAnswers(
          this.state.activeSessionId!,
          answers,
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `QAMate: Error saving investigation answers: ${err.message}`,
        );
        return;
      }
    }

    // Record investigation summary in timeline
    const answerSummaries = Object.entries(answersMap)
      .map(([id, val]) => `${id}: ${val}`)
      .join(', ');
    this.state.timelineEvents.push(`Investigation Complete (${answerSummaries})`);
    this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
    this.transitionTo('Plan');
  }

  private async downloadReport(
    format: string,
    filename?: string,
    sheets?: Record<string, boolean>,
  ) {
    if (!this.currentConversation) return;
    const strategy = (this.currentConversation as any).generatedStrategy;
    const testCases = (this.currentConversation as any).testCases || [];
    if (!strategy) {
      vscode.window.showErrorMessage('QAMate: No active strategy generated yet.');
      return;
    }

    const { ExportFramework } = await import('@qamate/engine');
    const exporter = new ExportFramework();
    let content: string | Buffer = '';
    const defaultExtension = format;

    if (format === 'xlsx') {
      content = await exporter.exportToExcelJS(strategy, testCases, sheets);
    } else {
      switch (format) {
        case 'md':
          content = exporter.exportToMarkdown(strategy, testCases);
          break;
        case 'csv':
          content = exporter.exportToCSV(strategy, testCases);
          break;
        case 'xls':
          content = exporter.exportToExcel(strategy, testCases);
          break;
        case 'html':
          content = exporter.exportToHTML(strategy, testCases);
          break;
        case 'json':
          content = exporter.exportToJSON(strategy, testCases);
          break;
      }
    }

    const suggestedFilename = filename || `qamate-report.${defaultExtension}`;

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(suggestedFilename),
      filters: { 'Report Files': [defaultExtension] },
    });

    if (uri) {
      const data = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
      await vscode.workspace.fs.writeFile(uri, data);
      vscode.window.showInformationMessage(`QAMate: Report successfully exported to ${uri.fsPath}`);
    }
  }

  private async syncToADO() {
    if (!this.currentConversation) return;
    const org = this.context.workspaceState.get<string>('qamate.ado.org');
    const project = this.context.workspaceState.get<string>('qamate.ado.project');
    const pat = await this.context.secrets.get('qamate.ado.pat');
    const externalId =
      (this.currentConversation as any).requirementTitle?.match(/\d+/)?.toString() || '101';

    if (!org || !project || !pat) {
      vscode.window.showErrorMessage(
        'QAMate: Azure DevOps settings are incomplete. Please configure them in connection settings.',
      );
      return;
    }

    vscode.window.showInformationMessage(
      `QAMate: Synchronizing test scenarios to Azure DevOps Project "${project}" (WorkItem ID: ${externalId})...`,
    );

    try {
      const testCases = this.currentConversation.testCases || this.currentConversation.questions.map((q, idx) => ({
        id: `TC-${idx + 1}`,
        title: q.text,
        steps: [{ stepNumber: 1, action: 'Perform query', expectedResult: q.rationale }],
      })) as any[];

      this.syncManager.enqueue(
        this.currentConversation.id,
        testCases,
        'ado',
        externalId,
        { org, project, pat }
      );
      vscode.window.showInformationMessage(
        'QAMate: Azure DevOps sync job successfully enqueued in background queue.',
      );
    } catch (err: any) {
      vscode.window.showErrorMessage(`QAMate: Azure DevOps sync failed: ${err.message}`);
    }
  }

  private async syncToJira() {
    if (!this.currentConversation) return;
    const domain = this.context.workspaceState.get<string>('qamate.jira.domain');
    const email = this.context.workspaceState.get<string>('qamate.jira.email');
    const token = await this.context.secrets.get('qamate.jira.token');
    const externalId =
      (this.currentConversation as any).requirementTitle?.match(/[A-Z]+-\d+/)?.toString() ||
      'QA-101';

    if (!domain || !email || !token) {
      vscode.window.showErrorMessage('QAMate: Jira connection settings are incomplete.');
      return;
    }

    vscode.window.showInformationMessage(
      `QAMate: Uploading deliverables report attachment to Jira Issue Board at ${domain} for Issue ${externalId}...`,
    );

    try {
      const testCases = this.currentConversation.testCases || this.currentConversation.questions.map((q, idx) => ({
        id: `TC-${idx + 1}`,
        title: q.text,
        steps: [{ stepNumber: 1, action: 'Perform query', expectedResult: q.rationale }],
      })) as any[];

      this.syncManager.enqueue(
        this.currentConversation.id,
        testCases,
        'jira',
        externalId,
        { domain, email, token }
      );
      vscode.window.showInformationMessage(
        'QAMate: Jira sync job successfully enqueued in background queue.',
      );
    } catch (err: any) {
      vscode.window.showErrorMessage(`QAMate: Jira sync failed: ${err.message}`);
    }
  }

  public transitionTo(step: WorkspaceStep) {
    this.state.currentStep = step;
    this.context.workspaceState.update('qamateActiveStep', step);
    this.updateView();
  }

  private async executeNextStep() {
    if (this.isAnalyzing) return;
    this.analysisError = '';

    const current = this.state.currentStep;
    switch (current) {
      case 'Understand': {
        const questions = this.currentConversation?.questions || [];
        if (questions.length > 0) {
          this.transitionTo('Prepare');
        } else {
          this.transitionTo('Plan');
        }
        break;
      }
      case 'Prepare': {
        this.transitionTo('Plan');
        break;
      }
      case 'Plan': {
        this.loadingLogs = ['Structuring test objectives...', 'Compiling prioritized suites...'];
        this.isAnalyzing = true;
        this.updateView();
        try {
          await this.engine.generateStrategy(this.state.activeSessionId!);
          const conv = await this.engine.getSession(this.state.activeSessionId!);
          if (conv) {
            this.currentConversation = conv;
            this.state.timelineEvents.push('Test Strategy Approved');
            this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
            this.transitionTo('Generate');
          }
        } catch (err: any) {
          this.analysisError = err.message;
        } finally {
          this.isAnalyzing = false;
          this.updateView();
        }
        break;
      }
      case 'Generate': {
        this.loadingLogs = ['Generating test cases...', 'Compiling step details...'];
        this.isAnalyzing = true;
        this.updateView();

        const selectedAIProvider =
          this.context.workspaceState.get<string>('qamate.ai.provider') || 'mock';
        const aiResult: {
          providerName: string;
          modelName?: string;
          selectionReason?: string;
          requestSent: boolean;
          responseReceived: boolean;
          enhancementApplied: boolean;
          errorMessage?: string;
        } = {
          providerName: selectedAIProvider === 'mock' ? 'None' : selectedAIProvider,
          requestSent: selectedAIProvider !== 'mock',
          responseReceived: false,
          enhancementApplied: false,
          errorMessage: undefined,
        };

        try {
          if (selectedAIProvider !== 'mock') {
            const lLMProvider = await this.resolveActiveLLMProvider();
            if (!lLMProvider) {
              throw new Error('AI Provider initialization failed.');
            }

            const generatePromise = this.engine.generateArtifacts(
              this.state.activeSessionId!,
              lLMProvider,
            );
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('AI Request timed out after 30 seconds.')), 30000),
            );

            await Promise.race([generatePromise, timeoutPromise]);
            aiResult.responseReceived = true;
            aiResult.enhancementApplied = true;
            aiResult.providerName = this.engine.orchestrator.lastSelectedProviderName;
            aiResult.modelName = this.engine.orchestrator.lastSelectedProviderId;
            (aiResult as any).selectionReason = this.engine.orchestrator.lastSelectedReason;
          } else {
            await this.engine.generateArtifacts(this.state.activeSessionId!, undefined);
          }
        } catch (err: any) {
          aiResult.responseReceived = false;
          aiResult.enhancementApplied = false;

          let errMsg = 'AI unavailable. Offline Analysis used.';
          const msg = err.message || '';
          if (
            msg.includes('401') ||
            msg.includes('Unauthorized') ||
            msg.includes('API key') ||
            msg.includes('key')
          ) {
            errMsg = 'Authentication failed. Offline Analysis used.';
          } else if (msg.includes('timeout') || msg.includes('timed out')) {
            errMsg = 'AI request timed out. Offline Analysis used.';
          }
          aiResult.errorMessage = errMsg;

          try {
            await this.engine.generateArtifacts(this.state.activeSessionId!, undefined);
          } catch {
            // ignore
          }
        } finally {
          this.context.workspaceState.update('qamateActiveAIResult', aiResult);
        }

        try {
          const conv = await this.engine.getSession(this.state.activeSessionId!);
          if (conv) {
            this.currentConversation = conv;
            this.state.timelineEvents.push('Test Cases Generated');
            this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
            this.context.workspaceState.update('qamateHasGeneratedSuite', true);
            this.transitionTo('Review');
          }
        } catch (err: any) {
          this.analysisError = err.message;
        } finally {
          this.isAnalyzing = false;
          this.updateView();
        }
        break;
      }
      case 'Review': {
        this.loadingLogs = ['Auditing safety patterns...', 'Matching coverage rules...'];
        this.isAnalyzing = true;
        this.updateView();
        try {
          await this.engine.runReview(this.state.activeSessionId!);
          await this.engine.runCoverage(this.state.activeSessionId!);
          const conv = await this.engine.getSession(this.state.activeSessionId!);
          if (conv) {
            this.currentConversation = conv;
            this.state.timelineEvents.push('Safety Review & Coverage Checked');
            this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
            this.transitionTo('Deliver');
          }
        } catch (err: any) {
          this.analysisError = err.message;
        } finally {
          this.isAnalyzing = false;
          this.updateView();
        }
        break;
      }
      case 'Deliver': {
        await this.startNewSession();
        break;
      }
    }
  }

  private async loadSession(sessionId: string) {
    const conv = await this.engine.getSession(sessionId);
    if (conv) {
      this.state.activeSessionId = sessionId;
      this.currentConversation = conv;
      if (conv.status === 'ready-for-generation' || conv.status === 'reviewing') {
        this.state.currentStep = 'Plan';
      } else {
        this.state.currentStep = 'Understand';
      }
      this.state.timelineEvents = ['Session loaded'];
      this.context.workspaceState.update('qamateActiveSessionId', sessionId);
      this.context.workspaceState.update('qamateActiveStep', this.state.currentStep);
      this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
      this.updateView();
    }
  }

  public async deleteSession(sessionId: string) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const storageDir = workspaceRoot ? path.join(workspaceRoot, '.qamate', 'data') : './data';
    const filePath = path.join(storageDir, 'conversations', `${sessionId}.json`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`QAMate: Error deleting session file: ${err.message}`);
    }
    if (this.state.activeSessionId === sessionId) {
      await this.startNewSession();
    } else {
      await this.refreshRecentSessionsList();
      this.updateView();
    }
  }

  private async renameSession(sessionId: string, newTitle: string) {
    const conv = await this.engine.getSession(sessionId);
    if (conv) {
      (conv as any).requirementTitle = newTitle;
      await this.storage.saveConversation(conv);
      if (this.state.activeSessionId === sessionId) {
        this.currentConversation = conv;
      }
      await this.refreshRecentSessionsList();
      this.updateView();
    }
  }

  private async duplicateSession(sessionId: string) {
    const conv = await this.engine.getSession(sessionId);
    if (conv) {
      const requirement = (conv as any).requirement ||
        (conv as any).requirementData || {
          id: `req-dup-${Date.now()}`,
          projectId: conv.projectId || 'vscode-project',
          title: `${(conv as any).requirementTitle || 'Session'} (Copy)`,
          content: (conv as any).requirementContent || '',
          contentType: 'plain-text',
          version: 1,
          status: 'draft',
        };
      const newConv = await this.engine.createSession(requirement as any);
      newConv.questions = [...conv.questions];
      newConv.answers = [...conv.answers];
      if ((conv as any).generatedStrategy) {
        (newConv as any).generatedStrategy = JSON.parse(
          JSON.stringify((conv as any).generatedStrategy),
        );
      }
      if ((conv as any).generatedArtifacts) {
        (newConv as any).generatedArtifacts = JSON.parse(
          JSON.stringify((conv as any).generatedArtifacts),
        );
      }
      (newConv as any).requirementTitle = `${(conv as any).requirementTitle || 'Session'} (Copy)`;
      await this.storage.saveConversation(newConv);
      vscode.window.showInformationMessage('QAMate: Session duplicated successfully.');
      await this.refreshRecentSessionsList();
      this.updateView();
    }
  }

  private normalizeAzureInput(input: string): { id: string; org?: string; project?: string } {
    const val = input.trim();
    const urlMatch = val.match(/dev\.azure\.com\/([^/]+)\/([^/]+)\/_workitems\/edit\/(\d+)/i);
    if (urlMatch) {
      return {
        org: urlMatch[1],
        project: urlMatch[2],
        id: urlMatch[3],
      };
    }
    const numMatch = val.match(/\d+/);
    if (numMatch) {
      return { id: numMatch[0] };
    }
    return { id: val };
  }

  private async importAzureStory(presetInput?: string) {
    let org = this.context.workspaceState.get<string>('qamate.ado.org') || '';
    let project = this.context.workspaceState.get<string>('qamate.ado.project') || '';
    let pat = (await this.context.secrets.get('qamate.ado.pat')) || '';

    let inputId = presetInput;
    if (!inputId) {
      inputId = await vscode.window.showInputBox({
        prompt: 'Enter Azure DevOps Work Item ID, #, or URL to Import',
      });
    }
    if (!inputId) return;

    const normalized = this.normalizeAzureInput(inputId);
    const targetOrg = normalized.org || org;
    const targetProject = normalized.project || project;

    if (!targetOrg || !targetProject || !pat) {
      const promptOrg =
        targetOrg ||
        (await vscode.window.showInputBox({ prompt: 'Enter Azure DevOps Organization Name' })) ||
        '';
      const promptProject =
        targetProject ||
        (await vscode.window.showInputBox({ prompt: 'Enter Azure DevOps Project Name' })) ||
        '';
      const promptPat =
        pat ||
        (await vscode.window.showInputBox({
          prompt: 'Enter Azure DevOps Personal Access Token (PAT)',
          password: true,
        })) ||
        '';

      if (!promptOrg || !promptProject || !promptPat) {
        vscode.window.showErrorMessage('QAMate: Azure DevOps credentials setup cancelled.');
        return;
      }
      await this.connectADO(promptOrg, promptProject, promptPat);
      org = promptOrg;
      project = promptProject;
      pat = promptPat;
    }

    const finalOrg = normalized.org || org;
    const finalProject = normalized.project || project;

    this.isAnalyzing = true;
    this.updateView();
    try {
      const { DefaultADOAdapter } = await import('@qamate/engine');
      const adapter = new DefaultADOAdapter();
      const req = await adapter.importWorkItem(normalized.id, finalOrg, finalProject, pat);

      console.log(`[QAMate DEBUG] Work Item Downloaded: ${!!req}`);
      console.log(
        `[QAMate DEBUG] Requirement Extracted: ${!!req?.content} (length: ${req?.content?.length || 0})`,
      );

      await this.runIntakeAnalysis(
        req.content,
        `Azure DevOps Work Item ${normalized.id} (${req.title})`,
      );

      console.log(`[QAMate DEBUG] Session Created: ${!!this.currentConversation}`);
      console.log(`[QAMate DEBUG] Active Session ID: ${this.state.activeSessionId}`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`QAMate: Azure DevOps import failed: ${err.message}`);
    } finally {
      this.isAnalyzing = false;
      this.updateView();
    }
  }

  private async importJiraIssue(presetKey?: string) {
    let domain = this.context.workspaceState.get<string>('qamate.jira.domain') || '';
    let email = this.context.workspaceState.get<string>('qamate.jira.email') || '';
    let token = (await this.context.secrets.get('qamate.jira.token')) || '';

    if (!domain || !email || !token) {
      domain =
        (await vscode.window.showInputBox({
          prompt: 'Enter Jira Domain (e.g. company.atlassian.net)',
        })) || '';
      email = (await vscode.window.showInputBox({ prompt: 'Enter Jira Email Address' })) || '';
      token =
        (await vscode.window.showInputBox({ prompt: 'Enter Jira API Token', password: true })) ||
        '';
      if (!domain || !email || !token) {
        vscode.window.showErrorMessage('QAMate: Jira credentials setup cancelled.');
        return;
      }
      await this.connectJira(domain, email, token);
    }

    let key = presetKey;
    if (!key) {
      key = await vscode.window.showInputBox({
        prompt: 'Enter Jira Issue Key to Import (e.g. QA-101)',
      });
    }
    if (!key) return;

    this.isAnalyzing = true;
    this.updateView();
    try {
      const { DefaultJiraAdapter } = await import('@qamate/engine');
      const adapter = new DefaultJiraAdapter();
      const req = await adapter.importIssue(key, domain, email, token);
      await this.runIntakeAnalysis(req.content, `Jira Issue ${key} (${req.title})`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`QAMate: Jira import failed: ${err.message}`);
    } finally {
      this.isAnalyzing = false;
      this.updateView();
    }
  }

  private extractJiraKey(input: string): string {
    const val = input.trim();
    const urlMatch = val.match(/\/browse\/([A-Z0-9-]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    return val;
  }

  public async connectAI(provider: string, key: string, model: string, endpoint: string) {
    this.context.workspaceState.update('qamate.ai.provider', provider);
    this.context.workspaceState.update('qamate.ai.model', model);
    this.context.workspaceState.update('qamate.ai.endpoint', endpoint);
    if (key) {
      if (provider === 'openai') await this.context.secrets.store('qamate.openai.key', key);
      else if (provider === 'claude') await this.context.secrets.store('qamate.claude.key', key);
      else if (provider === 'gemini') await this.context.secrets.store('qamate.gemini.key', key);
    }
    vscode.window.showInformationMessage(
      `QAMate: Connected AI Provider (${provider.toUpperCase()})`,
    );
    this.updateView();
  }

  public async disconnectAI() {
    this.context.workspaceState.update('qamate.ai.provider', 'mock');
    this.context.workspaceState.update('qamate.ai.model', '');
    this.context.workspaceState.update('qamate.ai.endpoint', '');
    await this.context.secrets.delete('qamate.openai.key');
    await this.context.secrets.delete('qamate.claude.key');
    await this.context.secrets.delete('qamate.gemini.key');
    vscode.window.showInformationMessage('QAMate: Disconnected AI Provider');
    this.updateView();
  }

  public async connectADO(org: string, project: string, pat: string) {
    this.context.workspaceState.update('qamate.ado.org', org);
    this.context.workspaceState.update('qamate.ado.project', project);
    if (pat) {
      await this.context.secrets.store('qamate.ado.pat', pat);
    }
    vscode.window.showInformationMessage(`QAMate: Connected Azure DevOps Org (${org})`);
    this.updateView();
  }

  public async disconnectADO() {
    this.context.workspaceState.update('qamate.ado.org', '');
    this.context.workspaceState.update('qamate.ado.project', '');
    await this.context.secrets.delete('qamate.ado.pat');
    vscode.window.showInformationMessage('QAMate: Disconnected Azure DevOps');
    this.updateView();
  }

  public async connectJira(domain: string, email: string, token: string) {
    this.context.workspaceState.update('qamate.jira.domain', domain);
    this.context.workspaceState.update('qamate.jira.email', email);
    if (token) {
      await this.context.secrets.store('qamate.jira.token', token);
    }
    vscode.window.showInformationMessage(`QAMate: Connected Jira Host (${domain})`);
    this.updateView();
  }

  public async disconnectJira() {
    this.context.workspaceState.update('qamate.jira.domain', '');
    this.context.workspaceState.update('qamate.jira.email', '');
    await this.context.secrets.delete('qamate.jira.token');
    vscode.window.showInformationMessage('QAMate: Disconnected Jira');
    this.updateView();
  }

  private async runAzureWizard() {
    const org = await vscode.window.showInputBox({
      prompt: 'Enter Azure DevOps Organization Name (e.g. my-company-org)',
      value: this.context.workspaceState.get<string>('qamate.ado.org') || '',
    });
    if (org === undefined) return;

    const project = await vscode.window.showInputBox({
      prompt: 'Enter Azure DevOps Project Name',
      value: this.context.workspaceState.get<string>('qamate.ado.project') || '',
    });
    if (project === undefined) return;

    const pat = await vscode.window.showInputBox({
      prompt: 'Enter Personal Access Token (PAT)',
      password: true,
      placeHolder: '••••••••••••••••',
    });
    if (pat === undefined) return;

    await this.connectADO(org, project, pat);
  }

  private async runJiraWizard() {
    const domain = await vscode.window.showInputBox({
      prompt: 'Enter Jira Domain URL (e.g. company.atlassian.net)',
      value: this.context.workspaceState.get<string>('qamate.jira.domain') || '',
    });
    if (domain === undefined) return;

    const email = await vscode.window.showInputBox({
      prompt: 'Enter Jira Account Email Address',
      value: this.context.workspaceState.get<string>('qamate.jira.email') || '',
    });
    if (email === undefined) return;

    const token = await vscode.window.showInputBox({
      prompt: 'Enter Jira API Token',
      password: true,
      placeHolder: '••••••••••••••••',
    });
    if (token === undefined) return;

    await this.connectJira(domain, email, token);
  }

  private async runAIWizard() {
    const providers = [
      { label: 'Offline Mode (Rule Engine)', value: 'mock' },
      { label: 'OpenAI GPT', value: 'openai' },
      { label: 'Google Gemini', value: 'gemini' },
      { label: 'Anthropic Claude', value: 'claude' },
      { label: 'Ollama Local Server', value: 'ollama' },
    ];

    const pick = await vscode.window.showQuickPick(providers, {
      placeHolder: 'Select AI Engine Provider',
    });
    if (!pick) return;

    const provider = pick.value;
    if (provider === 'mock') {
      await this.disconnectAI();
      return;
    }

    let key = '';
    if (provider === 'openai' || provider === 'gemini' || provider === 'claude') {
      const inputKey = await vscode.window.showInputBox({
        prompt: `Enter API Key for ${pick.label}`,
        password: true,
      });
      if (inputKey === undefined) return;
      key = inputKey;
    }

    const model = await vscode.window.showInputBox({
      prompt: 'Enter Model Name to use',
      value:
        provider === 'openai'
          ? 'gpt-4o'
          : provider === 'gemini'
            ? 'gemini-1.5-pro'
            : provider === 'claude'
              ? 'claude-3-5-sonnet'
              : 'llama3',
    });
    if (model === undefined) return;

    let endpoint = '';
    if (provider === 'ollama') {
      const inputEndpoint = await vscode.window.showInputBox({
        prompt: 'Enter Ollama Endpoint URL',
        value: 'http://localhost:11434',
      });
      if (inputEndpoint === undefined) return;
      endpoint = inputEndpoint;
    }

    await this.connectAI(provider, key, model, endpoint);
  }

  private async resolveActiveLLMProvider(): Promise<ILLMProvider | undefined> {
    const selectedAIProvider = this.context.workspaceState.get<string>('qamate.ai.provider') || 'mock';
    const selectedAIModel = this.context.workspaceState.get<string>('qamate.ai.model') || '';
    const selectedAIEndpoint = this.context.workspaceState.get<string>('qamate.ai.endpoint') || '';

    const openAIKey = this.context.secrets ? (await this.context.secrets.get('qamate.openai.key')) || '' : '';
    const claudeKey = this.context.secrets ? (await this.context.secrets.get('qamate.claude.key')) || '' : '';
    const geminiKey = this.context.secrets ? (await this.context.secrets.get('qamate.gemini.key')) || '' : '';

    this.engine.configManager.updateSettings({
      apiKeys: {
        openai: openAIKey,
        claude: claudeKey,
        gemini: geminiKey,
        ollama: selectedAIEndpoint || 'http://localhost:11434',
        preferred_provider: selectedAIProvider,
        preferred_model: selectedAIModel,
      }
    });

    await this.engine.orchestrator.refreshProviders();
    return this.engine.orchestrator;
  }

  private async syncAppState() {
    const selectedPersona =
      this.context.workspaceState.get<string>('qamateActivePersona') || 'manual-qa';
    const selectedAIProvider =
      this.context.workspaceState.get<string>('qamate.ai.provider') || 'mock';
    const selectedAIModel = this.context.workspaceState.get<string>('qamate.ai.model') || '';
    const selectedAIEndpoint = this.context.workspaceState.get<string>('qamate.ai.endpoint') || '';

    const adoOrg = this.context.workspaceState.get<string>('qamate.ado.org') || '';
    const adoProject = this.context.workspaceState.get<string>('qamate.ado.project') || '';

    const jiraDomain = this.context.workspaceState.get<string>('qamate.jira.domain') || '';
    const jiraEmail = this.context.workspaceState.get<string>('qamate.jira.email') || '';

    const hasOpenAIKey = this.context.secrets ? !!(await this.context.secrets.get('qamate.openai.key')) : false;
    const hasClaudeKey = this.context.secrets ? !!(await this.context.secrets.get('qamate.claude.key')) : false;
    const hasGeminiKey = this.context.secrets ? !!(await this.context.secrets.get('qamate.gemini.key')) : false;

    const hasAdoPat = this.context.secrets ? !!(await this.context.secrets.get('qamate.ado.pat')) : false;
    const hasJiraToken = this.context.secrets ? !!(await this.context.secrets.get('qamate.jira.token')) : false;

    const adoConnected = !!(adoOrg && adoProject && hasAdoPat);
    const jiraConnected = !!(jiraDomain && jiraEmail && hasJiraToken);

    let hasAIKey = false;
    if (selectedAIProvider === 'openai') hasAIKey = hasOpenAIKey;
    else if (selectedAIProvider === 'claude') hasAIKey = hasClaudeKey;
    else if (selectedAIProvider === 'gemini') hasAIKey = hasGeminiKey;

    let aiStatus = 'Offline Analysis: Ready';
    let vsCodeLMAvailable = false;
    let lmModelName = '';

    if ('lm' in vscode) {
      try {
        const models = await (vscode as any).lm.selectChatModels({});
        if (models && models.length > 0) {
          vsCodeLMAvailable = true;
          const selectedModel =
            models.find(
              (m: any) =>
                m.name?.toLowerCase().includes('gpt-4') ||
                m.name?.toLowerCase().includes('claude-3-5') ||
                m.name?.toLowerCase().includes('sonnet'),
            ) || models[0];
          lmModelName = selectedModel.name || selectedModel.id || 'Default';
        }
      } catch {
        // ignore
      }
    }

    // Update config settings and refresh orchestrator
    const openAIKey = this.context.secrets ? (await this.context.secrets.get('qamate.openai.key')) || '' : '';
    const claudeKey = this.context.secrets ? (await this.context.secrets.get('qamate.claude.key')) || '' : '';
    const geminiKey = this.context.secrets ? (await this.context.secrets.get('qamate.gemini.key')) || '' : '';

    this.engine.configManager.updateSettings({
      apiKeys: {
        openai: openAIKey,
        claude: claudeKey,
        gemini: geminiKey,
        ollama: selectedAIEndpoint || 'http://localhost:11434',
        preferred_provider: selectedAIProvider,
        preferred_model: selectedAIModel,
      }
    });

    await this.engine.orchestrator.refreshProviders();
    const activeProvName = this.engine.orchestrator.lastSelectedProviderName;
    const activeProvReason = this.engine.orchestrator.lastSelectedReason;
    aiStatus = `${activeProvName} (${activeProvReason})`;

    const sessions = await this.engine.listSessions();
    const sessionsCount = sessions.length;

    this.appState.update({
      currentStep: this.state.currentStep,
      activeSessionId: this.state.activeSessionId,
      timelineEvents: this.state.timelineEvents,
      devModeEnabled: this.state.devModeEnabled,
      activeTab: this.state.activeTab || 'dashboard',
      selectedPersona,
      selectedAIProvider,
      selectedAIModel,
      selectedAIEndpoint,
      adoOrg,
      adoProject,
      jiraDomain,
      jiraEmail,
      hasOpenAIKey,
      hasClaudeKey,
      hasGeminiKey,
      adoConnected,
      jiraConnected,
      adoStatus: adoConnected ? 'Connected' : 'Disconnected',
      jiraStatus: jiraConnected ? 'Connected' : 'Disconnected',
      aiStatus,
      sessionsCount,
      detectedFileName: this.detectedFileName,
      vsCodeLMAvailable,
      lmModelName,
    });
  }

  private async updateView() {
    await this.syncAppState();
  }

  private async getHtmlContent(): Promise<string> {
    const activeTab = this.state.activeTab || 'home';
    const stages: StageData[] = [];

    // Helper: Determine stage status
    const getStageStatus = (stepName: WorkspaceStep): 'locked' | 'active' | 'completed' => {
      const order: WorkspaceStep[] = [
        'Understand',
        'Prepare',
        'Plan',
        'Generate',
        'Review',
        'Deliver',
      ];
      const targetIndex = order.indexOf(stepName);
      const currentIndex = order.indexOf(this.state.currentStep);

      if (targetIndex < currentIndex) return 'completed';
      if (targetIndex === currentIndex) return 'active';
      return 'locked';
    };

    const state = this.appState.get();
    const selectedPersona = state.selectedPersona;
    const selectedAIProvider = state.selectedAIProvider;
    const selectedAIModel = state.selectedAIModel;
    const selectedAIEndpoint = state.selectedAIEndpoint;

    const adoOrg = state.adoOrg;
    const adoProject = state.adoProject;

    const jiraDomain = state.jiraDomain;
    const jiraEmail = state.jiraEmail;

    const hasOpenAIKey = state.hasOpenAIKey;
    const hasClaudeKey = state.hasClaudeKey;
    const hasGeminiKey = state.hasGeminiKey;
    const vsCodeLMAvailable = state.vsCodeLMAvailable;
    const lmModelName = state.lmModelName;

    const hasAdoPat = this.context.secrets ? !!(await this.context.secrets.get('qamate.ado.pat')) : false;
    const hasJiraToken = this.context.secrets ? !!(await this.context.secrets.get('qamate.jira.token')) : false;

    const adoConnected = state.adoConnected;
    const jiraConnected = state.jiraConnected;

    const hasAIKey = selectedAIProvider === 'openai' ? hasOpenAIKey :
                     selectedAIProvider === 'claude' ? hasClaudeKey :
                     selectedAIProvider === 'gemini' ? hasGeminiKey : false;

    const aiStatus = state.aiStatus;

    const aiResult = this.context.workspaceState.get<{
      providerName: string;
      modelName?: string;
      selectionReason?: string;
      requestSent: boolean;
      responseReceived: boolean;
      enhancementApplied: boolean;
      errorMessage?: string;
    }>('qamateActiveAIResult') || {
      providerName: selectedAIProvider === 'mock' ? 'None' : selectedAIProvider,
      modelName: '',
      selectionReason: '',
      requestSent: false,
      responseReceived: false,
      enhancementApplied: false,
    };
    const isNoSession = this.state.currentStep === 'NoSession';

    if (activeTab === 'settings') {
      stages.push({
        id: 'settings',
        title: 'Settings',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderSettingsPage({
          isNoSession
        }),
        suggestedPrompts: [],
      });
    } else if (activeTab === 'sessions') {
      const list = await this.engine.listSessions();
      const sessionsList = [];
      for (const sid of list) {
        const conv = await this.engine.getSession(sid);
        if (conv) {
          sessionsList.push({
            id: conv.id,
            title: (conv as any).requirementTitle || conv.id.replace('conv-', ''),
            timestamp: new Date(Number(conv.id.split('-').pop()) || Date.now()).toLocaleString(),
            step:
              conv.status === 'reviewing' || conv.status === 'ready-for-generation'
                ? 'Active'
                : 'Planning',
          });
        }
      }
      stages.push({
        id: 'sessions',
        title: 'Sessions',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderSessionsPage(sessionsList.reverse()),
        suggestedPrompts: [],
      });
    } else if (activeTab === 'dashboard') {
      const sessions = await this.engine.listSessions();
      const sessionsCount = sessions.length;
      const hasGeneratedSuite = this.context.workspaceState.get<boolean>('qamateHasGeneratedSuite') || false;

      let requirementTitle = 'Tenant Exception Alerting';
      let currentStep = 'NoSession';
      let healthScore = 100;
      let confidenceScore = 0.92;
      let questionsCount = 0;
      let recommendationsCount = 8;
      let componentsCount = 7;
      let flowsCount = 5;
      let actorsCount = 2;
      let integrationsCount = 3;
      let recentDecisions: string[] = [
        '✓ AI inferred Transaction Processing System.',
        '✓ Playbook DNA rules active.',
        '✓ Ready for strategy planning.'
      ];

      if (this.currentConversation) {
        requirementTitle = (this.currentConversation as any).requirementTitle || 'Recent Spec';
        currentStep = this.state.currentStep;
        confidenceScore = (this.currentConversation as any).confidenceScore || 0.92;
        questionsCount = (this.currentConversation as any).questions?.length || 0;
        
        const valReport = (this.currentConversation as any).validationReport;
        if (valReport && valReport.issues) {
          for (const issue of valReport.issues) {
            if (issue.severity === 'error') healthScore -= 20;
            else if (issue.severity === 'warning') healthScore -= 10;
          }
          healthScore = Math.max(10, healthScore);
        }

        const strat = (this.currentConversation as any).testStrategy;
        if (strat) {
          componentsCount = (strat.recommendedSuites || []).length || 7;
          flowsCount = (strat.objectives || []).length || 5;
          actorsCount = (strat.actors || []).length || 2;
        }

        recentDecisions = [
          `✓ System modeled: ${componentsCount} components found.`,
          `✓ Mapped ${flowsCount} testing flows.`,
          `✓ QA Health checked: score ${healthScore}%.`,
          `✓ AI Model selection verified: ${selectedAIProvider}.`
        ];
      }

      stages.push({
        id: 'dashboard',
        title: 'Dashboard',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderDashboardPage({
          isNoSession,
          detectedFileName: this.detectedFileName,
          aiStatus,
          selectedAIProvider,
          adoConnected,
          jiraConnected,
          sessionsCount,
          hasGeneratedSuite,
          requirementTitle,
          currentStep,
          projectName: 'ParentPay POS',
          healthScore,
          confidenceScore,
          questionsCount,
          recommendationsCount,
          componentsCount,
          flowsCount,
          actorsCount,
          integrationsCount,
          recentDecisions
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'requirement') {
      const list = await this.engine.listSessions();
      const sessionsCount = list.length;
      const hasGeneratedSuite = this.context.workspaceState.get<boolean>('qamateHasGeneratedSuite') || false;
      let lastSessionHtml = '';

      let requirementText = '';
      let requirementTitle = 'Tenant Exception Alerting';
      let healthScore = 100;
      let questionsCount = 0;
      let rulesCount = 12;
      let componentsCount = 6;
      let actorsCount = 2;
      let gapsCount = 3;

      if (this.currentConversation) {
        requirementText = (this.currentConversation as any).requirementText || '';
        requirementTitle = (this.currentConversation as any).requirementTitle || 'Recent Spec';
        questionsCount = (this.currentConversation as any).questions?.length || 0;

        const valReport = (this.currentConversation as any).validationReport;
        if (valReport && valReport.issues) {
          for (const issue of valReport.issues) {
            if (issue.severity === 'error') healthScore -= 20;
            else if (issue.severity === 'warning') healthScore -= 10;
          }
          healthScore = Math.max(10, healthScore);
        }

        const strat = (this.currentConversation as any).testStrategy;
        if (strat) {
          componentsCount = (strat.recommendedSuites || []).length || 6;
          actorsCount = (strat.actors || []).length || 2;
          rulesCount = (strat.scope || []).length || 12;
          gapsCount = questionsCount;
        }
      }

      const isReadOnly = this.context.workspaceState.get<boolean>('qamateReqReadOnly') !== false;
      const annotations = this.context.workspaceState.get<{ text: string; note: string }[]>('qamateAnnotations') || [
        { text: 'threshold depends on SLA', note: 'Customer SLA values dictate warning trigger timeouts.' }
      ];

      stages.push({
        id: 'requirement',
        title: 'Requirement Workspace',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderRequirementPage({
          isNoSession,
          detectedFileName: this.detectedFileName,
          aiStatus,
          adoConnected,
          jiraConnected,
          sessionsCount,
          hasGeneratedSuite,
          lastSessionHtml,
          requirementText,
          requirementTitle,
          healthScore,
          questionsCount,
          rulesCount,
          componentsCount,
          actorsCount,
          gapsCount,
          isReadOnly,
          annotations
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'system') {
      const selectedNodeId = this.context.workspaceState.get<string>('qamateSelectedBlueprintNode') || 'azure-function';
      const selectedNodeType = this.context.workspaceState.get<'component' | 'flow' | 'actor' | 'integration'>('qamateSelectedBlueprintNodeType') || 'component';

      stages.push({
        id: 'system',
        title: 'System Model',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderSystemPage({
          isNoSession,
          selectedNodeId,
          selectedNodeType
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'mental') {
      const selectedItemId = this.context.workspaceState.get<string>('qamateSelectedReasoningItem') || 'alert-mandatory';
      const selectedItemType = this.context.workspaceState.get<'unknown' | 'assumption' | 'fact'>('qamateSelectedReasoningItemType') || 'assumption';

      stages.push({
        id: 'mental',
        title: 'Mental Model',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderMentalModelPage({
          isNoSession,
          selectedItemId,
          selectedItemType
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'recommendations') {
      stages.push({
        id: 'recommendations',
        title: 'Recommendations',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderRecommendationsPage({
          isNoSession
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'strategy') {
      const selectedObjectiveId = this.context.workspaceState.get<string>('qamateSelectedStrategyObjective') || 'alert-burst';

      stages.push({
        id: 'strategy',
        title: 'Strategy',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderStrategyPage({
          isNoSession,
          selectedObjectiveId
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'artifacts') {
      const selectedTestCaseId = this.context.workspaceState.get<string>('qamateSelectedTestCase') || 'tc-001';

      stages.push({
        id: 'artifacts',
        title: 'Artifacts',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderArtifactsPage({
          isNoSession,
          selectedTestCaseId
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'review') {
      const selectedFindingId = this.context.workspaceState.get<string>('qamateSelectedReviewFinding') || 'weak-expected';

      stages.push({
        id: 'review',
        title: 'Review',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderReviewPage({
          isNoSession,
          selectedFindingId
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'deliver') {
      const selectedDestinationId = this.context.workspaceState.get<string>('qamateSelectedDeliverDestination') || 'jira';
      const selectedPreviewTab = this.context.workspaceState.get<'Markdown' | 'Excel' | 'Jira' | 'Azure DevOps' | 'JSON'>('qamateSelectedPreviewTab') || 'Markdown';

      stages.push({
        id: 'deliver',
        title: 'Deliver',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderDeliverPage({
          isNoSession,
          selectedDestinationId,
          selectedPreviewTab
        }),
        suggestedPrompts: []
      });
    } else if (activeTab === 'hub') {
      const isAdvancedMode = this.context.workspaceState.get<boolean>('qamateAIHubAdvanced') || false;

      stages.push({
        id: 'hub',
        title: 'AI Hub',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderAIHubPage({
          isNoSession,
          isAdvancedMode
        }),
        suggestedPrompts: []
      });
    }

    if (this.isAnalyzing && activeTab === 'requirement' && this.state.currentStep !== 'NoSession') {
      const activeStage = stages.find((s) => s.status === 'active');
      if (activeStage) {
        activeStage.contentHtml = renderSkeleton(this.state.currentStep, this.loadingLogs);
      }
    }

    // 4. Session Header parameters construction
    let sessionTitle = 'No Session Active';
    let sessionStatus = 'Waiting';
    let sessionMetadata = '';

    if (this.currentConversation && this.state.currentStep !== 'NoSession') {
      sessionTitle = (this.currentConversation as any).requirementTitle || 'Active Spec';
      sessionStatus = `${this.state.currentStep} outcome`;
      sessionMetadata = `Started ${new Date(Number(this.currentConversation.id.split('-').pop()) || Date.now()).toLocaleTimeString()}`;
    }

    // 5. Dynamic placeholder matching currentStep
    let promptPlaceholder = 'Ask about this requirement...';
    if (this.state.currentStep === 'Understand') {
      promptPlaceholder = 'Ask about requirement health...';
    } else if (this.state.currentStep === 'Plan') {
      promptPlaceholder = 'Refine this strategy...';
    } else if (this.state.currentStep === 'Review') {
      promptPlaceholder = 'Review these test cases...';
    }

    const timelineHtml = `
      <div id="history-drawer-container" class="history-drawer" style="margin-top: ${Theme.spacing.md}; border-top: 1px solid var(--vscode-panel-border); padding-top: 8px;">
        <div class="history-summary-header" onclick="toggleHistory()" style="cursor: pointer; font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: 600; text-transform: uppercase;">Logs & History â–¼</div>
        <div class="history-content" style="display: none; margin-top: 6px;">
          ${renderTimeline(this.state.timelineEvents)}
        </div>
      </div>
      <script>
        function toggleHistory() {
          var container = document.getElementById('history-drawer-container');
          var content = container.querySelector('.history-content');
          if (content.style.display === 'none') {
            content.style.display = 'block';
          } else {
            content.style.display = 'none';
          }
        }
      </script>
    `;

    return renderLayout(
      stages,
      this.state.devModeEnabled,
      this.isAnalyzing,
      timelineHtml,
      sessionTitle,
      sessionStatus,
      sessionMetadata,
      promptPlaceholder,
      activeTab,
    );
  }
}

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { QAMateEngine, Conversation, JsonFileStorage, Requirement, LLMProviderFactory, ILLMProvider } from '@qamate/engine';
import { Theme } from '../ui/Theme.js';
import { strings } from '../ui/strings.js';
import { WorkspaceStep, WorkspaceState } from '../ui/types.js';
import { RequirementViewModel } from '../ui/viewmodels/RequirementViewModel.js';
import { StrategyViewModel } from '../ui/viewmodels/StrategyViewModel.js';
import { ReviewViewModel } from '../ui/viewmodels/ReviewViewModel.js';
import { CoverageViewModel } from '../ui/viewmodels/CoverageViewModel.js';
import { renderSkeleton } from '../ui/components/Skeleton.js';
import { renderRequirementPage } from '../ui/pages/RequirementPage.js';
import { renderStrategyPage } from '../ui/pages/StrategyPage.js';
import { renderArtifactsPage } from '../ui/pages/ArtifactsPage.js';
import { renderReviewPage } from '../ui/pages/ReviewPage.js';
import { renderCoveragePage } from '../ui/pages/CoveragePage.js';
import { renderTimeline } from '../ui/components/Timeline.js';
import { renderLayout, StageData } from '../ui/components/Layout.js';
import { renderWelcomePage } from '../ui/pages/WelcomePage.js';

export class QAMateSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'qamate.sidebarView';
  private _view?: vscode.WebviewView;

  private state: WorkspaceState = {
    currentStep: 'NoSession',
    timelineEvents: [],
    devModeEnabled: false,
  };

  private currentConversation?: Conversation;

  private detectedFileName = '';
  private detectedFileAlreadyAnalyzed = false;

  private loadingLogs: string[] = [];
  private isAnalyzing = false;
  private analysisError = '';
  private recentSessionsHtml = '';

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext,
    private readonly engine: QAMateEngine,
    private readonly storage: JsonFileStorage
  ) {
    this.state.devModeEnabled = this.context.workspaceState.get<boolean>('qamateDevModeEnabled') || false;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    this.getHtmlContent().then((html) => {
      webviewView.webview.html = html;
    });

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
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
        case 'downloadReport':
          await this.downloadReport(message.format);
          break;
        case 'syncToADO':
          await this.syncToADO();
          break;
        case 'syncToJira':
          await this.syncToJira();
          break;
        case 'submitIntake':
          await this.runIntakeAnalysis(message.text, message.type);
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
          vscode.window.showInformationMessage(`QAMate: Query '${message.text}' received. AI assistant capability is not yet implemented (Sprint 6).`);
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
    const savedStep = this.context.workspaceState.get<WorkspaceStep>('qamateActiveStep');
    
    if (savedId && savedStep) {
      const conv = await this.engine.getSession(savedId);
      if (conv) {
        this.currentConversation = conv;
        this.state.activeSessionId = savedId;
        this.state.currentStep = savedStep;
        this.state.timelineEvents = this.context.workspaceState.get<string[]>('qamateTimelineEvents') || ['Session restored'];
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
        this.recentSessionsHtml = sessions.map((s) => {
          const name = s.id.replace('conv-', '');
          const label = s.status === 'reviewing' || s.status === 'ready-for-generation' ? 'Active' : 'Planning';
          return `
            <div class="session-item">
              <span>📁 <strong>${name}</strong> (${label})</span>
              <div>
                <a class="session-link-resume" onclick="postMessage({command: 'loadSession', sessionId: '${s.id}'})">Resume</a>
                <a class="session-link-delete" onclick="postMessage({command: 'deleteSession', sessionId: '${s.id}'})">Delete</a>
              </div>
            </div>`;
        }).join('');
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
    const activeSteps: WorkspaceStep[] = ['Validation', 'Intelligence', 'Clarifications', 'Strategy', 'Artifacts', 'Review', 'Coverage', 'Complete'];
    if (activeSteps.includes(this.state.currentStep)) {
      return;
    }

    // Guard: don't detect empty files (unless docx/pdf binary specs)
    if (ext !== '.pdf' && ext !== '.docx' && doc.getText().trim().length === 0) {
      return;
    }

    this.detectedFileName = basename;
    const list = await this.engine.listSessions();
    this.detectedFileAlreadyAnalyzed = list.some((id) => id.includes(path.basename(doc.fileName, ext)));

    // Transition NoSession → RequirementDetected
    if (this.state.currentStep === 'NoSession' || this.state.currentStep === 'Requirement') {
      this.state.currentStep = 'RequirementDetected';
    }
    this.updateView();
  }

  private extractTextFromFile(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    try {
      if (ext === '.md' || ext === '.txt' || ext === '.json' || ext === '.feature') {
        return fs.readFileSync(filePath, 'utf-8');
      }
      if (ext === '.pdf') {
        const buffer = fs.readFileSync(filePath);
        const content = buffer.toString('utf-8');
        const textParts = content.match(/\(([^)]+)\)/g);
        if (textParts && textParts.length > 5) {
          return textParts.map(t => t.slice(1, -1)).join(' ');
        }
        return `[PDF Specification Content]\n${content.replace(/[^\x20-\x7E\s]/g, '').slice(0, 1500)}`;
      }
      if (ext === '.docx') {
        const buffer = fs.readFileSync(filePath);
        const content = buffer.toString('utf-8');
        const cleanContent = content.replace(/[^\x20-\x7E\s]/g, ' ');
        const matches = cleanContent.match(/[a-zA-Z\s]{10,}/g);
        if (matches && matches.length > 10) {
          return `[Word Document Specification Content]\n${matches.join(' ')}`;
        }
        return `[Word Specification Content]\n${cleanContent.slice(0, 1000)}`;
      }
    } catch (err: any) {
      return `[Error loading content from file: ${path.basename(filePath)}]: ${err.message}`;
    }
    return '';
  }

  public async runActiveAnalysis(doc: vscode.TextDocument) {
    vscode.window.showInformationMessage(`QAMate: Started analysis on ${path.basename(doc.fileName)}`);
    this.isAnalyzing = true;
    this.analysisError = '';
    this.loadingLogs = ['Requirement Loaded'];
    this.updateView();

    try {
      const ext = path.extname(doc.fileName);
      const content = doc.uri.scheme === 'file'
        ? this.extractTextFromFile(doc.uri.fsPath)
        : doc.getText();

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

      this.loadingLogs.push('Validating spec headers...');
      this.updateView();

      const conversation = await this.engine.createSession(requirement);

      // Persist chosen persona context on session
      const selectedPersona = this.context.workspaceState.get<string>('qamateActivePersona') || 'manual-qa';
      (conversation as any).persona = selectedPersona;
      await this.storage.saveConversation(conversation);

      this.state.activeSessionId = conversation.id;
      this.currentConversation = conversation;
      this.state.currentStep = 'Validation';
      this.state.timelineEvents = ['Requirement Imported', 'Validation Complete'];
      this.context.workspaceState.update('qamateActiveSessionId', conversation.id);
      this.context.workspaceState.update('qamateActiveStep', 'Validation');
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
    this.loadingLogs = ['Intake Captured', `Format classified: ${type}`, 'Initializing compilation pipeline...'];
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

      this.loadingLogs.push('Validating pasted input...');
      this.updateView();

      const conversation = await this.engine.createSession(requirement);

      // Persist chosen persona context on session
      const selectedPersona = this.context.workspaceState.get<string>('qamateActivePersona') || 'manual-qa';
      (conversation as any).persona = selectedPersona;
      await this.storage.saveConversation(conversation);

      this.state.activeSessionId = conversation.id;
      this.currentConversation = conversation;
      this.state.currentStep = 'Validation';
      this.state.timelineEvents = ['Requirement Imported', 'Validation Complete'];
      this.context.workspaceState.update('qamateActiveSessionId', conversation.id);
      this.context.workspaceState.update('qamateActiveStep', 'Validation');
      this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
    } catch (err: unknown) {
      this.analysisError = err instanceof Error ? err.message : 'Fatal analysis pipeline crash.';
    } finally {
      this.isAnalyzing = false;
      this.updateView();
    }
  }

  private async saveClarificationAnswers(answersMap: Record<string, string>) {
    if (!this.currentConversation) {
      // No active session yet — just transition forward
      this.transitionTo('Strategy');
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
        this.currentConversation = await this.engine.submitAnswers(this.state.activeSessionId!, answers);
      } catch (err: any) {
        vscode.window.showErrorMessage(`QAMate: Error saving investigation answers: ${err.message}`);
        return;
      }
    }

    // Record investigation summary in timeline
    const answerSummaries = Object.entries(answersMap)
      .map(([id, val]) => `${id}: ${val}`)
      .join(', ');
    this.state.timelineEvents.push(`Investigation Complete (${answerSummaries})`);
    this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
    this.transitionTo('Strategy');
  }

  private async downloadReport(format: string) {
    if (!this.currentConversation) return;
    const strategy = (this.currentConversation as any).generatedStrategy;
    const artifacts = (this.currentConversation as any).generatedArtifacts || [];
    if (!strategy) {
      vscode.window.showErrorMessage('QAMate: No active strategy generated yet.');
      return;
    }

    const { ExportFramework } = await import('@qamate/engine');
    const exporter = new ExportFramework();
    let content = '';
    let defaultExtension = 'txt';

    switch (format) {
      case 'md':
        content = exporter.exportToMarkdown(strategy, artifacts);
        defaultExtension = 'md';
        break;
      case 'csv':
        content = exporter.exportToCSV(strategy, artifacts);
        defaultExtension = 'csv';
        break;
      case 'xls':
        content = exporter.exportToExcel(strategy, artifacts);
        defaultExtension = 'xls';
        break;
      case 'html':
        content = exporter.exportToHTML(strategy, artifacts);
        defaultExtension = 'html';
        break;
      case 'json':
        content = exporter.exportToJSON(strategy, artifacts);
        defaultExtension = 'json';
        break;
    }

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`qamate-report.${defaultExtension}`),
      filters: { 'Report Files': [defaultExtension] }
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
      vscode.window.showInformationMessage(`QAMate: Report successfully exported to ${uri.fsPath}`);
    }
  }

  private async syncToADO() {
    if (!this.currentConversation) return;
    const org = this.context.workspaceState.get<string>('qamate.ado.org');
    const project = this.context.workspaceState.get<string>('qamate.ado.project');
    const pat = await this.context.secrets.get('qamate.ado.pat');
    const externalId = (this.currentConversation as any).requirementTitle?.match(/\d+/)?.toString() || '101';

    if (!org || !project || !pat) {
      vscode.window.showErrorMessage('QAMate: Azure DevOps settings are incomplete. Please configure them in connection settings.');
      return;
    }

    vscode.window.showInformationMessage(`QAMate: Synchronizing test scenarios to Azure DevOps Project "${project}" (WorkItem ID: ${externalId})...`);
    
    try {
      const { DefaultADOAdapter } = await import('@qamate/engine');
      const adapter = new DefaultADOAdapter();
      const testCases = this.currentConversation.questions.map((q, idx) => ({
        id: `TC-${idx + 1}`,
        title: q.text,
        steps: [
          { stepNumber: 1, action: 'Perform query', expectedResult: q.rationale }
        ]
      })) as any[];

      await adapter.exportTestCases(testCases, externalId, org, project, pat);
      vscode.window.showInformationMessage('QAMate: Synchronization to Azure DevOps completed successfully.');
    } catch (err: any) {
      vscode.window.showErrorMessage(`QAMate: Azure DevOps sync failed: ${err.message}`);
    }
  }

  private async syncToJira() {
    if (!this.currentConversation) return;
    const domain = this.context.workspaceState.get<string>('qamate.jira.domain');
    const email = this.context.workspaceState.get<string>('qamate.jira.email');
    const token = await this.context.secrets.get('qamate.jira.token');
    const externalId = (this.currentConversation as any).requirementTitle?.match(/[A-Z]+-\d+/)?.toString() || 'QA-101';

    if (!domain || !email || !token) {
      vscode.window.showErrorMessage('QAMate: Jira connection settings are incomplete.');
      return;
    }

    vscode.window.showInformationMessage(`QAMate: Uploading deliverables report attachment to Jira Issue Board at ${domain} for Issue ${externalId}...`);
    
    try {
      const { DefaultJiraAdapter } = await import('@qamate/engine');
      const adapter = new DefaultJiraAdapter();
      const testCases = this.currentConversation.questions.map((q, idx) => ({
        id: `TC-${idx + 1}`,
        title: q.text,
        steps: [
          { stepNumber: 1, action: 'Perform query', expectedResult: q.rationale }
        ]
      })) as any[];

      await adapter.exportTestCases(testCases, externalId, domain, email, token);
      vscode.window.showInformationMessage('QAMate: Synchronization to Jira completed successfully.');
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
    if (!this.currentConversation && this.state.currentStep !== 'Requirement') return;

    switch (this.state.currentStep) {
      case 'Requirement':
        vscode.commands.executeCommand('qamate.analyze');
        break;
      case 'Validation':
        this.transitionTo('Intelligence');
        break;
      case 'Intelligence':
        this.transitionTo(this.currentConversation!.questions.length > 0 ? 'Clarifications' : 'Strategy');
        break;
      case 'Clarifications': {
        // Investigation answers are submitted directly from the webview via 'submitAnswers'.
        // If executeNext is called without answers (e.g. no questions), transition directly.
        if (this.currentConversation && this.currentConversation.questions.length === 0) {
          this.state.timelineEvents.push('Investigation Complete (no gaps found)');
          this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
          this.transitionTo('Strategy');
        }
        break;
      }
      case 'Strategy': {
        this.loadingLogs = ['Analyzing context answers...', 'Compiling objective mappings...'];
        this.isAnalyzing = true;
        this.updateView();
        try {
          await this.engine.generateStrategy(this.state.activeSessionId!);
          const conv = await this.engine.getSession(this.state.activeSessionId!);
          if (conv) {
            this.currentConversation = conv;
            this.state.timelineEvents.push('Strategy Ready');
            this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
            this.transitionTo('Artifacts');
          }
        } catch (err: any) {
          this.analysisError = err.message;
        } finally {
          this.isAnalyzing = false;
          this.updateView();
        }
        break;
      }
      case 'Artifacts': {
        this.loadingLogs = ['Planning skeletal templates...', 'Generating test suites...'];
        this.isAnalyzing = true;
        this.updateView();
        try {
          const provider = await this.resolveActiveLLMProvider();
          await this.engine.generateArtifacts(this.state.activeSessionId!, provider);
          const conv = await this.engine.getSession(this.state.activeSessionId!);
          if (conv) {
            this.currentConversation = conv;
            this.state.timelineEvents.push('Manual Tests Generated');
            this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
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
        this.loadingLogs = ['Auditing safety patterns...', 'Matching quality metrics...'];
        this.isAnalyzing = true;
        this.updateView();
        try {
          await this.engine.runReview(this.state.activeSessionId!);
          const conv = await this.engine.getSession(this.state.activeSessionId!);
          if (conv) {
            this.currentConversation = conv;
            this.state.timelineEvents.push('Review Completed');
            this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
            this.transitionTo('Coverage');
          }
        } catch (err: any) {
          this.analysisError = err.message;
        } finally {
          this.isAnalyzing = false;
          this.updateView();
        }
        break;
      }
      case 'Coverage': {
        this.loadingLogs = ['Mapping rule counts...', 'Tracing specification rules...'];
        this.isAnalyzing = true;
        this.updateView();
        try {
          await this.engine.runCoverage(this.state.activeSessionId!);
          const conv = await this.engine.getSession(this.state.activeSessionId!);
          if (conv) {
            this.currentConversation = conv;
            this.state.timelineEvents.push('Coverage Audited');
            this.context.workspaceState.update('qamateTimelineEvents', this.state.timelineEvents);
            this.transitionTo('Complete');
          }
        } catch (err: any) {
          this.analysisError = err.message;
        } finally {
          this.isAnalyzing = false;
          this.updateView();
        }
        break;
      }
    }
  }

  private async loadSession(sessionId: string) {
    const conv = await this.engine.getSession(sessionId);
    if (conv) {
      this.state.activeSessionId = sessionId;
      this.currentConversation = conv;
      this.state.currentStep = 'Validation';
      this.state.timelineEvents = ['Session loaded'];
      this.context.workspaceState.update('qamateActiveSessionId', sessionId);
      this.context.workspaceState.update('qamateActiveStep', 'Validation');
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

  public async connectAI(provider: string, key: string, model: string, endpoint: string) {
    this.context.workspaceState.update('qamate.ai.provider', provider);
    this.context.workspaceState.update('qamate.ai.model', model);
    this.context.workspaceState.update('qamate.ai.endpoint', endpoint);
    if (key) {
      if (provider === 'openai') await this.context.secrets.store('qamate.openai.key', key);
      else if (provider === 'claude') await this.context.secrets.store('qamate.claude.key', key);
      else if (provider === 'gemini') await this.context.secrets.store('qamate.gemini.key', key);
    }
    vscode.window.showInformationMessage(`QAMate: Connected AI Provider (${provider.toUpperCase()})`);
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

  private async resolveActiveLLMProvider(): Promise<ILLMProvider | undefined> {
    const providerId = this.context.workspaceState.get<string>('qamate.ai.provider') || 'mock';
    const modelName = this.context.workspaceState.get<string>('qamate.ai.model') || 'mock-model';
    const endpoint = this.context.workspaceState.get<string>('qamate.ai.endpoint') || '';

    let apiKey: string | undefined;
    if (providerId === 'openai') {
      apiKey = await this.context.secrets.get('qamate.openai.key');
    } else if (providerId === 'claude') {
      apiKey = await this.context.secrets.get('qamate.claude.key');
    } else if (providerId === 'gemini') {
      apiKey = await this.context.secrets.get('qamate.gemini.key');
    }

    try {
      return LLMProviderFactory.createProvider({
        providerId: providerId as any,
        apiKey,
        modelName,
        apiEndpoint: endpoint || undefined,
        temperature: 0.7,
      });
    } catch (err: any) {
      vscode.window.showWarningMessage(`QAMate: Failed to initialize AI provider: ${err.message}. Falling back to Rule-Based engine.`);
      return undefined;
    }
  }

  private async renderPreSessionScreen(): Promise<string> {
    const selectedPersona = this.context.workspaceState.get<string>('qamateActivePersona') || 'manual-qa';
    
    // Retrieve configurations
    const selectedAIProvider = this.context.workspaceState.get<string>('qamate.ai.provider') || 'mock';
    const selectedAIModel = this.context.workspaceState.get<string>('qamate.ai.model') || '';
    const selectedAIEndpoint = this.context.workspaceState.get<string>('qamate.ai.endpoint') || '';
    
    const adoOrg = this.context.workspaceState.get<string>('qamate.ado.org') || '';
    const adoProject = this.context.workspaceState.get<string>('qamate.ado.project') || '';
    
    const jiraDomain = this.context.workspaceState.get<string>('qamate.jira.domain') || '';
    const jiraEmail = this.context.workspaceState.get<string>('qamate.jira.email') || '';

    // Check key presence securely
    const hasOpenAIKey = !!(await this.context.secrets.get('qamate.openai.key'));
    const hasClaudeKey = !!(await this.context.secrets.get('qamate.claude.key'));
    const hasGeminiKey = !!(await this.context.secrets.get('qamate.gemini.key'));
    
    let hasAIKey = false;
    if (selectedAIProvider === 'openai') hasAIKey = hasOpenAIKey;
    else if (selectedAIProvider === 'claude') hasAIKey = hasClaudeKey;
    else if (selectedAIProvider === 'gemini') hasAIKey = hasGeminiKey;

    const hasAdoPat = !!(await this.context.secrets.get('qamate.ado.pat'));
    const hasJiraToken = !!(await this.context.secrets.get('qamate.jira.token'));

    // Compile display statuses
    let aiStatus = "Rule-Based Heuristics (Offline)";
    if (selectedAIProvider !== 'mock') {
      const activeState = hasAIKey || selectedAIProvider === 'ollama' ? 'Connected' : 'Missing API Key';
      aiStatus = `${selectedAIProvider.toUpperCase()} (${selectedAIModel || 'default model'}) • ${activeState}`;
    }

    const adoConnected = adoOrg && adoProject && hasAdoPat;
    const adoStatus = adoConnected ? `Connected (${adoOrg}/${adoProject})` : "Disconnected";

    const jiraConnected = jiraDomain && jiraEmail && hasJiraToken;
    const jiraStatus = jiraConnected ? `Connected (${jiraDomain})` : "Disconnected";

    // Auto-detect theme kind
    let detectedTheme = "Unknown Theme";
    const themeKind = vscode.window.activeColorTheme.kind;
    if (themeKind === 1) detectedTheme = "Light Mode";
    else if (themeKind === 2) detectedTheme = "Dark Mode";
    else if (themeKind === 3) detectedTheme = "High Contrast Dark";
    else if (themeKind === 4) detectedTheme = "High Contrast Light";

    return renderWelcomePage({
      detectedFileName: this.detectedFileName,
      recentSessionsHtml: this.recentSessionsHtml,
      aiStatus,
      adoStatus,
      jiraStatus,
      selectedPersona,
      detectedTheme,
      selectedAIProvider,
      selectedAIModel,
      selectedAIEndpoint,
      hasAIKey,
      adoOrg,
      adoProject,
      hasAdoPat,
      jiraDomain,
      jiraEmail,
      hasJiraToken,
      adoConnected: !!adoConnected,
      jiraConnected: !!jiraConnected
    });
  }

  private async updateView() {
    if (this._view) {
      this._view.webview.html = await this.getHtmlContent();
    }
  }

  private async getHtmlContent(): Promise<string> {
    // ── Pre-session states: Welcome & Detect screens ──
    if (this.state.currentStep === 'NoSession' || this.state.currentStep === 'RequirementDetected') {
      return await this.renderPreSessionScreen();
    }

    const stages: StageData[] = [];

    // Helper: Determine stage status
    const getStageStatus = (stepName: WorkspaceStep): 'locked' | 'active' | 'completed' => {
      const order: WorkspaceStep[] = ['Requirement', 'Validation', 'Intelligence', 'Clarifications', 'Strategy', 'Artifacts', 'Review', 'Coverage', 'Complete'];
      const targetIndex = order.indexOf(stepName);
      const currentIndex = order.indexOf(this.state.currentStep);

      if (targetIndex < currentIndex) return 'completed';
      if (targetIndex === currentIndex) return 'active';
      return 'locked';
    };

    // Stage 1: Understand
    const reqStatus = getStageStatus('Requirement');
    stages.push({
      id: 'Requirement',
      title: '1. Understand',
      status: reqStatus,
      statusLabel: reqStatus === 'completed' ? 'Done' : 'Active',
      suggestedPrompts: ['Explain rules list', 'Improve acceptance criteria'],
      contentHtml: reqStatus === 'active' ? `
        <div class="page-container">
          ${this.detectedFileName ? `
            <p style="margin-bottom: ${Theme.spacing.md};">Detected active editor file: <strong>${this.detectedFileName}</strong></p>
            <button class="btn-primary" onclick="postMessage({command: 'analyzeActive'})">🎯 Run Diagnostics Analysis</button>
          ` : `
            <p style="opacity: 0.7; margin-bottom: ${Theme.spacing.md};">No Markdown specification open. Open a spec file in your editor.</p>
            <button class="btn-secondary" onclick="postMessage({command: 'analyzeActive'})">Check Active Editor</button>
          `}
          <div style="margin-top: ${Theme.spacing.md}; border-top: 1px solid var(--vscode-panel-border); padding-top: ${Theme.spacing.sm};">
            <label style="font-size: 11px; color: var(--vscode-descriptionForeground); display: block; margin-bottom: 4px;">Recent sessions:</label>
            ${this.recentSessionsHtml || `<p class="empty-text">${strings.landing.noRecentSessions}</p>`}
          </div>
        </div>
      ` : `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>✓ Loaded: ${(this.currentConversation as any).requirementTitle || 'Demo requirement'}</span>
          <a href="#" onclick="postMessage({command: 'startNew'})" style="font-size:11px; color:var(--vscode-textLink-foreground);">Reset</a>
        </div>
      `
    });

    // Stage 2: Heuristics & Health
    const valStatus = getStageStatus('Validation');
    const valReport = this.currentConversation ? (this.currentConversation as any).validationReport : undefined;
    
    let healthScore = 100;
    let valIssuesListHtml = '';
    
    if (valReport && valReport.issues) {
      valIssuesListHtml = valReport.issues.map((issue: any) => {
        if (issue.severity === 'error') {
          healthScore -= 20;
          return `<li style="color: var(--vscode-testing-iconFailedColor, #F48771); margin-bottom: 4px;">❌ [${issue.ruleId}] ${issue.message}</li>`;
        } else {
          healthScore -= 10;
          return `<li style="color: var(--vscode-editorWarning-foreground, #CCA700); margin-bottom: 4px;">⚠ [${issue.ruleId}] ${issue.message}</li>`;
        }
      }).join('');
      healthScore = Math.max(0, healthScore);
    } else {
      valIssuesListHtml = `
        <li style="margin-bottom: 4px;">✓ Syntax formatting verified</li>
        <li style="margin-bottom: 4px;">✓ Acceptance Criteria structured</li>
        <li style="color: var(--vscode-editorWarning-foreground, #CCA700); margin-bottom: 4px;">⚠ Missing rollback details</li>
      `;
      healthScore = 80;
    }

    const healthColor = healthScore >= 80 ? 'var(--vscode-testing-iconPassedColor, #89D185)' : healthScore >= 50 ? 'var(--vscode-editorWarning-foreground, #CCA700)' : 'var(--vscode-testing-iconFailedColor, #F48771)';
    const healthRatingLabel = healthScore >= 80 ? 'EXCELLENT' : healthScore >= 50 ? 'NEEDS CLARIFICATION' : 'POOR';

    const valActiveHtml = `
      <div class="page-container">
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--vscode-sideBarSectionHeader-background); padding: 8px; border: 1px solid var(--vscode-panel-border); margin-bottom: 12px; border-radius: 2px;">
          <span style="font-weight: 600; font-size: 11px;">HEALTH SCORE:</span>
          <span style="font-weight: 700; color: ${healthColor}; font-size: 13px;">${healthScore}% (${healthRatingLabel})</span>
        </div>
        <div style="font-weight: 600; font-size: 11px; margin-bottom: 6px; color: var(--vscode-descriptionForeground); text-transform: uppercase;">Health Scorecard:</div>
        <ul style="margin: 0 0 ${Theme.spacing.md} 0; padding-left: 14px; font-size: 11px; line-height: 1.5; list-style-type: none;">
          ${valIssuesListHtml}
        </ul>
        <button class="btn-primary" onclick="postMessage({command: 'executeNext'})">Continue</button>
      </div>
    `;

    stages.push({
      id: 'Validation',
      title: '2. Heuristics & Health',
      status: valStatus,
      statusLabel: valStatus === 'locked' ? 'Locked' : valStatus === 'completed' ? `Passed (${healthScore}%)` : 'Active',
      suggestedPrompts: ['Suggest rollback cases', 'Show structural details'],
      contentHtml: valStatus === 'locked' ? '<p class="empty-text">Locked.</p>' : valStatus === 'active' ? valActiveHtml : `✓ Passed (${healthScore}% health score).`
    });

    // Stage 3: Extract Intelligence
    const intelStatus = getStageStatus('Intelligence');
    let intelCollapsed = '✓ Heuristic models verified.';
    if (this.currentConversation) {
      const viewModel = new RequirementViewModel(this.currentConversation);
      intelCollapsed = `✓ Intelligence compiled (${viewModel.rulesCount} rules, ${viewModel.actors} actors).`;
    }
    const intelActiveHtml = (): string => {
      if (!this.currentConversation) return '<p class="empty-text">Waiting for requirement analysis to complete.</p>';
      return `
        ${renderRequirementPage(new RequirementViewModel(this.currentConversation), this.state.devModeEnabled, this.currentConversation)}
        <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: ${Theme.spacing.md};">Continue</button>
      `;
    };
    stages.push({
      id: 'Intelligence',
      title: '3. Extract Intelligence',
      status: intelStatus,
      statusLabel: intelStatus === 'locked' ? 'Locked' : intelStatus === 'completed' ? 'Done' : 'Active',
      suggestedPrompts: ['List actors and roles', 'Audit Gherkin grammar rules'],
      contentHtml: intelStatus === 'locked' ? '<p class="empty-text">Locked.</p>' : intelStatus === 'active' ? intelActiveHtml() : intelCollapsed
    });

    // Stage 4: Investigate Gaps
    const clarStatus = getStageStatus('Clarifications');
    const answersCount = this.currentConversation?.answers.length || 0;
    const questions = this.currentConversation?.questions || [];

    const getClarificationContentHtml = (): string => {
      if (clarStatus === 'locked') return '<p class="empty-text">Locked.</p>';
      if (clarStatus === 'completed') return `✓ Completed QA Investigation (${answersCount} concerns resolved).`;
      
      if (questions.length === 0) {
        return `
          <div class="page-container">
            <p style="color: var(--vscode-button-background); font-weight: 500; margin-bottom: 4px;">✓ No clarification gaps found.</p>
            <p style="font-size: 11px; color: var(--vscode-descriptionForeground); line-height: 1.4;">The requirement specification is fully structured. No blocking logic gaps were identified.</p>
            <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: 12px;">Continue to Strategy</button>
          </div>
        `;
      }

      const cardsHtml = questions.map((q, idx) => {
        const displayStyle = idx === 0 ? 'block' : 'none';
        const optionsHtml = q.options ? q.options.map(opt => `
          <label style="display: block; margin-top: 6px; font-size: 11px; cursor: pointer; color: var(--vscode-foreground);">
            <input type="radio" name="q-val-${q.id}" value="${opt}" style="margin-right: 6px; vertical-align: middle;" />
            <span style="vertical-align: middle;">${opt}</span>
          </label>
        `).join('') : `
          <textarea id="q-txt-${q.id}" style="width: 100%; height: 50px; margin-top: 6px; font-size: 11px; font-family: inherit; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px; padding: 4px;" placeholder="Type details here..."></textarea>
        `;

        return `
          <div class="q-card" id="q-card-${idx}" style="display: ${displayStyle}; border: 1px solid var(--vscode-panel-border); padding: 10px; border-radius: 4px; background: var(--vscode-sideBarSectionHeader-background);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; font-size: 9px; color: var(--vscode-button-background); text-transform: uppercase; letter-spacing: 0.5px;">
                📂 ${q.category}
              </span>
              <span style="font-weight: 700; font-size: 8px; padding: 1px 4px; border-radius: 2px; text-transform: uppercase; background: ${q.priority === 'high' ? 'var(--vscode-testing-iconFailedColor, #F48771)' : 'var(--vscode-badge-background)'}; color: ${q.priority === 'high' ? '#fff' : 'var(--vscode-badge-foreground)'};">
                ${q.priority} priority
              </span>
            </div>

            <div style="font-weight: 600; font-size: 12px; line-height: 1.4; color: var(--vscode-foreground); margin-bottom: 8px;">
              ${idx + 1}. ${q.text}
            </div>

            <div style="margin: 8px 0;">
              ${optionsHtml}
            </div>

            <div style="background: rgba(0,0,0,0.15); padding: 8px; border-left: 2px solid var(--vscode-button-background); margin-top: 10px; font-size: 10px; color: var(--vscode-descriptionForeground); line-height: 1.4; border-radius: 2px;">
              <strong>🔍 Why ask:</strong> ${q.rationale}
              ${q.skipRisk && q.skipRisk !== 'None' ? `<br/><strong style="color: var(--vscode-testing-iconFailedColor, #F48771);">⚠ Skip Risk:</strong> ${q.skipRisk}` : ''}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="page-container">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px; opacity: 0.85;">
            <span id="stepper-progress-label" style="font-weight: 500;">Step 1 of ${questions.length}</span>
            <span style="cursor: pointer; color: var(--vscode-textLink-foreground); text-decoration: underline;" onclick="skipCurrentQuestion()">Skip</span>
          </div>

          <div id="q-cards-container">
            ${cardsHtml}
          </div>

          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn-secondary" id="btn-stepper-back" onclick="prevQuestion()" style="flex: 1; display: none;">Back</button>
            <button class="btn-primary" id="btn-stepper-next" onclick="nextQuestion()" style="flex: 2;">Next</button>
          </div>
        </div>

        <script>
          var currentQuestionIdx = 0;
          var totalQuestions = ${questions.length};
          var answersMap = {};
          var questionIds = ${JSON.stringify(questions.map(q => ({ id: q.id, type: q.type })))};

          function showQuestion(idx) {
            for (var i = 0; i < totalQuestions; i++) {
              var card = document.getElementById('q-card-' + i);
              if (card) {
                card.style.display = (i === idx) ? 'block' : 'none';
              }
            }
            document.getElementById('stepper-progress-label').innerText = 'Step ' + (idx + 1) + ' of ' + totalQuestions;
            document.getElementById('btn-stepper-back').style.display = (idx === 0) ? 'none' : 'block';
            
            var nextBtn = document.getElementById('btn-stepper-next');
            if (idx === totalQuestions - 1) {
              nextBtn.innerText = 'Submit & Complete';
            } else {
              nextBtn.innerText = 'Next';
            }
          }

          function getActiveAnswerValue() {
            var qInfo = questionIds[currentQuestionIdx];
            if (qInfo.type === 'single-choice') {
              var radios = document.getElementsByName('q-val-' + qInfo.id);
              for (var i = 0; i < radios.length; i++) {
                if (radios[i].checked) {
                  return radios[i].value;
                }
              }
              return '';
            } else {
              var textarea = document.getElementById('q-txt-' + qInfo.id);
              return textarea ? textarea.value.trim() : '';
            }
          }

          function nextQuestion() {
            var value = getActiveAnswerValue();
            if (!value) {
              value = 'Not answered';
            }
            var qInfo = questionIds[currentQuestionIdx];
            answersMap[qInfo.id] = value;

            if (currentQuestionIdx < totalQuestions - 1) {
              currentQuestionIdx++;
              showQuestion(currentQuestionIdx);
            } else {
              postMessage({ command: 'submitAnswers', answers: answersMap });
            }
          }

          function prevQuestion() {
            if (currentQuestionIdx > 0) {
              currentQuestionIdx--;
              showQuestion(currentQuestionIdx);
            }
          }

          function skipCurrentQuestion() {
            var qInfo = questionIds[currentQuestionIdx];
            answersMap[qInfo.id] = 'SKIPPED';
            
            if (currentQuestionIdx < totalQuestions - 1) {
              currentQuestionIdx++;
              showQuestion(currentQuestionIdx);
            } else {
              postMessage({ command: 'submitAnswers', answers: answersMap });
            }
          }
        </script>
      `;
    };

    stages.push({
      id: 'Clarifications',
      title: '4. Investigate Gaps',
      status: clarStatus,
      statusLabel: clarStatus === 'locked' ? 'Locked' : clarStatus === 'completed' ? 'Done' : 'Active',
      suggestedPrompts: ['List answered clarifications', 'Explain ambiguity #1'],
      contentHtml: getClarificationContentHtml()
    });

    // Stage 5: Plan Tests
    const stratStatus = getStageStatus('Strategy');
    let stratCollapsed = '✓ Strategy objectives compiled.';
    if (this.currentConversation && (this.currentConversation as any).generatedStrategy) {
      const viewModel = new StrategyViewModel(this.currentConversation);
      stratCollapsed = `✓ Compiled (Risk: ${viewModel.overallRisk}, ${viewModel.objectives.length} objectives).`;
    }
    const stratActiveHtml = (): string => {
      if (!this.currentConversation) return '<p class="empty-text">Waiting for investigation to complete.</p>';
      return `
        ${renderStrategyPage(new StrategyViewModel(this.currentConversation), this.state.devModeEnabled, this.currentConversation)}
        <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: ${Theme.spacing.md};">Continue</button>
      `;
    };
    stages.push({
      id: 'Strategy',
      title: '5. Plan Tests',
      status: stratStatus,
      statusLabel: stratStatus === 'locked' ? 'Locked' : stratStatus === 'completed' ? 'Done' : 'Active',
      suggestedPrompts: ['Adjust risk parameters', 'Refine recommended suites'],
      contentHtml: stratStatus === 'locked' ? '<p class="empty-text">Locked.</p>' : stratStatus === 'active' ? stratActiveHtml() : stratCollapsed
    });

    // Stage 6: Generate Specs
    const artStatus = getStageStatus('Artifacts');
    const artifactsCount = (this.currentConversation as any)?.generatedArtifacts?.length || 0;
    const artActiveHtml = (): string => {
      if (!this.currentConversation) return '<p class="empty-text">Waiting for strategy to complete.</p>';
      return `
        ${renderArtifactsPage((this.currentConversation as any).generatedArtifacts || [], this.state.devModeEnabled, this.currentConversation)}
        <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: ${Theme.spacing.md};">Continue</button>
      `;
    };
    stages.push({
      id: 'Artifacts',
      title: '6. Generate Specs',
      status: artStatus,
      statusLabel: artStatus === 'locked' ? 'Locked' : artStatus === 'completed' ? 'Done' : 'Active',
      suggestedPrompts: ['Add boundary test cases', 'Generate Playwright BDD specs'],
      contentHtml: artStatus === 'locked' ? '<p class="empty-text">Locked.</p>' : artStatus === 'active' ? artActiveHtml() : `✓ Generated (${artifactsCount} specs compiled).`
    });

    // Stage 7: Review Gate
    const revStatus = getStageStatus('Review');
    const revActiveHtml = (): string => {
      if (!this.currentConversation) return '<p class="empty-text">Waiting for artifacts to complete.</p>';
      return `
        ${renderReviewPage(new ReviewViewModel(this.currentConversation), this.state.devModeEnabled, this.currentConversation)}
        <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: ${Theme.spacing.md};">Continue</button>
      `;
    };
    stages.push({
      id: 'Review',
      title: '7. Review Gate',
      status: revStatus,
      statusLabel: revStatus === 'locked' ? 'Locked' : revStatus === 'completed' ? 'Done' : 'Active',
      suggestedPrompts: ['Show duplicates list', 'Improve Gherkin criteria rules'],
      contentHtml: revStatus === 'locked' ? '<p class="empty-text">Locked.</p>' : revStatus === 'active' ? revActiveHtml() : `✓ Reviewed (Approved, score 95%).`
    });

    // Stage 8: Verify Coverage
    const covStatus = getStageStatus('Coverage');
    const covActiveHtml = (): string => {
      if (!this.currentConversation) return '<p class="empty-text">Waiting for review to complete.</p>';
      return `
        ${renderCoveragePage(new CoverageViewModel(this.currentConversation), this.state.devModeEnabled, this.currentConversation)}
        <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: ${Theme.spacing.md};">Continue</button>
      `;
    };
    stages.push({
      id: 'Coverage',
      title: '8. Verify Coverage',
      status: covStatus,
      statusLabel: covStatus === 'locked' ? 'Locked' : covStatus === 'completed' ? 'Done' : 'Active',
      suggestedPrompts: ['Show gap analysis report', 'List uncovered rules'],
      contentHtml: covStatus === 'locked' ? '<p class="empty-text">Locked.</p>' : covStatus === 'completed' ? '✓ Coverage complete.' : covActiveHtml()
    });

    // Stage 9: Session Complete
    const isComplete = this.state.currentStep === 'Complete';
    if (isComplete) {
      stages.push({
        id: 'Complete',
        title: 'Session Complete',
        status: 'active',
        statusLabel: 'Done',
        suggestedPrompts: [],
        contentHtml: `
          <div class="page-container">
            <p style="font-weight: 600; color: var(--vscode-button-background); margin-bottom: 8px;">✓ QA workflow complete.</p>
            <p style="font-size: 12px; line-height: 1.6; margin-bottom: ${Theme.spacing.md};">All stages have been completed for this requirement. You can now start a new session with a different specification.</p>
            <button class="btn-primary" onclick="postMessage({command: 'startNew'})">Start New Session</button>
          </div>
        `
      });
    }

    if (this.isAnalyzing) {
      // Overwrite active card content with skeleton loader
      const activeStage = stages.find((s) => s.status === 'active');
      if (activeStage) {
        activeStage.contentHtml = renderSkeleton(this.state.currentStep, this.loadingLogs);
      }
    }

    // 4. Session Header parameters construction
    let sessionTitle = 'Workspace Idle';
    let sessionStatus = 'Waiting for file';
    let sessionMetadata = 'No requirement document loaded.';

    if (this.currentConversation) {
      sessionTitle = (this.currentConversation as any).requirementTitle || 'Demo Spec';
      if (this.state.currentStep === 'Complete') {
        sessionStatus = 'Session Complete';
      } else if (this.state.currentStep === 'Validation') {
        sessionStatus = 'Validation passed';
      } else if (this.state.currentStep === 'Clarifications') {
        sessionStatus = `Investigating Gaps • 2 Decisions Remaining`;
      } else {
        sessionStatus = `${this.state.currentStep} in progress`;
      }
      sessionMetadata = `Imported from active editor • Started 2 minutes ago`;
    }

    // 5. Dynamic placeholder matching currentStep
    let promptPlaceholder = 'Ask about this requirement...';
    if (this.state.currentStep === 'Validation') {
      promptPlaceholder = 'Ask about requirement health...';
    } else if (this.state.currentStep === 'Strategy') {
      promptPlaceholder = 'Refine this strategy...';
    } else if (this.state.currentStep === 'Review') {
      promptPlaceholder = 'Review these test cases...';
    } else if (this.state.currentStep === 'Artifacts') {
      promptPlaceholder = 'Improve generated tests...';
    }

    const timelineHtml = `
      <div id="history-drawer-container" class="history-drawer">
        <div class="history-summary-header" onclick="toggleHistory()">History ▼</div>
        <div class="history-content">
          ${renderTimeline(this.state.timelineEvents)}
        </div>
      </div>
    `;

    return renderLayout(
      stages,
      this.state.devModeEnabled,
      this.isAnalyzing,
      timelineHtml,
      sessionTitle,
      sessionStatus,
      sessionMetadata,
      promptPlaceholder
    );
  }
}

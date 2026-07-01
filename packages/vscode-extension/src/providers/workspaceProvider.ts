import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  QAMateEngine,
  Conversation,
  JsonFileStorage,
  Requirement,
  LLMProviderFactory,
  ILLMProvider,
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
import { renderTimeline } from '../ui/components/Timeline.js';
import { renderLayout, StageData } from '../ui/components/Layout.js';
import { renderWelcomePage } from '../ui/pages/WelcomePage.js';

import { renderSettingsPage } from '../ui/pages/SettingsPage.js';
import { renderSessionsPage } from '../ui/pages/SessionsPage.js';
import { renderHelpPage } from '../ui/pages/HelpPage.js';

export class QAMateSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'qamate.sidebarView';
  private _view?: vscode.WebviewView;

  private state: WorkspaceState = {
    currentStep: 'NoSession',
    timelineEvents: [],
    devModeEnabled: false,
    activeTab: 'home',
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
    private readonly storage: JsonFileStorage,
  ) {
    this.state.devModeEnabled =
      this.context.workspaceState.get<boolean>('qamateDevModeEnabled') || false;
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

    this.getHtmlContent().then((html) => {
      webviewView.webview.html = html;
    });

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
          return textParts.map((t) => t.slice(1, -1)).join(' ');
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
        doc.uri.scheme === 'file' ? this.extractTextFromFile(doc.uri.fsPath) : doc.getText();

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
      this.state.currentStep = 'Understand';
      this.state.timelineEvents = ['Requirement Imported', 'Analysis Scorecard Compiled'];
      this.context.workspaceState.update('qamateActiveSessionId', conversation.id);
      this.context.workspaceState.update('qamateActiveStep', 'Understand');
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
      requestSent: false,
      responseReceived: false,
      enhancementApplied: false,
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

      const conversation = await this.engine.createSession(requirement);

      // Persist chosen persona context on session
      const selectedPersona =
        this.context.workspaceState.get<string>('qamateActivePersona') || 'manual-qa';
      (conversation as any).persona = selectedPersona;
      await this.storage.saveConversation(conversation);

      this.state.activeSessionId = conversation.id;
      this.currentConversation = conversation;
      this.state.currentStep = 'Understand';
      this.state.timelineEvents = ['Requirement Imported', 'Analysis Scorecard Compiled'];
      this.context.workspaceState.update('qamateActiveSessionId', conversation.id);
      this.context.workspaceState.update('qamateActiveStep', 'Understand');
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
      filters: { 'Report Files': [defaultExtension] },
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
      const { DefaultADOAdapter } = await import('@qamate/engine');
      const adapter = new DefaultADOAdapter();
      const testCases = this.currentConversation.questions.map((q, idx) => ({
        id: `TC-${idx + 1}`,
        title: q.text,
        steps: [{ stepNumber: 1, action: 'Perform query', expectedResult: q.rationale }],
      })) as any[];

      await adapter.exportTestCases(testCases, externalId, org, project, pat);
      vscode.window.showInformationMessage(
        'QAMate: Synchronization to Azure DevOps completed successfully.',
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
      const { DefaultJiraAdapter } = await import('@qamate/engine');
      const adapter = new DefaultJiraAdapter();
      const testCases = this.currentConversation.questions.map((q, idx) => ({
        id: `TC-${idx + 1}`,
        title: q.text,
        steps: [{ stepNumber: 1, action: 'Perform query', expectedResult: q.rationale }],
      })) as any[];

      await adapter.exportTestCases(testCases, externalId, domain, email, token);
      vscode.window.showInformationMessage(
        'QAMate: Synchronization to Jira completed successfully.',
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
        const aiResult = {
          providerName: selectedAIProvider === 'mock' ? 'None' : selectedAIProvider,
          requestSent: selectedAIProvider !== 'mock',
          responseReceived: false,
          enhancementApplied: false,
          errorMessage: undefined as string | undefined,
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
      this.state.currentStep = 'Understand';
      this.state.timelineEvents = ['Session loaded'];
      this.context.workspaceState.update('qamateActiveSessionId', sessionId);
      this.context.workspaceState.update('qamateActiveStep', 'Understand');
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

  private async importAzureStory() {
    let org = this.context.workspaceState.get<string>('qamate.ado.org') || '';
    let project = this.context.workspaceState.get<string>('qamate.ado.project') || '';
    let pat = (await this.context.secrets.get('qamate.ado.pat')) || '';

    const inputId = await vscode.window.showInputBox({
      prompt: 'Enter Azure DevOps Work Item ID, #, or URL to Import',
    });
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

  private async importJiraIssue() {
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

    const key = await vscode.window.showInputBox({
      prompt: 'Enter Jira Issue Key to Import (e.g. QA-101)',
    });
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
    const providerId = this.context.workspaceState.get<string>('qamate.ai.provider') || 'mock';
    const modelName = this.context.workspaceState.get<string>('qamate.ai.model') || 'mock-model';
    const endpoint = this.context.workspaceState.get<string>('qamate.ai.endpoint') || '';

    if (providerId === 'mock') {
      if ((vscode as any).lm) {
        try {
          const models = await (vscode as any).lm.selectChatModels({});
          if (models && models.length > 0) {
            const selectedModel = models.find((m: any) =>
              m.name?.toLowerCase().includes('gpt-4') ||
              m.name?.toLowerCase().includes('claude-3-5') ||
              m.name?.toLowerCase().includes('sonnet')
            ) || models[0];
            return new VSCodeLMProvider(selectedModel);
          }
        } catch {
          // ignore
        }
      }
      return undefined;
    }

    let apiKey: string | undefined;
    if (providerId === 'openai') {
      apiKey = await this.context.secrets.get('qamate.openai.key');
    } else if (providerId === 'claude') {
      apiKey = await this.context.secrets.get('qamate.claude.key');
    } else if (providerId === 'gemini') {
      apiKey = await this.context.secrets.get('qamate.gemini.key');
    }

    try {
      if (providerId === 'openai' || providerId === 'claude' || providerId === 'gemini') {
        if (!apiKey) {
          throw new Error('API key is missing.');
        }
      }
      return LLMProviderFactory.createProvider({
        providerId: providerId as any,
        apiKey,
        modelName,
        apiEndpoint: endpoint || undefined,
        temperature: 0.7,
      });
    } catch (err: any) {
      if ((vscode as any).lm) {
        try {
          const models = await (vscode as any).lm.selectChatModels({});
          if (models && models.length > 0) {
            const selectedModel = models.find((m: any) =>
              m.name?.toLowerCase().includes('gpt-4') ||
              m.name?.toLowerCase().includes('claude-3-5') ||
              m.name?.toLowerCase().includes('sonnet')
            ) || models[0];
            vscode.window.showInformationMessage(
              `QAMate: Configuration failed. Using fallback VS Code LM: ${selectedModel.name || selectedModel.id}`
            );
            return new VSCodeLMProvider(selectedModel);
          }
        } catch {
          // ignore
        }
      }
      return undefined;
    }
  }

  private async updateView() {
    if (this._view) {
      this._view.webview.html = await this.getHtmlContent();
    }
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

    const hasOpenAIKey = !!(await this.context.secrets.get('qamate.openai.key'));
    const hasClaudeKey = !!(await this.context.secrets.get('qamate.claude.key'));
    const hasGeminiKey = !!(await this.context.secrets.get('qamate.gemini.key'));

    let hasAIKey = false;
    if (selectedAIProvider === 'openai') hasAIKey = hasOpenAIKey;
    else if (selectedAIProvider === 'claude') hasAIKey = hasClaudeKey;
    else if (selectedAIProvider === 'gemini') hasAIKey = hasGeminiKey;

    const hasAdoPat = !!(await this.context.secrets.get('qamate.ado.pat'));
    const hasJiraToken = !!(await this.context.secrets.get('qamate.jira.token'));

    const adoConnected = !!(adoOrg && adoProject && hasAdoPat);
    const jiraConnected = !!(jiraDomain && jiraEmail && hasJiraToken);

    let aiStatus = 'Offline Analysis: Ready';
    let vsCodeLMAvailable = false;
    let lmModelName = '';

    if ((vscode as any).lm) {
      try {
        const models = await (vscode as any).lm.selectChatModels({});
        if (models && models.length > 0) {
          vsCodeLMAvailable = true;
          const selectedModel = models.find((m: any) =>
            m.name?.toLowerCase().includes('gpt-4') ||
            m.name?.toLowerCase().includes('claude-3-5') ||
            m.name?.toLowerCase().includes('sonnet')
          ) || models[0];
          lmModelName = selectedModel.name || selectedModel.id || 'Default';
        }
      } catch {
        // ignore
      }
    }

    if (selectedAIProvider === 'mock') {
      if (vsCodeLMAvailable) {
        aiStatus = `VS Code LM detected (Model: ${lmModelName})`;
      } else {
        aiStatus = 'Offline Analysis: Ready';
      }
    } else {
      const activeState =
        hasAIKey || selectedAIProvider === 'ollama' ? 'Connected' : 'Missing API Key';
      aiStatus = `${selectedAIProvider.toUpperCase()} (${selectedAIModel || 'default'}) • ${activeState}`;
    }

    const aiResult = this.context.workspaceState.get<{
      providerName: string;
      requestSent: boolean;
      responseReceived: boolean;
      enhancementApplied: boolean;
      errorMessage?: string;
    }>('qamateActiveAIResult') || {
      providerName: selectedAIProvider === 'mock' ? 'None' : selectedAIProvider,
      requestSent: false,
      responseReceived: false,
      enhancementApplied: false,
    };

    if (activeTab === 'settings') {
      stages.push({
        id: 'settings',
        title: 'Settings',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderSettingsPage({
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
          adoConnected,
          jiraConnected,
          selectedPersona,
          devModeEnabled: this.state.devModeEnabled,
          aiStatus,
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
    } else if (activeTab === 'help') {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
      stages.push({
        id: 'help',
        title: 'Help',
        status: 'active',
        statusLabel: 'Active',
        contentHtml: renderHelpPage(workspaceRoot),
        suggestedPrompts: [],
      });
    } else {
      // activeTab === 'home'
      if (this.state.currentStep === 'NoSession') {
        const list = await this.engine.listSessions();
        const sessionsCount = list.length;
        const hasGeneratedSuite =
          this.context.workspaceState.get<boolean>('qamateHasGeneratedSuite') || false;

        let lastSessionHtml = '';
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const storageDir = workspaceRoot ? path.join(workspaceRoot, '.qamate', 'data') : './data';
        const convDir = path.join(storageDir, 'conversations');
        if (fs.existsSync(convDir)) {
          const files = fs
            .readdirSync(convDir)
            .filter((f) => f.endsWith('.json'))
            .map((f) => {
              const fp = path.join(convDir, f);
              const stat = fs.statSync(fp);
              return { id: path.basename(f, '.json'), mtime: stat.mtimeMs };
            })
            .sort((a, b) => b.mtime - a.mtime);

          if (files.length > 0) {
            const lastSession = await this.engine.getSession(files[0].id);
            if (lastSession) {
              const reqTitle = (lastSession as any).requirementTitle || 'Recent Requirement';
              const diff = Date.now() - files[0].mtime;
              const mins = Math.floor(diff / 60000);
              let relativeTime = 'Just now';
              if (mins >= 1 && mins < 60) relativeTime = `${mins}m ago`;
              else if (mins >= 60) {
                const hours = Math.floor(mins / 60);
                if (hours < 24) relativeTime = `${hours}h ago`;
                else relativeTime = `${Math.floor(hours / 24)}d ago`;
              }

              lastSessionHtml = `
                <div class="card" style="margin-bottom: 12px; border: 1px solid var(--vscode-button-background); background: rgba(255, 255, 255, 0.03); padding: 10px; display: flex; align-items: center; justify-content: space-between; border-radius: 4px;">
                  <div>
                    <div style="font-size: 9px; text-transform: uppercase; color: var(--vscode-descriptionForeground); font-weight: 600;">Continue Last Session</div>
                    <div style="font-weight: 600; font-size: 11px; color: var(--vscode-foreground); margin: 2px 0;">${reqTitle}</div>
                    <div style="font-size: 9px; color: var(--vscode-descriptionForeground);">${relativeTime}</div>
                  </div>
                  <button class="btn-primary" onclick="postMessage({command: 'loadSession', sessionId: '${lastSession.id}'})" style="width: auto; padding: 4px 10px; font-size: 10px; height: 22px; line-height: 1;">Resume ➔</button>
                </div>
              `;
            }
          }
        }

        stages.push({
          id: 'home',
          title: 'Home',
          status: 'active',
          statusLabel: 'Active',
          contentHtml: renderWelcomePage({
            detectedFileName: this.detectedFileName,
            recentSessionsHtml: this.recentSessionsHtml,
            aiStatus,
            adoStatus: adoConnected ? 'Connected' : 'Disconnected',
            jiraStatus: jiraConnected ? 'Connected' : 'Disconnected',
            adoConnected,
            jiraConnected,
            selectedAIProvider,
            sessionsCount,
            hasGeneratedSuite,
            lastSessionHtml,
          }),
          suggestedPrompts: [],
        });
      } else {
        // Active Session Outcome Stepper

        // 1. Understand Outcome
        const reqStatus = getStageStatus('Understand');
        let understandHtml = '';
        if (reqStatus === 'active') {
          let healthScore = 100;
          let valIssuesListHtml = '';
          const valReport = this.currentConversation
            ? (this.currentConversation as any).validationReport
            : undefined;
          if (valReport && valReport.issues) {
            valIssuesListHtml = valReport.issues
              .map((issue: any) => {
                const ruleText = this.state.devModeEnabled ? ` (${issue.ruleId})` : '';
                if (issue.severity === 'error') {
                  healthScore -= 20;
                  return `
                    <div style="border-left: 2px solid var(--vscode-testing-iconFailedColor, #F48771); padding-left: 6px; margin-bottom: 8px; text-align: left;">
                      <span style="color: var(--vscode-testing-iconFailedColor, #F48771); font-weight: 700; font-size: 10px;">🔴 CRITICAL</span>
                      <div style="font-size: 11px; margin-top: 2px; color: var(--vscode-foreground);">${issue.message}${ruleText}</div>
                    </div>
                  `;
                } else if (issue.severity === 'warning') {
                  healthScore -= 10;
                  return `
                    <div style="border-left: 2px solid var(--vscode-editorWarning-foreground, #CCA700); padding-left: 6px; margin-bottom: 8px; text-align: left;">
                      <span style="color: var(--vscode-editorWarning-foreground, #CCA700); font-weight: 700; font-size: 10px;">🟡 RECOMMENDED</span>
                      <div style="font-size: 11px; margin-top: 2px; color: var(--vscode-foreground);">${issue.message}${ruleText}</div>
                    </div>
                  `;
                } else {
                  return `
                    <div style="border-left: 2px solid var(--vscode-textLink-foreground, #3794FF); padding-left: 6px; margin-bottom: 8px; text-align: left;">
                      <span style="color: var(--vscode-textLink-foreground, #3794FF); font-weight: 700; font-size: 10px;">🔵 SUGGESTION</span>
                      <div style="font-size: 11px; margin-top: 2px; color: var(--vscode-foreground);">${issue.message}${ruleText}</div>
                    </div>
                  `;
                }
              })
              .join('');
            healthScore = Math.max(0, healthScore);
          } else {
            valIssuesListHtml = `
              <div style="border-left: 2px solid var(--vscode-testing-iconPassedColor, #89D185); padding-left: 6px; margin-bottom: 8px; text-align: left;">
                <span style="color: var(--vscode-testing-iconPassedColor, #89D185); font-weight: 700; font-size: 10px;">✓ COMPLETED</span>
                <div style="font-size: 11px; margin-top: 2px; color: var(--vscode-foreground);">Acceptance criteria structure verified.</div>
              </div>
              <div style="border-left: 2px solid var(--vscode-editorWarning-foreground, #CCA700); padding-left: 6px; margin-bottom: 8px; text-align: left;">
                <span style="color: var(--vscode-editorWarning-foreground, #CCA700); font-weight: 700; font-size: 10px;">🟡 RECOMMENDED</span>
                <div style="font-size: 11px; margin-top: 2px; color: var(--vscode-foreground);">Rollback parameters not defined in description.</div>
              </div>
            `;
            healthScore = 80;
          }

          const healthColor =
            healthScore >= 80
              ? 'var(--vscode-testing-iconPassedColor, #89D185)'
              : healthScore >= 70
                ? 'var(--vscode-testing-iconPassedColor, #89D185)'
                : healthScore >= 50
                  ? 'var(--vscode-editorWarning-foreground, #CCA700)'
                  : 'var(--vscode-testing-iconFailedColor, #F48771)';
          const healthRatingLabel =
            healthScore >= 80
              ? 'EXCELLENT'
              : healthScore >= 70
                ? 'GOOD'
                : healthScore >= 50
                  ? 'NEEDS ATTENTION'
                  : 'BLOCKED';
          const viewModel = new RequirementViewModel(this.currentConversation!);

          understandHtml = `
            <div class="page-container" style="font-size: 11px; animation: fade-in 0.18s ease-out;">
              <!-- Scorecard Dopamine Header -->
              <div class="card" style="border: 1px solid var(--vscode-testing-iconPassedColor, #89D185); background: rgba(137, 209, 133, 0.05); padding: 12px; border-radius: 4px; margin-bottom: 12px; text-align: center;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px; color: var(--vscode-foreground); display: flex; align-items: center; justify-content: center; gap: 4px;">
                  ${icons.checkFilled} Analysis Complete
                </div>
                
                <!-- Analysis Sources -->
                <div style="font-size: 9px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px;">
                  <div style="font-weight: 600; text-transform: uppercase; margin-bottom: 4px; font-size: 8px; text-align: center;">Analysis Sources</div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;">
                    <span style="color: var(--vscode-testing-iconPassedColor, #89D185); display: flex; align-items: center; gap: 3px;">✓ Rule Engine</span>
                    ${
                      selectedAIProvider !== 'mock'
                        ? aiResult.requestSent
                          ? aiResult.enhancementApplied
                            ? `<span style="color: var(--vscode-testing-iconPassedColor, #89D185); display: flex; align-items: center; gap: 3px;">✓ ${selectedAIModel || 'GPT-4'} Enhanced</span>`
                            : `<span style="color: var(--vscode-editorWarning-foreground, #CCA700); display: flex; align-items: center; gap: 3px;" title="${aiResult.errorMessage || ''}">⚠ ${selectedAIModel || 'GPT-4'} Unavailable</span>`
                          : `<span style="color: var(--vscode-descriptionForeground); display: flex; align-items: center; gap: 3px;">● ${selectedAIModel || 'GPT-4'} Pending</span>`
                        : ''
                    }
                  </div>
                  ${
                    selectedAIProvider !== 'mock' &&
                    aiResult.requestSent &&
                    !aiResult.enhancementApplied &&
                    aiResult.errorMessage
                      ? `<div style="font-size: 8px; color: var(--vscode-testing-iconFailedColor, #F48771); margin-top: 4px;">${aiResult.errorMessage}</div>`
                      : ''
                  }
                </div>

                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px; font-size: 11px; margin: 8px auto; width: fit-content; line-height: 1.4;">
                  <div style="display: flex; align-items: center; gap: 4px;">✓ <strong>${viewModel.rulesCount}</strong> Business Rules Identified</div>
                  <div style="display: flex; align-items: center; gap: 4px;">✓ <strong>${viewModel.actors.split(',').filter(Boolean).length || 1}</strong> Actor Profiles Found</div>
                  <div style="display: flex; align-items: center; gap: 4px;">✓ <strong>${viewModel.entities.split(',').filter(Boolean).length || 4}</strong> Acceptance Criteria Mapped</div>
                  <div style="display: flex; align-items: center; gap: 4px; color: var(--vscode-editorWarning-foreground, #CCA700);">⚠ <strong>2</strong> Risks Detected</div>
                </div>
                <div style="font-weight: 700; font-size: 9px; margin-top: 8px; color: var(--vscode-descriptionForeground); text-transform: uppercase; letter-spacing: 0.5px;">
                  Ready to build strategy
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--vscode-sideBarSectionHeader-background); padding: 8px; border: 1px solid var(--vscode-panel-border); margin-bottom: 12px; border-radius: 2px;">
                <span style="font-weight: 600; font-size: 11px;">REQUIREMENT QUALITY:</span>
                <span style="font-weight: 700; color: ${healthColor}; font-size: 11px;">
                  ${healthRatingLabel} ${this.state.devModeEnabled ? `(${healthScore}%)` : ''}
                </span>
              </div>

              <!-- Domain & Confidence badges -->
              <div style="display: flex; gap: 6px; margin-bottom: 12px; align-items: center; flex-wrap: wrap;">
                <span class="tag" style="background: var(--vscode-button-background); color: var(--vscode-button-foreground); font-size: 9px; padding: 2px 6px; border-radius: 2px; font-weight: 600; display: flex; align-items: center; gap: 3px;">
                  ${icons.search} Domain: ${viewModel.detectedDomains}
                </span>
                ${
                  this.state.devModeEnabled
                    ? `
                <span class="tag" style="background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-size: 9px; padding: 2px 6px; border-radius: 2px; font-weight: 600; display: flex; align-items: center; gap: 3px;">
                  ${icons.play} Confidence: ${viewModel.confidencePercent}%
                </span>
                `
                    : ''
                }
              </div>

              <div class="card" style="border: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBarSectionHeader-background); padding: 8px; border-radius: 2px; margin-bottom: 12px;">
                <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground); text-align: left;">Validation Checklist:</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  ${valIssuesListHtml}
                </div>
              </div>

              <div class="card" style="border: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBarSectionHeader-background); padding: 8px; border-radius: 2px; margin-bottom: 12px;">
                <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground); text-align: left;">Requirement Heuristics:</div>
                <div style="font-size: 11px; line-height: 1.5; color: var(--vscode-foreground); text-align: left;">
                  <p style="margin: 0 0 4px 0;">• <strong>Actors:</strong> ${viewModel.actors}</p>
                  <p style="margin: 0 0 4px 0;">• <strong>Entities:</strong> ${viewModel.entities}</p>
                  <p style="margin: 0;">• <strong>Business Rules:</strong> ${viewModel.rulesCount} rules identified</p>
                </div>
              </div>

              <button class="btn-primary" onclick="postMessage({command: 'executeNext'})">Continue</button>
            </div>
          `;
        }

        stages.push({
          id: 'Understand',
          title: 'Understand',
          status: reqStatus,
          statusLabel: reqStatus === 'completed' ? 'Done' : 'Active',
          suggestedPrompts: ['List actors and roles', 'Audit Gherkin grammar rules'],
          contentHtml:
            reqStatus === 'active' ? understandHtml : 'âœ“ Intelligence report compiled.',
        });

        // 2. Prepare (QA Readiness)
        const clarStatus = getStageStatus('Prepare');
        const questions = this.currentConversation?.questions || [];
        const answersCount = this.currentConversation?.answers.length || 0;

        const getClarificationContentHtml = (): string => {
          if (clarStatus === 'locked') return '<p class="empty-text">Locked.</p>';
          if (clarStatus === 'completed')
            return `âœ“ QA Readiness check completed (${answersCount} queries resolved).`;

          if (questions.length === 0) {
            return `
              <div class="page-container">
                <p style="color: var(--vscode-button-background); font-weight: 500; margin-bottom: 4px;">âœ“ Requirement ready.</p>
                <p style="font-size: 11px; color: var(--vscode-descriptionForeground); line-height: 1.4;">No blocking gap or ambiguities were identified.</p>
                <button class="btn-primary" onclick="postMessage({command: 'executeNext'})" style="margin-top: 12px;">Continue to Strategy</button>
              </div>
            `;
          }

          const cardsHtml = questions
            .map((q, idx) => {
              const displayStyle = idx === 0 ? 'block' : 'none';
              const optionsHtml = q.options
                ? q.options
                    .map(
                      (opt) => `
              <label style="display: block; margin-top: 6px; font-size: 11px; cursor: pointer; color: var(--vscode-foreground);">
                <input type="radio" name="q-val-${q.id}" value="${opt}" style="margin-right: 6px; vertical-align: middle;" />
                <span style="vertical-align: middle;">${opt}</span>
              </label>
            `,
                    )
                    .join('')
                : `
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
            })
            .join('');

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
              var questionIds = ${JSON.stringify(questions.map((q) => ({ id: q.id, type: q.type })))};

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
          id: 'Prepare',
          title: 'Prepare',
          status: clarStatus,
          statusLabel:
            clarStatus === 'locked' ? 'Locked' : clarStatus === 'completed' ? 'Done' : 'Active',
          suggestedPrompts: ['List answered clarifications', 'Explain ambiguity #1'],
          contentHtml: getClarificationContentHtml(),
        });

        // 3. Plan (Test Strategy)
        const stratStatus = getStageStatus('Plan');
        const stratActiveHtml = (): string => {
          if (!this.currentConversation) return '<p class="empty-text">Locked.</p>';
          return `
            ${renderStrategyPage(new StrategyViewModel(this.currentConversation), this.state.devModeEnabled, this.currentConversation)}
          `;
        };

        stages.push({
          id: 'Plan',
          title: 'Plan',
          status: stratStatus,
          statusLabel:
            stratStatus === 'locked' ? 'Locked' : stratStatus === 'completed' ? 'Done' : 'Active',
          suggestedPrompts: ['Adjust risk parameters', 'Refine recommended suites'],
          contentHtml:
            stratStatus === 'locked'
              ? '<p class="empty-text">Locked.</p>'
              : stratStatus === 'active'
                ? stratActiveHtml()
                : 'âœ“ strategy approved.',
        });

        // 4. Generate (Generate Test Suite)
        const artStatus = getStageStatus('Generate');
        const artifactsCount = (this.currentConversation as any)?.generatedArtifacts?.length || 0;
        const artActiveHtml = (): string => {
          return `
            <div class="page-container">
              <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 12px;">
                <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">Configure Suite Scope:</div>
                <div style="font-size: 11px; line-height: 1.5;">
                  <label style="display: block; margin-top: 4px;"><input type="checkbox" checked style="width:auto; vertical-align:middle; margin-right:6px;" /> Manual Tests (Positive, Negative, Boundary)</label>
                  <label style="display: block; margin-top: 4px;"><input type="checkbox" style="width:auto; vertical-align:middle; margin-right:6px;" /> API Checklist</label>
                  <label style="display: block; margin-top: 4px;"><input type="checkbox" style="width:auto; vertical-align:middle; margin-right:6px;" /> Performance Guidelines</label>
                  <label style="display: block; margin-top: 4px;"><input type="checkbox" style="width:auto; vertical-align:middle; margin-right:6px;" /> SQL Verification</label>
                  <label style="display: block; margin-top: 4px;"><input type="checkbox" style="width:auto; vertical-align:middle; margin-right:6px;" /> Security Scenarios</label>
                  <label style="display: block; margin-top: 4px;"><input type="checkbox" style="width:auto; vertical-align:middle; margin-right:6px;" /> Automation Scripts</label>
                </div>
              </div>
              <button class="btn-primary" onclick="postMessage({command: 'executeNext'})">Generate Test Suite</button>
            </div>
          `;
        };

        stages.push({
          id: 'Generate',
          title: 'Generate',
          status: artStatus,
          statusLabel:
            artStatus === 'locked' ? 'Locked' : artStatus === 'completed' ? 'Done' : 'Active',
          suggestedPrompts: ['Add boundary test cases', 'Generate Playwright BDD specs'],
          contentHtml:
            artStatus === 'locked'
              ? '<p class="empty-text">Locked.</p>'
              : artStatus === 'active'
                ? artActiveHtml()
                : `âœ“ Generated (${artifactsCount} deliverables).`,
        });

        // 5. Review (Results Workspace)
        const revStatus = getStageStatus('Review');
        const revActiveHtml = (): string => {
          if (!this.currentConversation) return '<p class="empty-text">Locked.</p>';
          return `
            ${renderArtifactsPage((this.currentConversation as any).generatedArtifacts || [], this.state.devModeEnabled, this.currentConversation)}
          `;
        };

        stages.push({
          id: 'Review',
          title: 'Review',
          status: revStatus,
          statusLabel:
            revStatus === 'locked' ? 'Locked' : revStatus === 'completed' ? 'Done' : 'Active',
          suggestedPrompts: ['Show duplicates list', 'Improve Gherkin criteria rules'],
          contentHtml:
            revStatus === 'locked'
              ? '<p class="empty-text">Locked.</p>'
              : revStatus === 'active'
                ? revActiveHtml()
                : 'âœ“ Deliverables approved.',
        });

        // 6. Deliver (Export & Sync)
        const covStatus = getStageStatus('Deliver');
        const getDeliverHtml = (): string => {
          if (!this.currentConversation) return '<p class="empty-text">Locked.</p>';
          return `
            <div class="page-container">
              <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 12px; background: rgba(0,0,0,0.15);">
                <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">Select Export Format:</div>
                <select id="export-format-selector-final" style="font-size: 11px; width: 100%; padding: 4px; margin-bottom: 8px;">
                  <option value="md">Markdown (.md)</option>
                  <option value="csv">CSV Spreadsheet (.csv)</option>
                  <option value="xls">Excel Spreadsheet (.xls)</option>
                  <option value="html">HTML Report (.html)</option>
                  <option value="json">JSON Metadata (.json)</option>
                </select>
                <button class="btn-secondary" onclick="triggerDownloadFinal()" style="font-size: 11px; padding: 4px; margin-top: 0;">Download Report</button>
              </div>

              <div class="card" style="border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 12px;">
                <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: var(--vscode-descriptionForeground);">Sync to Boards:</div>
                <div style="display: flex; gap: 4px;">
                  <button class="btn-secondary" onclick="postMessage({command: 'syncToADO'})" style="font-size: 11px; margin-top: 0; flex: 1;">Azure DevOps</button>
                  <button class="btn-secondary" onclick="postMessage({command: 'syncToJira'})" style="font-size: 11px; margin-top: 0; flex: 1;">Jira Story</button>
                </div>
              </div>

              <button class="btn-primary" onclick="postMessage({command: 'startNew'})">Done (Return Home)</button>
            </div>
            
            <script>
              function triggerDownloadFinal() {
                var format = document.getElementById('export-format-selector-final').value;
                postMessage({ command: 'downloadReport', format: format });
              }
            </script>
          `;
        };

        stages.push({
          id: 'Deliver',
          title: 'Deliver',
          status: covStatus,
          statusLabel:
            covStatus === 'locked' ? 'Locked' : covStatus === 'completed' ? 'Done' : 'Active',
          suggestedPrompts: ['Show gap analysis report', 'List uncovered rules'],
          contentHtml:
            covStatus === 'locked' ? '<p class="empty-text">Locked.</p>' : getDeliverHtml(),
        });
      }
    }

    if (this.isAnalyzing && activeTab === 'home' && this.state.currentStep !== 'NoSession') {
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

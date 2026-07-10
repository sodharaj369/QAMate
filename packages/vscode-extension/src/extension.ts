import * as vscode from 'vscode';
import * as path from 'path';
import { ConsoleLogger } from '@qamate/shared';
import { SQLiteDatabaseStorage, QAMateEngine, DefaultJiraAdapter, DefaultADOAdapter, IntegrationHub } from '@qamate/engine';
import { QAMateSidebarProvider } from './providers/workspaceProvider.js';
import { registerOpenWorkspaceCommand } from './commands/openWorkspace.js';
import { registerContinueSessionCommand } from './commands/continueSession.js';
import { registerStartSessionCommand } from './commands/startSession.js';
import { registerAnalyzeCommand } from './commands/analyze.js';

const logger = new ConsoleLogger('VSCodeExtension');

export function activate(context: vscode.ExtensionContext) {
  logger.info('QAMate VS Code Extension activated.');

  // Register Integration Adapters on activation
  IntegrationHub.register(new DefaultJiraAdapter());
  IntegrationHub.register(new DefaultADOAdapter());

  // Initialize SQLite Storage in workspace's .qamate/data folder
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const dbPath = isTest
    ? ':memory:'
    : workspaceRoot
      ? path.join(workspaceRoot, '.qamate', 'data', 'qamate.db')
      : './data/qamate.db';
  const storage = new SQLiteDatabaseStorage(dbPath);
  const engine = new QAMateEngine(storage);

  const provider = new QAMateSidebarProvider(context.extensionUri, context, engine, storage);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(QAMateSidebarProvider.viewType, provider),
  );

  // Bind Command Handlers
  context.subscriptions.push(
    registerOpenWorkspaceCommand(),
    registerContinueSessionCommand(provider),
    registerStartSessionCommand(provider),
    registerAnalyzeCommand(provider),
  );

  // Monitor active editor changes to auto-detect requirement specifications
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      provider.detectRequirementFile(editor.document);
    }
  });

  // Initial detection
  if (vscode.window.activeTextEditor) {
    provider.detectRequirementFile(vscode.window.activeTextEditor.document);
  }
}

export function deactivate() {
  logger.info('QAMate VS Code Extension deactivated.');
}

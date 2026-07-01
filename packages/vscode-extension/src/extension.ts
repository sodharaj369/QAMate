import * as vscode from 'vscode';
import * as path from 'path';
import { ConsoleLogger } from '@qamate/shared';
import { JsonFileStorage, QAMateEngine } from '@qamate/engine';
import { QAMateSidebarProvider } from './providers/workspaceProvider.js';
import { registerOpenWorkspaceCommand } from './commands/openWorkspace.js';
import { registerContinueSessionCommand } from './commands/continueSession.js';
import { registerStartSessionCommand } from './commands/startSession.js';
import { registerAnalyzeCommand } from './commands/analyze.js';

const logger = new ConsoleLogger('VSCodeExtension');

export function activate(context: vscode.ExtensionContext) {
  logger.info('QAMate VS Code Extension activated.');

  // Initialize Storage in workspace's .qamate/data folder
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const storageDir = workspaceRoot ? path.join(workspaceRoot, '.qamate', 'data') : './data';
  const storage = new JsonFileStorage(storageDir);
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

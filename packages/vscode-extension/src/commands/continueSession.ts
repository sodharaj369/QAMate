import * as vscode from 'vscode';
import { QAMateSidebarProvider } from '../providers/workspaceProvider.js';

export function registerContinueSessionCommand(provider: QAMateSidebarProvider): vscode.Disposable {
  return vscode.commands.registerCommand('qamate.continueWorkflow', () => {
    provider.restoreLastSession();
  });
}

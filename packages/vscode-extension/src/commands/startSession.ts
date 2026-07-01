import * as vscode from 'vscode';
import { QAMateSidebarProvider } from '../providers/workspaceProvider.js';

export function registerStartSessionCommand(provider: QAMateSidebarProvider): vscode.Disposable {
  return vscode.commands.registerCommand('qamate.startNewSession', () => {
    provider.startNewSession();
  });
}

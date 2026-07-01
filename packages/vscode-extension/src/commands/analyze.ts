import * as vscode from 'vscode';
import { QAMateSidebarProvider } from '../providers/workspaceProvider.js';

export function registerAnalyzeCommand(provider: QAMateSidebarProvider): vscode.Disposable {
  return vscode.commands.registerCommand('qamate.analyze', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('QAMate: No active text editor open.');
      return;
    }
    await provider.runActiveAnalysis(editor.document);
  });
}

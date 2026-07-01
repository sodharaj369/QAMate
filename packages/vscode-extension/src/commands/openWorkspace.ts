import * as vscode from 'vscode';

export function registerOpenWorkspaceCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('qamate.openWorkspace', () => {
    vscode.commands.executeCommand('workbench.view.extension.qamate-sidebar');
  });
}

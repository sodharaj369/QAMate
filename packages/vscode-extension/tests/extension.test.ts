import { describe, it, expect, vi, afterEach } from 'vitest';

// 1. Mock the VS Code namespace APIs
vi.mock('vscode', () => {
  const registerCommand = vi.fn((_cmd, callback) => {
    return {
      dispose: () => {},
      callback,
    };
  });

  return {
    commands: {
      registerCommand,
    },
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      activeTextEditor: undefined,
      createWebviewPanel: vi.fn(() => ({
        webview: {
          html: '',
        },
      })),
      registerWebviewViewProvider: vi.fn(() => ({
        dispose: () => {},
      })),
      onDidChangeActiveTextEditor: vi.fn(() => ({
        dispose: () => {},
      })),
    },
    workspace: {
      workspaceFolders: undefined,
      openTextDocument: vi.fn(),
    },
    ViewColumn: {
      Two: 2,
    },
    Uri: {
      file: (p: string) => ({ fsPath: p }),
      parse: (u: string) => ({ href: u }),
    },
  };
});

import * as vscode from 'vscode';
import { activate, deactivate } from '../src/extension.js';

describe('VS Code Extension activation tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should activate and register qamate.analyze command', () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: '/' },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
      },
    } as any;

    expect(() => activate(mockContext)).not.toThrow();
    expect(mockContext.subscriptions.length).toBe(5);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'qamate.analyze',
      expect.any(Function),
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'qamate.continueWorkflow',
      expect.any(Function),
    );
  });

  it('should execute analyze callback and show error if no editor is open', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: '/' },
      workspaceState: {
        get: vi.fn(() => undefined),
        update: vi.fn(),
      },
    } as any;

    activate(mockContext);

    // Retrieve the registered callback
    const registerMock = vscode.commands.registerCommand as any;
    const analyzeCall = registerMock.mock.calls.find((call: any) => call[0] === 'qamate.analyze');
    const analyzeCallback = analyzeCall[1];

    // Ensure activeTextEditor is undefined
    (vscode.window as any).activeTextEditor = undefined;

    await analyzeCallback();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'QAMate: No active text editor open.',
    );
  });

  it('should execute analyze callback and update view if active editor is open', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: '/' },
      workspaceState: {
        get: vi.fn(() => undefined),
        update: vi.fn(),
      },
    } as any;

    activate(mockContext);

    // Retrieve callback
    const registerMock = vscode.commands.registerCommand as any;
    const analyzeCall = registerMock.mock.calls.find((call: any) => call[0] === 'qamate.analyze');
    const analyzeCallback = analyzeCall[1];

    // Setup active editor mock
    (vscode.window as any).activeTextEditor = {
      document: {
        getText: () => 'Mock requirement content',
        fileName: 'examples/dummy_spec.md',
      },
    };

    await analyzeCallback();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'QAMate: Started analysis on dummy_spec.md',
    );
  });

  it('should deactivate extension without throwing errors', () => {
    expect(() => deactivate()).not.toThrow();
  });
});

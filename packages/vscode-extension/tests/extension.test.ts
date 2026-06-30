import { describe, it, expect, vi, afterEach } from 'vitest';

// 1. Mock the VS Code namespace APIs
vi.mock('vscode', () => {
  const registerCommand = vi.fn((_cmd, callback) => {
    return {
      dispose: () => {},
      callback, // Keep reference so we can manually execute it in tests
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
    },
    ViewColumn: {
      Two: 2,
    },
  };
});

import * as vscode from 'vscode';
import { activate, deactivate } from '../src/index.js';

describe('VS Code Extension activation tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should activate and register qamate.analyze command', () => {
    const mockContext = {
      subscriptions: [],
    } as any;

    expect(() => activate(mockContext)).not.toThrow();
    expect(mockContext.subscriptions.length).toBe(1);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'qamate.analyze',
      expect.any(Function),
    );
  });

  it('should execute analyze callback and show error if no editor is open', async () => {
    const mockContext = {
      subscriptions: [],
    } as any;

    activate(mockContext);

    // Retrieve the registered callback
    const registerMock = vscode.commands.registerCommand as any;
    const analyzeCallback = registerMock.mock.calls[0][1];

    // Ensure activeTextEditor is undefined
    (vscode.window as any).activeTextEditor = undefined;

    await analyzeCallback();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'QAMate: No active text editor open.',
    );
  });

  it('should execute analyze callback and open webview panel if active editor is open', async () => {
    const mockContext = {
      subscriptions: [],
    } as any;

    activate(mockContext);

    // Retrieve callback
    const registerMock = vscode.commands.registerCommand as any;
    const analyzeCallback = registerMock.mock.calls[0][1];

    // Setup active editor mock
    (vscode.window as any).activeTextEditor = {
      document: {
        getText: () => 'Mock requirement content',
        fileName: 'examples/dummy_spec.md',
      },
    };

    await analyzeCallback();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'QAMate: Starting analysis on dummy_spec.md...',
    );
    expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
  });

  it('should deactivate extension without throwing errors', () => {
    expect(() => deactivate()).not.toThrow();
  });
});

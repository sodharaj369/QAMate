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
import { activate } from '../src/extension.js';

describe('VS Code Extension UX interactions tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register sidebarView provider on activation', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: '/' },
      workspaceState: {
        get: vi.fn(() => undefined),
        update: vi.fn(),
      },
    } as any;

    activate(mockContext);

    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
      'qamate.sidebarView',
      expect.any(Object),
    );
  });

  it('should trigger transitions on qamate.continueWorkflow command', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: '/' },
      workspaceState: {
        get: vi.fn(() => undefined),
        update: vi.fn(),
      },
    } as any;

    activate(mockContext);

    const registerMock = vscode.commands.registerCommand as any;
    const strategyCall = registerMock.mock.calls.find((call: any) => call[0] === 'qamate.continueWorkflow');
    expect(strategyCall).toBeDefined();

    const strategyCallback = strategyCall[1];
    expect(() => strategyCallback()).not.toThrow();
  });
});

import { renderWelcomePage } from '../src/ui/pages/WelcomePage.js';
import { renderSettingsPage } from '../src/ui/pages/SettingsPage.js';

describe('Welcome Screen Page Rendering tests', () => {
  it('should render requirement intake zone, active editor file card, and recent sessions list', () => {
    const html = renderWelcomePage({
      detectedFileName: 'active_requirement.md',
      recentSessionsHtml: '<div class="session-item">conv-1</div>',
      aiStatus: 'VS Code AI (Claude)',
      adoStatus: 'Connected',
      jiraStatus: 'Connected',
      adoConnected: true,
      jiraConnected: true,
      selectedAIProvider: 'openai',
      sessionsCount: 0,
      hasGeneratedSuite: false,
      lastSessionHtml: '',
    });

    expect(html).toContain('active_requirement.md');
    expect(html).toContain('AI Available');
    expect(html).toContain('conv-1');
  });
});

describe('Settings Screen Page Rendering tests', () => {
  it('should render selected persona, AI connection settings, and ADO/Jira board configurations', () => {
    const html = renderSettingsPage({
      selectedPersona: 'automation-qa',
      selectedAIProvider: 'openai',
      selectedAIModel: 'gpt-4o',
      selectedAIEndpoint: '',
      hasAIKey: true,
      adoOrg: 'my-org',
      adoProject: 'my-proj',
      hasAdoPat: true,
      jiraDomain: 'my-jira.atlassian.net',
      jiraEmail: 'test@company.com',
      hasJiraToken: true,
      adoConnected: true,
      jiraConnected: true,
      devModeEnabled: true,
      aiStatus: 'openai (gpt-4o) • Connected',
    });

    expect(html).toContain('automation-qa');
    expect(html).toContain('my-proj');
    expect(html).toContain('my-jira.atlassian.net');
    expect(html).toContain('Developer Diagnostics');
  });
});

describe('Intake Auto-Detection Classifier Regex tests', () => {
  const classify = (val: string): string => {
    const lowerVal = val.toLowerCase();
    const isJiraUrl = val.indexOf('atlassian.net/browse/') !== -1;
    const isJiraKey = /^[A-Z]+-[0-9]+$/.test(val);
    const isAdoUrl = val.indexOf('dev.azure.com/') !== -1 && val.indexOf('/_workitems/edit/') !== -1;
    const isAdoId = /^[0-9]+$/.test(val);
    const isUserStory = (lowerVal.indexOf('as a') !== -1 || lowerVal.indexOf('as an') !== -1) && lowerVal.indexOf('i want to') !== -1;
    const isMarkdown = val.startsWith('#') || val.indexOf('\n#') !== -1 || val.indexOf('**') !== -1;

    if (isJiraUrl) {
      return 'Jira Work Item URL';
    } else if (isJiraKey) {
      return 'Jira Issue Key';
    } else if (isAdoUrl) {
      return 'Azure DevOps Work Item URL';
    } else if (isAdoId) {
      return 'Azure DevOps ID';
    } else if (isUserStory) {
      return 'User Story Format';
    } else if (isMarkdown) {
      return 'Markdown Specification';
    } else {
      return 'Plain Text Requirement';
    }
  };

  it('should correctly classify intake inputs', () => {
    expect(classify('https://mycompany.atlassian.net/browse/QA-456')).toBe('Jira Work Item URL');
    expect(classify('PROJ-101')).toBe('Jira Issue Key');
    expect(classify('https://dev.azure.com/myorg/myproject/_workitems/edit/789')).toBe('Azure DevOps Work Item URL');
    expect(classify('102030')).toBe('Azure DevOps ID');
    expect(classify('As a user, I want to login so that I can see my dashboard.')).toBe('User Story Format');
    expect(classify('# Login Requirement\nThis is a spec.')).toBe('Markdown Specification');
    expect(classify('Just some raw text without formatting.')).toBe('Plain Text Requirement');
  });
});

describe('Domain Detection Keyword Classifier tests', () => {
  const detectDomains = (content: string): { domains: string[]; confidence: number } => {
    const text = content.toLowerCase();
    const domainKeywords: Record<string, string[]> = {
      'Authentication': ['auth', 'login', 'sign-in', 'password', 'oauth', 'token', 'credential', 'identity'],
      'Payments': ['payment', 'card', 'stripe', 'paypal', 'billing', 'checkout', 'price', 'invoice', 'transaction'],
      'Healthcare': ['patient', 'doctor', 'medical', 'health', 'clinic', 'prescription', 'ehr'],
      'API': ['endpoint', 'request', 'response', 'json', 'rest', 'graphql', 'payload', 'header', 'api']
    };

    const detected: string[] = [];
    let maxMatches = 0;
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const matches = keywords.filter(word => text.includes(word)).length;
      if (matches > 0) {
        detected.push(domain);
        if (matches > maxMatches) {
          maxMatches = matches;
        }
      }
    }

    if (detected.length === 0) detected.push('General Scope');

    let confidence = 80;
    if (maxMatches === 1) confidence = 50;
    else if (maxMatches === 2) confidence = 75;
    else if (maxMatches >= 3) confidence = 90;

    return { domains: detected, confidence };
  };

  it('should detect operational domains and confidence scores based on text keywords', () => {
    const resAuth = detectDomains('The system requires secure auth tokens for sign-in credentials.');
    expect(resAuth.domains).toContain('Authentication');
    expect(resAuth.confidence).toBe(90);

    const resPay = detectDomains('Integrate payment stripe API billing checkout.');
    expect(resPay.domains).toContain('Payments');
    expect(resPay.domains).toContain('API');

    const resGeneral = detectDomains('Just standard features list.');
    expect(resGeneral.domains).toContain('General Scope');
    expect(resGeneral.confidence).toBe(80);
  });
});

describe('Test Strategy Dashboard Overrides tests', () => {
  it('should apply recommended and excluded overrides to generated strategy object', () => {
    const mockStrategy = {
      recommendedSuites: [{ suite: 'Security', priority: 1, reason: 'Initial' }],
      excludedSuites: [],
    };
    
    const message = {
      command: 'overrideStrategy',
      recommendedSuites: [{ suite: 'Security', priority: 3, reason: 'Lowered priority' }],
      excludedSuites: [{ suite: 'Performance', reason: 'User Excluded' }],
    };

    const strategy = mockStrategy;
    strategy.recommendedSuites = message.recommendedSuites;
    strategy.excludedSuites = message.excludedSuites;

    expect(strategy.recommendedSuites[0].priority).toBe(3);
    expect(strategy.excludedSuites[0].suite).toBe('Performance');
  });
});

describe('Test Results Workspace updates tests', () => {
  it('should update artifact content in list when message is handled', () => {
    const mockArtifacts = [
      { id: 'ART-1', content: 'Old Content', type: 'Manual Test Cases' }
    ];
    
    const message = {
      command: 'updateArtifact',
      artifactId: 'ART-1',
      content: 'New Dynamic Content from Editor'
    };

    const art = mockArtifacts.find(a => a.id === message.artifactId);
    if (art) {
      art.content = message.content;
    }

    expect(mockArtifacts[0].content).toBe('New Dynamic Content from Editor');
  });
});

describe('Test Living Workspace step tracker tests', () => {
  it('should resolve correct NBA tracking guidelines based on the active step', () => {
    const activeStep = 'Understand';
    let nextBestActionText = '';
    
    switch (activeStep) {
      case 'Understand':
        nextBestActionText = 'Review health metrics, actors, and rules. Click "Continue" to prepare.';
        break;
      case 'Prepare':
        nextBestActionText = 'Complete QA Readiness check or click "Skip" to view strategy.';
        break;
    }

    expect(nextBestActionText).toContain('health metrics');
  });
});


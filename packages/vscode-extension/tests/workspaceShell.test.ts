import { describe, it, expect } from 'vitest';
import { renderLayout } from '../src/ui/components/Layout.js';
import * as Library from '../src/ui/components/Library.js';
import { renderDashboardPage } from '../src/ui/pages/DashboardPage.js';
import { renderRequirementPage } from '../src/ui/pages/RequirementPage.js';
import { renderSystemPage } from '../src/ui/pages/SystemPage.js';
import { renderMentalModelPage } from '../src/ui/pages/MentalModelPage.js';
import { renderRecommendationsPage } from '../src/ui/pages/RecommendationsPage.js';
import { renderStrategyPage } from '../src/ui/pages/StrategyPage.js';
import { renderArtifactsPage } from '../src/ui/pages/ArtifactsPage.js';
import { renderReviewPage } from '../src/ui/pages/ReviewPage.js';
import { renderDeliverPage } from '../src/ui/pages/DeliverPage.js';
import { renderSettingsPage } from '../src/ui/pages/SettingsPage.js';
import { renderAIHubPage } from '../src/ui/pages/AIHubPage.js';
import { renderSessionsPage } from '../src/ui/pages/SessionsPage.js';

describe('UI Sprint 1: Workspace Shell & Navigation tests', () => {

  it('Test 1: renderLayout outputs command bar, breadcrumbs, notifications bell, and layout divs', () => {
    const stages = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        status: 'active' as const,
        statusLabel: 'Active',
        contentHtml: '<div>Test content</div>',
        suggestedPrompts: []
      }
    ];

    const html = renderLayout(
      stages,
      false, // devMode
      false, // isAnalyzing
      '<div>timeline</div>',
      'Story-123-Payment-Gateway',
      'active',
      'meta',
      'type prompt...',
      'dashboard'
    );

    // Assert that JetBrains-style Command Bar is rendered
    expect(html).toContain('workspace-commands');
    expect(html).toContain('Analyze');
    expect(html).toContain('Generate');
    expect(html).toContain('Review');
    expect(html).toContain('Export');

    // Assert Breadcrumbs layout
    expect(html).toContain('workspace-breadcrumbs');
    expect(html).toContain('Story-123-Payment-Gateway');

    // Assert Notification Center Bell & Dropdown Popup
    expect(html).toContain('notification-bell');
    expect(html).toContain('notification-dropdown');

    // Assert Layout wrapper classes
    expect(html).toContain('workspace-shell');
    expect(html).toContain('workspace-sidebar');
    expect(html).toContain('workspace-host');
    expect(html).toContain('workspace-drawer');
    expect(html).toContain('workspace-footer');
  });

  it('Test 2: Reusable component library methods render valid structural markup', () => {
    // 1. Metric Card
    const metricHtml = Library.renderMetric('Rules Coverage', '96%', 'High');
    expect(metricHtml).toContain('Rules Coverage');
    expect(metricHtml).toContain('96%');
    expect(metricHtml).toContain('High');

    // 2. Toolbar
    const toolbarHtml = Library.renderToolbar([
      { label: 'Analyze', command: 'analyzeActive', disabled: false },
      { label: 'Blocked', command: 'blockedCmd', disabled: true }
    ]);
    expect(toolbarHtml).toContain('Analyze');
    expect(toolbarHtml).toContain('disabled');

    // 3. Tree List
    const treeHtml = Library.renderTree([
      { label: 'Root Component', children: [{ label: 'Child Component' }] }
    ]);
    expect(treeHtml).toContain('Root Component');
    expect(treeHtml).toContain('Child Component');

    // 4. Property Grid
    const gridHtml = Library.renderPropertyGrid([{ name: 'Revision', value: 'v5' }]);
    expect(gridHtml).toContain('Revision');
    expect(gridHtml).toContain('v5');

    // 5. Empty State
    const emptyHtml = Library.renderEmptyState('No workspace loaded', 'Import requirement');
    expect(emptyHtml).toContain('No workspace loaded');
  });

  it('Test 3: renderDashboardPage renders onboarding options when in empty state', () => {
    const html = renderDashboardPage({
      isNoSession: true,
      detectedFileName: 'test.md',
      aiStatus: 'offline',
      selectedAIProvider: 'mock',
      adoConnected: false,
      jiraConnected: false,
      sessionsCount: 0,
      hasGeneratedSuite: false
    });

    expect(html).toContain('Welcome to QAMate');
    expect(html).toContain('Choose how you\'d like to start');
    expect(html).toContain('Paste Requirement Specification');
    expect(html).toContain('Connect Jira User Story');
    expect(html).toContain('Import Azure DevOps');
    expect(html).toContain('Upload Specification File');
  });

  it('Test 4: renderDashboardPage renders metrics, system overview, decisions feed and quick actions when session active', () => {
    const html = renderDashboardPage({
      isNoSession: false,
      detectedFileName: '',
      aiStatus: 'healthy',
      selectedAIProvider: 'claude',
      adoConnected: true,
      jiraConnected: true,
      sessionsCount: 2,
      hasGeneratedSuite: true,
      requirementTitle: 'Payment Routing Gateway',
      currentStep: 'Plan',
      projectName: 'POS Client',
      healthScore: 90,
      confidenceScore: 0.95,
      questionsCount: 2,
      componentsCount: 8,
      flowsCount: 6,
      actorsCount: 3,
      recentDecisions: [
        '✓ Inferred transaction flow paths.',
        '✓ Connected performance metrics.'
      ]
    });

    // Check header info
    expect(html).toContain('Current Workspace');
    expect(html).toContain('Payment Routing Gateway');
    expect(html).toContain('Stage: <strong style="color: var(--vscode-foreground);">Plan</strong>');
    expect(html).toContain('Project: <strong style="color: var(--vscode-foreground);">POS Client</strong>');

    // Check health metric row values
    expect(html).toContain('Req Health');
    expect(html).toContain('90%');
    expect(html).toContain('Understanding');
    expect(html).toContain('95%');
    expect(html).toContain('Blocking Gaps');

    // Check system overview details
    expect(html).toContain('System Summary');
    expect(html).toContain('Components: <strong style="color: var(--vscode-foreground);">8</strong>');
    expect(html).toContain('Flows: <strong style="color: var(--vscode-foreground);">6</strong>');
    expect(html).toContain('Actors: <strong style="color: var(--vscode-foreground);">3</strong>');

    // Check decisions feed
    expect(html).toContain('Recent QA Decisions');
    expect(html).toContain('✓ Inferred transaction flow paths.');
    expect(html).toContain('✓ Connected performance metrics.');

    // Check quick actions
    expect(html).toContain('Quick Actions');
    expect(html).toContain('Analyze Spec');
    expect(html).toContain('Assumptions');
    expect(html).toContain('Open Strategy');

    // Check active provider and status diagnostics
    expect(html).toContain('Active AI Provider Hub');
    expect(html).toContain('Workspace Status Diagnostics');
  });

  it('Test 5: renderRequirementPage renders onboarding intake controls when no session active', () => {
    const html = renderRequirementPage({
      isNoSession: true,
      detectedFileName: '',
      aiStatus: 'healthy',
      adoConnected: false,
      jiraConnected: false,
      sessionsCount: 0,
      hasGeneratedSuite: false,
      lastSessionHtml: ''
    });

    expect(html).toContain('Create QA Session');
    expect(html).toContain('Paste Raw Text Specification');
    expect(html).toContain('Upload Local Spec File');
    expect(html).toContain('Connect to Boards');
    expect(html).toContain('Drag & Drop Specification');
  });

  it('Test 6: renderRequirementPage renders split panels, metadata, quality metrics, rules cards, and actionable gaps when active', () => {
    const html = renderRequirementPage({
      isNoSession: false,
      detectedFileName: '',
      aiStatus: 'healthy',
      adoConnected: true,
      jiraConnected: true,
      sessionsCount: 2,
      hasGeneratedSuite: true,
      lastSessionHtml: '',
      requirementText: 'Spike alerts webhook integration spec details.',
      requirementTitle: 'Tenant Alert Routing',
      healthScore: 85,
      confidenceScore: 0.94,
      questionsCount: 3,
      rulesCount: 15,
      componentsCount: 7,
      actorsCount: 3,
      gapsCount: 2,
      isReadOnly: true,
      annotations: [
        { text: 'SLA threshold', note: 'Customer SLA threshold varies.' }
      ],
      businessRules: [
        { text: 'Alert when exception threshold exceeded.', source: 'AC #2', confidence: 'High' }
      ],
      detectedInfo: {
        goals: ['Goal 1'],
        actors: ['Actor 1'],
        components: ['Comp 1'],
        integrations: ['Int 1']
      },
      unknowns: [
        { text: 'Suppression window timeout', status: 'Unknown' }
      ]
    });

    // Check Metadata Header
    expect(html).toContain('REQ-2034');
    expect(html).toContain('Azure DevOps');
    expect(html).toContain('Priority: <strong style="color: var(--vscode-foreground);">High</strong>');

    // Check Left Panel (Raw spec & Annotations)
    expect(html).toContain('Spike alerts webhook integration spec details.');
    expect(html).toContain('SLA threshold');
    expect(html).toContain('Customer SLA threshold varies.');
    expect(html).toContain('Continue to System Model');

    // Check Right Panel (Metrics & Summaries)
    expect(html).toContain('Quality Grade');
    expect(html).toContain('85%');
    expect(html).toContain('Detected Business Rules');
    expect(html).toContain('Alert when exception threshold exceeded.');
    expect(html).toContain('Actionable Gaps & Unknowns');
    expect(html).toContain('Suppression window timeout');
    expect(html).toContain('[ Resolve ]');

    // Check Footer import history
    expect(html).toContain('Imported From: <strong>Azure DevOps</strong>');
    expect(html).toContain('Refresh');
    expect(html).toContain('Reimport');
  });

  it('Test 7: renderSystemPage renders empty state when no session active', () => {
    const html = renderSystemPage({
      isNoSession: true
    });

    expect(html).toContain('System Architecture Blueprint Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 8: renderSystemPage renders structural tree, flow sequence maps, property details, diagnostics, unknowns, and impact cards', () => {
    const html = renderSystemPage({
      isNoSession: false,
      selectedNodeId: 'stripe-webhook',
      selectedNodeType: 'component',
      components: [
        { id: 'stripe-webhook', name: 'Stripe Webhook Gateway', type: 'Payment gateway hook', status: 'Verified' as const, source: 'DNA' as const }
      ],
      flows: [
        { id: 'alert-flow', name: 'Alert flow sequence path', nodes: ['Stripe Webhook Gateway', 'Azure Function', 'KQL Logger'] }
      ],
      actors: [
        { id: 'merchant', name: 'Merchant user', role: 'Submits payment checkouts' }
      ],
      integrations: [
        { id: 'stripe', name: 'Stripe API', type: 'REST Integration' }
      ],
      qualityAttributes: [
        { name: 'Security', checked: true },
        { name: 'Observability', checked: false }
      ],
      validationIssues: ['Connected: ✓', 'Flows complete: ✓'],
      unknownComponents: ['Queue Processor'],
      impactItems: ['Mental Model Gaps', 'Test Strategy Cases']
    });

    // Check Structural tree components list
    expect(html).toContain('System Components Tree');
    expect(html).toContain('Stripe Webhook Gateway');
    expect(html).toContain('Verified');
    expect(html).toContain('(DNA)');

    // Check flows and actors checklist
    expect(html).toContain('Functional Flows & Actors');
    expect(html).toContain('Alert flow sequence path');
    expect(html).toContain('Merchant user');

    // Check Quality focus checklist
    expect(html).toContain('System Quality Attributes Focus');
    expect(html).toContain('Security');
    expect(html).toContain('Observability');

    // Check flow sequence map
    expect(html).toContain('Active Blueprint Flow Sequence');
    expect(html).toContain('Stripe Webhook Gateway');
    expect(html).toContain('Azure Function');
    expect(html).toContain('KQL Logger');

    // Check properties grid values
    expect(html).toContain('Component Properties & Confidence');
    expect(html).toContain('Stripe Webhook Gateway');
    expect(html).toContain('Payment gateway hook');
    expect(html).toContain('██████████ 100% (Verified)');

    // Check evidence tracing
    expect(html).toContain('QA Blueprint Evidence Tracing');

    // Check downstream impacts preview
    expect(html).toContain('Downstream Impact Preview');
    expect(html).toContain('Mental Model Gaps');
    expect(html).toContain('Test Strategy Cases');

    // Check Validation checklist and assumed gaps
    expect(html).toContain('Blueprint Validation Status');
    expect(html).toContain('Flows complete: ✓');
    expect(html).toContain('Unknown Components (Assumed Gaps)');
    expect(html).toContain('Queue Processor');

    // Check bottom toolbar & stepper continue button
    expect(html).toContain('+ Component');
    expect(html).toContain('+ Flow');
    expect(html).toContain('Build QA Mental Model ➔');
  });

  it('Test 9: renderMentalModelPage renders empty state when no session active', () => {
    const html = renderMentalModelPage({
      isNoSession: true
    });

    expect(html).toContain('QA Understanding Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 10: renderMentalModelPage renders diagnostic headers, priority gating cards, confidence bars, rationale explainers, resolver inputs, and trace map when active', () => {
    const html = renderMentalModelPage({
      isNoSession: false,
      selectedItemId: 'test-assumption',
      selectedItemType: 'assumption',
      unknowns: [
        { id: 'suppress-window', text: 'Alert suppression window timeout.', impact: 'High' as const, status: 'Unknown' }
      ],
      assumptions: [
        { id: 'test-assumption', text: 'Alert rules require static threshold parameters.', source: 'Paragraph 3', confidence: 0.85, origin: 'AI' as const, rationale: 'Azure telemetry API models expect float metrics.' }
      ],
      facts: [
        { id: 'hmac-signatures', text: 'Stripe transaction webhook verifies signature.', origin: 'DNA' as const }
      ],
      readyStatus: { ready: false, blockingCount: 2, warningsCount: 1, resolvedCount: 10, totalCount: 12 }
    });

    // Check Header diagnostics
    expect(html).toContain('QA Understanding');
    expect(html).toContain('Ready for Strategy: <strong style="color: var(--vscode-testing-iconFailedColor, #F48771);">No</strong>');
    expect(html).toContain('Blocking: <strong style="color: var(--vscode-foreground);">2</strong>');
    expect(html).toContain('Resolved: <strong style="color: var(--vscode-foreground);">10/12</strong>');

    // Check Gating lists (Unknowns, Assumptions, Facts)
    expect(html).toContain('⚠ Unknown Gaps (Need Attention)');
    expect(html).toContain('Alert suppression window');
    expect(html).toContain('Resolve');

    expect(html).toContain('⚠ Assumptions (Need Confirmation)');
    expect(html).toContain('Alert rules require static threshold parameters.');
    expect(html).toContain('Evidence: Paragraph 3 [Open Source]');
    expect(html).toContain('Source: 🤖 AI');
    expect(html).toContain('✓ Confirm');
    expect(html).toContain('✏ Modify');
    expect(html).toContain('✗ Reject');

    expect(html).toContain('✓ Facts (Verified)');
    expect(html).toContain('Stripe transaction webhook verifies signature.');
    expect(html).toContain('DNA');

    // Check Explainability, evidence trace quote, and manual override resolver
    expect(html).toContain('AI Inference Explainability Rationale');
    expect(html).toContain('Azure telemetry API models expect float metrics.');
    expect(html).toContain('█████████░ 85%');

    expect(html).toContain('Evidence Trace Quote');
    expect(html).toContain('Manual Override Resolver');
    expect(html).toContain('Confirm Update');

    // Check Trace Map and bottom toolbar/stepper actions
    expect(html).toContain('QA Reasoning Trace');
    expect(html).toContain('+ Assumption');
    expect(html).toContain('Resolve All');
    expect(html).toContain('Build Strategy from Approved Understanding ➔');
  });

  it('Test 11: renderRecommendationsPage renders empty state when no active session', () => {
    const html = renderRecommendationsPage({
      isNoSession: true
    });

    expect(html).toContain('Recommendation Center Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 12: renderRecommendationsPage renders grid, comments textareas, category filters, and recommendation proposals', () => {
    const html = renderRecommendationsPage({
      isNoSession: false,
      activeCount: 5,
      acceptedCount: 12,
      ignoredCount: 1,
      proposals: [
        {
          id: 'test-proposal-1',
          title: 'Custom retry webhook triggers spec',
          category: 'Reliability' as const,
          risk: 'Medium' as const,
          impactCases: 3,
          description: 'Introduce automatic error log retries.',
          rationale: 'Telemetry server logs suggests transaction rate delays.',
          status: 'Active' as const,
          userComment: 'Needs PO review'
        }
      ]
    });

    // Check Header metrics
    expect(html).toContain('AI Recommendation Center');
    expect(html).toContain('Active Proposals: <strong style="color: var(--vscode-button-background);">5</strong>');
    expect(html).toContain('Accepted: <strong style="color: var(--vscode-testing-iconPassedColor, #89D185);">12</strong>');
    expect(html).toContain('Ignored: <strong style="color: var(--vscode-testing-iconFailedColor, #F48771);">1</strong>');

    // Check Search and categories list
    expect(html).toContain('Filter proposals, categories...');
    expect(html).toContain('Security');
    expect(html).toContain('Performance');
    expect(html).toContain('Reliability');

    // Check proposals grid cards
    expect(html).toContain('Custom retry webhook triggers spec');
    expect(html).toContain('Category: <strong>Reliability</strong>');
    expect(html).toContain('Risk Level: <strong>Medium</strong>');
    expect(html).toContain('Downstream Impact: <strong>3 cases</strong>');

    // Check description, rationale, comments, and actions
    expect(html).toContain('Introduce automatic error log retries.');
    expect(html).toContain('Telemetry server logs suggests transaction rate delays.');
    expect(html).toContain('Needs PO review');
    expect(html).toContain('✓ Accept');
    expect(html).toContain('🔕 Ignore');
    expect(html).toContain('✏ Modify');

    // Check footer buttons
    expect(html).toContain('+ Recommendation');
    expect(html).toContain('Reset Filters');
  });

  it('Test 13: renderStrategyPage renders empty state when no active session', () => {
    const html = renderStrategyPage({
      isNoSession: true
    });

    expect(html).toContain('Strategy Blueprint Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 14: renderStrategyPage renders summary metrics, category testing areas, strategy changes diffs, boundary tables, equivalence partitions, coverage checklists, and approve footer', () => {
    const html = renderStrategyPage({
      isNoSession: false,
      selectedObjectiveId: 'sig-val',
      testingAreas: [
        {
          name: 'Security',
          objectives: [
            { id: 'sig-val', title: 'Webhook signature validation check', status: 'Accepted' as const, risk: 'Critical' as const, execution: 'Security' as const, effort: 'Medium' as const, source: 'Playbook' as const, evidence: 'Req paragraph 4' }
          ]
        }
      ],
      strategyDiffs: [
        '+ Added Webhook drift tests'
      ],
      coverageMatrix: [
        { label: 'Requirements', checked: true },
        { label: 'Quality Attributes', checked: false }
      ],
      warnings: [
        'Missing: Negative Tests'
      ],
      projectionCount: { manual: 30, api: 10, performance: 5, security: 5 }
    });

    // Check Header Strategy Summary
    expect(html).toContain('Strategy Blueprint Summary');
    expect(html).toContain('Areas: <strong style="color: var(--vscode-foreground);">6</strong>');
    expect(html).toContain('Excluded: <strong style="color: var(--vscode-foreground);">1</strong>');
    expect(html).toContain('Coverage: <strong style="color: var(--vscode-testing-iconPassedColor, #89D185);">94%</strong>');
    expect(html).toContain('Est. Cases: <strong style="color: var(--vscode-button-background);">42</strong>');

    // Check Gating testing areas lists
    expect(html).toContain('Testing Areas & Objectives');
    expect(html).toContain('Security Area');
    expect(html).toContain('Webhook signature validation check');
    expect(html).toContain('Accepted');
    expect(html).toContain('Risk: Critical');
    expect(html).toContain('Exec: Security');
    expect(html).toContain('Source: Playbook');

    // Check Strategy Diff
    expect(html).toContain('Strategy Changes Diff Timeline');
    expect(html).toContain('+ Added Webhook drift tests');

    // Check Boundary offsets table
    expect(html).toContain('Boundary Analysis & Offsets');
    expect(html).toContain('Below Boundary');
    expect(html).toContain('Equal Boundary');
    expect(html).toContain('Above Boundary');

    // Check Equivalence partition
    expect(html).toContain('Equivalence Partitions Inputs Override');
    expect(html).toContain('Valid Input:');
    expect(html).toContain('Invalid Input:');

    // Check Coverage matrix and projection counts
    expect(html).toContain('Strategy Coverage Matrix completeness');
    expect(html).toContain('Requirements');
    expect(html).toContain('Quality Attributes');
    expect(html).toContain('Generated Deliverables Projection');
    expect(html).toContain('Manual Test Cases: <strong style="color: var(--vscode-foreground);">30</strong>');
    expect(html).toContain('API Unit Tests: <strong style="color: var(--vscode-foreground);">10</strong>');

    // Check Actionable warnings & footer approve triggers
    expect(html).toContain('Actionable Strategy Warnings');
    expect(html).toContain('Missing: Negative Tests');
    expect(html).toContain('+ Add Test Objective');
    expect(html).toContain('Optimize Strategy');
    expect(html).toContain('Approve Strategy & Generate Artifacts ➔');
  });

  it('Test 15: renderArtifactsPage renders empty state when no active session', () => {
    const html = renderArtifactsPage({
      isNoSession: true
    });

    expect(html).toContain('Test Design Workspace Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 16: renderArtifactsPage renders summary metrics, category filters, strategy updated banners, test case grids with health indicators, properties editor, explainability trace, and footer actions', () => {
    const html = renderArtifactsPage({
      isNoSession: false,
      selectedTestCaseId: 'tc-test-1',
      qualityScore: 95,
      strategyUpdated: true,
      testCases: [
        {
          id: 'tc-test-1',
          health: 'Strong' as const,
          title: 'Verify signature integrity webhook decryption',
          expected: 'Decrypted payload matches original message.',
          steps: '1. Setup decryption keys.\n2. Dispatch webhook.',
          preconditions: 'Keys registered.',
          priority: 'Critical' as const,
          status: 'Draft' as const,
          origin: 'AI' as const,
          evidence: 'Req paragraph 5'
        }
      ],
      warnings: [
        'Expected Result too generic'
      ]
    });

    // Check Header Summary metrics
    expect(html).toContain('Test Suite Summary');
    expect(html).toContain('Total Cases: <strong style="color: var(--vscode-foreground);">1</strong>');
    expect(html).toContain('Quality Score: <strong style="color: var(--vscode-button-background);">95%</strong>');

    // Check Views and Grouping toolbar
    expect(html).toContain('Table View');
    expect(html).toContain('Grouped');
    expect(html).toContain('Scenario');
    expect(html).toContain('Group By:');

    // Check Strategy updated warning banner
    expect(html).toContain('⚠ Strategy Updated (8 Affected Test Cases - Review Required)');

    // Check test grid table rows and health indicators
    expect(html).toContain('Test Suite Cases Grid');
    expect(html).toContain('TC-TEST-1');
    expect(html).toContain('Strong');
    expect(html).toContain('Verify signature integrity webhook decryption');
    expect(html).toContain('Draft');

    // Check Explainability trace
    expect(html).toContain('Test Case Generation Explainability');
    expect(html).toContain('TC-TEST-1');

    // Check Quality warnings logs
    expect(html).toContain('Design Quality Warnings checklist');
    expect(html).toContain('Expected Result too generic');

    // Check properties editor form fields
    expect(html).toContain('Test Case Properties Editor');
    expect(html).toContain('Verify signature integrity webhook decryption');
    expect(html).toContain('Keys registered.');
    expect(html).toContain('Save Changes');

    // Check Traceability linkages and version histories
    expect(html).toContain('Traceability Linkages');
    expect(html).toContain('Test Case Revision History');

    // Check footer actions toolbar and stepper continue triggers
    expect(html).toContain('+ Add Test Case');
    expect(html).toContain('Bulk Edit');
    expect(html).toContain('Duplicate');
    expect(html).toContain('Export Selected');
    expect(html).toContain('Review Test Suite ➔');
  });

  it('Test 17: renderReviewPage renders empty state when no active session', () => {
    const html = renderReviewPage({
      isNoSession: true
    });

    expect(html).toContain('QA Review Board Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 18: renderReviewPage renders summary dashboard, categories checklists, severity badges, suggested improvements, ignore options, action timelines, impact previews, and approve footer', () => {
    const html = renderReviewPage({
      isNoSession: false,
      selectedFindingId: 'test-finding-1',
      qualityScore: 95,
      previousScore: 90,
      criticalCount: 2,
      warningsCount: 4,
      readyToDeliver: false,
      complianceSplits: { playbook: 90, coverage: 95, traceability: 95, quality: 90 },
      findings: [
        {
          id: 'test-finding-1',
          title: 'TC-001: Expected result missing validation',
          category: 'Quality' as const,
          severity: 'Critical' as const,
          targetTestCase: 'TC-001',
          issue: 'Expected Result Weak',
          why: 'Missing expected fields description',
          risk: 'Verification checks skipped in CI',
          source: 'Playbook Rule QA-ER-05',
          suggestedFix: 'Verify decrypted message header keys are matching payload.',
          status: 'Open' as const
        }
      ],
      ignoreReasons: ['Already Covered', 'Intentional'],
      timelineSteps: ['Generated', 'Review Finding', 'Fix Applied'],
      impactItems: ['Test Case', 'Traceability']
    });

    // Check Header Summary metrics
    expect(html).toContain('QA Review Board');
    expect(html).toContain('Quality Score: <strong style="color: var(--vscode-button-background);">95%</strong>');
    expect(html).toContain('(+5% improved)');
    expect(html).toContain('Ready to Deliver: <strong style="color: var(--vscode-testing-iconFailedColor, #F48771);">No</strong>');
    expect(html).toContain('Critical: <strong style="color: var(--vscode-foreground);">2</strong>');
    expect(html).toContain('Warnings: <strong style="color: var(--vscode-foreground);">4</strong>');

    // Check split details
    expect(html).toContain('Playbook Compliance: <strong style="color: var(--vscode-foreground);">90%</strong>');
    expect(html).toContain('Coverage Index: <strong style="color: var(--vscode-foreground);">95%</strong>');

    // Check Left column categories findings checklists
    expect(html).toContain('Audit Categories & Findings');
    expect(html).toContain('Quality Checks');
    expect(html).toContain('TC-001: Expected result missing validation');
    expect(html).toContain('Critical');

    // Check Traceability mappings
    expect(html).toContain('Traceability Mappings Evidence Trace');
    expect(html).toContain('Test Case (TC-001)');

    // Check Impact previews
    expect(html).toContain('Review Fix Affected Impact Preview');
    expect(html).toContain('Test Case');
    expect(html).toContain('Traceability');

    // Check Right column suggested fixes and decisions
    expect(html).toContain('Explainable Finding Rationale');
    expect(html).toContain('Expected Result Weak');
    expect(html).toContain('Playbook Rule QA-ER-05');

    expect(html).toContain('Suggested Improvement (Recommended Fix)');
    expect(html).toContain('Verify decrypted message header keys are matching payload.');
    expect(html).toContain('Accept Fix');
    expect(html).toContain('Modify Fix');
    expect(html).toContain('Ignore');

    // Check ignore reasons & timeline
    expect(html).toContain('Audit Ignore Reason (DNA Feedback Loop)');
    expect(html).toContain('Already Covered');
    expect(html).toContain('Audit Action Timeline');
    expect(html).toContain('Fix Applied');

    // Check toolbar and stepper continue triggers
    expect(html).toContain('Apply All Safe');
    expect(html).toContain('Ignore Info');
    expect(html).toContain('Run Audit Again');
    expect(html).toContain('Approve Review & Prepare Deliverables ➔');
  });

  it('Test 19: renderDeliverPage renders empty state when no active session', () => {
    const html = renderDeliverPage({
      isNoSession: true
    });

    expect(html).toContain('Publish Workspace Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 20: renderDeliverPage renders readiness checklists, deliverables package counts, destination channels, version configurations, naming templates, live preview tabs, pre-flight validations, publish plans, forecasts, logs, PDF summaries, and stepper triggers', () => {
    const html = renderDeliverPage({
      isNoSession: false,
      selectedDestinationId: 'test-dest-jira',
      selectedPreviewTab: 'Markdown',
      readyToPublish: true,
      readinessChecks: [
        { label: 'Review Approved', checked: true }
      ],
      deliverables: [
        { label: 'Requirement spec', count: 1 }
      ],
      destinations: [
        { id: 'test-dest-jira', name: 'Jira Software backlog', connected: true, status: 'Connected (PAY)' }
      ],
      namingTemplate: 'custom-{project}-test',
      versionConfig: { version: 'v3.5', baseline: 'Sprint 15', build: '180' },
      partialPublish: [
        { label: 'Test Cases', checked: true }
      ],
      dryRun: true,
      previewContent: 'TC-TEST-CONTENT',
      publishPlan: [
        'Upload 42 Test Cases'
      ],
      publishImpact: { create: 10, update: 2, skip: 1, warnings: 0 },
      validationRules: [
        { label: 'IDs sequences verification', status: 'Passed' as const }
      ],
      timelineLogs: [
        'Pre-flight validation passed'
      ]
    });

    // Check Header summary readiness checks
    expect(html).toContain('Publish & Delivery Center');
    expect(html).toContain('Ready to Publish');
    expect(html).toContain('Review Approved');

    // Check Deliverables counts
    expect(html).toContain('QA Deliverables Package Summary');
    expect(html).toContain('Requirement spec:');
    expect(html).toContain('1');

    // Check Left Column: Destination Channels connection status
    expect(html).toContain('Target Destinations & Connections');
    expect(html).toContain('Jira Software backlog');
    expect(html).toContain('Connected (PAY)');

    // Check Version configuration parameters
    expect(html).toContain('Deliverable Version Configuration');
    expect(html).toContain('v3.5');
    expect(html).toContain('Sprint 15');
    expect(html).toContain('180');

    // Check Naming Rules templates
    expect(html).toContain('Naming Rules Template spec');
    expect(html).toContain('custom-{project}-test');

    // Check partial publish checkboxes & Dry Run toggler
    expect(html).toContain('Publish Scope items selection');
    expect(html).toContain('Test Cases');
    expect(html).toContain('Preview Changes only (Dry Run - Nothing uploaded)');

    // Check Right Column: Previews tabs & code text box
    expect(html).toContain('Compiled Deliverable Live Preview');
    expect(html).toContain('Markdown');
    expect(html).toContain('Excel');
    expect(html).toContain('TC-TEST-CONTENT');

    // Check Pre-flight validation checklist statuses
    expect(html).toContain('Export Validation Checks Pre-Flight');
    expect(html).toContain('IDs sequences verification');

    // Check publish plan checklist
    expect(html).toContain('Publish Plan schedule');
    expect(html).toContain('Upload 42 Test Cases');

    // Check Publishing Impact Forecast
    expect(html).toContain('Publishing Impact Forecast');
    expect(html).toContain('Will Create: <strong style="color: var(--vscode-testing-iconPassedColor, #89D185);">10</strong>');
    expect(html).toContain('Will Update: <strong style="color: var(--vscode-testing-iconQueuedColor, #CCA700);">2</strong>');

    // Check Sync timeline logs
    expect(html).toContain('Export Sync timeline logs');
    expect(html).toContain('Pre-flight validation passed');

    // Check PDF report generator
    expect(html).toContain('QA Delivery Summary Report PDF');
    expect(html).toContain('Generate Handover PDF Document');

    // Check actions toolbar
    expect(html).toContain('Connections Config');
    expect(html).toContain('Validation Pre-Check');
    expect(html).toContain('Reload Preview');

    // Check final publish stepper triggers
    expect(html).toContain('Publish & Sync Suite ➔');
    expect(html).toContain('Back to Workspace Cockpit');
  });

  it('Test 21: renderSettingsPage renders empty state when no active session', () => {
    const html = renderSettingsPage({
      isNoSession: true
    });

    expect(html).toContain('Project DNA Workspace Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 22: renderSettingsPage renders Project DNA cockpit details, health completeness progress, tech stack configs, quality attribute priorities, business glossary mappings tables, AI capability priority selects, thinking rules check boxes, knowledge learnings, and rescan triggers', () => {
    const html = renderSettingsPage({
      isNoSession: false,
      projectOverview: {
        name: 'ParentPay POS',
        domain: 'Payments',
        architecture: 'Microservices',
        language: '.NET + MAUI',
        testing: 'Manual + Playwright',
        version: '3.1',
        baseline: 'Sprint 14',
        modified: 'Today',
        changesCount: 8
      },
      healthPercentage: 87,
      healthMetrics: [
        { label: 'Technology Stack config', status: 'Passed' as const }
      ],
      techStack: [
        { label: 'Frontend UI', value: 'React' }
      ],
      architectures: [
        { label: 'Microservices architecture', checked: true }
      ],
      qualityPriorities: [
        { label: 'Security checkouts', priority: 'Critical' as const }
      ],
      testingStandards: [
        { label: 'OWASP vulnerability checks', checked: true }
      ],
      glossary: [
        { term: 'Tenant', meaning: 'Customer Organization profile', alias: 'School client', source: 'Requirement section 3' }
      ],
      providers: [
        { name: 'Claude', capability: 'Reasoning', rating: '★★★★★', status: 'Connected', priority: 'Preferred' }
      ],
      thinkingRules: [
        { label: 'Challenge rules assumptions', checked: true }
      ],
      knowledgeMemory: [
        { label: 'User corrections logged', count: 18 }
      ],
      workspaceScan: [
        { label: 'React frontend framework', status: 'Detected' as const }
      ],
      integrations: [
        { name: 'Jira Software connections', connected: true }
      ],
      promptWeights: [
        { label: 'Project DNA profile', weight: 32 }
      ],
      historyLogs: [
        'Playbook changed (v3.0)'
      ]
    });

    // Check Header Overview details
    expect(html).toContain('🧬 Project DNA Cockpit');
    expect(html).toContain('ParentPay POS');
    expect(html).toContain('Payments');
    expect(html).toContain('Microservices');
    expect(html).toContain('Sprint 14');
    expect(html).toContain('Restore Previous');

    // Check Health completeness
    expect(html).toContain('DNA Health Status completeness');
    expect(html).toContain('87%');
    expect(html).toContain('Technology Stack config');

    // Check Left Column: Stack, Architecture & Standards
    expect(html).toContain('Technology Stack Profile');
    expect(html).toContain('Frontend UI');
    expect(html).toContain('React');

    expect(html).toContain('Architecture design models');
    expect(html).toContain('Microservices architecture');

    expect(html).toContain('Quality Attributes priorities');
    expect(html).toContain('Security checkouts');
    expect(html).toContain('Critical');

    expect(html).toContain('Testing Standards rulesets');
    expect(html).toContain('OWASP vulnerability checks');

    expect(html).toContain('Deployment Environment profiles base URLs');

    // Check Right Column: Glossary, AI & Rules
    expect(html).toContain('Business Glossary term mappings');
    expect(html).toContain('Tenant');
    expect(html).toContain('School client');
    expect(html).toContain('Customer Organization profile');

    expect(html).toContain('AI Fallback Providers capability configurations');
    expect(html).toContain('Claude');
    expect(html).toContain('Reasoning');
    expect(html).toContain('★★★★★');
    expect(html).toContain('Connected');

    expect(html).toContain('QA Reasoning Thinking Rules');
    expect(html).toContain('Challenge rules assumptions');

    expect(html).toContain('Project Knowledge memory learnt rules');
    expect(html).toContain('User corrections logged:');
    expect(html).toContain('18');

    expect(html).toContain('Workspace Scan Auto-Detection alerts');
    expect(html).toContain('React frontend framework');
    expect(html).toContain('Detected');

    expect(html).toContain('Workspace Connected Integrations');
    expect(html).toContain('Jira Software connections');

    expect(html).toContain('AI Prompt Context Weight contribution');
    expect(html).toContain('Project DNA profile');
    expect(html).toContain('32%');

    expect(html).toContain('DNA Changes Timeline history');
    expect(html).toContain('Playbook changed (v3.0)');

    // Check action toolbar and save button
    expect(html).toContain('Discard');
    expect(html).toContain('Rescan Repo');
    expect(html).toContain('Export DNA');
    expect(html).toContain('Clone DNA');
    expect(html).toContain('Compare DNA');
    expect(html).toContain('Save Project DNA ➔');
  });

  it('Test 23: renderAIHubPage renders empty state when no active session', () => {
    const html = renderAIHubPage({
      isNoSession: true
    });

    expect(html).toContain('AI Hub Workspace Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 24: renderAIHubPage renders preferred providers stats, advanced togglers, capabilities mappings, health comparison tables, failover chain timelines, connection checklists, spend gauges, usage summaries, diagnostics transaction logs, security checkups, and save config triggers', () => {
    const html = renderAIHubPage({
      isNoSession: false,
      isAdvancedMode: true,
      activeProvider: 'Claude',
      requestsToday: 284,
      connectedCount: 5,
      healthyCount: 4,
      offlineCount: 1,
      workspaceMode: 'AI Connected',
      latencyAvg: 230,
      monthlySpend: 42.50,
      monthlyLimit: 150.00,
      capabilities: [
        { label: 'Reasoning tasks', model: 'Claude 3.5 Sonnet', capability: 'Reasoning', rating: '★★★★★' }
      ],
      providers: [
        { name: 'Claude', status: 'Connected', latency: 240, availability: 99, context: '200k', jsonSupport: true, cost: 'Low' }
      ],
      routingRules: [
        { label: 'Requirement Analysis', provider: 'Claude' }
      ],
      failoverChain: ['Claude (Primary)', 'GPT (Fallback)'],
      connectionsTest: [
        { label: 'Claude', status: 'Passed' as const }
      ],
      keyStatuses: [
        { label: 'Claude key status', status: 'Configured' as const }
      ],
      promptProfiles: [
        { label: 'Requirement Analysis profile', mode: 'Strict' as const }
      ],
      usageStats: [
        { label: 'Requests Today', value: '284' }
      ],
      timelineLogs: [
        { time: '10:42', provider: 'Claude', operation: 'Strategy Gen', latency: 2500, status: 'Timeout', fallback: 'GPT-4o', reason: 'Threshold limit reached' }
      ],
      securitySettings: [
        { label: 'API Keys Stored Securely', status: true }
      ],
      capabilityTests: [
        { label: 'Reasoning capabilities', status: true }
      ],
      recommendations: [
        { project: 'Payments Microservices', model: 'Claude Sonnet', reason: 'Large context window' }
      ]
    });

    // Check Header AI overview
    expect(html).toContain('🤖 AI Hub Control Center');
    expect(html).toContain('AI Connected');
    expect(html).toContain('Claude');
    expect(html).toContain('230ms');
    expect(html).toContain('284');
    expect(html).toContain('5 (4 healthy, 1 offline)');

    // Check Advanced toggler
    expect(html).toContain('Advanced Settings Router');
    expect(html).toContain('Advanced Mode');

    // Check Left Column: Capabilities & Routing
    expect(html).toContain('AI Capabilities Mappings');
    expect(html).toContain('Reasoning tasks (Reasoning):');
    expect(html).toContain('Claude 3.5 Sonnet');
    expect(html).toContain('★★★★★');

    expect(html).toContain('Custom Routing Rules (Advanced)');
    expect(html).toContain('Requirement Analysis:');

    expect(html).toContain('Prompt Profiles configuration');
    expect(html).toContain('Requirement Analysis profile:');

    expect(html).toContain('Secure Connection Keys config');
    expect(html).toContain('Claude key status:');
    expect(html).toContain('Configured');
    expect(html).toContain('edit');

    // Check Right Column: Health, Usage & Logs
    expect(html).toContain('Provider Health & Capabilities Comparison');
    expect(html).toContain('Claude');
    expect(html).toContain('240ms');
    expect(html).toContain('99%');
    expect(html).toContain('200k');

    expect(html).toContain('Failover Chain routing flowchart');
    expect(html).toContain('Claude (Primary)');

    expect(html).toContain('AI Connection & Capability diagnostics tests');
    expect(html).toContain('Connection tests:');
    expect(html).toContain('Claude');
    expect(html).toContain('Capabilities tests:');
    expect(html).toContain('Reasoning capabilities');

    expect(html).toContain('Monthly Spend budget limits');
    expect(html).toContain('Spent Limit Gauge');
    expect(html).toContain('$42.50 / $150.00');

    expect(html).toContain('Transaction usage metrics');
    expect(html).toContain('Requests Today:');
    expect(html).toContain('284');

    expect(html).toContain('Diagnostics Transaction logs');
    expect(html).toContain('[10:42] <strong>Claude</strong>: Strategy Gen ➔ Timeout (2500ms) [Fallback: GPT-4o - Threshold limit reached]');

    expect(html).toContain('Security & Data Privacy audit');
    expect(html).toContain('API Keys Stored Securely');

    expect(html).toContain('Workspace AI Provider Recommendation');
    expect(html).toContain('Payments Microservices');
    expect(html).toContain('Claude Sonnet');

    // Check actions toolbar & save button
    expect(html).toContain('Test Connections');
    expect(html).toContain('Reset Metrics');
    expect(html).toContain('Reconnect');
    expect(html).toContain('Save AI Hub Config ➔');
  });

  it('Test 25: renderSessionsPage renders empty state when no active session', () => {
    const html = renderSessionsPage({
      isNoSession: true
    });

    expect(html).toContain('QA Evolution Workspace Empty');
    expect(html).toContain('No active session loaded');
  });

  it('Test 26: renderSessionsPage renders QA Evolution cockpit metrics, revision timeline traces, comparator object drop downs, story evolution traces, side-by-side object diff comparators, testing impact dashboards, decisions history list logs, workspace replay streams, and action triggers', () => {
    const html = renderSessionsPage({
      isNoSession: false,
      selectedCompareObject: 'Requirement',
      selectedDiffMode: 'Side by Side',
      selectedRevisionId: 'v3',
      selectedCompareRevisionId: 'v2',
      evolutionSummary: {
        revision: 'v3',
        created: 'Today',
        changedAreas: ['Requirement', 'Strategy'],
        overallImpact: 'Medium' as const
      },
      timelineRevisions: [
        { id: 'v3', date: 'Today 10:45', createdBy: 'Raj', generatedBy: 'Claude', reason: 'Spec update', status: 'Published', active: true }
      ],
      sessionAnalytics: {
        started: '10:15',
        lastEdited: '10:42',
        duration: '27 mins',
        requests: 18,
        manualChanges: 9
      },
      impactSummary: {
        componentsCount: 2,
        objectivesCount: 4,
        casesCount: 18,
        coverageDelta: '+6%'
      },
      decisionHistory: [
        'Accepted Recommendation #12'
      ],
      replayTimeline: [
        '10:15 - Requirement Document Imported'
      ],
      diffResult: {
        oldValue: 'drift tolerance window threshold = 300s;',
        newValue: 'drift tolerance window threshold = 600s;',
        changeReason: 'Updated specification support.',
        additionsCount: 5,
        deletionsCount: 3
      }
    });

    // Check Header Cockpit metrics
    expect(html).toContain('QA Evolution Control Deck');
    expect(html).toContain('Overall Impact: Medium');
    expect(html).toContain('Active Revision:');
    expect(html).toContain('v3');
    expect(html).toContain('Changed Areas:');
    expect(html).toContain('Requirement, Strategy');
    expect(html).toContain('Started: 10:15');
    expect(html).toContain('Duration: 27 mins');

    // Check Timeline & Selectors
    expect(html).toContain('QA Evolution Timeline history');
    expect(html).toContain('Revision v3 (Published)');
    expect(html).toContain('By Raj • Gen: Claude • Reason: Spec update');

    expect(html).toContain('Object Comparison Configuration');
    expect(html).toContain('compare-object-select');
    expect(html).toContain('Compare Object:');
    expect(html).toContain('compare-v1');
    expect(html).toContain('compare-v2');

    expect(html).toContain('Story Evolution Trace path');
    expect(html).toContain('QA Strategy Evolution Journey:');

    // Check Side-by-Side Object Diff comparator
    expect(html).toContain('Side-by-Side Object Diff comparator');
    expect(html).toContain('Side by Side');
    expect(html).toContain('Unified');
    expect(html).toContain('Summary');
    expect(html).toContain('drift tolerance window threshold = 300s;');
    expect(html).toContain('drift tolerance window threshold = 600s;');
    expect(html).toContain('Change Explanation:');
    expect(html).toContain('Updated specification support.');

    // Check Testing Impact Analysis
    expect(html).toContain('Publishing & Testing Impact Analysis');
    expect(html).toContain('Affected Components:');
    expect(html).toContain('Affected Test Cases:');
    expect(html).toContain('Coverage Delta:');
    expect(html).toContain('+6%');

    // Check Decision history & Replay timeline
    expect(html).toContain('QA Decisions history log');
    expect(html).toContain('Accepted Recommendation #12');

    expect(html).toContain('Workspace Replay timeline trace');
    expect(html).toContain('10:15 - Requirement Document Imported');

    // Check Action buttons
    expect(html).toContain('Compare');
    expect(html).toContain('Restore');
    expect(html).toContain('Replay');
    expect(html).toContain('Export Diff');
  });

  it('Test 27: renderLayout returns resizable splitters, tabbed context panels, font size zoom buttons, keyboard shortcuts guides, command palette search lists, and floating toast controls', () => {
    const stages = [
      { id: 'dashboard', title: 'Dashboard', status: 'active' as const, statusLabel: 'Active', contentHtml: '<div>Dashboard Cockpit</div>', suggestedPrompts: [] }
    ];
    const html = renderLayout(
      stages,
      false, // devModeEnabled
      false, // isAnalyzing
      '<div>timeline</div>',
      'Sprint 14 specifications',
      'active',
      'meta',
      'type prompt...',
      'dashboard'
    );

    // Check resizable splitter
    expect(html).toContain('workspace-splitter');
    expect(html).toContain('workspace-splitter');

    // Check tabbed drawer options
    expect(html).toContain('drawer-tab');
    expect(html).toContain('tab-health');
    expect(html).toContain('tab-recs');
    expect(html).toContain('tab-logs');
    expect(html).toContain('tab-ai');
    expect(html).toContain('drawer-panel-health');
    expect(html).toContain('drawer-panel-recs');

    // Check zoom button items
    expect(html).toContain('A-');
    expect(html).toContain('A+');
    expect(html).toContain('adjustZoom');

    // Check shortcuts helpers dialog modal
    expect(html).toContain('shortcuts-modal');
    expect(html).toContain('Workspace Keyboard Shortcuts');

    // Check Command Palette dialog modal
    expect(html).toContain('palette-modal');
    expect(html).toContain('palette-search-input');
    expect(html).toContain('triggerPaletteCommand');

    // Check floating toast container overlay
    expect(html).toContain('toast-container');
    expect(html).toContain('qamate-toast-container');

    // Check status bar telemetry
    expect(html).toContain('AI');
    expect(html).toContain('Claude');
    expect(html).toContain('DNA');
    expect(html).toContain('Loaded');
    expect(html).toContain('Review');
    expect(html).toContain('Passed');
    expect(html).toContain('Revision');
    expect(html).toContain('v3');
    expect(html).toContain('Session');
    expect(html).toContain('Saved');
  });
});

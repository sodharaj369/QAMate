# QAMate v1 Screen Designs 🎨

This document defines the interface wireframe layouts, content sections, and interaction guidelines for each screen in QAMate v1. All styles maps to native VS Code tokens.

---

## 1. Home Screen (Redesigned)

A clean workspace designed to put value first and configuration later. All credentials and provider selections are moved to Settings or lazy wizards.

```text
+-------------------------------------------------------------+
|  QAMate                                                     |
|  The fastest way to turn requirements into trusted          |
|  QA deliverables.                                           |
+-------------------------------------------------------------+
|                                                             |
|  Paste Requirement                                          |
|  +-------------------------------------------------------+  |
|  | [ Text Area: Enter user story or spec text... ]        |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  [ Analyze Requirement (Primary Button) ]                  |
|                                                             |
+-------------------------------------------------------------+
|  OR                                                         |
|                                                             |
|  [ Analyze Current File ]                                   |
|  [ Upload Requirement ]                                     |
|  [ Import Azure DevOps Story ]                              |
|  [ Import Jira Issue ]                                      |
+-------------------------------------------------------------+
|  Recent Sessions                                            |
|  - Auth Service Spec (2 mins ago)    [Resume] [Delete]      |
|  - Payments API Flow (1 hour ago)    [Resume] [Delete]      |
+-------------------------------------------------------------+
|  System Status                                              |
|  AI: Offline | Azure: Not Connected | Jira: Not Connected   |
|                                                             |
|  [ Settings -> ]                                            |
+-------------------------------------------------------------+
```

---

## 2. Navigation
A sticky 4-item global navigation bar at the top or bottom of the workspace view:
```text
🏠 Home  |  📂 Sessions  |  ⚙ Settings  |  ❓ Help
```

---

## 3. Settings Screen
The single place for all setup and diagnostic configurations:

```text
+-------------------------------------------------------------+
|  ⚙ Settings                                                 |
+-------------------------------------------------------------+
|  CONNECTIONS                                                |
|  > AI Connection                                            |
|    Status: Offline [Connect]                                |
|  > Azure DevOps Connection                                  |
|    Status: Not Connected [Connect]                          |
|  > Jira Connection                                          |
|    Status: Not Connected [Connect]                          |
+-------------------------------------------------------------+
|  PREFERENCES                                                |
|  QA Perspective:  [ Manual QA ] V                           |
|  Theme:           [ Auto-Detect ] V                         |
|  Export Default:  [ Excel ] V                               |
|  Notifications:   [ Enabled ] V                             |
+-------------------------------------------------------------+
|  [ ] Developer Mode (Checkbox)                              |
+-------------------------------------------------------------+
|  (Appears only if Developer Mode is checked)                |
|  DEVELOPER TOOLS                                            |
|  > Diagnostics [Run Diagnostics]                            |
|  > Engine Logs [View Logs]                                  |
|  > Reasoning Trace [View Traces]                            |
|  > Token Usage: 0 tokens this session                       |
+-------------------------------------------------------------+
```

---

## 4. AI Connection Wizard
Triggered by clicking `Connect` under Settings ➔ AI Connection:

```text
+-------------------------------------------------------------+
|  Connect AI Provider                                        |
+-------------------------------------------------------------+
|  Scanning environment...                                    |
|  Checking local VS Code context...                          |
|                                                             |
|  (Case A: VS Code AI Detected)                              |
|  +-------------------------------------------------------+  |
|  |  VS Code AI Found:                                    |  |
|  |  GPT-5.5 (via GitHub Copilot)                         |  |
|  |                                                       |  |
|  |  [ Use VS Code AI (Primary Button) ]                  |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  (Case B: Custom Providers list / Manual setup)             |
|  Select AI Provider:                                        |
|  ( ) OpenAI                                                 |
|  ( ) Anthropic Claude                                       |
|  ( ) Google Gemini                                          |
|  ( ) Ollama (Local)                                         |
|  (*) Offline Rules Engine Only                              |
|                                                             |
|  [ Save & Connect ]                                         |
+-------------------------------------------------------------+
```

---

## 5. Azure DevOps & Jira Import Wizards
Triggered from the Home screen "Import Azure DevOps Story" or "Import Jira Issue":

```text
+-------------------------------------------------------------+
|  Import Azure DevOps Work Item                              |
+-------------------------------------------------------------+
|  Step 1: Enter Organization Name                            |
|  [ company-org ]                                            |
|                                                             |
|  Step 2: Enter Personal Access Token (PAT)                  |
|  [ •••••••••••••••••••••••••••••• ]                         |
|                                                             |
|  [ Test Connection ] ➔ Output: Connection Successful!       |
|                                                             |
|  [ Done (Save Securely) ]                                   |
+-------------------------------------------------------------+
```

---

## 6. QA Readiness Panel (Prepare Outcome)
Only shown if requirements validation finds blocking gaps:

```text
+-------------------------------------------------------------+
|  Prepare: QA Readiness Check                                |
|  QAMate found 2 gaps that block test strategy creation.     |
+-------------------------------------------------------------+
|  Gap 1: Authentication Protocol                             |
|  What is the target protocol for user logins?               |
|  ( ) JWT Token                                              |
|  ( ) OAuth 2.0 / OpenID Connect                             |
|  ( ) Basic Auth                                             |
|                                                             |
|  Why is this asked?                                         |
|  This decision changes authorization test coverage and      |
|  determines security validation scope.                      |
|                                                             |
|  [ Skip Question ]                                          |
|  Warning: Skipping this will result in missing security     |
|  regression test cases.                                     |
+-------------------------------------------------------------+
|  [ Back ]                                      [ Next Gap ] |
+-------------------------------------------------------------+
```

---

## 7. Test Strategy Panel (Plan Outcome)

```text
+-------------------------------------------------------------+
|  Plan: Review Test Strategy                                 |
+-------------------------------------------------------------+
|  Scope Limits                                               |
|  In-Scope: Login, token refresh, password resets.           |
|  Out-of-Scope: Third-party SAML integration.                |
+-------------------------------------------------------------+
|  Risk Matrix Coordinates                                    |
|  High Risk: Session expiration under high load.             |
|  Medium Risk: Form validation error messages.               |
+-------------------------------------------------------------+
|  Testing Approach & Exclusions                              |
|  Priority: Focus on P0 Security and Negative edge cases.    |
|  Automation Recommendation: API testing for tokens.         |
+-------------------------------------------------------------+
|  [ Approve Strategy (Primary Button) ]                      |
+-------------------------------------------------------------+
```

---

## 8. Results Workspace (Review Outcome)
Consolidated view with tabs:

```text
+-------------------------------------------------------------+
|  Review: Results Workspace                                  |
+-------------------------------------------------------------+
|  [ Strategy ]  |  [*Test Cases*]  |  [ Coverage ]  |  [ Review ]
+-------------------------------------------------------------+
|  Search Test Cases: [ Search text... ]                      |
+-------------------------------------------------------------+
|  TC-001: JWT Token Valid Format                             |
|  Preconditions: User input is a valid auth header.          |
|  Steps:                                                     |
|  1. Send request with valid bearer JWT.                     |
|  2. Verify 200 OK.                                          |
|                                                             |
|  [ Edit (Markdown) ]                          [ Delete ]    |
+-------------------------------------------------------------+
|  TC-002: JWT Token Expired                                  |
|  Preconditions: Expiry timestamp is in the past.            |
|  ...                                                        |
+-------------------------------------------------------------+
|  [ Proceed to Deliver (Primary Button) ]                    |
+-------------------------------------------------------------+
```

---

## 9. Export & Synchronization Panel (Deliver Outcome)

```text
+-------------------------------------------------------------+
|  Deliver: Export Deliverables                               |
+-------------------------------------------------------------+
|  Requirement Title: Auth Service API Spec                   |
|  Deliverables Approved: 12 Test Cases, 1 Strategy           |
+-------------------------------------------------------------+
|  Select Export Format:                                      |
|  [ Excel (.xlsx) ]   ➔ [ Download ]                         |
|  [ Markdown (.md) ]  ➔ [ Save in Project ]                  |
|  [ PDF Report ]      ➔ [ Download ]                         |
+-------------------------------------------------------------+
|  Or Sync to Enterprise Systems:                             |
|  [ Sync to Azure DevOps (Attach to Work Item #1042) ]       |
|  [ Sync to Jira (Attach to User Story JIRA-541) ]           |
+-------------------------------------------------------------+
|  [ Done (Return Home) ]                                     |
+-------------------------------------------------------------+
```

---

## 10. Developer Mode Overlay
Visible only when Developer Mode is active. Renders as a sidebar collapsible tray or tab:

```text
+-------------------------------------------------------------+
|  [v] Developer Mode Details                                 |
+-------------------------------------------------------------+
|  Engine Logs:                                               |
|  [18:12:05] Analyzer: Scanning document ast...              |
|  [18:12:06] Scorer: Computed health rating: 84%              |
+-------------------------------------------------------------+
|  Reasoning Path:                                            |
|  - Domain: Security (matched keyword 'token', 'jwt')        |
|  - Gaps: 1 gap found ('auth-protocol')                      |
+-------------------------------------------------------------+
|  Token Metrics:                                             |
|  Prompt Tokens: 1245 | Completion Tokens: 432 | Cost: $0.03 |
|  Confidence Rating: High (0.92)                             |
+-------------------------------------------------------------+
```

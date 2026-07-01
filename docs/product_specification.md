# QAMate v1 Product Specification 📋

This document defines the frozen functional specifications for the QAMate v1 release. 

---

## 1. Product Philosophy
QAMate is **NOT** an AI chat application. It is:
> **A QA workspace that transforms software requirements into trusted QA deliverables.**

Every feature, interface element, and background heuristic must reinforce this philosophy by optimizing for **human QA Lead confidence** over mindless automation.

---

## 2. Outcome-Based Workflow Specifications

### Outcome 1: Understand
The **Understand** outcome manages requirement intake and compiles structural insights from requirements.

* **Intake Priorities**:
  1. **Paste**: Paste raw requirement text or story snippets directly into a dashboard text area.
  2. **Current File**: Detect and analyze the active editor file in VS Code.
  3. **Upload**: Drag and drop or browse to upload local requirement specifications (.md, .txt, .pdf, .docx, .json, etc.).
  4. **Azure DevOps Story**: Import a work item from Azure DevOps using a wizard.
  5. **Jira Issue**: Import an issue from Jira using a wizard.
* **Analysis Progress Indicators**:
  The UI must show real progress status logs matching engine steps. No fake timing delays. The progress updates must read:
  - `Understanding Requirement...`
  - `Validating...`
  - `Extracting Rules...`
  - `Finding Risks...`
  - `Done`
* **Analysis Summary**:
  The resulting analysis dashboard is restricted to exactly these six sections:
  1. **Requirement Health Rating**: Scorecard detailing duplicate requirements or inconsistencies.
  2. **Actors**: Identified human or system roles interacting with the feature.
  3. **Business Rules**: Indexed validation logic and operations.
  4. **Acceptance Criteria**: Traceable criteria extracted from the source text.
  5. **Risks**: High, medium, and low technical/operational risk areas.
  6. **Recommendations**: Strategic advice with clear explanations.

### Outcome 2: Prepare (QA Readiness)
The **Prepare** outcome addresses requirement gaps and ambiguities before strategies are written.

* **Conditional Appearance**: The QA Readiness screen appears **ONLY** if the analyzer identifies gaps or ambiguities that require user clarification. If no questions are generated or all are optional, this view is bypassed, and the user goes directly to **Plan**.
* **Traceable Rationale**: Every question must state *why* it is being asked and *how* the answer changes the final test suite. No generic questions are allowed.
  - *Example*: Authentication mechanism? ➔ *Why*: This decision changes authorization test coverage and security validation scope.
* **Skip Risks**: If a user attempts to skip a question, the UI must explain the risk to test quality (e.g. *"Skipping this performance query will result in missing load test guidelines"*).

### Outcome 3: Plan (Test Strategy)
The **Plan** outcome compiles the strategic testing approach.

* **Test Strategy Elements**:
  - **Scope**: What is in-scope and out-of-scope for testing.
  - **Risks**: The testing risk matrix (criticality vs complexity).
  - **Priorities**: Core test priorities (P0/P1/P2/P3 rules).
  - **Approach**: Target frameworks and methodology overrides.
  - **Automation Suggestions**: Specific areas recommended for automation.
* **Interaction**: The user must review, edit, and actively approve the strategic parameters before test case generation is enabled.

### Outcome 4: Generate (Generate Test Suite)
The **Generate** outcome produces the concrete test deliverables based on the approved strategy.

* **Default Test Suites**:
  - **Manual Tests** (Positive, Negative, Boundary cases).
* **Recommended Test Suites** (User selects from list):
  - **API Tests**
  - **SQL Verification**
  - **Security Audits**
  - **Performance / Load**
  - **Accessibility (WCAG)**
  - **Automation Skeletons**

### Outcome 5: Review
The **Review** outcome consolidates generated deliverables for validation.

* **Consolidated Preview Tabs**:
  - **Strategy**: Approved strategy variables.
  - **Test Cases**: Comprehensive, searchable grid of test scenarios.
  - **Coverage**: Traceability mapping test cases back to business rules.
  - **Review**: Static analysis check logs (checking for duplicates or compliance).
* **Interaction**: All test cases and descriptions in the grid must support inline Markdown text editing and search.

### Outcome 6: Deliver
The **Deliver** outcome processes the export and synchronization of approved deliverables.

* **Export Formats**:
  - **Excel**: Standard grid sheet for manual QA uploads.
  - **Markdown**: Formatted file for source control inclusion.
  - **PDF**: Ready-to-print executive summary report.
  - **Azure DevOps Sync**: Direct synchronization to Azure DevOps Test Plans as test steps.
  - **Jira Sync**: Direct attachment or sub-task sync to the source story.

---

## 3. Core Product Rules
1. **Never Ask If Engine Knows**: If a detail is discoverable in the active file, project configuration, or workspace context, the system must not query the user.
2. **Never Ask If Output Doesn't Change**: If an answer doesn't alter the generated strategy, cases, or frameworks, do not present the question.
3. **Never Show Fake Progress/Confidence**: Eliminate mock loading times and arbitrary confidence percentages.
4. **Never Expose Engine Complexity**: Raw prompts, neural configurations, and token costs remain isolated in Developer Mode.
5. **Always Explain Recommendations**: Every recommendation or rule audit must be backed by a clear rationale detailing:
   - *What happened?*
   - *Why?*
   - *What should I do next?*

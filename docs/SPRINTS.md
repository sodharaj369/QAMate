# QAMate Sprint Backlog & Verification Specifications 🏃‍♂️

Every sprint in this backlog is oriented around the **user journey** (Trust, Intelligence, Orchestration, Reasoning, Review, Export) and must begin with the following mandatory engineering check:

> [!IMPORTANT]
> **PONYTAIL PHILOSOPHY NEED CHECK**
> Before writing any code for a feature task in any sprint, verify:
> 1. Is this needed?
> 2. Can it be skipped?
> 3. Can it be reused?
> 4. Can VS Code already do it?
> 5. Can Rule Validation Engine do it?
> 6. Should AI even be called?
> 7. Can previous reasoning be reused?
> 8. Will this improve QA?
> 9. Will this reduce AI tokens?
> *Only then implement.*

---

## Detailed Sprints

### Sprint 1 — Trust & Foundation
*   **Goal**: Deliver a cohesive Welcome page displaying real-time connection states and active workspace caches, removing stale configurations on startup.
*   **Tasks**:
    1. Build central AppState model managing active view states and cold launch synchronization.
    2. Register the Session Manager aggregate tracking active session listings, renames, copies, and deletion events.
    3. Implement connection detection widgets verifying states for AI providers, Azure DevOps, and Jira APIs.
    4. Compile the Living Workspace outcomes stepper skeleton.
*   **Folder Location**: `packages/vscode-extension/src/providers/workspaceProvider.ts`, `packages/vscode-extension/src/ui/components/`
*   **Acceptance Criteria**: Launching the extension displays active status badges (e.g. AI 🟢 Claude Sonnet, Azure 🟢 Connected) and lists recent sessions with zero configuration blocker screens.
*   **Manual Test**: Configure connection credentials, close workspace, reopen and confirm the welcome page displays green status badges immediately without stale indicators.
*   **Edge Cases**: Launching in an empty folder hides the session lists and displays a "No open folders" layout.

### Sprint 2 — Requirement Intelligence
*   **Goal**: Construct watches, classification regex patterns, and local rules scorecards to parse inputs without triggering AI completions.
*   **Tasks**:
    1. Write document watches listening for active text editor focus shifts.
    2. Implement zero-dependency DOCX and PDF text parsers extracting plain runs.
    3. Build validator modules auditing constraints (VAL-005, VAL-006, VAL-007).
    4. Wire the local decision ladder evaluating requirement confidence scores before proposing AI requests.
*   **Folder Location**: `packages/engine/src/rule-validation/`, `packages/engine/src/reasoning/`
*   **Acceptance Criteria**: Dropping a spec on the panel displays extracted actors, rules, ambiguities, and risk scorecards.
*   **Manual Test**: Drop a spec file missing acceptance rules on the sidebar, check that the scorecard registers a VAL-006 warning.
*   **Edge Cases**: Saving document changes debounces the parser watches to avoid duplicate analysis triggers.

### Sprint 3 — AI Hub & Orchestration
*   **Goal**: Establish Pluggable AI Orchestration supporting multiple simultaneous providers, automatic failover, and token analytics logs.
*   **Tasks**:
    1. Implement provider-hub factories resolving primary providers and overrides.
    2. Integrate the native VS Code LM API first, auto-detecting GitHub Copilot.
    3. Build 30-second connection timeout wrappers triggering failovers.
    4. Write token analytics calculators logging input/output tokens, estimated API costs, and cache hits.
*   **Folder Location**: `packages/engine/src/provider-hub/`, `packages/engine/src/analytics/`
*   **Acceptance Criteria**: Triggering analysis prints detailed diagnostics: Provider (Claude), Model (Sonnet 4.6), Calls (2), Time (3.2s), Tokens (3,400), Saved (7,200), Cost ($0.011), Cache Hits (1).
*   **Manual Test**: Disconnect connection during request; confirm visual notifications warn of timeout and failover to Ollama local server finishes.
*   **Edge Cases**: Rate limits caught on one provider redirect payload contexts immediately to the fallback model.

### Sprint 4 — QA Decision Engine (Moat Sprint)
*   **Goal**: Deploy QAMate's core reasoning engine: confidence matrices, material clarifications, and domain-persona context compilation.
*   **Tasks**:
    1. Build QA Decision matrices scoring complexity against business risks.
    2. Implement the material clarification question candidate planner.
    3. Construct zero-question stepper paths that bypass QA Readiness stepper if confidence scores exceed 0.8.
    4. Compile tailored context parameters shape-shifting generation rules based on target QA Persona configurations.
*   **Folder Location**: `packages/engine/src/decision-engine/`, `packages/engine/src/reasoning/`
*   **Acceptance Criteria**: Vague specifications generate a maximum of 3 targeted questions mapping logic risks, while highly clear specifications auto-skip the Prepare stepper.
*   **Manual Test**: Intake a complete spec, verify stepper moves directly to the Strategy Plan view.
*   **Edge Cases**: Backtracking questions does not corrupt saved AppState stepper configurations.

### Sprint 5 — Results Workspace
*   **Goal**: Render premium, interactive tables containing filters and search grids, replacing raw markdown templates.
*   **Tasks**:
    1. Replace raw text codes with structured tables parsing TC priorities, steps, and expected results.
    2. Write search filters and inline cell editing listeners.
    3. Implement checkmark state synchronization mapping UI checklist actions back to TestCase aggregates.
*   **Folder Location**: `packages/vscode-extension/src/ui/pages/ArtifactsPage.ts`, `packages/vscode-extension/src/ui/viewmodels/`
*   **Acceptance Criteria**: Double-clicking table cells edits step text inline, and checkmarks persist on searches.
*   **Manual Test**: Select cases checklist, filter by "POS", double-click step cell and edit text, check that JSON save records update.
*   **Edge Cases**: Swapping tabs retains edit data in active cache before final storage writes.

### Sprint 6 — Review & Export
*   **Goal**: Generate styled Excel workbooks, dynamic filename paths, and present QAMate's signature QA Health dashboard.
*   **Tasks**:
    1. Implement ExcelJS exporters creating Summary, Strategy, Test Cases, Risks, and Traceability sheet tabs.
    2. Setup sheet freeze panes, autofilters, and dynamic filename configurations.
    3. Build QA Health dashboards displaying metrics: Requirement Quality, Rules Coverage, Confidence, Risks Mapped, Questions Asked, Questions Avoided, AI Efficiency (e.g. A+), and Ready for Export.
    4. Compile export formats: XLSX, CSV, PDF, Markdown, JSON. (Legacy XLS is deprecated).
*   **Folder Location**: `packages/engine/src/platform/`, `packages/vscode-extension/src/ui/pages/ReviewPage.ts`
*   **Acceptance Criteria**: Exporting workbook formats output with freeze panes, and review tabs render QA Health gauges before download triggers.
*   **Manual Test**: Complete analysis, verify the Review tab presents: "Coverage: 96%, AI Efficiency: A+, Ready for Export: YES".
*   **Edge Cases**: Cells containing XML bracket markers are escaped during spreadsheet compile to avoid corruption.

### Sprint 7 — AI Optimization (USP Sprint)
*   **Goal**: Build context prompt compression, delta prompting, cache reuse, and token reduction models.
*   **Tasks**:
    1. Write whitespace and comment pruning filters inside Context Compilers.
    2. Build delta prompting engines that submit only modified answers/changes on stepper updates.
    3. Optimize prompt structures to place static instructions at the start, promoting cache reuse.
*   **Folder Location**: `packages/engine/src/token-optimizer/`
*   **Acceptance Criteria**: Large specifications compiled to prompt completions drop 60% of redundant token payloads.
*   **Manual Test**: Monitor token analytics logs; verify prompt runs show high cache hit ratios and reduced cost metrics.
*   **Edge Cases**: System prompts are cached globally on the active LLM provider.

### Sprint 8 — Knowledge Engine
*   **Goal**: Deploy localized learning suggest pipelines, approval gates, and playbook rules versioning.
*   **Tasks**:
    1. Build the three-tiered QA memory lookup hierarchy: Session Memory ➔ Project Memory ➔ Organization Playbooks.
    2. Write suggestion approval grids in the review workspace, ensuring AI suggestions must be approved before serializing.
    3. Implement versioned playbooks allowing rules rollbacks.
    4. Lock the rule constraint: **AI must never rewrite deterministic engine logic automatically.**
*   **Folder Location**: `packages/engine/src/knowledge/`, `packages/engine/src/learning/`
*   **Acceptance Criteria**: QA Lead approves corrections suggestion; future analysis loads these rules to guide Prompt Builders.
*   **Manual Test**: Trigger suggestion checklist, approve item, check that `data/knowledge/store.json` registers rule.
*   **Edge Cases**: Rollbacks restore the repository guidelines index database to older Git hashes.

### Sprint 9 — Integrations
*   **Goal**: Replace simulated storage with real databases and sync child deliverables directly to DevOps and JIRA boards.
*   **Tasks**:
    1. Build SQLite local database storage adapters.
    2. Write ADO patch commands creating child work items linked hierarchically to parent user story IDs.
    3. Connect Jira sync commands to Zephyr/Xray REST APIs, exporting tests as structured items.
*   **Folder Location**: `packages/engine/src/session/`, `packages/engine/src/integrations/`
*   **Acceptance Criteria**: Sessions resume cleanly from SQLite records, and synchronizations write structured tests to external boards.
*   **Manual Test**: Run JIRA sync, confirm ticket details show test issue parameters instead of comment logs.
*   **Edge Cases**: Expired PAT tokens raise explicit authentication error alerts.

### Sprint 10 — Release Readiness
*   **Goal**: Execute release packaging, accessibility gating, telemetry opt-ins, and performance profiling runs.
*   **Tasks**:
    1. Profile cold start timings, memory thresholds, and bundle sizes, maintaining activation times under 50ms.
    2. Verify keyboard tab indices and screen reader ARIA labels in sidebar components.
    3. Bundle build parameters (VSIX, README, screenshots, CHANGELOG, LICENSE, Privacy Policy).
    4. Wire opt-in telemetry reporting.
*   **Folder Location**: Monorepo packages root builds
*   **Acceptance Criteria**: VSIX extension bundles compile cleanly and pass all validation gates.
*   **Manual Test**: Install VSIX on a clean editor, check settings accessibility, verify telemetry opt-out switches work.
*   **Edge Cases**: Stress benchmarks execute successfully inside target timings.

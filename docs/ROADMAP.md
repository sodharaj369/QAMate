# QAMate Product Roadmap & Architecture Blueprint 🗺️

## Vision
**QAMate is a native VS Code AI-powered QA Reasoning Workspace that transforms requirements into trusted QA deliverables through Lean QA Intelligence, deterministic validation, AI orchestration, and human review. QAMate optimizes for user confidence over automation and maximum QA value per token.**

---

## Product Principles
1.  **Trust Before Automation**: Generate fewer high-trust tests rather than thousands of unverified, shallow test cases.
2.  **AI-Backed Reasoning**: AI amplifies but does not replace the local rules validation engine.
3.  **Rule Validation**: Validate requirement syntax and boundaries deterministic-first.
4.  **Lean QA Intelligence**: Minimize AI completions and queries through local diagnostics.
5.  **Maximum QA Value per Token**: Optimize payload structures, utilizing prompt compression and caching strategies.
6.  **Native VS Code**: Prefer Secret Storage, LM APIs, and native components before custom integrations.
7.  **Living Workspace**: Guide the user sequentially through the six outcomes steps.
8.  **Human Override**: Ensure the QA Lead has override capabilities on exclusions, priorities, and steps.
9.  **Review Before Export**: Gate export triggers with interactive tables and quality dashboards.
10. **Controlled Learning**: Accumulate corrections locally with approval gates, preventing automatic prompt overrides.

---

## First-Class Architectural Decision Flow
Before any AI provider completion call is initiated, the compiler must evaluate this flow:

```
Requirement Specification
   │
   ▼
Need AI completion? ──(No)──➔ Return static template / Skip
   │ (Yes)
   ▼
Already Cached? ──────(Yes)──➔ Return cache
   │ (No)
   ▼
Already Known? ───────(Yes)──➔ Return project memory
   │ (No)
   ▼
Need User input? ─────(Yes)──➔ Present Wizard / Stepper
   │ (No)
   ▼
Generate Deliverables (Maximum QA Value per Token)
   │
   ▼
Store Learnings (Suggestions ➔ Approval)
   │
   ▼
Update Analytics (Token audits, cost estimation)
```

---

## Folder Structure
```
QAMate/
├── docs/                            # Product Bible & Roadmaps
├── examples/                        # Golden dataset files
├── packages/
│   ├── shared/                      # Base loggers, shared custom errors
│   └── engine/                      # Core business logic & provider gateways
│       ├── src/
│       │   ├── domain.ts            # DDD aggregate models & entities
│       │   ├── types.ts             # Context & configuration structures
│       │   ├── interfaces/          # Engine module contracts
│       │   ├── reasoning/           # Analysis strategy planners
│       │   ├── decision-engine/     # Stepper wizards & question planners
│       │   ├── rule-validation/     # Heuristics rules & scorers
│       │   ├── knowledge/           # Session/Project/Org memories
│       │   ├── token-optimizer/     # Prompt compressors & caching
│       │   ├── provider-hub/        # LM API ports & factories
│       │   ├── analytics/           # Cost logs & token usage analytics
│       │   ├── learning/            # QA correction suggestions approvals
│       │   └── session/             # SQLite & local JSON databases
│       └── package.json
└── package.json                     # Monorepo root workspace configuration
```

---

## Epics
*   **Epic 1: Unified QA Intake & Parsing**: Support reading specs from active buffers, local uploads, binary DOCX/PDF extractors, Azure DevOps Work Items, and Jira issue keys.
*   **Epic 2: Rule Validation & Requirement Intelligence**: Implement offline rules-based validations and classifiers to scorecard rules, actors, and gaps.
*   **Epic 3: Lean QA Decision Engine**: Formulate questions only when confidence score falls below 0.8, providing zero-question paths.
*   **Epic 4: Strategy Override Matrix**: Formulate risk prioritization models and visual grids to override recommendations.
*   **Epic 5: QA Deliverables Generation**: Build Test Cases, Risks, Traceability matrices, Coverage scorecards, Test Data, Assumptions, Out-of-Scope items, and Reviews tailored to QA Persona rules.
*   **Epic 6: AI Provider Hub**: Integrate VS Code LM API, Copilot, Claude, GPT, Gemini, and Ollama under a unified provider gateway with 30s automatic failovers.
*   **Epic 7: Results Workspace**: Render professional tables, filtering, search, and inline cell editing, syncing changes back to TestCase aggregates.
*   **Epic 8: Results Review & Export**: Build review gates and safety checkers presenting the signature QA Health dashboard before XLSX, CSV, PDF, Markdown, and JSON exports.
*   **Epic 9: AI Optimization & Token Economy**: Implement context prompt compression, delta prompting, cache reuse, and token analytics logs.
*   **Epic 10: Knowledge Engine**: Structure Session ➔ Project ➔ Organization memory retrieval, with learning suggestions and approval gates.
*   **Epic 11: Release Readiness**: Execute cold start audits, memory diagnostics, ARIA checksheets, and telemetry opt-ins, compiling VSIX bundles.

---

## Definition of Done (DoD)
Every pull request and sprint delivery must satisfy:
- [ ] **Type Check**: TypeScript compiles cleanly with zero compilation errors.
- [ ] **Linter & Formatter**: ESLint Flat rules and Prettier formats pass checks.
- [ ] **Unit Tests**: Coverage targets met with Vitest runner.
- [ ] **Zero SDK Leakage**: Core packages contain no external client SDK imports or VS Code visual dependencies.
- [ ] **Heuristics Safety**: The module runs successfully offline using rule-based strategies when AI keys are absent.
- [ ] **Traceability Check**: Every generated deliverable maps back to a specific requirement rule or index.
- [ ] **No Fake Intelligence**: The UI never mocks active network connections or displays simulated status runs.
- [ ] **No Unnecessary AI Calls**: The operation checks the decision ladder and avoids calls if data is cached or known.
- [ ] **Token Usage Measured**: Logs input, output, and total tokens on completion.
- [ ] **Token Reduction Verified**: Compilers confirm prompt pruning is applied.
- [ ] **VS Code Native APIs Preferred**: Utilizes native editor components (SecretStorage, QuickPicks) before custom builds.
- [ ] **Lean QA Intelligence Followed**: Runs validation and heuristics before prompting AI.
- [ ] **Material Clarification Respected**: Stepper only triggers for critical logic gaps.
- [ ] **Architecture Documentation Updated**: Updates Product Bible files if refactoring shifts package interfaces.
- [ ] **AI Constitution Not Violated**: Code matches the root [AI_CONSTITUTION.md](file:///d:/QAMate/AI_CONSTITUTION.md) directives.

---

## Future Work
*   **Team Knowledge**: Shared team playbooks and organizational database synchronization.
*   **AI Evaluation**: Benchmarking models based on rules compliance and generation speed.
*   **Prompt Replay**: Replaying and debugging past context compilations.
*   **Enterprise Policies**: Enterprise role-based access controls and custom validation policies.

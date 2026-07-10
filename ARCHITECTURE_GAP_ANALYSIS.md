# QAMate Architecture Gap Analysis
**Comprehensive Module-by-Module Technical Assessment & Migration Roadmap**

This document evaluates the packages and source modules of QAMate against the new product vision defined in the **QAMate Manifesto** and **Workflow v2**. 

Modules are categorized into one of five states:
* 🟢 **KEEP**: Core structural elements requiring no major changes.
* 🟡 **KEEP WITH MINOR CHANGES**: Conceptually sound elements needing cleanup or simplified dependencies.
* 🟠 **REFACTOR**: Modules needing design simplification or consolidation.
* 🔴 **REWRITE**: Brittle heuristics that must be rebuilt to support the **Evidence-Based Reasoning Flow**.
* ❌ **REMOVE**: Redundant or misaligned features that solve implementation problems and should be purged.

---

## Architectural Mapping Matrix

| Module | Category | Primary Dependency | Risk Level |
| :--- | :---: | :--- | :---: |
| **`WorkspaceIntelligenceEngine`** | 🆕 **NEW (KEEP)** | None | Low |
| **`platform/systemEngine.ts`** | 🔴 REWRITE | `SystemModel`, `ProjectDNA` | High |
| **`platform/reasoningEngine.ts`** | 🔴 REWRITE | `QAMateMentalModel` | High |
| **`ProjectDNAStore`** | 🆕 **NEW (KEEP)** | `ProjectConfig` | Medium |
| **`QAValueEngine`** | 🆕 **NEW (KEEP)** | `TestCase` | Medium |
| **`QAReviewEngine`** | 🆕 **NEW (KEEP)** | `TestCase`, `ReviewReport` | Medium |
| **`QARecommendationEngine`** | 🆕 **NEW (KEEP)** | `ProjectDNA` | Medium |
| **`ChangeIntelligenceEngine`** | 🆕 **NEW (KEEP)** | `SystemModel`, `TestStrategy` | Medium |
| **`token-optimizer` & `platform/efficiency.ts`** | 🟠 **REFACTOR / REDESIGN** | `AIRequest` | Medium |
| **`platform/trust.ts`** | ❌ REMOVE | None | Low |
| **`platform/security.ts`** | ❌ REMOVE | None | Low |
| **`clarification/` (Candidate, Planner)** | 🟠 REFACTOR | `Question` | Medium |
| **`decision-engine/` (Decision Matrix, Strategy Selector)** | ❌ REMOVE / 🟠 REFACTOR | `DecisionReport` | Medium |
| **`analyzer/` (Requirement Analyzer, Validator)** | 🟠 REFACTOR | `Requirement` | Medium |
| **`knowledge/` (Knowledge & Reusable Memory)** | 🟠 REFACTOR | `KnowledgeEntry` | Medium |
| **`provider-hub/` & `providers/` (Orchestration & LLMs)** | 🟡 KEEP WITH MINOR CHANGES | `ILLMProvider` | Medium |
| **`strategy/` (Test Strategy Engine)** | 🟡 KEEP WITH MINOR CHANGES | `TestStrategy` | Medium |
| **`artifacts/` (Planner, Generator, Parser)** | 🟡 KEEP WITH MINOR CHANGES | `QAArtifact` | Low |
| **`review/` (Review Engine & Quality Gates)** | 🟡 KEEP WITH MINOR CHANGES | `ReviewReport` | Low |
| **`coverage-engine/` (Rule Coverage Calculations)** | 🟢 KEEP | `CoverageReport` | Low |
| **`integrations/` & `storage/` (Jira, ADO, Persistence)** | 🟢 KEEP | `Conversation` | Low |

---

## Evaluation of Redesigned and New Components

### 1. `WorkspaceIntelligenceEngine` [NEW]
* **Category**: 🟢 **NEW (KEEP)**
* **Why it exists**: Serves as the repository scanner that runs upon project startup before any requirement is analyzed. It crawls the README, package.json/pom.xml, Docker configs, OpenAPI specs, playbooks, and existing tests to build the **Workspace Intelligence** registry.
* **Alignment**: High alignment with Step 0.
* **Migration Approach**: Implement as a local file parser that profiles project metadata and extracts endpoints, tech limits, and framework environments.
* **Dependencies**: None.
* **Risk**: Low.

### 2. `TokenOptimizer` (Redesigned as AI Request Optimizer)
* **Category**: 🟠 **REFACTOR / REDESIGN**
* **Why it exists**: Manages payload compilation, token budgeting, and caching.
* **Redesign Approach**: Rebuild as the **AI Request Optimizer**. It is responsible for delta prompting, static context caching, prompt chunking, provider-specific prompt formatting, context prioritization, Project DNA injection, and token budgeting. It must **never** strip code comments, rewrite user input, or change input meanings.
* **Dependencies**: `AIRequest`, `ILLMProvider`.
* **Risk**: Medium.

### 3. `ProjectDNAStore` [NEW]
* **Category**: 🟢 **KEEP / NEW**
* **Why it exists**: Serves as the "brain of the project." It stores tech stack choices, coding standards, business vocabulary, domain glossary, system architecture, testing standards, team preferences, known limitations, existing suites, integration landscape, and reusable components. It is fully visible and editable in the UI.
* **Alignment**: High alignment.
* **Migration Approach**: Create a stateful store loading these metrics from `.qamate/dna.json` or local settings. Build UI fields to display and edit each section.
* **Dependencies**: `ProjectConfig`.
* **Risk**: Low.

### 4. `QAValueEngine` [NEW]
* **Category**: 🟢 **KEEP / NEW**
* **Why it exists**: Serves as the core compiler that handles duplicate case removal, parameterization of minor validation checks, merging similar test objectives, and coverage optimization.
* **Alignment**: High alignment. This is QAMate's USP, converting raw generative test case suggestions into optimized suites.
* **Migration Approach**: Create a dedicated `QAValueEngine` service. It intercepts generated `TestCase` models before they are saved, runs local and AI-driven rules to merge similar objectives and parameterize data permutations into tables.
* **Dependencies**: `TestCase`.
* **Risk**: Medium.

### 5. `QAReviewEngine` [NEW]
* **Category**: 🟢 **KEEP / NEW**
* **Why it exists**: Serves as the compliance gate auditor that checks for weak expected results, missing negative assertions, missing boundaries (when relevant), checking traceability matrices, and verifying style and playbook compliance.
* **Alignment**: High alignment. It validates compliance, while the QA Value Engine focuses purely on optimization/pruning.
* **Migration Approach**: Create a compliance auditor service wrapping playbook and static check rules.
* **Dependencies**: `TestCase`, `ReviewReport`.
* **Risk**: Medium.

### 6. `QARecommendationEngine` [NEW]
* **Category**: 🟢 **KEEP / NEW**
* **Why it exists**: A platform-wide capability that evaluates requirements, system model, QA mental model, strategy, and knowledge against the Project DNA to output structured recommendations.
* **Alignment**: High alignment. It can run at any stage of the workspace (Requirement, System Model, Mental Model, Strategy).
* **Dependencies**: `ProjectDNA`, `SystemModel`, `QAMateMentalModel`, `TestStrategy`.
* **Risk**: Medium.

### 7. `ChangeIntelligenceEngine` [NEW]
* **Category**: 🟢 **KEEP / NEW**
* **Why it exists**: Computes requirements modifications across sprints and handles Story Evolution. It maps: Requirement Changed ➔ Detect What Changed? ➔ Why? ➔ Affected Components ➔ Affected Risks ➔ Affected Tests ➔ Affected Strategy ➔ Regenerate only affected outputs.
* **Dependencies**: `SystemModel`, `TestStrategy`, `TestCase`.
* **Risk**: Medium.

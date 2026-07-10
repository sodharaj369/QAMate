# QAMate Capability-First Implementation Roadmap (Roadmap v2)
**Capability-Oriented Phased Action Plan for AI-First QA Reasoning Workspaces**

This roadmap details the engineering phases required to transition QAMate to its new vision: an **AI-native QA Reasoning Workspace**. In contrast to previous feature-focused sprints, this plan builds capabilities in logical layers, prioritizing core schema boundaries and AI reasoning logic before assembling output templates and user interface controls.

---

## Roadmap Timeline at a Glance

```
  Phase 0: Workspace Intel        ──> Foundational repo scan & Project DNA settings UI
                 │
                 ▼
  Phase 1: Schemas & DNA Store    ──> Establish structural boundaries & Project DNA Store
                 │
                 ▼
  Phase 2: System & Request Opt   ──> System Model extraction & Request Optimization
                 │
                 ▼
  Phase 3: Mental Model & Gaps    ──> QA Mental Model compilation & Assumption Gates
                 │
                 ▼
  Phase 4: Strategy & Recs Engine ──> Test Strategy & Platform Recommendation Engine
                 │
                 ▼
  Phase 5: Value & Review Engines ──> QA Value & QA Review compilers & Deliverables
```

---

## Phase 0: Workspace & Project Intelligence
*Build the foundational repository scanner, extract playbooks, and construct the Project DNA settings interface.*

### Goal
Implement the **WorkspaceIntelligenceEngine** to crawl repository metadata upon launch, and build the transparent Project DNA editing interface.

### Why Now
Before QAMate can analyze a requirement or query an AI model, it must understand the project workspace context (languages, framework environment, OpenAPI endpoints, and existing tests) so that all downstream reasoning is aligned with the project's parameters.

### Dependencies
* None (Bootstrapping phase).

### Deliverables
* **WorkspaceIntelligenceEngine**: Core file-system crawler that profiles the repository directory, README, package configurations, API definitions, and testing directories.
* **Project DNA Settings UI**: A transparent, fully editable settings drawer displaying Architecture, Tech Stack, Vocabulary, Playbooks, and limitations directly to the user.
* **Structured Data Rule**: Enforce the constitutional constraint that all internal storage uses structured JSON, never raw files (which are strictly transient views).

### Acceptance Criteria
* Opening the workspace triggers a repository crawl in under 2 seconds.
* Exposes an editable vocabulary and playbooks editor in the sidebar.

### Manual Verification
1. Open a workspace folder; check that the Project DNA tab is populated with extracted tech stack data (e.g. Node environment, Playwright framework).
2. Edit a custom business term in the DNA vocabulary card; verify that the change is saved to local JSON storage.

---

## Phase 1: Structural Schemas & Project DNA Store
*Establish structural boundaries, manage project settings, and simplify orchestrations.*

### Goal
Define the validated schema contracts for the `SystemModel` and `TestStrategy` aggregates, build the **ProjectDNAStore** database model, and simplify provider gateways.

### Why Now
We must lock down the target schemas and the project's permanent DNA settings store before modifying reasoning logic.

### Dependencies
* Phase 0 Workspace Intelligence registry.

### Deliverables
* **Structural Schemas**: Validated schema contracts for the `SystemModel` (components, actors, flows) and the `TestStrategy` aggregates.
* **ProjectDNAStore**: A stateful store that manages Project DNA parameters and injects them into the reasoning context.
* **Simplified Orchestrator**: A lightweight connection gateway focusing purely on fallback routing, health queries, and timeouts.
* **Deprecation of Legacy Middleware**: Complete removal of prompt comment-stripping, USD cost estimations, and regex-based credentials checks.

---

## Phase 2: System Understanding & AI Request Optimizer
*Build System Model extraction and implement request-level prompt optimization.*

### Goal
Rewrite the system modeling engine to populate the System Model schema, and implement the redesigned **AI Request Optimizer** (the redesigned `TokenOptimizer`).

### Why Now
Once the System Model schemas are locked in, we can replace the fragile string-matching checks with actual AI observations. To support this efficiently, the AI Request Optimizer must manage prompts and payloads without stripping comments or rewriting user inputs.

### Dependencies
* Phase 1 schemas and simplified orchestration gateway.

### Deliverables
* **Schema-Driven Modeling**: A system understanding engine that extracts AI observations, rule templates, and Project DNA to populate the **QAMate System Model**. AI only contributes observations; the model itself belongs to QAMate.
* **AI Request Optimizer**: A redesigned layer responsible for delta prompting, static context caching, prompt chunking, provider-specific prompt formatting, context prioritization, Project DNA injection, and token budgeting. It must **never** strip code comments, rewrite user input, or change input meanings.

---

## Phase 3: QA Mental Model & Gaps Gating
*Compile the QA Mental Model, prepare validation checkpoints, and handle manual fallbacks.*

### Goal
Build the **QA Mental Model** compilation engine, implement the **Assumption Verification Gate**, and enable **Manual Analysis Mode**.

### Why Now
The QA Mental Model is the heart of QAMate. Before planning a strategy, we must compile the active facts, assumptions, inferences, and unknowns. If AI is offline, QAMate must degrade gracefully into a manual editor state rather than halting.

### Dependencies
* Phase 2 system modeling and optimization layers.

### Deliverables
* **QA Mental Model Compiler**: An engine that processes System Model nodes and evidence to compile the QA Mental Model (facts, assumptions, inferences, unknowns, reasoning trace).
* **Assumption Verification Gate**: A checkpoint where the user must review and confirm AI-extracted system assumptions before proceeding to the Plan phase.
* **Manual Analysis Mode**: UI and core controllers that enter AI Disconnected Mode when AI is offline, loading empty fields for manual mapping.
* **Communication Confidence**: UI modules displaying Understanding, Strategy, and Generation confidence scores (without using them to block progress).
* **Visual Operations Contracts**: Exposed UI cards showing the active contract's active guarantees and forbidden actions.

---

## Phase 4: Strategy Blueprint & Recommendation Engine
*Build the Test Strategy, implement structured strategy editing, and run the recommendation engine.*

### Goal
Build the `TestStrategy` engine, implement structured strategy input GUI fields, and run the platform-wide **QARecommendationEngine** component.

### Why Now
Once the QA Mental Model and system boundaries are verified, we can construct the Strategy Blueprint. Placing the Recommendation Engine here ensures it utilizes the full context of the System Model, Mental Model, and Strategy to make deep recommendations.

### Dependencies
* Phase 3 approved Mental Models and confirmed assumptions.

### Deliverables
* **Test Strategy Engine**: Build the Test Strategy aggregates mapping objectives, suites, and exclusions.
* **Structured Strategy GUI**: An editing interface for Objectives, Scope, and Out of Scope boundaries. Stored internally as JSON and exported as Markdown, but **never exposing raw markdown editing to the user**.
* **QARecommendationEngine**: A reusable platform-wide component that evaluates the System Model, QA Mental Model, Strategy, and Knowledge against the Project DNA to output structured recommendations: `Requirement ➔ Recommendation ➔ Reason ➔ Industry Practice ➔ Accept/Ignore`.
* **Reasoning Trace Logs**: Build the trace logs mapping: `Evidence ➔ Reasoning ➔ Decision ➔ Confidence ➔ Recommendation`.

---

## Phase 5: QA Value & Review Engines & Synthesis
*Prune test case noise, run compliance audits, handle change intelligence, and compile deliverables.*

### Goal
Deliver the **QAValueEngine** and **QAReviewEngine** components, run compliance audits, handle change intelligence, and compile QA deliverables.

### Why Now
This final outcome compiles and reviews QA deliverables. Splitting the value engine (optimization) from the review engine (compliance) ensures that quality audits are detailed and standard-compliant.

### Dependencies
* Phase 4 approved Strategy Blueprints.

### Deliverables
* **QAValueEngine**: Core optimization compiler responsible for duplicate case removal, parameterization of validation checks, merging similar objectives, and coverage optimization.
* **QAReviewEngine**: Compliance gate auditor responsible for evaluating weak expected results, missing negative assertions, missing boundaries (when relevant), checking traceability matrices, and verifying style and playbook compliance.
* **One Layout UI**: A unified UI layout featuring hidable and collapsible panels based on user preferences.
* **Change Intelligence Engine**: Computes requirement modifications across sprints, tracking **Story Evolution** and recording a **Change History Log**.
* **Bypassed Deliveries**: Action controllers that format and sync JSON files directly with local directories or ticket systems, rendering Markdown, HTML, or CSV strictly as transient export views.

# QAMate Product Roadmap 🗺️

> [!WARNING]
> **ROADMAP IS FROZEN**
> Only modify this roadmap when:
> - User research explicitly proves the change is required
> - Multiple customers request the specific feature capability
> - Core architectural dependencies require a shift
> 
> **Do not modify because of new ideas.** Keep QAMate focused.

---

## 📐 Roadmap Principle
**Every sprint must end with a usable product slice.** 
No sprint should leave you with a "half UI" or "placeholder engine." Each sprint deliverable must be functionally integrated, testable, and demonstrable from the VS Code extension interface.

---

## 🗺️ The Frozen Road

### 1. Foundation 🧱

#### Sprint PF-1: First Launch Experience (Highest Priority)
- **Goal**: Make the first 30 seconds feel premium, obvious, and valuable.
- **Build**: 
  - Welcome dashboard: Introduction, recent sessions list, recent projects, and empty state instructions.
  - Connections widget: Displays connection statuses for local VS Code AI, Azure DevOps, Jira, and Offline fallback modes.
  - Preferences: QA Perspective/Persona selection (`manual-qa`, `automation-qa`, `backend-developer`, `tech-lead`) with persistent caching.
  - Session manager: Actions to create, resume, or delete a workspace analysis session.
  - Cleanups: Remove all fake simulated timeline stages, hardcoded mockup listings, and placeholders.
- **Shippable Deliverable**: A fully functioning IDE sidebar webview that reads the local workspace, detects files, manages sessions, and lets users pick a target persona.

#### Sprint PF-2: AI & Connection Manager
- **Goal**: Connect credentials once, securely, and never ask again.
- **Build**:
  - Secure credential adapter leveraging VS Code Secret Storage (never plain config files).
  - Autodetect active VS Code AI provider models.
  - Azure DevOps and Jira secure connector setups: Personal Access Tokens (PATs), Org name, project name, connection state checkers, disconnect options.
- **Shippable Deliverable**: Interactive sidebar status widget displaying secure real-time connections, fallback configurations, and connection lifecycles.

#### Sprint PF-3: Requirement Intake
- **Goal**: Rapid intake workflow to initialize requirement validation in under 10 seconds.
- **Build**:
  - Drag-and-drop or paste requirement area.
  - File watcher for the active text editor document (with `.md`, `.txt`, `.docx`, `.pdf`, `.json` support).
  - Auto-detection algorithm classifying raw inputs: Requirement Text, User Story format, ADO issue URL, Jira issue Key, or configuration file.
- **Shippable Deliverable**: The paste-and-watch intake workspace that automatically routes raw inputs into the analysis compiler.

---

### 2. Intelligence 🧠

#### Sprint RI-1: Requirement Analysis
- **Goal**: Compile structural insights without calling any external LLMs.
- **Build**:
  - Deterministic parser: Extract business rules, actors, database entities, and explicit acceptance criteria using static AST/heuristic rules.
  - Health audit engine: Report duplicate requirements, missing blocks, and basic structural inconsistencies.
- **Shippable Deliverable**: A local analysis dashboard detailing requirement statistics, identified actors, and structural health scorecards.

#### Sprint RI-2: Domain Detection
- **Goal**: Categorize requirement scopes to target correct QA testing perspectives.
- **Build**:
  - Domain categorization engine matching common software scopes: Authentication, Payments, Healthcare, Education, Hospitality, CRM, API, Infrastructure.
  - Confidence rating mapping based on keyword rules (no fake simulated confidence numbers).
- **Shippable Deliverable**: Sidebar indicator detailing the confidence rating and detected operational domains.

#### Sprint RI-3: Reasoning Engine
- **Goal**: Highlight critical gaps, missing information, and structural assumptions.
- **Build**:
  - Heuristic-based logic engine checking assumptions, missing database models, and direct requirement contradictions.
- **Shippable Deliverable**: Interactive resolution loop prompting: *"Need clarification? (Yes/No)"* with immediate structural reasoning explanations.

#### Sprint RI-4: QA Readiness
- **Goal**: Drive investigative readiness questions without annoying the user.
- **Build**:
  - Adaptive stepper question generator that skips unnecessary queries if context parameters are already known.
  - Explicit rationale cards detailing why each question is being asked and how it alters the final testing strategy.
- **Shippable Deliverable**: Fully responsive question stepper showing why questions are generated and allowing skips/overrides.

---

### 3. QA Deliverables 📦

#### Sprint TS-1: Test Strategy
- **Goal**: Formulate the primary strategic outline before drafting test code.
- **Build**:
  - Visual strategy generator compiling: Risk Matrices, Scope limits, Priority indicators, and Automation suggestions.
  - Editor letting users modify priorities and exclude items before running artifact factories.
- **Shippable Deliverable**: Fully interactive Strategy Dashboard presenting risk matrices with user override support.

#### Sprint TS-2: Test Cases (Manual & Skeletons)
- **Goal**: Produce manual and automated test templates under the target persona.
- **Build**:
  - Factory pattern creating Positive, Negative, Boundary, Edge Case, and API checklists.
  - Suggests Security, Performance, and Accessibility rules only when the detected domain warrants them.
- **Shippable Deliverable**: Structured cases layout matching exact validation outputs.

#### Sprint TS-3: Results Workspace
- **Goal**: Read, filter, and modify deliverables inside the workspace.
- **Build**:
  - Consolidated tab views (Strategy, Cases, Coverage review logs).
  - Search, sort, filter, and inline markdown editor controls.
- **Shippable Deliverable**: Tab-based deliverable manager displaying tabular case metrics and editable blocks.

#### Sprint TS-4: Export Adapter
- **Goal**: Export approved deliverables in multiple standard structures.
- **Build**:
  - Exporters for: Excel (XLSX), CSV, Markdown (MD), and direct synchronization to Azure DevOps/Jira ticket attachments.
- **Shippable Deliverable**: Integrations card with download selectors and direct ADO/Jira sync actions.

---

### 4. Experience 🎨

#### Sprint UX-1: Living Workspace
- **Goal**: Clean layout keeping focus on user workflow without visual noise.
- **Build**:
  - Single-page stepper workspace layout eliminating nested side panels.
  - Next Best Action footer tracker showing progress.
- **Shippable Deliverable**: Unified workspace panel showing active session, next steps, and timeline changes.

#### Sprint UX-2: Native VS Code
- **Goal**: Fluid IDE integration satisfying standard typography, colors, and accessibility.
- **Build**:
  - Complete integration matching user font sizes, active VS Code theme overrides, standard Codicons, and native keyboard hotkey bindings.
- **Shippable Deliverable**: Extension bundle that looks and operates natively like a built-in VS Code interface.

#### Sprint UX-3: Micro-interactions & Polish
- **Goal**: Responsive visual feedback for operations.
- **Build**:
  - Flat CSS transitions, skeleton loaders, and drag-and-drop animations.
- **Shippable Deliverable**: Smooth animations and loading skeletons that respond to background execution states.

---

### 5. Enterprise & Advanced 🚀

#### Sprint ENT-1: Azure & Jira Synchronization
- **Goal**: Sync local deliverables to live enterprise work items automatically.
- **Build**:
  - Automated field mapper linking test cases back to Jira Issues and Azure DevOps Test Plans.

#### Sprint ENT-2: Team Settings & Org Playbooks
- **Goal**: Inject customized standards.
- **Build**:
  - Configurable playbooks enabling teams to set custom criteria, corporate styles, and test design templates.

---

### 6. Future & Learning 🧠

#### Sprint LRN-1: Pattern Memory Reuse
- **Goal**: Learn from historical session edits.
- **Build**:
  - Local database storing manual corrections to suggested assumptions and reusing similar patterns in future requirements.

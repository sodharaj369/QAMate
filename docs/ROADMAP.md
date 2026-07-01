# QAMate Product Roadmap 🗺️

> [!WARNING]
> **ROADMAP IS FROZEN**
> Only modify this roadmap when:
> - User research explicitly proves the change is required
> - Multiple customers request the specific feature capability
> - Core architectural dependencies require a shift
> 
> **Do not modify because of new ideas.** Keep QAMate focused on the six outcome stages:
> **Understand** ➔ **Prepare** ➔ **Plan** ➔ **Generate** ➔ **Review** ➔ **Deliver**

---

## 📐 Roadmap Principle
**Every phase must end with a usable product slice.** 
Each phase's features must be functionally integrated, testable, and demonstrable from the VS Code extension interface.

---

## 🗺️ The Frozen Road

### Phase 0 — Design Freeze (Current)
* **Goal**: Establish the complete UX design, screen specs, state machine, and component libraries.
* **Deliverables**:
  - **Product Specification**: Defining the bounds of the outcomes-based design.
  - **Screen Designs**: Wireframes and layouts for Home, Settings, Wizards, Strategy, Results Tabs, and Developer Mode.
  - **User Flows**: Paths for the six outcomes (with and without QA Readiness).
  - **Component Library**: Native VS Code token overrides and styles.
  - **State Machine**: Aggregates, states, actions, and heuristic-first offline paths.

### Phase 1 — Foundation (Immediate Backlog)
* **Goal**: Enable requirement intake and session setup with configuration out of the way.
* **Deliverables**:
  - **Home Screen**: Redesigned dashboard focusing on Pasting/Opening specs first. No configuration fields or AI dropdowns on start.
  - **Sessions**: Simple sidebar history (Resume, Rename, Delete, Duplicate) matching Cursor's recent panel.
  - **Settings**: Centralized configuration home for Connections (AI, Azure, Jira), Preferences (QA Perspective/Persona, Theme, defaults), and Developer logs.
  - **Requirement Intake**: Fast prioritization intake order (1. Paste, 2. Current File, 3. Upload, 4. Azure DevOps, 5. Jira).

### Phase 2 — Intelligence
* **Goal**: Build local analysis summaries, domain detection, readiness questioning, and strategic outlines.
* **Deliverables**:
  - **Understand (Analysis & Domain Detection)**: Local heuristic analysis parsing actors, business rules, acceptance criteria, health audits, and categorizing domains (e.g. Payments, CRM) with real confidence indicators.
  - **Prepare (QA Readiness)**: Conditional questionnaire appearing only if gaps exist, explaining *why* queries matter.
  - **Plan (Test Strategy)**: Strategy summary compiling editable scope details, risks, priorities, approaches, and automation suggestions.

#### Sprint: PF-2 — AI Provider Discovery
- Detect VS Code Language Model API support.
- Automatically use GitHub Copilot when available.
- Detect existing VS Code AI providers.
- Show provider and model name.
- Fall back to Offline Analysis if unavailable.
- Only ask for API keys when no usable provider exists or the user explicitly wants a different model.

### Phase 3 — QA Deliverables
* **Goal**: Produce manual/automated test suites, review coverage, and export artifacts.
* **Deliverables**:
  - **Generate (Generate Test Suite)**: Generate test case files with defaults (Manual Tests: Positive, Negative, Boundary) and custom selections (API, SQL, Security, Performance, Accessibility, Automation).
  - **Review (Results Workspace)**: Consolidated tabs (Strategy, Test Cases, Coverage, Review) with searchable grids, inline markdown editing, and coverage logs.
  - **Deliver (Export Adapter)**: Synchronized exports to Excel, Markdown, PDF, and direct work-item syncing to Azure DevOps and Jira.

### Phase 4 — Experience
* **Goal**: Polish the visual workspace and add responsive IDE micro-interactions.
* **Deliverables**:
  - **Polish**: Fluid CSS skeleton loaders, transitions, and native styling.
  - **Animations & Accessibility**: Keybindings and screen reader accessibility checks.
  - **Marketplace**: Complete visual showcase assets showcasing Home, Analysis, Strategy, and Results.

### Phase 5 — Integrations
* **Goal**: Integrate advanced AI platforms and enterprise platforms natively.
* **Deliverables**:
  - **AI Discovery**: Automatic detection of local VS Code AI (e.g., GitHub Copilot, VS Code Chat) with direct configuration integration.
  - **Azure DevOps & Jira Wizards**: Step-by-step import setup flows for connection credentials, stored securely.

### Phase 6 — Enterprise
* **Goal**: Team-wide customization and reporting.
* **Deliverables**:
  - **Teams**: Workspace sharing structures.
  - **Templates & Reports**: Organizational playbooks and QA readiness compliance reporting.

### Phase 7 — Learning
* **Goal**: Build long-term memory patterns and corrections lookup.
* **Deliverables**:
  - **Playbooks & Reusable Patterns**: Shared team guidelines.
  - **Organizational Knowledge**: Local database learning from manual user strategic adjustments and historical corrections.


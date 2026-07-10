# QAMate UI/UX Roadmap v2
**From AI Extension ➔ Professional QA Workspace**

---

## UI Philosophy
The workspace resolves the QA Engineer's critical questions instantly through side-by-side dockable layouts:
1. **What system am I testing?** (System Model component layout)
2. **What did the AI understand?** (Intake context details)
3. **What assumptions did the AI make?** (Mental Model and Gaps gating list)
4. **What is my testing strategy?** (Objectives, exclusions, and standards checklist)
5. **Why is the AI recommending this?** (Recommendation triggers & explanations)
6. **What changed?** (Change Intelligence story timelines)
7. **Am I ready to generate?** (QA Health audit scorecard)

---

## UI Architecture

```
   +---------------------------------------------------------------+
   |                      Top Navigation Header                    |
   +---------------------------------------------------------------+
   |   🏠   |                                          |           |
   |   📄   |                                          |  Context  |
   |   🏗   |                                          |   Panel   |
   |   🧠   |             Active Workspace             | (Health,  |
   |   📋   |                  Panel                   |  Recs,    |
   |   🧪   |                                          |  Triggers)|
   |   ✔    |                                          |           |
   |   📦   |                                          |           |
   |   📚   |                                          |           |
   |   ⚙    |                                          |           |
   +---------------------------------------------------------------+
   |                      Bottom Status Bar                        |
   +---------------------------------------------------------------+
```

---

## Detailed Sprint Backlog

### UI Sprint 1 — Workspace Shell & Navigation (Current Sprint)
* **Goal**: Build the IDE-style workspace layout shell.
* **Deliverables**:
  * **Vertical Left Sidebar**: Dashboard, Requirement, System Model, Mental Model, Strategy, Artifacts, Review, Deliver, Sessions, Settings.
  * **Top Header**: Displays Active Project, Selected Requirement, active LLM Provider, and Project DNA details.
  * **Bottom Status Bar**: Displays AI connectivity status, loaded playbook name, and model revisions.
  * **Dockable Grid Layout**: Responsive side-by-side flex panes fitting VS Code theme tokens.

### UI Sprint 2 — Dashboard
* **Goal**: Present a high-level cockpit panel of active diagnostics.
* **Deliverables**:
  * Health score gauges, active blocking issues counters, and recommendation cards.
  * Recent activity feed logging accepted recommendations and strategy updates.

### UI Sprint 3 — Requirement Workspace
* **Goal**: Build an editor layout supporting multiple intake sources (Drag & Drop, pasting, JIRA/ADO connection slots).
* **Deliverables**:
  * Side-by-side view with specifications on the left, and parsed rules, compliance warnings, and unknowns on the right.

### UI Sprint 4 — System Model Workspace
* **Goal**: Render component flow trees and properties.
* **Deliverables**:
  * Interactive system tree mapping Components ➔ Flows ➔ User Personas ➔ API endpoints.

### UI Sprint 5 — QA Mental Model Workspace
* **Goal**: Gating screen showing facts, assumptions, and inferences.
* **Deliverables**:
  * Gaps approval checklist. Collapsible reasoning traces showing evidence links.

### UI Sprint 6 — Recommendation Center
* **Goal**: Centralized control deck for AI proposals.
* **Deliverables**:
  * Filter grids to accept, ignore, or modify recommendations with user comments.

### UI Sprint 7 — Strategy Workspace
* **Goal**: Visual planning board managing objectives and boundaries.
* **Deliverables**:
  * Visual suite builder avoiding raw markdown editing. Clickable traceability traces.

### UI Sprint 8 — Artifact Workspace
* **Goal**: Highly responsive test spreadsheet.
* **Deliverables**:
  * Spreadsheets supporting inline text editing, undo/redo, groupings, and column choosers.

### UI Sprint 9 — Review Workspace
* **Goal**: Quality health audit panel.
* **Deliverables**:
  * Audit logs indicating playbook violations, missing boundaries, and negative coverage targets.

### UI Sprint 10 — Deliver Workspace
* **Goal**: Advanced export pipeline views.
* **Deliverables**:
  * Formats previewer showing active sheets, revisions, naming strategies, and target channels.

### UI Sprint 11 — Project DNA Settings
* **Goal**: Live tech stack and playbook dictionary card grids.

### UI Sprint 12 — AI Hub Configuration
* **Goal**: Provider status dashboard showing connection latency, costs, and failover options.

### UI Sprint 13 — Sessions & History Diff
* **Goal**: Diff timeline comparing strategy versions (e.g. v1 ➔ v2 changes).

### UI Sprint 14 — Performance Polish
* **Goal**: CSS transitions, shortcuts, resizable splitters, and ARIA audits.

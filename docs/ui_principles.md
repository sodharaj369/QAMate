# QAMate User Interface Design Principles

The following principles guide the implementation of the QAMate User Interface layer:

---

## 1. Workflow-First, Not Chat-First
- While lightweight conversation complements the workflow, the workspace is structured around linear guided progress pipelines (`Requirement ➔ Clarifications ➔ Strategy ➔ Review ➔ Coverage`).
- Chat assists with refinements, but does not serve as the primary navigation vehicle.

---

## 2. One-Click Next Action
- Every workspace view presents a single, highlighted primary action button at the bottom of the screen ("Next Best Action Recommendation").
- Prompts are automatically contextualized based on state machine stages (e.g. `Requirement Imported` defaults to `Clarify Gaps`).

---

## 3. Progressive Disclosure
- Collapses configuration options by default using details/summary accordions.
- Displays high-level summaries and cards first, and exposes deep logs only when the user explicitly requests them.

---

## 4. Keyboard-First Productivity
- Implements hotkey bindings for core commands:
  - `QAMate: Analyze Active Requirement File`
  - `QAMate: Generate Test Strategy`
  - `QAMate: Review Generated Artifacts`

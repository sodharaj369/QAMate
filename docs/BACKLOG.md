# QAMate Product Backlog & Refactoring Priorities 📋

This backlog aligns directly with the product-first 10-sprint plan, mapping functional features and refactoring priorities.

---

## P0 (Sprint 1 - Sprint 4: Trust, Intake, AI, and QA Decision Engines)
- [ ] Centralize visual variables inside a single AppState class, removing direct settings reads in UI files.
- [ ] Wire VS Code LM API first, implementing auto-detection of GitHub Copilot.
- [ ] Connect multiple AI providers simultaneously, with 30s automatic failover controls.
- [ ] Integrate local validation rules (VAL-005, VAL-006, VAL-007) and scorecard indicators.
- [ ] Build the zero-question stepper path based on confidence scorecard thresholds.
- [ ] Resolve the 32 bugs tracked in [BUG_TRACKER.md](file:///d:/QAMate/docs/BUG_TRACKER.md).

---

## P1 (Sprint 5 - Sprint 7: Results, Reviews, and AI Optimizations)
- [ ] Replace raw markdown text checklists with structured tables supporting search, filters, and inline cell editing.
- [ ] Build QA Health dashboards displaying metrics: Requirement Quality, Rules Coverage, Confidence, Risks Mapped, Questions Asked, Questions Avoided, AI Efficiency, and Ready for Export.
- [ ] Format ExcelJS sheet structures (Summary, Strategy, Test Cases, Risks, Traceability) with header freeze panes and autofilters.
- [ ] Build context compression, delta prompting, and cached session reuse logic to minimize API token cost profiles.
- [ ] Solve the write-only Knowledge base bug. Retrieve approved lessons from `store.json` and append to Context Compilers.
- [ ] Establish learning suggest dashboards allowing QA Leads to approve or discard corrections before database serialization.

---

## P2 (Sprint 8 - Sprint 9: Memory systems & Corporate Integrations)
- [ ] Migrate simulated SQLite storage adapters to operational SQLite databases.
- [ ] Sync child Test Cases directly to DevOps boards using JSON-Patch APIs.
- [ ] Update Jira adapter to write structured test cases to Zephyr/Xray APIs instead of appending issue comments.

---

## P3 (Sprint 10: Release & Polish)
- [ ] Conduct accessibility checks, verifying keyboard tab indices and screen reader compatibility.
- [ ] Profile stress performance parameters, ensuring coverage and lookup calculations pass limit times.
- [ ] Publish QAMate extension VSIX builds.

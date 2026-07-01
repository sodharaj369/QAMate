# QAMate Product Backlog 📋

This document tracks future features, experimental ideas, and rejected proposals. All entries must be filtered through QAMate's `docs/WHY_QAMATE.md` and `docs/PRODUCT_VISION.md` before being added here.

---

## 📌 Categorized Backlog

### 1. Future
- [ ] Add offline SQLite storage adapter option for massive historical sessions.
- [ ] Support for importing requirements directly from local email archives (.eml).
- [ ] Direct export to HTML documentation templates for static site publishing.

### 2. AI
- [ ] Local Ollama model integration guides and presets for offline-only teams.
- [ ] Prompt compression layers to reduce token costs on extremely long specs.
- [ ] Model benchmarking utility to let users run performance checks on active providers.

### 3. Enterprise
- [ ] Custom playbook editor workspace for managers to build team-wide rules.
- [ ] Audit logs tracking local AI usage costs for team telemetry.
- [ ] PDF templates styling custom corporate reporting styles.

### 4. UX
- [ ] Keyboard navigation shortcuts for all interactive cards and decision grids.
- [ ] Custom dark/light contrast adjustments for users with visual impairments.
- [ ] Right-click context menu additions inside VS Code active workspace directory tree.

### 5. Integrations
- [ ] Slack notification dispatcher when a requirement analysis is generated.
- [ ] Git pre-commit hooks to automatically flag requirement file changes.

### 6. Research
- [ ] Research AST parsers for Word documents (.docx) to improve text extraction.
- [ ] Study token limits and context window strategies for very large epic-level requirements.

---

## ❌ Rejected Ideas
We document rejected ideas here to prevent re-opening settled discussions and maintain focus.

| Proposal | Date Rejected | Rationale for Rejection |
|---|---|---|
| **Add a general chat panel** | 2026-07-01 | **Violates PRODUCT_VISION and PRODUCT_BOUNDARIES**. QAMate is a structured workspace, not a general-purpose chatbot. Chat introduces massive friction and distracts from linear QA workflows. |
| **Agent Marketplace** | 2026-07-01 | **Out of scope**. QAMate optimizes for individual developer/QA workflow. We are not building a platform for third-party agents. |
| **Write requirements for users** | 2026-07-01 | **Violates PRODUCT_VISION**. QAMate analyzes, validates, and tests requirements; it does not author or draft requirements for business analysts. |
| **Simulated progress animations** | 2026-07-01 | **Violates UX_PRINCIPLES (No Fake Intelligence)**. Simulated loops mock the user's intelligence and degrade transparency. We show real execution states and skeleton loaders. |

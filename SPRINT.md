# QAMate Sprint Tracking Board 📋

Welcome to the QAMate sprint dashboard. This document tracks our development velocity, sprint status, and active task lists.

---

## 🗺️ Sprint Roadmap Status

| Sprint | Goal / Module | Status | Deliverable |
|---|---|---|---|
| **Sprint 0** | Project Foundation | ✅ Completed | Monorepo structure, build config, linting, DDD models, actions. |
| **Sprint 1** | Requirement Intelligence Engine | ✅ Completed | Static heuristics validator, rules extraction, ambiguities report, CLI runner. |
| **Sprint 2** | Question Planning & Clarification Engine | ✅ Completed | Candidate generation, prioritization, deduplication, interactive loop. |
| **Sprint 3** | QA Context Engine | ✅ Completed | Prompt context assembly, project rules, coding standards, readiness. |
| **Sprint 4** | Test Strategy Engine | 🚀 Next | Test types matrices recommendations (API, Visual, UI). |
| **Sprint 5** | Test Generation Engine | 📅 Backlog | Positive, negative, and boundary test cases generation. |
| **Sprint 6** | Review Engine (USP) | 📅 Backlog | QA reviews, deduplication, low-value checks, recommendation gate. |
| **Sprint 7** | Coverage Engine | 📅 Backlog | Rule coverage analysis reporting dashboard. |
| **Sprint 8** | AI Provider Layer | 📅 Backlog | BYO AI Configs (Ollama, Gemini, Claude, OpenAI). |
| **Sprint 9** | Storage Layer | 📅 Backlog | Persistence adapters (JSON, SQLite, SQL Server). |
| **Sprint 10** | VS Code Extension UI | 📅 Backlog | Editor webview panels and markdown exporters. |
| **Sprint 11** | Azure DevOps Integration | 📅 Backlog | Manual ADO import/export tools. |
| **Sprint 12** | Knowledge Engine | 📅 Backlog | QA memory reuse, bug patterns database, similar requirements. |

---

## ⚡ Active Sprint: Sprint 4 — Test Strategy Engine (Planning)

### Goal:
Build a rules-based and AI-assisted Test Strategy Engine that analyzes the compiled QA Context to recommend specific test suites and coverage methodologies (e.g. Smoke, Regression, Security, API) before writing test cases.

### Inputs:
- `RequirementIntelligenceReport`
- `GeneratorContext`

### Outputs:
- Recommended Test Strategy (`TestStrategy`)

---

## 📝 Sprint 4 Active Tasks

- [ ] Core Strategy Interfaces & Models
  - [ ] Define `TestStrategy` model and recommend structures in `domain.ts`
  - [ ] Define interfaces for `ITestStrategyEngine` in `interfaces/index.ts`
- [ ] Test Matrix Evaluator Logic
  - [ ] Implement rule matrix checks mapping gap categories to test suites (e.g. auth gap ➔ Security suite)
  - [ ] Include automated reasoning justifications in the recommended strategy
- [ ] Interactive CLI Strategy Display
  - [ ] Update `cli.ts` to output recommended test suites and exclusions before generating cases
- [ ] Unit Tests
  - [ ] Write `packages/engine/tests/strategy.test.ts`
- [ ] Documentation
  - [ ] Create `docs/test_strategy_engine.md` explaining strategy matrix heuristics
  - [ ] Update SPRINT.md tracking statuses

---

## 🛠️ Verification Commands

Run these commands from the monorepo root to verify the codebase:

```bash
# Compile TypeScript Project References
npm run build

# Run Vitest Unit Tests
npm run test

# Run Format and Lint checks
npm run format && npm run lint
```

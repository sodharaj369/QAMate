# QAMate Sprint Tracking Board 📋

Welcome to the QAMate sprint dashboard. This document tracks our development velocity, sprint status, and active task lists.

## ❄️ QAMate Roadmap Status
- **Architecture**: ✅ Frozen (v1)
- **Roadmap**:      ✅ Frozen (v1)
- *New features require implementation experience before roadmap changes.*

## 📐 Principal CTO Directives
- **Rule 1**: No more roadmap changes (this layout is frozen).
- **Rule 2**: Every sprint must end with a CLI demo.
- **Rule 3**: Every sprint must validate/expand the `examples/` golden dataset containing real-world requirements.

---

## 🗺️ Sprint Roadmap Status

| Sprint | Goal / Module | Status | Deliverable |
|---|---|---|---|
| **Sprint 0** | Project Foundation | ✅ Completed | Monorepo structure, build config, linting, DDD models, actions. |
| **Sprint 1** | Requirement Intelligence Engine | ✅ Completed | Static heuristics validator, rules extraction, ambiguities report, CLI runner. |
| **Sprint 2** | Question Planning & Clarification Engine | ✅ Completed | Candidate generation, prioritization, deduplication, interactive loop. |
| **Sprint 3** | QA Context Engine | ✅ Completed | Prompt context assembly, project rules, coding standards, readiness. |
| **Sprint 4** | Test Strategy Engine | 🚀 Next | Rich strategy mapping, risk levels, exclusions reasoning, reasoning trace. |
| **Sprint 5A** | QA Artifact Planning | 📅 Backlog | Planning artifact selections, user personas definitions. |
| **Sprint 5B** | QA Artifact Generation | 📅 Backlog | Factory-based generation of manual cases, unit skeletons, API queries, SQL rules, and checklists. |
| **Sprint 6** | Review Engine (USP) | 📅 Backlog | QA reviews, deduplication, low-value checks, recommendation gate. |
| **Sprint 7** | Knowledge Engine | 📅 Backlog | QA memory reuse, bug patterns database, similar requirements. |
| **Sprint 8** | Coverage Engine | 📅 Backlog | Rule coverage analysis reporting dashboard. |
| **Sprint 9** | AI Provider Layer | 📅 Backlog | BYO AI Configs (Ollama, Gemini, Claude, OpenAI). |
| **Sprint 10** | Storage Layer | 📅 Backlog | Persistence adapters (JSON, SQLite, SQL Server). |
| **Sprint 11** | VS Code Extension UI | 📅 Backlog | Editor webview panels and markdown exporters. |
| **Sprint 12** | Azure DevOps Integration | 📅 Backlog | Manual ADO import/export tools. |

---

## ⚡ Active Sprint: Sprint 4 — Test Strategy Engine (Planning)

### Goal:
Create an executable QA test strategy that determines business impact, risk levels, recommended test suites, exclusions with justification, out-of-scope targets, automation candidates, manual testing focus areas, suggested data, target environments, execution order, and confidence.

### Inputs:
- `GeneratorContext`

### Outputs:
- Recommended Test Strategy (`TestStrategy`)

---

## 📝 Sprint 4 Active Tasks

- [ ] Extend Strategy Models in `domain.ts`
  - [ ] Add `TestStrategy` interface and sub-types (objectives, impact, risk, recommended/excluded/out-of-scope, effort, data, etc.)
- [ ] Declare `ITestStrategyEngine` interface in `interfaces/index.ts`
- [ ] Implement `DefaultTestStrategyEngine` class
  - [ ] Create `packages/engine/src/strategy/strategyEngine.ts`
  - [ ] Implement `assessRisk()` helper
  - [ ] Implement `analyzeImpact()` helper
  - [ ] Implement `recommendSuites()` helper
  - [ ] Implement `optimizeScope()` helper
  - [ ] Implement `Reasoning Trace` audit trails logger
  - [ ] Setup exports in `packages/engine/src/strategy/index.ts`
  - [ ] Export strategy module from engine index
- [ ] Interactive CLI update
  - [ ] Update `cli.ts` to output the QA Strategy dashboard block before context serialization
- [ ] Unit Tests
  - [ ] Write `packages/engine/tests/strategy.test.ts`
- [ ] Documentation
  - [ ] Create `docs/test_strategy_engine.md` explaining strategy matrix heuristics
  - [ ] Update SPRINT.md tracking statuses

---

## 🧱 Project-Wide Rules (Never Change)

1. **Every sprint must end with**:
   - Working CLI demo
   - Unit tests
   - Updated documentation
   - Golden dataset validation
   - Build passing
2. **Every recommendation must include reasoning.**
3. **Every generated artifact must be traceable back to**:
   `Requirement` ➔ `Intelligence` ➔ `Questions` ➔ `Context` ➔ `Strategy` ➔ `Artifact` ➔ `Review` ➔ `Coverage`
4. **AI must never be the source of truth.** AI assists. QAMate reasons.
5. **Build vertical slices.** Never build infrastructure that has no consumer.
6. **Every new module must have**: Interface, One implementation, Unit tests, CLI demonstration, and Documentation.

---

## 🎯 Product Principles (Never Change)

1. **Ask before generating.**
2. **Reason before recommending.**
3. **Explain every recommendation.**
4. **Prefer quality over quantity.**
5. **Every output must be traceable.**
6. **AI is replaceable.**
7. **Engine first, UI second.**
8. **One sprint = one working feature.**
9. **Use real-world examples for validation.**
10. **If a feature doesn't help engineers make better decisions, don't build it.**

---

## 📂 Golden Dataset Layout (Mandatory)

```
examples/
├── authentication/
├── banking/
├── crm/
├── ecommerce/
├── education/
├── healthcare/
├── hospitality/
├── infrastructure/
├── payments/
├── security/
```
Each folder contains:
- `Requirement.md`
- `ExpectedIntelligence.json`
- `ExpectedQuestions.json`
- `ExpectedContext.json`
- `ExpectedStrategy.json`
- `ExpectedArtifacts.json`
- `ExpectedReview.json`
- `ExpectedCoverage.json`
- `README.md`

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

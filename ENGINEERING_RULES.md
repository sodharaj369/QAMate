# QAMate Engineering Constitution 📜

This document defines the strict engineering guidelines and principles for **QAMate**. Every developer (human) and AI coding agent (Copilot, Gemini, ChatGPT, Claude) contributing to this repository **must** strictly adhere to these rules to maintain structural integrity and prevent architectural drift.

---

## 🏛️ Architectural Guardrails

1. **No Silent Refactoring**: Never alter the existing package workspace configurations, project references, or core interfaces without explicit approval.
2. **Abstractions on Demand**: Never introduce new abstractions (e.g., wrapper patterns, generic factories, interface layers) unless they are explicitly requested or needed to fulfill a current sprint requirement.
3. **No External Dependencies without Justification**: Do not add third-party npm libraries without explaining why they are required and confirming they do not bloat build outputs.
4. **Platform Independence**: The core engine (`@qamate/engine`) must remain entirely stateless and free of visual client APIs (VS Code, browser, Node CLI details) or proprietary vendor libraries.

## 🛠️ Code Design & Coding Standards

1. **One Responsibility Per Module**: Keep classes, strategies, and utilities focused on a single responsibility. Favor small, pluggable strategies over monolithic orchestrators.
2. **Deterministic Fallbacks (Heuristics First)**: Every AI-assisted module must be designed to run with a static, rule-based checker fallback when AI configurations are missing.
3. **Clean Code over Comments**: Write clear, descriptive TypeScript symbols. Code comments should explain *why* something is designed in a specific way, not *what* the code does.
4. **Strict TypeScript Typing**: Avoid the use of `any` or loose type definitions. Use compiler references and strict mappings to enforce contracts at build time.

## 🧪 Testing and Verification

1. **Test-Driven Implementations**: Every class, model parser, or utility strategy must be accompanied by unit tests.
2. **Build Safety**: The codebase must build cleanly (`npm run build`) and satisfy linting/formatting checks (`npm run format:check`, `npm run lint`) at all times.
3. **Sprint Containment**: Do not implement code or outline placeholders for features scheduled in future sprints. Build vertically: make each sprint's feature fully functional and testable.

## 🚀 Git and Pull Request Guidelines

1. **Scope Contained PRs**: Limit each pull request or development branch to one feature or task.
2. **Conventional Commits**: Adhere to conventional commit prefix specifications (`feat(scope):`, `fix(scope):`, `docs(scope):`).

---

## 🤖 AI Quality Checklist (Definition of Done)

Every sprint delivery and AI generation module must satisfy the following checklist before merging:
- [ ] **No Hallucinations**: Did this module invent any information not present in the input requirements or context?
- [ ] **Explainability**: Can the module explain every recommendation or analysis result with traceability logs or reasoning steps?
- [ ] **Honesty**: Can it explicitly say "I don't know" or raise a clarification query if information is insufficient?
- [ ] **Traceability**: Is every output traceable back to a source Requirement?
- [ ] **Fail-Safe**: Are there unit tests for failure and edge cases (e.g. invalid inputs, missing fields, or empty lists)?


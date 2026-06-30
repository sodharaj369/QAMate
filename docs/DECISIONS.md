# QAMate Architecture Decision Records (ADR) 🏛️

This document registers the core architectural decisions that govern the development of **QAMate**. Contributors must read and adhere to these guidelines to prevent architectural drift.

---

## 📄 ADR-001: AI Provider Independence

- **Status**: Accepted
- **Context**: The engine must allow developers and enterprises to switch between different LLM models and API hosts (e.g. OpenAI, Claude, Azure, Ollama) easily.
- **Decision**: All AI interactions must bypass vendor-specific SDK structures in the core modules and communicate solely through the `ILLMProvider` interface.
- **Consequences**: Avoids lock-in and allows standard rules-based fallback engines to mock completions during offline unit testing.

---

## 📄 ADR-002: Vertical Slice Development

- **Status**: Accepted
- **Context**: Speculative framework building often creates unused layers and speculative code paths that slow velocity.
- **Decision**: Every engine module must be built vertically sprint-by-sprint. An interface must have exactly one implementation, one unit test suite, and one CLI runner consumer before any new module is planned.
- **Consequences**: Ensures high confidence in code utility, keeps features immediately demonstrable, and eliminates dead code.

---

## 📄 ADR-003: Golden Dataset

- **Status**: Accepted
- **Context**: Over time, static rule changes and prompt tuning can degrade analyzer intelligence or strategy outputs on earlier requirements.
- **Decision**: Maintain a mandatory `examples/` golden dataset containing real-world spec files and their expected JSON artifacts. Every build and pull request must validate output models against these baselines.
- **Consequences**: Provides regression safety for QA engine logic and guarantees that engine updates improve reasoning over time.

---

## 📄 ADR-004: Reasoning Trace

- **Status**: Accepted
- **Context**: Standard AI wrappers spit out test cases without explaining *why* they prioritized particular suites or excluded others, reducing engineer trust.
- **Decision**: The Strategy and Review engines must output an explicit `reasoning` trace string list detailing why each decision was reached.
- **Consequences**: Promotes transparency, helps junior QA engineers learn strategic principles, and simplifies diagnostic debugging.

---

## 📄 ADR-005: Persona-Based Configuration

- **Status**: Accepted
- **Context**: A manual tester, an automation engineer, and a backend developer require vastly different testing outputs from the same requirement.
- **Decision**: The Context Engine must accept a target persona configuration (`manual-qa` | `automation-qa` | `backend-developer` | `tech-lead`) to shape compiler priorities, rather than relying on custom system prompt tuning.
- **Consequences**: Decouples the target formatting logic from the reasoning engine, allowing the same requirement context to compile specific artifacts for each team member.

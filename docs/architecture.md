# QAMate Architecture & Engine Module Design

This document details the architectural design of **QAMate**, an open-source, AI-powered QA Thinking Assistant.

---

## 🏛️ Overall Monorepo Topology

QAMate is structured as an npm/pnpm workspace monorepo. This allows us to keep the core QA logic completely distinct from the visual clients (like the VS Code Extension or Web App) while sharing common types and utility libraries.

```
                    ┌────────────────────────┐
                    │  @qamate/shared (lib)  │
                    │  - Loggers, custom     │
                    │    errors, and utils   │
                    └───────────▲────────────┘
                                │
                    ┌───────────┴────────────┐
                    │  @qamate/engine (core) │
                    │  - Domain DDD Models   │
                    │  - Module Interfaces   │
                    │  - LLM Provider Gateway│
                    └───────────▲────────────┘
                                │
       ┌────────────────────────┴────────────────────────┐
       │                                                 │
┌──────┴──────────────────────┐           ┌──────────────┴──────────────┐
│ @qamate/vscode-extension    │           │     @qamate/web-app (future) │
│ - Reads editor documents    │           │ - Web UI for QA teams       │
│ - Renders Webview panels    │           │ - Stateful socket connection│
└─────────────────────────────┘           └─────────────────────────────┘
```

---

## 🧩 The 8 Core Engine Modules

The core engine `@qamate/engine` defines the contracts for 8 lifecycle modules representing the "Ask first. Think second. Generate last." philosophy.

```
Requirement Intelligence Extraction (Analyzer)
   │
   ▼
Clarification Generation (ClarificationEngine)
   │
   ▼
Dynamic System Prompt Assembly (PromptBuilder)
   │
   ▼
Raw Test Generation (TestGenerator)
   │
   ▼
Post-Process Duplication & Compliance Check (ReviewEngine)
   │
   ▼
Business Criticality & Risk Tagging (PrioritizationEngine)
   │
   ▼
Target Format Serialization (ExportEngine)
```

All session transitions and historical logs are managed by a central **Conversation Manager**.

### 1. Requirement Analyzer (`IRequirementAnalyzer`)
Scans raw input texts (e.g., Markdown specifications, JIRA story JSON) and produces the unified **Requirement Intelligence Report**. Rather than outputting descriptive text, it builds a structured, queryable knowledge block representing the actors, domain entities, rules, ambiguities, gaps, risk areas, complexity, and testing confidence.

### 2. Clarification Engine (`IClarificationEngine`)
Consumes the `RequirementIntelligenceReport` and uses the structured ambiguities and missing information to formulate high-quality QA clarification questions. Instead of generating cases immediately, it prompts the QA engineer for clarification on key assumptions (e.g., "If the user logs in but their session is expired, do we redirect to login or show an error modal?").

### 3. Prompt Builder (`IPromptBuilder`)
Translates the accumulated requirement content, the intelligence report, and user responses into formatted context strings. It manages systemic instructions to prevent AI hallucination and ensure consistency with the target test runner specifications.

### 4. Test Generator (`ITestGenerator`)
Generates the raw test cases using the approved domain context and the `RequirementIntelligenceReport` knowledge base. This is the first module that performs generative test suite creation.

### 5. Review Engine (`IReviewEngine`)
Applies static and AI-based compliance filters. It compares the generated test cases against the `RequirementIntelligenceReport` business rules list to ensure complete rule coverage and zero duplicates.

### 6. Prioritization Engine (`IPrioritizationEngine`)
Applies priority labels (`P0` to `P3`) to the generated test cases by analyzing user flows and business risk tags defined in the intelligence report.

### 7. Export Engine (`IExportEngine`)
Translates the internal `TestCase` model array into output formats like Gherkin Feature Files, Playwright code files, CSV, or structured JSON.

### 8. Conversation Manager (`IConversationManager`)
Orchestrates the lifecycle state machine of a single QAMate run. It persists session state and enables multi-turn conversation support.

---

## 🔌 Provider Independence Layer (`ILLMProvider`)

To ensure the core business model remains independent of proprietary APIs (such as OpenAI or Google Vertex AI), we introduce the `ILLMProvider` interface:

```typescript
export interface ILLMProvider {
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: LLMRequestOptions): Promise<string>;
}
```

By passing this provider instance into the active modules (e.g., `IRequirementAnalyzer.analyze(req, provider)`), the engine remains completely agnostic of the LLM transport layer. It simply requests prompt completions.

---

## 🎯 Domain-Driven Design Rationale

By implementing strict DDD boundaries:
1. **Pristine Domain Layer**: The files [`domain.ts`](../packages/engine/src/domain.ts) and [`types.ts`](../packages/engine/src/types.ts) are written in pure TypeScript with zero third-party dependencies, guaranteeing portability.
2. **Stateless UI**: Clients (like the VS Code extension) query the state of the active `Conversation` aggregate to figure out what to render, ensuring the client bundle remains small and isolated.
3. **Traceability**: An immutable `Answer` maps to a distinct `Question` Entity, maintaining a clean audit log of decisions made by the QA engineer.
4. **Shared Structured Knowledge Base Pattern**:
   Instead of every module re-parsing unstructured text generated by previous AI cycles, every module builds on top of a shared, structured knowledge model (`RequirementIntelligenceReport`). The analyzer translates loose prose into strict schemas (actors, entities, constraints), which the generator and reviewer compile into deterministic tests.

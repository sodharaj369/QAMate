# QA Artifact Generation Engine

The **QA Artifact Generation Engine** executes the final generation phase of the QA pipeline, transforming the selected `ArtifactPlan` and compiled `GeneratorContext` into discrete file outputs utilizing the pluggable `ILLMProvider` AI completion interface.

---

## 1. Domain Models (`QAArtifact`)

The generated artifact is saved as:
- **`id`**: Unique identifier.
- **`planId`**: Traceability key linking back to the artifact plan.
- **`type`**: The specific artifact title (e.g. `Unit Test Skeletons`, `Manual Test Cases`).
- **`content`**: The generated class method signatures, playwright scripts, or markdown checklists.

---

## 2. LLM Prompt Composition

The generator compiles a structured prompt grounding the AI with:
- System objectives.
- Actor roles and business rules.
- Tech stack parameters (language, framework, style, clouds).
- Selected artifact types.
- The precise instructions from the plan.

Prompt Layout:
```
Generate QA Artifacts for Requirement: "SAS Tokens feature"
Strategy Objectives:
- [BR-001]: Verify token expiry validations.

Persona: BACKEND-DEVELOPER
Tech Stack Profile:
- Language:  TypeScript
- Framework: Playwright
- Style:     Given/When/Then

Selected Artifacts:
- Unit Test Skeletons
- API Test Collection

Generation Directives:
- Draft unit test code skeletons using the Given/When/Then pattern.
- Provide method signatures and mock placeholders.

Please format your response by placing each artifact under its respective Markdown header, e.g. "### Unit Test Skeletons".
```

---

## 3. Multi-Artifact Parser Algorithm

When the AI returns a single completion containing multiple artifacts, the engine parses individual sections using a heading extractor:

1. Splits the provider completion response text by line.
2. Identifies lines starting with `#` or `**` containing the clean name of each targeted artifact.
3. Captures all lines between that matched heading and the next heading line.
4. If a heading is missing or parsing fails, it safely falls back to assigning the completion to the first artifact or loads a persona-specific offline template.

---

## 4. Offline Mock Generation Fallbacks

For offline regression testing and CLI demonstration runs, the generator includes persona-specific fallback code templates matching target technology parameters. This guarantees the CLI runs locally with zero external network request requirements or real AI API keys:

- **Manual QA**: Markdown test case steps (`TC-001`, `TC-002`), preconditions, actions, and expected results.
- **Backend Developer**: TypeScript, C#, or Java unit method signatures conforming to the profile's testing style (e.g. AAA or BDD).
- **Automation QA**: Complete Playwright, Cypress, or Selenium script skeletons with assertion guidelines.
- **Security Tester**: Authentication penetration checklists.

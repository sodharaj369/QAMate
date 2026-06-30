# QA Artifact Planning Engine

The **QA Artifact Planning Engine** evaluates the compiled `TestStrategy` alongside a target **User Persona** and repository **Project Profile** stack to outline exactly *which* artifacts should be generated and *how* they should be formatted.

---

## 1. Domain Models (`ArtifactPlan`)

The artifact plan is structured as an immutable aggregate root:
- **`persona`**: Target engineering user persona (`manual-qa` | `automation-qa` | `backend-developer` | `frontend-developer` | `tech-lead` | `security-tester` | `performance-tester`).
- **`profile`**: Tech stack parameters (language, framework, database, cloud providers, and naming styles).
- **`selectedArtifacts`**: Targeted files/scenarios chosen for generation.
- **`generationInstructions`**: Core hints parsed for the AI generator prompt.
- **`reasoning`**: Structural trail explaining the planner's decisions.

---

## 2. Persona Mapping Matrices

The planner implements rules mapping target profiles to outputs:

| Persona | Selected Artifact Types | Tailored Instructions |
|---|---|---|
| **Manual QA** | Manual Test Cases, Regression Checklist, Exploratory Charter | Step-by-step user paths with preconditions and visual boundary guidelines. |
| **Automation QA** | e.g. Playwright Test Skeletons, Selectors & Assertions Checklist | Code skeleton targets with page locator (selectors) and assertions. |
| **Backend Developer** | Unit Test Skeletons, Integration Test Skeletons, API Collection, SQL Rules | AAA pattern class signatures, mock suggestions, database table check constraints. |
| **Frontend Developer** | Component Test Skeletons, UI Interaction Checklist | React component visual tests and interactive UI triggers. |
| **Security Tester** | Security Checklist, Penetration Scenarios | Access lockouts, authentication penetration, and expired tokens. |
| **Performance Tester** | Performance Checklist, Throughput Benchmark Targets | Transaction latency metrics and concurrency limits verification. |
| **Tech Lead** | Executive Strategy Summary, System Coverage Matrix | High-level risk summary and requirement-to-suite mapping. |

---

## 3. CLI Planning Dashboard

The Artifact Plan is displayed in the terminal prior to serialization:

```
======================================================
📋 QAMate Artifact Plan Dashboard
======================================================
Target Persona:      BACKEND-DEVELOPER
Technology Stack:    Language:  TypeScript
                     Framework: Playwright
                     Database:  SQL Server
                     Cloud:     Azure
                     Style:     Given/When/Then
------------------------------------------------------
📦 Selected Artifact Types to Generate:
  ✔ [Unit Test Skeletons]
  ✔ [Integration Test Skeletons]
  ✔ [API Test Collection]
  ✔ [SQL Validation Rules]
------------------------------------------------------
🤖 Prompt Instructions for AI Generation:
  - Draft unit test code skeletons using the Given/When/Then pattern.
  - Do NOT write full logic implementations. Provide method signatures, mock configuration suggestions, and assert assertions placeholders.
  - Generate HTTP API request templates and parameter validations for target Azure endpoints.
  - Provide SQL constraint validations and assertions for data layer: SQL Server.
------------------------------------------------------
🧠 Planning Decision Reasoning:
  1. Persona target set to: backend-developer
  2. Repository profile configured with language: TypeScript, framework: Playwright...
  3. Backend Developer persona targets system stability, mock strategies...
======================================================
```

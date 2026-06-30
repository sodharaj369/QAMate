# Requirement Analyzer Architectural Design

The **Requirement Analyzer** is the entry gatekeeper of the QAMate test case generation pipeline. In line with our core philosophy—**"Ask first. Think second. Generate last."**—the analyzer does not generate tests. Instead, it reads specifications, parses them into structured knowledge blocks, checks for semantic gaps, and calculates a testing readiness confidence score.

---

## 1. Core Responsibilities

The Requirement Analyzer handles four distinct responsibilities:

```
                  ┌──────────────────────────────────────────────┐
                  │              Input Requirement               │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           1. INPUT VALIDATION                                   │
│  - Heuristics checklist (length, format, content structure)                     │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ Valid?
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       2. FEATURE & CONTEXT DECONSTRUCTION                       │
│  - Extracts structured business rules, system actors, entities, and complexity  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        3. QUALITY & GAP ASSESSMENT                              │
│  - Identifies contradictions, vague terminology, and logical omissions          │
│  - Maps missing data against QA checklists                                      │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        4. READINESS CONFIDENCE SCORING                          │
│  - Computes weighted readiness score (0.0 to 1.0) and action recommendation    │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          RequirementAnalyzerResult           │
                  │       (RequirementIntelligenceReport)        │
                  └──────────────────────────────────────────────┘
```

---

## 2. Shared Structured Knowledge Model

Instead of returning a descriptive paragraph, the analyzer compiles the raw text into a strict schema: the **`RequirementIntelligenceReport`**. This report forms the "shared brain" that all other modules (Clarification, Generation, and Review) consume.

### Structured Schemas Defined:

1. **`actors: Actor[]`**:
   * *Type*: Structured List
   * *Fields*: `name` (unique ID), `description` (role constraints, e.g., "Parent - User authorized to manage sub-accounts").
2. **`entities: DomainEntity[]`**:
   * *Type*: Structured List
   * *Fields*: `name` (domain model name), `properties` (fields identified), `relationships` (pointers to other models).
3. **`businessRules: BusinessRule[]`**:
   * *Type*: Structured List
   * *Fields*: `id` (rule code), `description` (statement), `condition` (trigger context), `expectedOutcome` (assertion boundary).
4. **`ambiguities: Ambiguity[]`**:
   * *Type*: Quality Report List
   * *Fields*: `id` (issue pointer), `description`, `locationSnippet`, `severity` (low/medium/high).
5. **`missingInformation: MissingInformationGap[]`**:
   * *Type*: Gap Analysis List
   * *Fields*: `description`, `category` (error-handling, boundaries, auth, formats, performance), `impactSeverity` (low/medium/high).
6. **`riskAreas: RiskArea[]`**:
   * *Type*: Risk Assessment
   * *Fields*: `area`, `description`, `severity`.
7. **`complexity: RequirementComplexity`**:
   * *Type*: Complexity analysis (nice-to-have metric)
   * *Fields*: `level` (low/medium/high), `factors` (elements causing complexity, e.g. third-party API dependencies, state machines), `rationale` (QA logic explanation).

---

## 3. Input Validation Rules (Pre-processing)

Before starting heavy semantic analysis, the input undergoes validation:

| Rule ID | Name | Severity | Condition / Violation Threshold |
|---|---|---|---|
| **VAL-001** | Non-Empty Spec | `error` | Content is empty, null, or whitespace-only. |
| **VAL-002** | Length Threshold | `warning` | Content is $< 30$ words. While parseable, it is highly likely to contain insufficient context. |
| **VAL-003** | Structural Check | `warning` | Markdown lacks standard headers (`#`, `##`) or User Story formats (`As a... I want... So that...`). |
| **VAL-004** | Project Context | `error` | Requirement references a project with missing config (e.g., target language/framework). |

If any `error` severity issue is found, the analysis is immediately aborted and returned as `isValid: false`.

---

## 4. Ambiguity Detection Strategy

Ambiguities are mapped into four categories using regex heuristics and LLM semantic classifiers:

- **Contradictions**: Logical conflicts (e.g. statement A: *"Admin must approve refund"* vs. statement B: *"Auto-refund is triggered on cancel"*).
- **Vague Terminology**: Qualifiers that lack test assertions (e.g., search for qualifiers like *fast, instantaneously, normal, secure, robust, modern, sometimes, usually*).
- **Incomplete Conditionals**: "If" paths where the negative state is left blank.
- **Unspecified Actors**: Passive voice statements (e.g., *"The database is purged"* without stating which user/subsystem performs it).

---

## 5. Missing Information Detection (QA Gaps)

The analyzer maps absent logic against standard QA checklists:
- **Error & Failure Recovery**: Timeouts, retries, boundary failures.
- **Boundary Limits**: Numeric limits, character lengths, rate throttling bounds.
- **Authorization & Security Context**: Role accesses, session termination actions.
- **Data Format Specifications**: Date/time offsets, numerical schemas, string sizes.

---

## 6. Confidence Scoring Model

To prevent premature test generation, we compute a weighted confidence score ($Score_{readiness}$) between $0.0$ and $1.0$:

$$Score_{readiness} = (w_{clarity} \times S_{clarity}) + (w_{completeness} \times S_{completeness}) + (w_{consistency} \times S_{consistency})$$

### Score Components
1. **Clarity Score ($S_{clarity}$)**: Inverse of ambiguity density.
2. **Completeness Score ($S_{completeness}$)**: Score based on missing QA gaps.
3. **Consistency Score ($S_{consistency}$)**: Score based on contradiction count.

### Dimension Weights (Default)
- $w_{clarity} = 0.3$
- $w_{completeness} = 0.5$ (Weighted heavily because missing rules lead to poor coverage)
- $w_{consistency} = 0.2$

### Threshold Guidelines & Actions
* **Score $> 0.8$ (Green / `generate-direct`)**: The specification is complete and clear. Direct generation is authorized.
* **Score $0.5$ to $0.8$ (Amber / `clarify-recommended`)**: Gaps exist. Questions recommended to cover edge cases.
* **Score $< 0.5$ (Red / `clarify-mandatory`)**: Critical gaps. Automated generation is blocked until clarification questions are resolved.

---

## 7. Question Generation Workflow

The output of the Requirement Analyzer integrates directly into the conversational questioning cycle:

```
┌──────────────────────────────────────┐
│        Requirement Analyzer          │
│ - Outputs Intelligence Report        │
│   (ambiguities + missing gaps)       │
└──────────────────┬───────────────────┘
                   │
                   ▼ [RequirementIntelligenceReport]
┌──────────────────────────────────────┐
│         Clarification Engine         │
│ - Formulates Questions               │
│ - Lists QA Rationale                 │
└──────────────────┬───────────────────┘
                   │
                   ▼ [Questions List]
┌──────────────────────────────────────┐
│         Conversation Manager         │
│ - Updates Session                    │
│ - Triggers WebView UI                │
└──────────────────────────────────────┘
```

1. **Extraction**: The `RequirementAnalyzer` returns the `RequirementIntelligenceReport`.
2. **Translation**: If the score is $< 0.8$, the `ConversationManager` invokes the `ClarificationEngine`.
3. **Formulation**: The `ClarificationEngine` parses the structured `ambiguities` and `missingInformation` and generates targeted `Question` entities with options, explanations, and QA rationales.
4. **Interaction**: Questions are rendered in the VS Code webview panel for the QA engineer to answer.
5. **Re-Analysis**: Once answered, the answers are appended to the context, and a new analysis cycle is run, updating the `RequirementIntelligenceReport` and increasing the confidence score.

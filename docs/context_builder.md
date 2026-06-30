# QA Context Engine

The **QA Context Engine** compiles the complete domain information required for test case generation. Rather than creating raw, hardcoded prompt strings, the engine packages all specification variables into a structured value object called `GeneratorContext`.

This context is then rendered through prompt templates, validated, and subjected to a readiness check to determine if AI generation can safely proceed.

---

## 1. Context Structure (`GeneratorContext`)

The `GeneratorContext` holds:
- **`version`**: Schema structure version (`"1.0"`).
- **`requirement`**: The raw specification (markdown or JSON).
- **`intelligence`**: Extraction details (rules, actors, ambiguities, and gaps).
- **`answers`**: Clarification results from the questioning phase.
- **`projectConfig`**: Company-wide guidelines, target test frameworks (e.g. Playwright), target languages, and coding/naming conventions.
- **`generationPreferences`**: User instructions detailing test counts, automation filters, and testing focuses (e.g. security checks).
- **`compiledAt`**: Timestamp of compilation.

---

## 2. Compilation & Verification Pipeline

```
     Raw Requirement + Reports + Answers + Configs + Preferences
                                │
                                ▼
                       [Context Compiler]
                                │
                                ▼
                        GeneratorContext
                                │
                                ▼
                       [Context Validator]  ➔  ContextReadinessReport
                                │
                      ┌─────────┴─────────┐
                      ▼                   ▼
                 [Not Ready]           [Ready]
            (Unresolved Gaps)      (Proceed to AI)
```

### Context Compiler (`IContextCompiler`)
Aggregates all raw requirement information, metadata, configuration, and answers into a unified schema instance.

### Context Validator (`IContextValidator`)
Performs static integrity checks:
- Verifies that the requirement is not empty.
- Maps all raw gaps and ambiguities from the intelligence report and matches them against the collected clarifications. If any **blocking** questions (e.g. regarding permissions or core branch logic) remain unanswered, the context is marked as **Not Ready**.
- Returns a `ContextReadinessReport` containing:
  - `ready` (boolean flag)
  - `confidence` (health percentage from 0.0 to 1.0)
  - `blockingIssues` (list of unresolved blocking gaps)
  - `warnings` (list of missing optional clarifications)
  - `recommendation` (concrete UI actions, e.g. "Proceed" vs. "Clarify Required")

---

## 3. Template-Driven Prompting (`IContextRenderer`)

To maintain provider independence, prompt layouts are loaded from templates (e.g. `templates/generation.md`) containing brackets:
- `{{REQUIREMENT_TITLE}}` & `{{REQUIREMENT_CONTENT}}`
- `{{BUSINESS_RULES}}` & `{{ACTORS}}`
- `{{CLARIFICATIONS}}`
- `{{TARGET_LANGUAGE}}` & `{{TARGET_FRAMEWORK}}`
- `{{COMPANY_RULES}}` & `{{QA_GUIDELINES}}`

The `DefaultContextRenderer` loads layouts from files, performs variable substitutions, and can serialize the context to JSON.

---

## 4. Context Inspector Console UI

Before invoking any AI models, QAMate prints a summary checklist of the compiled brain:

```
======================================================
🧠 QAMate Context Inspector
======================================================
Requirement Spec:   ✔ Loaded ("public_storage_spec")
Business Rules:     ✔ 2 rules loaded
Actors:             ✔ 2 actors loaded
Clarifications:     ✔ 1 answered, 0 skipped
Project Standards:  ✔ Target Language: TypeScript
                    ✔ Framework: Playwright
Generation Prefs:   ✔ Max Cases: 10
                    ✔ Focus: security, boundaries
------------------------------------------------------
🛡️  Readiness Check:  🟢 READY TO GENERATE
Confidence Score:   90%
Recommendation:     Ready - Proceed with generation (some optional variables missing).
======================================================
```
This ensures developers and QA engineers can audit what data is sent to the LLM.

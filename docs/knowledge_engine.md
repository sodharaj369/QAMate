# QA Knowledge Engine

The **QA Knowledge Engine** serves as the persistent memory layer for QAMate. It enables the system to store QA learning experiences, bug patterns, defect risks, and reusable test assets, making QAMate progressively smarter over time.

---

## 1. Core Architecture

The Knowledge Engine decouples storage contracts from specific implementations so that memory can be stored in-memory (for local dev/CLI) or persisted in file-based storage systems (SQLite, JSON databases, etc.).

```
IKnowledgeEngine (Interface)
    │
    └── DefaultKnowledgeEngine (Implementation)
            │
            ├── Extract Knowledge   → Mines QA outcomes from runs
            ├── Query Store         → Keyword similarity lookup (Jaccard)
            └── Find Similar        → Matches historical specs to new inputs
```

---

## 2. Memory Domain Models

Memory units are structured as `KnowledgeEntry` entities containing the following categories:

| Category | Source | Description |
|---|---|---|
| `bug-pattern` | Quality review issues | Records recurring generation bugs (e.g., duplicated titles, empty checks) to avoid repeating them. |
| `common-defect` | Requirement risks | Identifies common engineering pitfalls for specific features (e.g., token expiry limits). |
| `test-template` | Code/manual artifacts | Saves generated code skeleton formats (Playwright scripts, xUnit test classes) for reuse. |
| `lesson-learned` | Quality gate suggestions | Stores feedback and instructions from review reports to refine subsequent prompts. |
| `reusable-assertion` | Requirement business rules | Catalogs concrete validation rules (e.g., "SAS public access disabled") for future runs. |

---

## 3. Heuristic Search & Relevance Scoring

To retrieve similar requirements or suggest relevant templates, the engine implements a deterministic text-matching pipeline:

1. **Tokenization & Stop-Word Filtering**:
   Queries and entries are cleaned (case-insensitive, non-alphanumeric removed) and split into tokens. Standard grammatical stop words (e.g., *the*, *and*, *with*) are filtered out to focus on domain-specific keywords.
2. **Jaccard Similarity Coefficient**:
   The engine scores similarity by comparing the intersection of search keywords against the union of search keywords:
   $$\text{Jaccard Similarity} = \frac{|A \cap B|}{|A \cup B|}$$
   This produces a normalized score between `0.0` and `1.0`.
3. **Ranking**:
   Matches are sorted in descending order of relevance score and filtered by a user-defined `minConfidence` threshold.

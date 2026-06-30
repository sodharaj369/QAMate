# Generation Lifecycle Engine

The **Generation Lifecycle Engine** manages stateful session versioning, refinements, and rollbacks for generated test suites.

---

## 1. Lifecycle Operations

- **Continue**: Appends incremental updates to existing artifacts without replacing historical changes.
- **Regenerate All**: Clears current version output and triggers a fresh generation run.
- **Refine Selected**: Submits a target artifact and a natural language refinement instruction to update specific code segments.

---

## 2. Versioning & Rollback History

All mutations commit a new immutable `ArtifactVersion` to the `GenerationSession` history list. 
If an edit degrades output quality, the QA engineer can roll back the workspace to any previous version ID (e.g. `v-1`).

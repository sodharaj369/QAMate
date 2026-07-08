# Volume 3: Architecture & AI Engines - Chapter 27: Token Optimization & Economy

## Purpose
Specifies prompt compression, caching, and token budgeting rules.

## Problem
Large requirement specifications and long session histories lead to high API token consumption and slow model execution times.

## Goals
- Minimize token payloads using context compression and delta prompting.
- Track tokens saved and estimated costs dynamically.

## Non Goals
- Processing billing transactions.
- Tuning endpoint gateway proxies.

## Architecture
The compiler module processes specs and conversation variables before sending prompt completes, filtering out non-essential elements.

## UX
Surfaces token metrics, cost estimates, cache hits, and tokens saved indicators under Developer mode collapsible sections.

## Engineering
*   **Context Compression**: Prunes markdown images, code examples, styling links, and empty tags.
*   **Delta Prompting**: Sends only the changes (delta) in requirements or new answers instead of the entire conversation transcript.
*   **Cache Reuse**: Leverages LLM provider prompt caching features by structuring system instructions and static rules at the start of prompts.

## Examples
The compiler processes a 10KB specification document, reducing it to 3KB by stripping HTML tables, placeholder tags, and comments before sending to Gemini.

## Anti Patterns
- Submitting full, raw specification files and transcript logs on every stepper transition.

## Acceptance Criteria
- Payloads must exclude redundant specification formatting tags.
- Context compilers must calculate and display estimated query costs.

## Future Evolution
Deploy local vector database indexing models to compile prompts using semantic retrieval of relevant rules.

# Volume 1: Product Foundation - Chapter 05: Product Boundaries & Scope Matrix

## Purpose
Outlines the strict bounds of QAMate features to prevent scope creep.

## Problem
QA platforms attempt to build ticket boards, test runners, and editors, resulting in bloated, unfocused software.

## Goals
- Align all features directly with the six outcome stages.
- Decouple engine packages from corporate deployment configurations.

## Non Goals
- Writing or editing the raw software specification.
- Executing automated tests or tracking execution run results.

## Architecture
Boundaries are enforced by tactical DDD aggregate boundaries. A TestCase is isolated from Conversation states once generated.

## UX
The VS Code Webview sidebar serves as a configuration panel and delivery dashboard, not a code editor.

## Engineering
Packages compile independently. project references enforce boundaries during build time.

## Examples
A request to add a "Run Test" button is rejected; test execution is outside QAMate's domain boundary.

## Anti Patterns
- Allowing the core engine to read VS Code workspace settings directly.

## Acceptance Criteria
- The engine does not reference platform-specific code.
- Database models are simulated or saved via clean storage adapters.

## Future Evolution
Maintain clean boundaries as QAMate scales to support web dashboards or corporate reporting systems.

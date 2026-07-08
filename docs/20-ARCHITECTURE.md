# Volume 3: Architecture & AI Engines - Chapter 20: Core System Topology & Boundaries

## Purpose
Locks in the high-level codebase layout and packages boundary rules.

## Problem
Uncontrolled module imports and library bleed across client packages result in fragile extensions and slow startup times.

## Goals
- Enforce circular import checks and linear package references.
- Keep the business core decoupled from Visual Studio Code framework APIs.

## Non Goals
- Specifying details of target test runner frameworks.
- Defining workspace database query logic.

## Architecture
npm workspace monorepo layout: shared (utilities) ➔ engine (business/AI domain) ➔ vscode-extension (editor host client).

## UX
The presentation client operates as an independent presentation layer mapping visual forms to aggregate contracts.

## Engineering
Enforces project references within tsconfig configuration profiles to validate build structures.

## Examples
A unit test validates that the core domain file contains no imports referencing the "vscode" module.

## Anti Patterns
- Allowing domain entities to hold references to webview panels or visual window contexts.

## Acceptance Criteria
- The monorepo builds incrementally using "npm run build".
- No circular package dependencies exist.

## Future Evolution
Establish a headless CLI runner to validate requirements and strategies during automated CI pipelines.

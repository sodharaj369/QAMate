# Volume 1: Product Foundation - Chapter 03: The Permanent Constitution

## Purpose
Establishes the immutable rules governing code contributions and architectural design.

## Problem
Architectural drift occurs when developers introduce ad-hoc abstractions, wrapper patterns, or custom libraries to solve minor issues.

## Goals
- Maintain the core engine in a stateless, client-agnostic structure.
- Prevent the introduction of external npm dependencies without strict justification.

## Non Goals
- Documenting project-specific playbooks or test rules.
- Specifying CI/CD compilation script parameters.

## Architecture
The monorepo contains three packages: shared, engine, and vscode-extension. The engine must remain stateless and decoupled from the extension visual APIs.

## UX
Aligns the extension sidebar panels with the state of the Conversation aggregate.

## Engineering
Strict TypeScript typing is enforced. The use of "any" or loose object parameters is prohibited.

## Examples
Reviewing a pull request; the PR is rejected because it imports the "vscode" module into "@qamate/engine".

## Anti Patterns
- Writing custom wrappers or generic factory classes before there is an active consumer.

## Acceptance Criteria
- Every new module contains: interface, one implementation, unit tests, and CLI demonstration.
- All unit test suites must pass clean before merges.

## Future Evolution
This constitution is frozen and serves as the permanent validation benchmark for all QAMate contributions.

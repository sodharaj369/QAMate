# Volume 2: UX & Visual Design - Chapter 12: The Living Workspace Stepper

## Purpose
Specifies the design of the outcomes stepper and active transitions.

## Problem
Testers lose track of progress when shifting between analysis notes, strategy charts, and generated code files.

## Goals
- Constrain user interaction to the active step page using single-page rendering.
- Keep the timeline events tracker updated as the user progresses.

## Non Goals
- Allowing arbitrary jumping across outcome stages without resolving dependencies.
- Managing execution details of generated test cases.

## Architecture
Coordinated by the client provider transition function, updating local states and compiling HTML templates.

## UX
Presents the Next Best Action panel at the footer of each stage, providing guidance on what steps to execute next.

## Engineering
Updates the active conversation status inside JSON storage when moving between stepper positions.

## Examples
Completing the QA questionnaire transitions the stepper from "Prepare" to "Plan", loading the strategy page.

## Anti Patterns
- Allowing the user to generate test cases before reviewing the test strategy.

## Acceptance Criteria
- The stepper header highlights the current progress state.
- The transition command raises error screens if analysis dependencies fail.

## Future Evolution
Implement interactive progress indicators directly in the editor status bar to track background AI reasoning runs.

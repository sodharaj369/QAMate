# Volume 2: UX & Visual Design - Chapter 14: Export & Delivery System

## Purpose
Governs the multi-format serialization of QA deliverables.

## Problem
Manual copy-pasting of test cases is slow and prone to formatting errors, while static spreadsheet exports lack traceability matrices.

## Goals
- Compile premium Excel workbooks containing styled sheets, freeze panes, autofilters, and traceability tabs.
- Support dynamic filename formatting and direct ADO/Jira synchronization.

## Non Goals
- Storing long-term ticket backlogs.
- Managing code repository commits.

## Architecture
Translates TestCase and TestStrategy aggregates into target files via ExportFramework and ExcelJS builders.

## UX
Renders format selection options (Excel Workbook, CSV, HTML, Markdown, JSON) and sync status badges on the Deliver screen.

## Engineering
*   **Workbook Structure**: ExcelJS builds sheets: Summary, QA Strategy, Functional, Negative, Boundary, Risks, Traceability.
*   **Sheet Layout**: Styled row headers (color code: #007ACC), freeze panes, auto-adjusted widths, and table filters.
*   **Dynamic Filename**: Formats path names based on project ID and requirement title (e.g. `qamate-proj-login-report.xlsx`).
*   **CSV Compatibility**: Generates standard comma-separated lines parsing steps, preserving line breaks.

## Examples
QA Lead exports to Excel Workbook. The generated spreadsheet opens with header freeze panes active on case sheets and a traceability tab mapping tests back to rules.

## Anti Patterns
- Generating spreadsheets using plain HTML table text overrides.

## Acceptance Criteria
- Export workbooks must compile without cell formatting errors.
- Sync commands must link child test scenarios back to parent ticket IDs.

## Future Evolution
Add git commit templates to automatically write generated scripts to test folders in active workspaces.

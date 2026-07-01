# QAMate VS Code Extension Design System

This document specifies the design tokens, layout grids, components, and typography rules for the QAMate VS Code Extension. It acts as a guide to ensure consistent UX alignment.

---

## 🎨 Spacing Scale
QAMate uses a modular layout spacing scale based on a 4px baseline grid. Never use arbitrary values.
- **4px**: Extra Small (margins, input text padding)
- **8px**: Small (vertical item separators, badge gaps)
- **12px**: Medium (default padding within sections and lists)
- **16px**: Large (default padding inside panel workspace frames)
- **24px**: Extra Large (separators between major screen components)
- **32px**: Double Extra Large (margins surrounding welcome headers)
- **48px**: Triple Extra Large (empty state top offsets)

---

## 📝 Typography
All fonts scale matching the user's active editor environment:
- **Page Title**: `24px / line-height: 32px` (weight: 600)
- **Section Title**: `16px / line-height: 22px` (weight: 600)
- **Card Title / Field Label**: `14px / line-height: 18px` (weight: 500)
- **Body / Main copy**: `13px / line-height: 18px` (weight: 400)
- **Caption / Metadata**: `11px / line-height: 14px` (weight: 400)

---

## 🌈 Colors & Styling
QAMate maps colors exclusively to native VS Code theme tokens:
- **Background**: `var(--vscode-sideBar-background)`
- **Foreground**: `var(--vscode-foreground)`
- **Low-Contrast Description**: `var(--vscode-descriptionForeground)`
- **Borders**: `var(--vscode-panel-border)`
- **Standard Button**:
  - Background: `var(--vscode-button-background)`
  - Hover: `var(--vscode-button-hoverBackground)`
  - Text: `var(--vscode-button-foreground)`
- **Secondary Button**:
  - Background: `var(--vscode-button-secondaryBackground)`
  - Hover: `var(--vscode-button-secondaryHoverBackground)`
  - Text: `var(--vscode-button-secondaryForeground)`
- **Input Field**:
  - Background: `var(--vscode-input-background)`
  - Border: `var(--vscode-input-border)`
  - Foreground: `var(--vscode-input-foreground)`

---

## ⏱️ Animation Tokens
Transition times use central design tokens to enforce consistent speeds:
- **Fast**: 120ms (button hover triggers)
- **Normal**: 180ms (card highlights, state transitions)
- **Slow**: 250ms (stepper transitions, page loads)

---

## 🏗️ Components Directory
All components are restricted to a maximum of 300 lines of clean code:
- **Button**: Handles primary and secondary action triggers.
- **Card**: Displays grouped detail metrics.
- **StatusChip**: Highlights ratings (e.g. approved, warning, critical).
- **Timeline**: Events history trace items.
- **ProgressStep**: Simplifies cognitive workload by illustrating previous, active, and upcoming stages.
- **RecommendationCard**: Explicitly details the **Next Best Action**, including its **Reason** and **Expected Impact**.
- **EmptyState**: Standardized layout displaying when no sessions or strategies exist.
- **LoadingSkeleton**: Flat textual log summaries matching real engine events as they resolve.

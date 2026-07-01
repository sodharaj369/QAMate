# QAMate v1 Component Library 🎨

This document defines QAMate's CSS-based design system, visual styling tokens, and layout guidelines for building components. All styles must map directly to native VS Code theme overrides.

---

## 1. UI Tokens & Styling Variables

Custom CSS properties map directly to native VS Code tokens, ensuring seamless integration with light and dark IDE themes:

| CSS Property Variable | Mapping VS Code Token | Usage Description |
| :--- | :--- | :--- |
| `var(--qamate-bg)` | `var(--vscode-sideBar-background)` | Extension sidebar background |
| `var(--qamate-fg)` | `var(--vscode-foreground)` | Standard body and label copy |
| `var(--qamate-desc-fg)` | `var(--vscode-descriptionForeground)` | Low-contrast captions and details |
| `var(--qamate-border)` | `var(--vscode-panel-border)` | Separators and panel lines |
| `var(--qamate-card-bg)` | `var(--vscode-sideBarSectionHeader-background)` | Visual grouping card background |
| `var(--qamate-btn-bg)` | `var(--vscode-button-background)` | Primary button color |
| `var(--qamate-btn-hover)` | `var(--vscode-button-hoverBackground)`| Primary button hover color |
| `var(--qamate-btn-fg)` | `var(--vscode-button-foreground)` | Primary button text |
| `var(--qamate-btn-sec-bg)` | `var(--vscode-button-secondaryBackground)`| Secondary button color |
| `var(--qamate-btn-sec-hover)`| `var(--vscode-button-secondaryHoverBackground)`| Secondary button hover color |
| `var(--qamate-btn-sec-fg)` | `var(--vscode-button-secondaryForeground)`| Secondary button text |
| `var(--qamate-input-bg)` | `var(--vscode-input-background)` | Form input background |
| `var(--qamate-input-fg)` | `var(--vscode-input-foreground)` | Form input text |
| `var(--qamate-input-border)` | `var(--vscode-input-border)` | Form input border |

---

## 2. Spacing Scale

Layout margins and paddings must adhere to a 4px baseline grid:
- **4px (`--space-xs`)**: Extra Small (margins, select element paddings)
- **8px (`--space-sm`)**: Small (vertical item separators, badge gaps)
- **12px (`--space-md`)**: Medium (default padding within sections and lists)
- **16px (`--space-lg`)**: Large (default padding inside panel frames)
- **24px (`--space-xl`)**: Extra Large (separators between major screen components)
- **32px (`--space-xxl`)**: Double Extra Large (welcome header margins)

---

## 3. Reusable UI Components

All components are implemented in HTML/CSS and must be kept modular (under 300 lines of code).

### A. Primary & Secondary Buttons
- **HTML**: `<button class="btn-primary">` / `<button class="btn-secondary">`
- **Design Guidelines**: Minimum height of 28px, border-radius of 2px, and 120ms transitions.

### B. Visual Grouping Card
- **HTML Class**: `.card`
- **Design Guidelines**:
  - Background: `var(--qamate-card-bg)`
  - Padding: `var(--space-md)` (12px)
  - Border: 1px solid `var(--qamate-border)`
  - Used for grouping analysis items, strategy components, and questions.

### C. Status Chips
- **HTML Class**: `.tag`
  - `.tag-ok` (Teal color mapping: `var(--vscode-testing-iconPassedColor)`)
  - `.tag-warn` (Orange color mapping: `var(--vscode-testing-iconQueuedColor)`)
  - `.tag-critical` (Red color mapping: `var(--vscode-testing-iconFailedColor)`)
- **Design Guidelines**: Small caps text, font size 9px, bold weight.

### D. Outcome Progress Stepper
- **HTML Class**: `.stepper-container` containing `.step-item`
- **Design Guidelines**: Horizontal bar layout with circles indicating finished, active, and upcoming outcomes. Uses color coding to avoid cognitive overload.

### E. Recommendation Card
- **HTML Class**: `.recommendation-box`
- **Design Guidelines**: Uses a left border accent matching `var(--qamate-btn-bg)` (3px solid) to highlight the Next Best Action recommendation. Always contains three sub-sections: what happened, why, and what to do next.

### F. Loading Skeletons
- **HTML Class**: `.skeleton-line`
- **Design Guidelines**: Pulsing translucent lines that correspond to background event logs in the engine, providing instant visual feedback.

---

## 4. Micro-interactions & Animations

- **Hover Transitions**: Button hovers use a clean ease-in-out transition of 120ms (`transition: background 0.12s ease-in-out`).
- **Drag-and-Drop Dropzone**: File intake drop target shifts borders to primary colors and fades back on drag exit (180ms transition).
- **Tab Transitions**: Switching between Results Workspace tabs (Strategy, Test Cases, Coverage, Review) uses a slide/opacity fade of 180ms.

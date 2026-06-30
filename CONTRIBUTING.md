# Contributing to QAMate 🤝

Thank you for your interest in contributing to QAMate! We want to build the best open-source AI-powered QA Thinking Assistant, and your support makes that possible.

To maintain high code quality and professional standards, please review this guide.

---

## 📜 Development Workflow

1. **Fork and Clone**: Fork the repository on GitHub and clone your fork locally.
2. **Branching Strategy**: Create a branch for your work:
   - New features: `feature/your-feature-name`
   - Bug fixes: `bugfix/your-bugfix-name`
   - Documentation: `docs/your-doc-title`
3. **Coding Standards**:
   - Ensure strict TypeScript typing (avoid `any` where possible).
   - Adhere to the Domain-Driven Design layout for core engine updates.
4. **Format & Lint**:
   - Format code using Prettier (`npm run format`).
   - Ensure zero lint errors by running ESLint (`npm run lint`).
5. **Compile & Test**:
   - Make sure all TypeScript workspaces build successfully: `npm run build`.
   - Run and pass the unit tests via Vitest: `npm run test`.
6. **Submit PR**: Open a pull request against the `main` branch.

---

## 💬 Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. This helps in generating automated changelogs and tracking releases.

Format:
`type(scope): description`

### Types:

- **feat**: A new feature for the user or engine logic.
- **fix**: A bug fix.
- **docs**: Documentation updates (README, docs folder, code comments).
- **style**: Changes that do not affect the meaning of the code (formatting, white-space, semi-colons).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **test**: Adding missing tests or correcting existing tests.
- **chore**: Updating build tasks, package manager dependencies, or workspace configs.

### Examples:

- `feat(engine): introduce requirement analyzer interface`
- `fix(shared): resolve logger console timestamp padding`
- `docs(readme): add setup instructions`

---

## 🧑‍💻 Code Quality Gates

Before opening a pull request, please run our verification chain locally. Pull requests that fail any of these gates will block the CI pipeline:

```bash
# 1. Format code check
npm run format:check

# 2. Lint verification
npm run lint

# 3. TypeScript compilation
npm run build

# 4. Run tests
npm run test
```

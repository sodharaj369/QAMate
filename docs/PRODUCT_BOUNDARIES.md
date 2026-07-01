# QAMate Product Boundaries 🛡️

To prevent scope creep and ensure we build a world-class QA reasoning workspace, we maintain a strict **No Build** list. If a feature request falls into any of these categories, it must be rejected immediately.

---

## 🚫 The "No Build" List

We will **NOT** build:

1. **A Chat Application / Assistant**
   - *Why*: QAMate is not a generic conversational assistant or a replacement for ChatGPT. The user interface is a structured guided stepper, not a chat bubble loop.
2. **A Prompt Playground**
   - *Why*: Users should not write or fine-tune system prompts inside QAMate. The engine handles prompting internally using domain rules and configurations.
3. **An Agent Marketplace / Multi-Agent Orchestrator**
   - *Why*: QAMate is a single-agent/rule-based developer tool, not an enterprise agent workflow builder.
4. **Project Management & Sprint Planning**
   - *Why*: We do not build Kanban boards, backlog managers, user story creators, or estimation trackers. We read from DevOps/Jira, but we do not replace them.
5. **Requirement Writing / Authoring Platforms**
   - *Why*: QAMate reads and analyzes requirements; it is not a tool for BA/Product managers to draft user stories or specs.
6. **Bug Tracking & Time Tracking**
   - *Why*: We do not store developer hours, logs, task durations, or defect lists.
7. **A Code Editor**
   - *Why*: VS Code is the code editor. QAMate runs inside a sidebar panel; it does not replace the text editor space, syntax highlighting, or standard workspace file managers.
8. **A Documentation Platform**
   - *Why*: QAMate generates QA-specific deliverables (Manual Cases, API Specs, Test Skeletons). It is not a wiki, wiki manager, or generic team documentation hub.

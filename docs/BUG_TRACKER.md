# QAMate Bug Tracker & Verification Diagnostics 🐛

This document tracks all active bugs, grouped by structural categories, mapping reproduction steps, expected behavior, root causes, priorities, and acceptance criteria.

---

## 1. AI

### BUG-AI-001: GitHub Copilot / VS Code LM API detection failure
*   **Priority**: High
*   **Root Cause**: The provider resolver attempts to query `vscode.lm` before the extension environment is fully loaded.
*   **Reproduction Steps**:
    1. Open an editor with GitHub Copilot active.
    2. Start the extension. The connection badge displays "Offline" and prompts for Gemini API keys.
*   **Expected Behavior**: Automatically queries the active LM API and connects Copilot as the default provider without user action.
*   **Acceptance Criteria**: The extension resolves the VS Code native LM API successfully on cold launch.

### BUG-AI-002: Provider API key validation bypass
*   **Priority**: High
*   **Root Cause**: Empty strings are evaluated as truthy values during key configurations checks inside provider builders.
*   **Reproduction Steps**:
    1. Open Settings.
    2. Enter whitespace spaces in the Gemini API key field and click connect.
    3. The widget displays "Connected" but crashes on active analysis runs.
*   **Expected Behavior**: Rejects empty spaces or formatting characters and displays validation error warnings.
*   **Acceptance Criteria**: Form validation checks reject whitespace strings before saving credentials.

### BUG-AI-003: Automatic failover network timeout freeze
*   **Priority**: Medium
*   **Root Cause**: The prompt generator lacks timeout parameters, blocking connection responses on network drops.
*   **Reproduction Steps**:
    1. Start analysis with an active OpenAI key.
    2. Unplug the internet connection during the prompt request. The stepper remains loading indefinitely.
*   **Expected Behavior**: Raises connection timeout error after 30 seconds and redirects to the local Ollama fallback.
*   **Acceptance Criteria**: Failover executes within 30 seconds of connection timeouts.

---

## 2. State

### BUG-ST-001: Configuration stale on VS Code theme shift
*   **Priority**: Medium
*   **Root Cause**: UI webviews load CSS color parameters on initialization but do not subscribe to color theme updates.
*   **Reproduction Steps**:
    1. Open sidebar under Dark theme.
    2. Switch editor theme to Light. The sidebar retains dark background values.
*   **Expected Behavior**: Automatically refreshes sidebar visual layouts on color theme updates.
*   **Acceptance Criteria**: UI listens to theme updates and redrafts css parameters.

### BUG-ST-002: Startup state initialization mismatch on cold launch
*   **Priority**: Medium
*   **Root Cause**: Cache loader reads invalid session IDs on initial workspace runs, failing to mount defaults.
*   **Reproduction Steps**:
    1. Open a new folder in VS Code.
    2. Click the QAMate icon. The UI renders the scorecard of a previous workspace.
*   **Expected Behavior**: Checks active folder boundaries and initializes an empty WelcomePage.
*   **Acceptance Criteria**: Welcome screen shows no active workspace data if the folder lacks a database folder.

### BUG-ST-003: Single AppState subscription updates drop on tab swap
*   **Priority**: Low
*   **Root Cause**: Tab switching commands rebuild HTML screens, dropping previous observer handles.
*   **Reproduction Steps**:
    1. Open settings, modify QA Persona.
    2. Click home tab. The welcome panel is not updated.
*   **Expected Behavior**: Subscriptions persist across tabs, keeping home screens aligned with settings modifications.
*   **Acceptance Criteria**: Switching tabs does not break AppState subscription hooks.

---

## 3. Sessions

### BUG-SS-001: Resume session loads wrong outcome stepper index
*   **Priority**: High
*   **Root Cause**: The session restorer maps conversation status strings to wrong stepper positions.
*   **Reproduction Steps**:
    1. Complete strategy checks and generate cases.
    2. Close the workspace and restart the extension.
    3. Click "Resume". The sidebar displays the intake screen instead of the Results tab.
*   **Expected Behavior**: Restores the user to the Results workspace tab.
*   **Acceptance Criteria**: The resumed stepper index matches the conversation status.

### BUG-SS-002: Double active session state leakage
*   **Priority**: High
*   **Root Cause**: Rapidly executing command clicks creates overlapping session cache registrations on disk.
*   **Reproduction Steps**:
    1. Open requirement A.
    2. Click "Analyze Active" twice in rapid succession.
    3. The file is saved twice under different IDs, causing data conflicts.
*   **Expected Behavior**: Locks the command button during active runs to prevent overlapping calls.
*   **Acceptance Criteria**: Buttons are disabled during active analysis tasks.

### BUG-SS-003: Resume session option displays duplicate session lists
*   **Priority**: Low
*   **Root Cause**: The session list loader appends items to the DOM without clearing previous lists.
*   **Reproduction Steps**:
    1. Open and close the home tab settings multiple times.
    2. The recent sessions panel displays duplicating session lists.
*   **Expected Behavior**: Clears lists before appending updated entries.
*   **Acceptance Criteria**: The recent session list has unique file IDs.

---

## 4. Requirement Intake

### BUG-RI-001: Azure DevOps Work Item description is imported empty
*   **Priority**: High
*   **Root Cause**: ADO description HTML payloads containing nested iframe structures return empty fields on standard JSON parses.
*   **Reproduction Steps**:
    1. Import ADO Work Item with nested iframe formatting descriptions.
    2. Check the requirement variable. It reads "No description provided."
*   **Expected Behavior**: Traverses nested tags to extract text runs.
*   **Acceptance Criteria**: Clean description text is extracted from nested structures.

### BUG-RI-002: Zero-dependency Word extractor drops blank paragraphs
*   **Priority**: Medium
*   **Root Cause**: Word document ASCII extractor replaces structural margins with empty spaces.
*   **Reproduction Steps**:
    1. Upload a DOCX specification containing table margins and double carriage returns.
    2. The parsed requirement content reads as a single, long line of text.
*   **Expected Behavior**: Retains line breaks to preserve document layout formatting.
*   **Acceptance Criteria**: Line break indicators are parsed correctly from binary docx zip streams.

### BUG-RI-003: Local file watcher duplicates intake session on double-save
*   **Priority**: Low
*   **Root Cause**: Document save commands fire multiple times rapidly, triggering redundant watches.
*   **Reproduction Steps**:
    1. Modify requirement.md in the editor.
    2. Double-click save command. QAMate runs analysis twice.
*   **Expected Behavior**: Debounces file watcher events to restrict analysis runs.
*   **Acceptance Criteria**: File save watches are debounced by 500ms.

---

## 5. Results Workspace

### BUG-RW-001: Results workspace shows markdown wall in checklist tab
*   **Priority**: High
*   **Root Cause**: Test Case Factory prints manual tests as raw markdown strings instead of parsing them to structured tables.
*   **Reproduction Steps**:
    1. Run test cases generation.
    2. Open "Test Cases" tab. The panel renders a single raw markdown text box.
*   **Expected Behavior**: Formats manual checklists into structured, readable tables.
*   **Acceptance Criteria**: Cases render inside HTML grids with separate steps and expected outcomes.

### BUG-RW-002: Search filtering drops checkmark states when input is cleared
*   **Priority**: Medium
*   **Root Cause**: Filtering lists rebuilds the DOM, losing active checkmark states.
*   **Reproduction Steps**:
    1. Check case TC-001 as verified.
    2. Type "payment" in search, then clear the search box.
    3. TC-001 checkmark returns to unchecked state.
*   **Expected Behavior**: Syncs visual checkmarks back to TestCase models before redrawing.
*   **Acceptance Criteria**: Checked states persist across search and filter events.

### BUG-RW-003: QA Health gauges show wrong code quality percentages
*   **Priority**: Low
*   **Root Cause**: Core review scorers divide value metrics by zero when the exceptions rule list is empty.
*   **Reproduction Steps**:
    1. Run strategy containing zero exclusions.
    2. Review gauge displays code quality score as 0%.
*   **Expected Behavior**: Handles empty lists gracefully and calculates scores out of total active rules.
*   **Acceptance Criteria**: Review scores calculate correctly on zero exclusions strategies.

---

## 6. Export

### BUG-EX-001: Empty Excel worksheets generated on invalid headers
*   **Priority**: High
*   **Root Cause**: The spreadsheet parser matches markdown headers strictly, ignoring lines with minor spaces.
*   **Reproduction Steps**:
    1. Generate cases using a model that writes headers as "###  Positive Cases" (double spaces).
    2. Download ExcelJS report. The worksheet tab is empty.
*   **Expected Behavior**: Sanitizes and normalizes markdown headers before parsing sections.
*   **Acceptance Criteria**: Cases are successfully written to target workbook tabs.

### BUG-EX-002: Export uses static file name override
*   **Priority**: Medium
*   **Root Cause**: File downloader writes reports to a static name, causing file overwrites.
*   **Reproduction Steps**:
    1. Save report for requirement A.
    2. Save report for requirement B. It defaults to the same filename, overwriting A.
*   **Expected Behavior**: Generates unique names using project ID and requirement title.
*   **Acceptance Criteria**: Save prompt defaults to unique filenames.

### BUG-EX-003: Invalid XML formatting in ExcelJS export cells
*   **Priority**: Low
*   **Root Cause**: Spreadsheet cells do not escape special characters like `<` or `>`.
*   **Reproduction Steps**:
    1. Write custom HTML step checks (e.g. `<img src=...>).
    2. Download Excel report and open it. Excel throws a file corruption error.
*   **Expected Behavior**: Escapes xml characters inside cell values.
*   **Acceptance Criteria**: The exported excel workbook opens without corruption errors.

---

## 7. UX

### BUG-UX-001: Welcome Page "Upload spec" dead on empty workspaces
*   **Priority**: High
*   **Root Cause**: Document selector requires a workspace folder URI to resolve relative file paths.
*   **Reproduction Steps**:
    1. Open VS Code without open folders.
    2. Click "Upload File". The upload dialog is blocked.
*   **Expected Behavior**: Resolves paths relative to the user's home folder.
*   **Acceptance Criteria**: Dialog loads and lets users open files in empty workspaces.

### BUG-UX-002: Drag-and-drop drop zone triggers file open editor
*   **Priority**: Medium
*   **Root Cause**: Visual webview layout does not override the editor's default dragover event handles.
*   **Reproduction Steps**:
    1. Drag requirement.md from file explorer.
    2. Drop it on the Webview panel. The file opens in the main editor.
*   **Expected Behavior**: Catches the drop event and runs intake analysis.
*   **Acceptance Criteria**: Dropping files on the Webview triggers QAMate intake.

### BUG-UX-003: Text font sizing doesn't scale on high-DPI monitors
*   **Priority**: Low
*   **Root Cause**: Webview components use hardcoded pixel sizes instead of relative CSS units.
*   **Reproduction Steps**:
    1. Launch extension on a 4K monitor.
    2. Sidebar font sizes are unreadably small.
*   **Expected Behavior**: Scales font sizes based on editor window configurations.
*   **Acceptance Criteria**: Visual layouts scale correctly across resolutions.

---

## 8. Integrations

### BUG-IN-001: Shallow Jira commenting sync
*   **Priority**: Medium
*   **Root Cause**: The adapter parses test cases as comment strings rather than native JIRA test issue configurations.
*   **Reproduction Steps**:
    1. Configure Jira parameters.
    2. Click "Sync to Jira".
    3. View the Jira ticket. The test details are logged as a comment rather than a structured test case.
*   **Expected Behavior**: Syncs cases directly to JIRA-managed testing panels.
*   **Acceptance Criteria**: Jira sync command writes child test scenarios back to parent ticket IDs.

### BUG-IN-002: ADO HTML Description Tag Pruning
*   **Priority**: Medium
*   **Root Cause**: ADO description HTML is stripped of layout parameters, returning single-line text runs.
*   **Reproduction Steps**:
    1. Import ADO Work Item with table formatting.
    2. Description reads as a single, unformatted text string.
*   **Expected Behavior**: Uses HTML-to-Markdown converters to preserve layout formatting.
*   **Acceptance Criteria**: Excluded layout lines are preserved during import.

### BUG-IN-003: ADO status stale connection widget cache
*   **Priority**: Low
*   **Root Cause**: Connection status widget reads cache parameters without verifying token expiration dates.
*   **Reproduction Steps**:
    1. Connect ADO using an expired PAT token.
    2. Welcome page displays a green "Active" badge.
*   **Expected Behavior**: Runs quick validation pings before displaying connection badges.
*   **Acceptance Criteria**: Connection status widget verifies credentials on launch.

---

## 9. Performance

### BUG-PE-001: Large specifications parser causes UI thread blockage
*   **Priority**: High
*   **Root Cause**: The text parser runs synchronously on the main thread, blocking visual updates during large parses.
*   **Reproduction Steps**:
    1. Open a 500KB requirement document.
    2. Run analysis. The VS Code sidebar UI freezes.
*   **Expected Behavior**: Executes parsing tasks asynchronously.
*   **Acceptance Criteria**: Sidebar UI remains responsive during large file parses.

### BUG-PE-002: Jaccard memory query calculations slow down when store file exceeds 1MB
*   **Priority**: Medium
*   **Root Cause**: The keyword matching engine searches entries sequentially in memory.
*   **Reproduction Steps**:
    1. Add 5,000 knowledge entries to store.json.
    2. Run query. Search time exceeds 500ms.
*   **Expected Behavior**: Indexes memory keywords to optimize retrieval times.
*   **Acceptance Criteria**: Retrieval times remain under 20ms.

### BUG-PE-003: Safety scanner CPU spikes when auditing large base64 inline files
*   **Priority**: Low
*   **Root Cause**: Safety scanner checks regex rules sequentially on large base64 data structures.
*   **Reproduction Steps**:
    1. Insert large base64 image data inside requirement content.
    2. Run safety scans. CPU usage spikes.
*   **Expected Behavior**: Ignores inline base64 lines during safety audits.
*   **Acceptance Criteria**: Scans complete within 15ms.

---

## 10. CI/CD

### BUG-CI-001: GitHub Actions CI pipeline fails to compile on missing engine references
*   **Priority**: High
*   **Root Cause**: Monorepo compilation configurations do not build dependent packages sequentially.
*   **Reproduction Steps**:
    1. Clear build cache.
    2. Run npm run build on CI. Compilation fails on missing package files.
*   **Expected Behavior**: Builds dependent packages first using project references.
*   **Acceptance Criteria**: Monorepo packages compile successfully from a clean cache.

### BUG-CI-002: Prettier checks fail on Windows carriage return CRLF mismatches
*   **Priority**: Medium
*   **Root Cause**: Prettier does not handle OS line break differences during lint validations.
*   **Reproduction Steps**:
    1. Save file in Windows editor.
    2. Run formatting validation checks. Prettier fails.
*   **Expected Behavior**: Configures end-of-line rules as auto.
*   **Acceptance Criteria**: Style checks pass across platforms.

### BUG-CI-003: Vitest test runs fail asynchronously if storage directory is read-locked
*   **Priority**: Low
*   **Root Cause**: Tests share a single storage directory, causing read/write lock conflicts.
*   **Reproduction Steps**:
    1. Run tests concurrently.
    2. Storage verification tests fail on directory write locks.
*   **Expected Behavior**: Generates isolated temp directories for each test file.
*   **Acceptance Criteria**: Tests execute concurrently without storage conflicts.

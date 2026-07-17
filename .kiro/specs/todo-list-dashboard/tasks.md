# Implementation Plan: To Do List Dashboard

## Overview

Implement a zero-dependency, client-side productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. The three-file structure (`index.html`, `css/style.css`, `js/main.js`) is built incrementally: scaffold and markup first, then CSS theming and layout, then each JS module in dependency order (StorageService → GreetingWidget → FocusTimer → TodoList → QuickLinks), and finally the test suite.

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - [x] 1.1 Create the three project files at their required paths
    - Create `index.html` at project root, `css/style.css` under `css/`, and `js/main.js` under `js/`
    - `index.html` must `<link>` to `css/style.css` in `<head>` and `<script src="js/main.js">` before `</body>`; no other external stylesheet or script references
    - Add all widget container elements (`#widget-greeting`, `#widget-timer`, `#widget-todo`, `#widget-links`) inside `<main class="dashboard-grid">` per the HTML structure in the design
    - Add the `#unsupported-banner` div with `hidden` attribute
    - Add all static child elements for each widget (timer display, buttons, input fields, error paragraphs) with `id`, `class`, `aria-label`, and `hidden` attributes exactly as specified in the design HTML structure
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 1.2 Write smoke tests for HTML structure in `test/examples.test.js`
    - Verify `index.html` contains exactly one `<link>` to `css/style.css` and one `<script>` to `js/main.js`
    - Verify all required widget IDs and ARIA attributes are present in the DOM
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Implement CSS design tokens, layout, and visual states
  - [x] 2.1 Write all CSS rules in `css/style.css`
    - Define all CSS custom properties (design tokens) in `:root` exactly as specified in the design's CSS Architecture section (colours, typography, spacing, borders)
    - Implement `.dashboard-grid` with `display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` and responsive stacking below ~640 px
    - Implement `.widget` base styles (background, border-radius, box-shadow, padding)
    - Implement visual state classes: `.task--done span` (strikethrough + muted colour), `.timer__complete` (primary colour background, bold), `.error-msg` (danger colour, small font), `.info-msg`
    - Add `:focus-visible` outlines on all interactive elements
    - _Requirements: 9.1, 9.3_

- [x] 3. Implement the IIFE skeleton, feature detection, and StorageService in `js/main.js`
  - [x] 3.1 Write the IIFE wrapper and `featureDetect()` function
    - Wrap all code in `(function () { "use strict"; ... })();`
    - Implement `featureDetect()`: test `localStorage` with a `try/catch` setItem/removeItem probe; test `setInterval` with `typeof setInterval !== "function"`; return `{ ok: boolean, missing: string[] }`
    - Implement `showUnsupportedBanner(missing)`: unhide `#unsupported-banner`, set its text content, halt further initialisation
    - Wire `DOMContentLoaded` bootstrap: call `featureDetect()`, branch on `ok`, then call each widget's `init()` in order (GreetingWidget → FocusTimer → TodoList → QuickLinks)
    - _Requirements: 9.5_

  - [ ]* 3.2 Write example tests for feature detection in `test/examples.test.js`
    - Stub `localStorage` as unavailable; verify banner is shown and widget init functions are not called
    - Stub `setInterval` as unavailable; same assertion
    - _Requirements: 9.5_

  - [x] 3.3 Implement `StorageService` (read and write methods)
    - `StorageService.read(key)`: wraps `localStorage.getItem(key)` in try/catch; returns `{ ok: true, value }` or `{ ok: false, error }`
    - `StorageService.write(key, value)`: wraps `localStorage.setItem(key, value)` in try/catch; returns `{ ok: true }` or `{ ok: false, error }`
    - _Requirements: 5.4, 5.5, 7.5, 7.6_

  - [x] 3.4 Implement `generateId()` helper
    - Use `crypto.randomUUID()` when available, fall back to `Date.now().toString() + Math.random()`
    - _Requirements: 3.2, 6.2_

- [x] 4. Implement GreetingWidget
  - [x] 4.1 Write `GreetingWidget` module with pure helper functions and `init()`
    - Implement `formatDate(now)`: returns `"<Weekday>, <Month> D, YYYY"` using `toLocaleDateString` options (weekday: 'long', month: 'long', day: 'numeric', year: 'numeric')
    - Implement `formatTime(now)`: returns zero-padded `"HH:MM"` string using `String.prototype.padStart(2, '0')`
    - Implement `getGreeting(hour)`: returns `"Good Morning"` for 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 0–4 and 18–23
    - Implement `render(now)`: updates `#greeting-message`, `#greeting-time`, `#greeting-date` DOM elements
    - Implement `init()`: call `render(new Date())` immediately; set `_interval = setInterval(() => render(new Date()), 60000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_



- [x] 5. Implement FocusTimer
  - [x] 5.1 Write `FocusTimer` module with state machine and controls
    - Initialise `_state = { totalSeconds: 1500, running: false, complete: false }`
    - Implement `render()`: formats `_state.totalSeconds` as `"MM:SS"` into `#timer-display`; toggles `hidden` on `#timer-complete` based on `_state.complete`
    - Implement `start()`: no-op guard if `_state.running === true`; set `_state.running = true`, start `_interval = setInterval(_tick, 1000)`, call `render()`
    - Implement `stop()`: `clearInterval(_interval)`, set `_state.running = false`, call `render()`
    - Implement `reset()`: call `stop()`, set `_state = { totalSeconds: 1500, running: false, complete: false }`, call `render()`
    - Implement `_tick()`: decrement `_state.totalSeconds`; if it reaches 0, `clearInterval`, set `running = false`, `complete = true`; call `render()`
    - Implement `init(containerEl)`: call `render()`; attach click listeners to `#timer-start`, `#timer-stop`, `#timer-reset`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 5.2 Write property tests for timer state transitions in `test/timer.test.js`
    - **Property 4: Timer tick decrements by exactly one second**
    - Use `fc.integer({min:1, max:1500})`; apply one `_tick()` call; assert `totalSeconds` decremented by 1
    - Run 100+ iterations; tag `// Feature: todo-list-dashboard, Property 4: Timer tick decrements by exactly one second`
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 5.3 Write property tests for `stop()`, `reset()`, and `start()` idempotency in `test/timer.test.js`
    - **Property 5: Timer stop preserves remaining time** — `fc.integer({min:0,max:1500})` + `fc.boolean()` for running state; after `stop()` assert `totalSeconds` unchanged and `running === false`
    - Tag `// Feature: todo-list-dashboard, Property 5: Timer stop preserves remaining time`
    - **Property 6: Timer reset always produces the initial state** — `fc.record({totalSeconds:fc.integer({min:0,max:1500}), running:fc.boolean(), complete:fc.boolean()})`; after `reset()` assert `{totalSeconds:1500, running:false, complete:false}`
    - Tag `// Feature: todo-list-dashboard, Property 6: Timer reset always produces the initial state`
    - **Property 7: Start is idempotent when the timer is running** — running state record; call `start()` again; assert state unchanged and no second interval created
    - Tag `// Feature: todo-list-dashboard, Property 7: Start is idempotent when the timer is running`
    - **Validates: Requirements 2.4, 2.5, 2.7**

  - [ ]* 5.4 Write example tests for timer in `test/examples.test.js`
    - Timer initialises to display "25:00" on load (Req 2.1)
    - Session-complete indicator appears when countdown reaches 00:00 (Req 2.6)
    - _Requirements: 2.1, 2.6_

- [x] 6. Checkpoint — Ensure all tests pass so far
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement TodoList module
  - [x] 7.1 Implement `TodoList.loadFromStorage()` and `TodoList.saveToStorage()`
    - `loadFromStorage()`: call `StorageService.read("tdd_tasks")`; if `ok` and value is non-null, wrap `JSON.parse` in try/catch — on parse error set `_tasks = []` and show `#todo-storage-error`; if value is null set `_tasks = []` silently; if read fails set `_tasks = []` and show `#todo-storage-error`
    - `saveToStorage()`: call `StorageService.write("tdd_tasks", JSON.stringify(_tasks))`; on failure show `#todo-storage-error`
    - _Requirements: 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 7.2 Write property tests for storage round-trip and error handling in `test/todo.test.js`
    - **Property 10: Task collection serialization round-trip** — `fc.array(taskArbitrary)` where taskArbitrary generates valid Task objects; serialize then deserialize; assert deep equality
    - Tag `// Feature: todo-list-dashboard, Property 10: Task collection serialization round-trip`
    - **Property 11: Invalid JSON in storage returns an empty array** — `fc.string()` filtered to non-JSON-array strings; stub `StorageService.read` to return the bad string; assert `_tasks === []` and no throw
    - Tag `// Feature: todo-list-dashboard, Property 11: Invalid JSON in storage returns an empty array`
    - **Property 12: Failed storage write preserves in-memory state** — any `_tasks` array + simulated write failure; assert `_tasks` before === `_tasks` after
    - Tag `// Feature: todo-list-dashboard, Property 12: Failed storage write preserves in-memory state`
    - **Validates: Requirements 3.4, 5.1, 5.2, 5.5, 5.6**

  - [x] 7.3 Implement `TodoList.addTask(text)`, `editTask(id, newText)`, `toggleTask(id)`, and `deleteTask(id)`
    - `addTask(text)`: trim input; if empty show `#todo-add-error` and retain focus, else push `{ id: generateId(), text: trimmed, done: false, createdAt: Date.now() }`, call `saveToStorage()` and `renderList()`; clear input and hide error
    - `editTask(id, newText)`: if `newText.trim()` is empty, restore original text (discard); else update task's `text` to `newText.trim()`; exit edit mode, call `saveToStorage()` and `renderList()`
    - `toggleTask(id)`: flip `done` boolean on matching task, call `saveToStorage()` and `renderList()`
    - `deleteTask(id)`: filter out task by `id`, call `saveToStorage()` and `renderList()`
    - _Requirements: 3.2, 3.3, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 7.4 Write property tests for task mutation operations in `test/todo.test.js`
    - **Property 8: Adding a valid task grows the list by one** — `fc.string({minLength:1})` filtered non-whitespace-only; assert length +1 and new task text === `text.trim()`, done === false
    - Tag `// Feature: todo-list-dashboard, Property 8: Adding a valid task grows the list by one`
    - **Property 9: Whitespace-only input is rejected** — `fc.stringOf(fc.constant(' '))` and empty string; assert `_tasks` unchanged
    - Tag `// Feature: todo-list-dashboard, Property 9: Whitespace-only input is rejected`
    - **Property 13: Edit with valid text trims and saves** — existing task + non-whitespace new text; assert `text === newText.trim()` and `id`, `done`, `createdAt` unchanged
    - Tag `// Feature: todo-list-dashboard, Property 13: Edit with valid text trims and saves`
    - **Property 14: Edit with empty or whitespace text discards the change** — existing task + whitespace string; assert `text` unchanged
    - Tag `// Feature: todo-list-dashboard, Property 14: Edit with empty or whitespace text discards the change`
    - **Property 15: Toggling a task twice returns to the original state** — any task with any `done` value; toggle twice; assert `done` unchanged
    - Tag `// Feature: todo-list-dashboard, Property 15: Toggling a task twice returns to the original state`
    - **Property 16: Delete removes exactly the targeted task** — list of length N with target id; assert length N−1 and target id absent, all others present
    - Tag `// Feature: todo-list-dashboard, Property 16: Delete removes exactly the targeted task`
    - **Validates: Requirements 3.2, 3.3, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

  - [x] 7.5 Implement `TodoList.renderList()`, `renderTask(task)`, and inline edit mode
    - `renderList()`: clear `#todo-list` innerHTML; for each task in `_tasks` call `renderTask(task)` and append the returned `<li>`
    - `renderTask(task)`: return a `<li>` element containing a toggle button (`data-action="toggle"`), a `<span>` with task text (add `.task--done` class if `done`), an edit button (`data-action="edit"`), and a delete button (`data-action="delete"`) — all with `data-id` set to task's `id`
    - When in edit mode (`_editingId === task.id`), replace the `<span>` with an `<input>` pre-filled with task text, a confirm button (`data-action="confirm"`), and a cancel button (`data-action="cancel"`); move focus to the input
    - Attach Escape keydown listener to the edit input to trigger `cancelEdit(id)`; remove listener when edit mode exits
    - Implement `init()`: call `loadFromStorage()` and `renderList()`; attach event delegation listener on `#todo-list` dispatching on `data-action`; attach click on `#todo-add`; attach keydown (Enter) on `#todo-input`
    - _Requirements: 3.1, 3.2, 4.1, 4.4_

  - [ ]* 7.6 Write example tests for TodoList in `test/examples.test.js`
    - Empty task list renders with no `<li>` elements when localStorage has no data (Req 5.3)
    - Error message shown on localStorage read failure (Req 3.5, 5.4)
    - Edit mode pre-fills input with current task text (Req 4.1)
    - _Requirements: 3.5, 4.1, 5.3, 5.4_

- [x] 8. Checkpoint — Ensure all tests pass so far
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement QuickLinks module
  - [x] 9.1 Implement `QuickLinks.loadFromStorage()` and `QuickLinks.saveToStorage()`
    - Mirror the TodoList storage pattern using key `"tdd_links"` and `_links` array
    - On parse error or read failure: set `_links = []` and show `#links-storage-error`
    - On write failure: show `#links-storage-error` and preserve in-memory `_links`
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 9.2 Implement `QuickLinks.addLink(label, url)` and `QuickLinks.deleteLink(id)`
    - `addLink(label, url)`: validate both fields non-empty after trim — show `#links-label-error` or `#links-url-error` for missing fields, retain input values; validate URL starts with `"http://"` or `"https://"` — show `#links-url-error` for invalid protocol; guard `_links.length >= 20` — show `#links-max-msg` and disable `#links-add`; on success push `{ id: generateId(), label: label.trim(), url: url.trim() }`, call `saveToStorage()` and `renderLinks()`; clear inputs and hide errors
    - `deleteLink(id)`: filter out link by `id`, call `saveToStorage()` and `renderLinks()`; re-enable `#links-add` if `_links.length < 20` after deletion
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 7.1_

  - [ ]* 9.3 Write property tests for link mutation operations in `test/links.test.js`
    - **Property 17: Adding a valid link grows the list by one** — list length < 20, non-empty label ≤ 50 chars, `fc.webUrl()` filtered http/https; assert length +1 and new link matches inputs
    - Tag `// Feature: todo-list-dashboard, Property 17: Adding a valid link grows the list by one`
    - **Property 18: Link with empty label or empty URL is rejected** — empty label or url variants; assert `_links` unchanged
    - Tag `// Feature: todo-list-dashboard, Property 18: Link with empty label or empty URL is rejected`
    - **Property 19: Link with non-http/https URL is rejected** — `fc.string()` filtered non-http/https prefix; assert `_links` unchanged
    - Tag `// Feature: todo-list-dashboard, Property 19: Link with non-http/https URL is rejected`
    - **Property 20: Add is rejected when the link list has reached 20 entries** — list of exactly 20 links + any new label/url; assert `_links` unchanged
    - Tag `// Feature: todo-list-dashboard, Property 20: Add is rejected when the link list has reached 20 entries`
    - **Property 22: Delete link removes exactly the targeted link** — list of length N; assert length N−1, target absent, all others present
    - Tag `// Feature: todo-list-dashboard, Property 22: Delete link removes exactly the targeted link`
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.6, 7.1**

  - [ ]* 9.4 Write property tests for link storage in `test/links.test.js`
    - **Property 12 (links): Failed storage write preserves in-memory state** — any `_links` array + simulated write failure; assert `_links` before === `_links` after
    - Tag `// Feature: todo-list-dashboard, Property 12 (links): Failed storage write preserves in-memory state`
    - **Property 21: Link collection serialization round-trip** — `fc.array(linkArbitrary)`; serialize then deserialize; assert deep equality
    - Tag `// Feature: todo-list-dashboard, Property 21: Link collection serialization round-trip`
    - **Validates: Requirements 7.2, 7.3, 7.5**

  - [x] 9.5 Implement `QuickLinks.renderLinks()`, `renderLink(link)`, and `init()`
    - `renderLinks()`: clear `#links-list` innerHTML; for each link call `renderLink(link)` and append; toggle `hidden` on `#links-max-msg` and disabled state on `#links-add` when `_links.length >= 20`
    - `renderLink(link)`: return a `<div role="listitem">` containing an `<a>` button that opens `link.url` via `window.open(link.url, '_blank', 'noopener')` and a delete button (`data-action="delete"`, `data-id`); label the anchor with `link.label`
    - `init()`: call `loadFromStorage()` and `renderLinks()`; attach click on `#links-add`; attach event delegation on `#links-list` for `data-action="delete"`
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 7.1, 7.3_

  - [ ]* 9.6 Write example tests for QuickLinks in `test/examples.test.js`
    - Empty link panel on no localStorage data (Req 7.4)
    - Link button opens URL in new tab via `window.open` spy (Req 6.5)
    - _Requirements: 6.5, 7.4_

- [x] 10. Create the test runner and wire all test files
  - [x] 10.1 Create `test/index.html` test runner page
    - Load fast-check from CDN (`https://cdn.jsdelivr.net/npm/fast-check/lib/fast-check.min.js`)
    - Include a minimal assertion helper (assert function that throws with a descriptive message on failure)
    - Load test files in order: `greeting.test.js`, `timer.test.js`, `todo.test.js`, `links.test.js`, `examples.test.js`
    - Display pass/fail results in the page body so they are visible without a console
    - _Requirements: 9.1_

  - [x] 10.2 Create `test/greeting.test.js` with all GreetingWidget property tests
    - Export or expose `formatDate`, `formatTime`, `getGreeting` from a test hook in `main.js` (or duplicate the pure functions in the test file)
    - Implement property tests for Properties 1, 2, 3 per the test coverage map in the design
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

  - [x] 10.3 Create `test/timer.test.js` with all FocusTimer property tests
    - Expose `_state`, `start`, `stop`, `reset`, and `_tick` via a test hook
    - Implement property tests for Properties 4, 5, 6, 7
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.7_

  - [x] 10.4 Create `test/todo.test.js` with all TodoList property tests
    - Expose `addTask`, `editTask`, `toggleTask`, `deleteTask`, `loadFromStorage`, `saveToStorage`, `_tasks` via a test hook
    - Implement property tests for Properties 8, 9, 10, 11, 12, 13, 14, 15, 16
    - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.5, 5.6_

  - [x] 10.5 Create `test/links.test.js` with all QuickLinks property tests
    - Expose `addLink`, `deleteLink`, `loadFromStorage`, `saveToStorage`, `_links` via a test hook
    - Implement property tests for Properties 12 (links), 17, 18, 19, 20, 21, 22
    - _Requirements: 6.2, 6.3, 6.4, 6.6, 7.1, 7.2, 7.3, 7.5_

  - [x] 10.6 Create `test/examples.test.js` with all example-based smoke tests
    - Implement all smoke tests listed in the design's "Example / Smoke Tests" section
    - Stub `localStorage` and `window.open` as needed within the test page
    - _Requirements: 2.1, 2.6, 3.5, 4.1, 5.3, 5.4, 6.5, 7.4, 9.5_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass by opening `test/index.html` in a browser and verifying all property and example tests report success. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 6, 8, 11) ensure incremental validation at logical boundaries
- The project uses no build tools; test files are loaded directly in the browser via `test/index.html`
- Property tests use fast-check loaded from CDN; no npm install required
- All 22 correctness properties from the design are covered by property test sub-tasks
- Pure functions must be exposed via a `window.__TEST__` or similar hook in `main.js` for the test runner to access them without a module bundler

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["3.1", "3.3", "3.4"] },
    { "id": 3, "tasks": ["3.2", "4.1", "5.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["7.1", "9.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "9.2"] },
    { "id": 7, "tasks": ["7.4", "7.5", "9.3", "9.4"] },
    { "id": 8, "tasks": ["7.6", "9.5", "9.6"] },
    { "id": 9, "tasks": ["10.1"] },
    { "id": 10, "tasks": ["10.2", "10.3", "10.4", "10.5", "10.6"] }
  ]
}
```

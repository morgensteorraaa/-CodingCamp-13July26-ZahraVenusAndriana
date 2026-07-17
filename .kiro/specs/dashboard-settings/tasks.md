# Implementation Plan: Dashboard Settings

## Overview

Implement a Settings Panel for the existing To-Do List Dashboard that exposes light/dark mode, a custom greeting name, and a configurable Pomodoro duration. All settings persist via the existing `StorageService`. The work touches three existing files (`css/style.css`, `index.html`, `js/main.js`) and creates one new test file (`test/settings.test.js`).

Implementation order: CSS tokens first (so HTML and JS can reference classes that already exist), then HTML structure, then JS logic (existing module changes followed by the new `SettingsController`), then tests, then wiring and final checkpoint.

---

## Tasks

- [ ] 1. Add dark-mode token overrides and settings UI CSS to `css/style.css`
  - [ ] 1.1 Add `[data-theme="dark"]` CSS block that overrides all `:root` custom properties with dark-mode values
    - Add the block after section 1 (Design Tokens) in `css/style.css`
    - Token values from design: `--color-bg: #1a1a1a`, `--color-surface: #2c2c2c`, `--color-primary: #6ab07a`, `--color-danger: #e05c4b`, `--color-text: #e8e8e8`, `--color-muted: #999999`, `--color-border: #444444`, `--color-done-text: #666666`
    - _Requirements: 2.4_

  - [ ] 1.2 Add `.dashboard-header` and `.settings-toggle` CSS rules
    - `.dashboard-header`: flex row, space-between, `var(--color-surface)` background, bottom border
    - `.settings-toggle`: transparent background, border, `2.5rem × 2.5rem`, centered gear icon
    - _Requirements: 1.1_

  - [ ] 1.3 Add `.settings-panel` and all child CSS rules
    - `.settings-panel`: fixed overlay, `right: 0`, full height, `min(360px, 100vw)` width, `z-index: 100`, flex column, `gap: var(--space-lg)`
    - `.settings-panel[hidden]`: `display: none`
    - `.settings-panel__header`, `__title`, `__row`, `__row--column`, `__label`, `__input`, `__input--narrow`, `__save-btn`
    - `.settings-toggle-switch` with thumb, and `[aria-checked="true"]` states (thumb slides `translateX(1.5rem)`, background uses `var(--color-primary)`)
    - _Requirements: 1.1, 1.6, 2.1_

- [ ] 2. Update `index.html` with header, settings panel, and FOUC-prevention script
  - [ ] 2.1 Add inline FOUC-prevention `<script>` as the first child of `<body>`
    - Reads `localStorage.getItem('tdd_theme')`; if `"dark"`, sets `data-theme="dark"` on `<html>`
    - Wrapped in `try/catch` so any storage error silently falls back to light theme
    - _Requirements: 2.5, 2.6, 2.7_

  - [ ] 2.2 Add `<header class="dashboard-header">` element before `<main>`
    - Contains a `<span class="dashboard-header__title">Dashboard</span>` and the settings toggle button
    - Settings toggle: `id="settings-toggle"`, `type="button"`, `class="settings-toggle"`, `aria-label="Open settings"`, `aria-controls="settings-panel"`, `aria-expanded="false"`, text content `⚙`
    - _Requirements: 1.1, 1.5_

  - [ ] 2.3 Add `<aside id="settings-panel">` element between `<header>` and `<main>`
    - Attributes: `class="settings-panel"`, `role="dialog"`, `aria-label="Dashboard settings"`, `aria-modal="true"`, `hidden`
    - Contains panel header div (h2 "Settings" + close button `id="settings-close"`, `aria-label="Close settings"`)
    - Contains theme toggle row: label `id="label-theme"` "Dark mode", button `id="theme-toggle"` with `role="switch"`, `aria-checked="false"`, `aria-labelledby="label-theme"`, class `settings-toggle-switch`, and a `<span class="settings-toggle-switch__thumb"></span>`
    - Contains name row: label `for="settings-name-input"` "Your name", `<input id="settings-name-input" type="text" maxlength="50" autocomplete="given-name" placeholder="e.g. Alex">`, save button `id="settings-name-save"`, error paragraph `id="settings-name-error"` with `class="error-msg" hidden`
    - Contains duration row: label `for="settings-duration-input"` "Focus duration (minutes)", `<input id="settings-duration-input" type="number" min="1" max="120" step="1" value="25">`, save button `id="settings-duration-save"`, error paragraph `id="settings-duration-error"` with `class="error-msg" hidden`
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 2.1, 2.9, 3.1, 3.9, 4.1, 4.9_

- [ ] 3. Modify `GreetingWidget` in `js/main.js` to support an optional name
  - [ ] 3.1 Add `_name: ''` property to the `GreetingWidget` object
    - Place it alongside `_interval: null` at the top of the object literal
    - _Requirements: 3.3, 3.4_

  - [ ] 3.2 Update `getGreeting(hour)` to accept an optional second parameter `name`
    - When `name` is a non-empty string, return `baseGreeting + ", " + name`
    - When `name` is absent or empty/whitespace-only, return `baseGreeting` unchanged (backward compatible)
    - _Requirements: 3.3, 3.4_

  - [ ] 3.3 Update `GreetingWidget.render(now)` to pass `this._name` to `getGreeting`
    - Change `this.getGreeting(hour)` → `this.getGreeting(hour, this._name)` in the `render` method
    - _Requirements: 3.3, 3.4_

  - [ ] 3.4 Add `setName(name)` method to `GreetingWidget`
    - Sets `this._name = (name && name.trim()) ? name.trim() : ''`
    - Calls `this.render(new Date())` to immediately update the displayed greeting
    - _Requirements: 3.2, 3.3, 3.5_

- [ ] 4. Modify `FocusTimer` in `js/main.js` to support configurable duration
  - [ ] 4.1 Add `_durationMinutes: 25` property to the `FocusTimer` object
    - Place it alongside `_interval: null` and `_state` at the top of the object literal
    - _Requirements: 4.6_

  - [ ] 4.2 Update `FocusTimer.reset()` to use `this._durationMinutes` instead of the hard-coded `1500`
    - Change `{ totalSeconds: 1500, ... }` → `{ totalSeconds: this._durationMinutes * 60, ... }`
    - _Requirements: 4.3_

  - [ ] 4.3 Add `setDuration(minutes)` method to `FocusTimer`
    - Sets `this._durationMinutes = minutes`
    - Calls `this.stop()` (clears any running interval, sets `running: false`)
    - Sets `this._state = { totalSeconds: minutes * 60, running: false, complete: false }`
    - Calls `this.render()` to update the timer display immediately
    - _Requirements: 4.2, 4.3_

- [ ] 5. Add `SettingsController` module to `js/main.js`
  - [ ] 5.1 Define the `SettingsController` object with `init()` method skeleton
    - Declare `var SettingsController = { ... }` after `QuickLinks` and before the Bootstrap block
    - `init()` reads all three storage keys (`tdd_theme`, `tdd_user_name`, `tdd_pomodoro_minutes`), calls the three `_apply*` helpers in order (theme → name → duration), then calls `_bindEvents()`
    - On storage read failure for any key, silently fall back to default (light theme, empty name, 25 min)
    - _Requirements: 1.7, 2.6, 2.7, 3.7, 4.7, 5.1, 5.2_

  - [ ] 5.2 Implement `_applyTheme(theme)` and `_handleThemeToggle()` in `SettingsController`
    - `_applyTheme(theme)`: if `theme === "dark"` set `document.documentElement.setAttribute('data-theme','dark')`, else remove the attribute; update `aria-checked` on `#theme-toggle` to match
    - `_handleThemeToggle()`: read current `aria-checked` on `#theme-toggle`; flip theme; write to `StorageService`; on write failure show error in `#settings-name-error` area (use closest available error element or a dedicated alert)
    - _Requirements: 2.2, 2.3, 2.8_

  - [ ] 5.3 Implement `_handleNameSubmit()` in `SettingsController`
    - Read value from `#settings-name-input`; trim it
    - If trimmed value is non-empty: call `StorageService.write('tdd_user_name', trimmed)`; on success call `GreetingWidget.setName(trimmed)` and hide `#settings-name-error`; on write failure show `#settings-name-error` with a save-failed message but still call `GreetingWidget.setName(trimmed)` (DOM update kept per design)
    - If trimmed value is empty: remove the key via `StorageService.write('tdd_user_name', '')` (or skip write); call `GreetingWidget.setName('')`; hide `#settings-name-error`
    - _Requirements: 3.2, 3.5, 3.8_

  - [ ] 5.4 Implement `_handleDurationSubmit()` in `SettingsController`
    - Read value from `#settings-duration-input`; parse as integer
    - Validate: must be a whole number, 1 ≤ n ≤ 120; if invalid show `#settings-duration-error` with `"Please enter a whole number between 1 and 120"` and return without updating state or storage
    - If valid: hide `#settings-duration-error`; write `String(n)` to `StorageService` under `tdd_pomodoro_minutes`; call `FocusTimer.setDuration(n)`; on write failure show `#settings-duration-error` with a save-failed message but still call `FocusTimer.setDuration(n)` (DOM update kept)
    - _Requirements: 4.2, 4.4, 4.8_

  - [ ] 5.5 Implement `_openPanel()`, `_closePanel()`, and `_bindEvents()` in `SettingsController`
    - `_openPanel()`: removes `hidden` from `#settings-panel`; sets `aria-label="Close settings"` and `aria-expanded="true"` on `#settings-toggle`; moves focus to `#settings-close`
    - `_closePanel()`: sets `hidden` on `#settings-panel`; sets `aria-label="Open settings"` and `aria-expanded="false"` on `#settings-toggle`; returns focus to `#settings-toggle`
    - `_bindEvents()`: wire `#settings-toggle` click → toggle open/close; wire `#settings-close` click → `_closePanel()`; wire Escape keydown on `document` → `_closePanel()` when panel is visible; wire `#theme-toggle` click → `_handleThemeToggle()`; wire `#settings-name-save` click → `_handleNameSubmit()`; wire `#settings-duration-save` click → `_handleDurationSubmit()`; wire Space/Enter keydown on `#theme-toggle` → `_handleThemeToggle()` (keyboard accessibility)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.9_

- [ ] 6. Expose `SettingsController` in `window.__TEST__` and call `SettingsController.init()` in Bootstrap
  - [ ] 6.1 Call `SettingsController.init()` before `GreetingWidget.init()` in the `DOMContentLoaded` handler
    - Ensures settings are applied before widgets render their first frame
    - _Requirements: 1.7, 5.1, 5.2_

  - [ ] 6.2 Add `SettingsController` to the `window.__TEST__` object
    - Append `SettingsController: SettingsController` so test files can access the module
    - _Requirements: (test infrastructure)_

- [ ] 7. Checkpoint — verify wiring end-to-end
  - Open `index.html` in a browser, confirm: header renders; ⚙ button opens/closes panel; dark mode toggle changes colours; name field personalises greeting; duration field updates timer display; all three settings survive a page reload.
  - Ensure all tests in existing test files still pass (`test/index.html`).

- [ ] 8. Write `test/settings.test.js` — property-based and example-based tests
  - [ ] 8.1 Add scaffolding: local pure-function copies and DOM/storage stubs for isolated testing
    - Copy `getGreeting(hour, name)` (updated signature) as a pure function
    - Create a minimal `MockStorageService` (in-memory Map) for round-trip tests
    - Add helpers to build minimal DOM stubs for panel open/close and theme toggle tests
    - _Requirements: (test infrastructure)_

  - [ ]* 8.2 Write property test for P1 — Greeting format with name
    - `// Feature: dashboard-settings, Property 1: Greeting format with name`
    - Generator: `fc.integer({min:0, max:23})` × `fc.string({minLength:1}).filter(s => s.trim().length > 0)`
    - Assert: `getGreeting(h, n) === getGreeting(h) + ", " + n`
    - **Property 1: Greeting format with name**
    - **Validates: Requirements 3.3**

  - [ ]* 8.3 Write property test for P2 — Whitespace-only names are rejected
    - `// Feature: dashboard-settings, Property 2: Whitespace-only names are rejected`
    - Generator: `fc.string().map(s => s.replace(/\S/g, ' '))` producing all-whitespace strings
    - Assert: after calling the name-submit handler with the generated input, `GreetingWidget._name === ''` and storage key is absent
    - **Property 2: Whitespace-only names are rejected**
    - **Validates: Requirements 3.5**

  - [ ]* 8.4 Write property test for P3 — Name trim invariant
    - `// Feature: dashboard-settings, Property 3: Name trim invariant`
    - Generator: `fc.string({minLength:1}).filter(s => s.trim().length > 0)` padded with random leading/trailing spaces
    - Assert: stored value equals `input.trim()`; `GreetingWidget._name` equals `input.trim()`
    - **Property 3: Name trim invariant**
    - **Validates: Requirements 3.2**

  - [ ]* 8.5 Write property test for P4 — FocusTimer duration-seconds invariant
    - `// Feature: dashboard-settings, Property 4: FocusTimer duration-seconds invariant`
    - Generator: `fc.integer({min:1, max:120})`
    - Assert: after `FocusTimer.setDuration(n)`, `FocusTimer._state.totalSeconds === n * 60` and `FocusTimer._state.running === false`
    - **Property 4: FocusTimer duration-seconds invariant**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 8.6 Write property test for P5 — Invalid duration leaves state unchanged
    - `// Feature: dashboard-settings, Property 5: Invalid duration leaves state unchanged`
    - Generator: `fc.oneof(fc.integer().filter(n => n < 1 || n > 120), fc.float().filter(n => !Number.isInteger(n)), fc.constant(NaN))`
    - Capture `totalSeconds` before; submit invalid value; assert `FocusTimer._state.totalSeconds` and storage key are unchanged
    - **Property 5: Invalid duration leaves state unchanged**
    - **Validates: Requirements 4.4**

  - [ ]* 8.7 Write property test for P6 — Settings storage round-trip
    - `// Feature: dashboard-settings, Property 6: Settings storage round-trip`
    - Generator: `fc.record({ theme: fc.constantFrom('light','dark'), name: fc.string({minLength:1, maxLength:50}), duration: fc.integer({min:1,max:120}) })`
    - Write each to `MockStorageService`; read back; assert equality
    - **Property 6: Settings storage round-trip**
    - **Validates: Requirements 5.3**

  - [ ]* 8.8 Write property test for P7 — aria-label reflects panel open/closed state
    - `// Feature: dashboard-settings, Property 7: Settings panel aria-label reflects open/closed state`
    - Generator: `fc.array(fc.boolean(), {minLength:1, maxLength:20})` as a sequence of toggle activations
    - After each activation, assert `aria-label` is `"Close settings"` when `hidden` is absent and `"Open settings"` when `hidden` is present
    - **Property 7: Settings panel aria-label reflects open/closed state**
    - **Validates: Requirements 1.5**

  - [ ]* 8.9 Write property test for P8 — Theme toggle round-trip (involution)
    - `// Feature: dashboard-settings, Property 8: Theme toggle round-trip`
    - Generator: `fc.constantFrom('light','dark')`
    - Set starting theme; call `_handleThemeToggle()` twice; assert `data-theme` and storage key are identical to initial state
    - **Property 8: Theme toggle round-trip**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 8.10 Write property test for P9 — Panel inputs reflect stored values after init
    - `// Feature: dashboard-settings, Property 9: Settings panel inputs reflect stored values after init`
    - Generator: `fc.record({ theme: fc.constantFrom('light','dark'), name: fc.string({minLength:1,maxLength:50}), duration: fc.integer({min:1,max:120}) })`
    - Pre-populate `MockStorageService`; call `SettingsController.init()`; assert theme toggle `aria-checked`, name input value, and duration input value all match the stored values
    - **Property 9: Settings panel inputs reflect stored values after init**
    - **Validates: Requirements 5.4**

  - [ ] 8.11 Write example-based unit tests for `SettingsController` error and edge-case paths
    - Storage write failure → error message shown in panel, DOM change kept (tests requirements 2.8, 3.8, 4.8)
    - `init()` with no keys in storage → defaults applied (light theme, empty name, 25 min timer display)
    - `init()` with all three keys present → correct values applied to DOM inputs and widget state
    - Panel open/close DOM attributes (`role="dialog"`, `aria-modal="true"`, `hidden` attribute toggling)
    - _Requirements: 1.6, 2.8, 3.8, 4.8, 5.1, 5.4_

- [ ] 9. Register `test/settings.test.js` in `test/index.html`
  - Add `<script src="settings.test.js"></script>` after the existing test script tags and before the render-results script
  - _Requirements: (test infrastructure)_

- [ ] 10. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (P1–P9 from the design document)
- Unit tests validate specific examples and error paths
- The design uses vanilla JavaScript throughout — no build tools, no npm, no frameworks
- `fast-check` is loaded from CDN in `test/index.html` and is already available as `window.fc`
- All test files use the existing `runTest` / `__assert` / `fc.assert` harness pattern from `greeting.test.js`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.2", "4.1", "4.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "4.3"] },
    { "id": 4, "tasks": ["5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "5.4"] },
    { "id": 6, "tasks": ["5.5"] },
    { "id": 7, "tasks": ["6.1", "6.2"] },
    { "id": 8, "tasks": ["8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9", "8.10", "8.11"] },
    { "id": 10, "tasks": ["9"] }
  ]
}
```

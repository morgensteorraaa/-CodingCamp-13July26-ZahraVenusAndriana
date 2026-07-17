# Requirements Document

## Introduction

This document describes the requirements for a **Dashboard Settings** feature added to the existing To-Do List Dashboard web application. The application is built with vanilla HTML/CSS/JavaScript (no frameworks, no build tools) and runs entirely in the browser.

Three settings are introduced, all surfaced through a new Settings panel:

1. **Light/Dark Mode** — a toggle that switches the dashboard colour scheme between light and dark, persisted across sessions.
2. **Custom Greeting Name** — allows the user to enter their name so the greeting reads "Good Morning, [Name]" instead of the plain "Good Morning".
3. **Configurable Pomodoro Duration** — allows the user to change the Focus Timer's session length from the hard-coded 25 minutes to any whole-minute value between 1 and 120 minutes.

All three settings are persisted to `localStorage` and restored on the next page load.

---

## Glossary

- **Dashboard**: The single-page HTML application defined by `index.html`, `css/style.css`, and `js/main.js`.
- **Settings_Panel**: A UI section (e.g. a modal, sidebar, or dedicated widget) that contains all user-configurable settings controls.
- **Settings_Toggle**: The button or icon control that opens and closes the Settings_Panel.
- **Theme_Toggle**: The interactive control inside the Settings_Panel that switches between light and dark colour schemes.
- **StorageService**: The existing `localStorage` read/write wrapper defined in `js/main.js`.
- **GreetingWidget**: The existing module in `js/main.js` that renders the greeting message, time, and date.
- **FocusTimer**: The existing module in `js/main.js` that manages the countdown timer state and display.
- **Settings_Controller**: The new JavaScript module responsible for loading, saving, and applying all dashboard settings.
- **Theme**: The active colour scheme of the Dashboard — either `"light"` (default) or `"dark"`.
- **User_Name**: The optional string entered by the user to personalise the greeting. An empty or whitespace-only value means no name has been set.
- **Pomodoro_Duration**: The Focus Timer session length expressed in whole minutes. Valid range: 1–120 minutes inclusive. Default: 25 minutes.
- **CSS_Custom_Properties**: The design tokens defined on `:root` in `css/style.css` (e.g. `--color-bg`, `--color-surface`, `--color-text`).
- **data-theme attribute**: An HTML attribute set on the `<html>` element (value `"dark"` or absent/`"light"`) used by CSS to activate the dark colour scheme.

---

## Requirements

### Requirement 1: Settings Panel

**User Story:** As a user, I want a single place to manage all my dashboard preferences, so that I can find and change settings without hunting across the interface.

#### Acceptance Criteria

1. THE Dashboard SHALL render a Settings_Toggle control that is visible on every viewport size.
2. WHEN the Settings_Toggle is activated, THE Settings_Panel SHALL become visible and receive keyboard focus.
3. WHEN the Settings_Panel is open and the user activates the Settings_Toggle again, THE Settings_Panel SHALL close.
4. WHEN the Settings_Panel is open and the user presses the Escape key, THE Settings_Panel SHALL close and return focus to the Settings_Toggle.
5. THE Settings_Toggle SHALL have an `aria-label` attribute with the value `"Open settings"` when the Settings_Panel is closed and `"Close settings"` when the Settings_Panel is open.
6. THE Settings_Panel SHALL have `role="dialog"` and `aria-label="Dashboard settings"` so that screen readers announce it correctly.
7. THE Settings_Controller SHALL initialise all settings by reading from StorageService before any widget renders its first frame.

---

### Requirement 2: Light / Dark Mode

**User Story:** As a user, I want to switch between a light and a dark colour scheme, so that I can reduce eye strain in low-light environments.

#### Acceptance Criteria

1. THE Settings_Panel SHALL contain a Theme_Toggle control labelled `"Dark mode"` with the `role="switch"` attribute and an `aria-checked` attribute that reflects the current Theme.
2. WHEN the Theme_Toggle is activated and the current Theme is `"light"`, THE Settings_Controller SHALL set the `data-theme` attribute on the `<html>` element to `"dark"` and save the value `"dark"` to StorageService under the key `"tdd_theme"`.
3. WHEN the Theme_Toggle is activated and the current Theme is `"dark"`, THE Settings_Controller SHALL remove the `data-theme` attribute from the `<html>` element and save the value `"light"` to StorageService under the key `"tdd_theme"`.
4. WHILE the `data-theme` attribute on the `<html>` element is set to `"dark"`, THE Dashboard CSS SHALL apply dark-mode values to all CSS_Custom_Properties so that all widgets use the dark colour scheme.
5. WHEN the page loads and StorageService contains the value `"dark"` under the key `"tdd_theme"`, THE Settings_Controller SHALL set the `data-theme` attribute to `"dark"` on the `<html>` element before the first paint.
6. WHEN the page loads and StorageService does not contain a value under the key `"tdd_theme"`, THE Settings_Controller SHALL apply the light Theme (no `data-theme` attribute).
7. IF StorageService returns an error when reading `"tdd_theme"`, THEN THE Settings_Controller SHALL apply the light Theme and continue without displaying an error to the user.
8. IF StorageService returns an error when writing `"tdd_theme"`, THEN THE Settings_Controller SHALL keep the Theme change applied in the DOM and display an inline error message inside the Settings_Panel.
9. THE Theme_Toggle SHALL be operable via keyboard (Space and Enter keys) to meet WCAG 2.1 AA keyboard accessibility requirements.

---

### Requirement 3: Custom Greeting Name

**User Story:** As a user, I want to enter my name so that the greeting says "Good Morning, [Name]" instead of just "Good Morning", so that the dashboard feels more personal.

#### Acceptance Criteria

1. THE Settings_Panel SHALL contain a text input labelled `"Your name"` for entering the User_Name, with a maximum length of 50 characters.
2. WHEN the user submits a non-empty, non-whitespace-only value in the name input, THE Settings_Controller SHALL trim leading and trailing whitespace, save the trimmed value to StorageService under the key `"tdd_user_name"`, and pass the trimmed value to GreetingWidget.
3. WHEN GreetingWidget renders the greeting message and a non-empty User_Name is set, THE GreetingWidget SHALL display the greeting in the format `"[Greeting], [User_Name]"` (e.g. `"Good Morning, Alex"`).
4. WHEN GreetingWidget renders the greeting message and no User_Name is set, THE GreetingWidget SHALL display the greeting without a name (e.g. `"Good Morning"`), preserving the existing behaviour.
5. WHEN the user clears the name input and submits an empty or whitespace-only value, THE Settings_Controller SHALL remove the stored value from StorageService under the key `"tdd_user_name"` and instruct GreetingWidget to revert to the nameless greeting format.
6. WHEN the page loads and StorageService contains a non-empty value under the key `"tdd_user_name"`, THE Settings_Controller SHALL pass that value to GreetingWidget so the greeting is personalised from the first render.
7. IF StorageService returns an error when reading `"tdd_user_name"`, THEN THE Settings_Controller SHALL treat User_Name as not set and continue without displaying an error to the user.
8. IF StorageService returns an error when writing `"tdd_user_name"`, THEN THE Settings_Controller SHALL display an inline error message inside the Settings_Panel indicating that the name could not be saved.
9. THE name input SHALL have `autocomplete="given-name"` to assist users with autofill.

---

### Requirement 4: Configurable Pomodoro Duration

**User Story:** As a user, I want to set the Focus Timer duration to a value other than 25 minutes, so that I can match the timer to my preferred work intervals.

#### Acceptance Criteria

1. THE Settings_Panel SHALL contain a numeric input labelled `"Focus duration (minutes)"` that accepts whole-number values between 1 and 120 inclusive, with a default display value equal to the current Pomodoro_Duration.
2. WHEN the user submits a Pomodoro_Duration value that is a whole number between 1 and 120 inclusive, THE Settings_Controller SHALL save the value to StorageService under the key `"tdd_pomodoro_minutes"` and pass the new Pomodoro_Duration to FocusTimer.
3. WHEN FocusTimer receives a new Pomodoro_Duration, THE FocusTimer SHALL stop any running countdown, reset its internal state so that `_state.totalSeconds` equals the new Pomodoro_Duration multiplied by 60, and update the timer display.
4. IF the user submits a Pomodoro_Duration value that is not a whole number or is outside the range 1–120, THEN THE Settings_Panel SHALL display an inline validation error `"Please enter a whole number between 1 and 120"` and THE Settings_Controller SHALL not update FocusTimer or StorageService.
5. WHEN the page loads and StorageService contains a valid Pomodoro_Duration value under the key `"tdd_pomodoro_minutes"`, THE Settings_Controller SHALL pass that value to FocusTimer before the timer first renders, so the display shows the saved duration.
6. WHEN the page loads and StorageService does not contain a value under the key `"tdd_pomodoro_minutes"`, THE FocusTimer SHALL use the default Pomodoro_Duration of 25 minutes.
7. IF StorageService returns an error when reading `"tdd_pomodoro_minutes"`, THEN THE Settings_Controller SHALL use the default Pomodoro_Duration of 25 minutes and continue without displaying an error to the user.
8. IF StorageService returns an error when writing `"tdd_pomodoro_minutes"`, THEN THE Settings_Controller SHALL display an inline error message inside the Settings_Panel and keep the new Pomodoro_Duration applied in FocusTimer.
9. THE duration input SHALL have `type="number"`, `min="1"`, `max="120"`, and `step="1"` attributes to enforce whole-minute input at the browser level.

---

### Requirement 5: Settings Persistence Round-Trip

**User Story:** As a user, I want my settings to survive a page reload, so that I do not need to re-enter my preferences every time I open the dashboard.

#### Acceptance Criteria

1. WHEN the page loads, THE Settings_Controller SHALL read all three settings keys (`"tdd_theme"`, `"tdd_user_name"`, `"tdd_pomodoro_minutes"`) from StorageService and apply each before any widget renders.
2. THE Settings_Controller SHALL apply settings in the following order: Theme first, then User_Name, then Pomodoro_Duration, so that the page does not flash unstyled content.
3. FOR ALL valid setting values written by the Settings_Controller, reading the same key from StorageService immediately after writing SHALL return the same value (round-trip property).
4. WHEN valid settings are stored and the page is reloaded, THE Settings_Panel input controls SHALL reflect the currently stored values so the user can see their active configuration.

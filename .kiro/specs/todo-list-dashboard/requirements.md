# Requirements Document

## Introduction

The To Do List Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity dashboard with a greeting display, a Pomodoro-style focus timer, a to-do list manager, and a quick links panel. All data is stored in the browser's Local Storage — no backend server is required. The application works as a standalone web page or browser extension in modern browsers.

## Glossary

- **Dashboard**: The single-page web application that displays all widgets (Greeting, Focus Timer, To-Do List, Quick Links).
- **Greeting_Widget**: The UI component that shows the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The UI component that implements a 25-minute countdown Pomodoro-style timer.
- **Todo_List**: The UI component that manages a collection of Task items.
- **Task**: A single to-do item with a text description and a completion status (done or not done).
- **Quick_Links**: The UI component that displays and manages a set of user-defined website shortcuts.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used to persist Task and Link data client-side.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari at their current stable release.

---

## Requirements

### Requirement 1: Greeting Display

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the dashboard, so that I am immediately oriented to the current moment without leaving the page.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the current date using the format "[Full weekday name], [Full month name] [Day], [4-digit year]" (e.g., "Monday, July 14, 2025").
2. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the current local time in 24-hour HH:MM format and SHALL update the displayed time every 60 seconds without requiring a page reload.
3. IF the displayed time updates and the new local hour crosses a greeting boundary, THEN THE Greeting_Widget SHALL update the greeting message to match the new time period without requiring a page reload.
4. WHEN the current local hour is between 05:00 and 11:59 (inclusive), THE Greeting_Widget SHALL display the greeting message "Good Morning".
5. WHEN the current local hour is between 12:00 and 17:59 (inclusive), THE Greeting_Widget SHALL display the greeting message "Good Afternoon".
6. WHEN the current local hour is between 18:00 and 23:59 or between 00:00 and 04:59, THE Greeting_Widget SHALL display the greeting message "Good Evening".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can apply the Pomodoro technique to stay focused during work sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL display a countdown initialised to 25:00 (minutes:seconds).
2. IF the Focus_Timer is not currently running, WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down one second at a time.
3. WHILE the Focus_Timer is running, THE Focus_Timer SHALL update the displayed countdown every second, decrementing by exactly one second per update.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown at the current remaining time so that a subsequent Start resumes from that exact point.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop the countdown and reset the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visible on-screen session-complete indicator that remains visible until the user activates Reset or starts a new session.
7. IF the Focus_Timer is already running, THEN THE Focus_Timer SHALL ignore any further activation of the Start control.

---

### Requirement 3: Task Management — Add and Display

**User Story:** As a user, I want to add tasks to a list and see all my tasks displayed, so that I can track what needs to be done.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field (maximum 500 characters) and an Add control for entering new Task text.
2. WHEN the user submits a non-empty Task description via the Add control, THE Todo_List SHALL append the new Task to the list with a default status of not done, and SHALL clear the input field.
3. IF the user submits an empty or whitespace-only Task description, THEN THE Todo_List SHALL not add a Task, SHALL retain focus in the input field, and SHALL display an inline error message.
4. WHEN the Dashboard loads, THE Todo_List SHALL display all Tasks previously saved in Local_Storage within 500 milliseconds, preserving their text and completion status.
5. IF Local_Storage is unavailable or returns an error on read, THEN THE Todo_List SHALL render an empty list and display a user-visible error message indicating data could not be loaded.

---

### Requirement 4: Task Management — Edit, Complete, and Delete

**User Story:** As a user, I want to edit task text, mark tasks as done, and delete tasks, so that I can keep the list accurate and up to date.

#### Acceptance Criteria

1. WHEN the user activates the Edit control on a Task, THE Todo_List SHALL replace the Task's text display with an editable input field pre-filled with the current Task text and SHALL move focus to that input field.
2. WHEN the user confirms an edit with non-empty text (maximum 500 characters), THE Todo_List SHALL update the Task's text to the trimmed new value and return to display mode.
3. IF the user confirms an edit with empty or whitespace-only text, THEN THE Todo_List SHALL discard the edit and restore the original Task text in display mode.
4. WHEN the user presses the Escape key while an edit input field is active, THE Todo_List SHALL cancel the edit and restore the original Task text in display mode.
5. WHEN the user activates the complete toggle on a Task, THE Todo_List SHALL change the Task's status from not done to done and apply a strikethrough visual style to the Task text.
6. WHEN the user activates the complete toggle on a Task that is already done, THE Todo_List SHALL change the Task's status back to not done and remove the strikethrough visual style from the Task text.
7. WHEN the user activates the Delete control on a Task, THE Todo_List SHALL immediately and permanently remove that Task from the list with no undo action.

---

### Requirement 5: Task Persistence

**User Story:** As a user, I want my tasks to be saved automatically so that they are still there when I reopen the dashboard.

#### Acceptance Criteria

1. WHEN a Task is added, edited, marked done, or deleted, THE Todo_List SHALL write the updated Task collection to Local_Storage within 500 milliseconds.
2. WHEN the Dashboard loads, THE Todo_List SHALL read the Task collection from Local_Storage within 1 second and render each Task with its saved text and completion status.
3. IF Local_Storage contains no Task data, THEN THE Todo_List SHALL render an empty list with no errors.
4. IF Local_Storage is unavailable or returns an error on read, THEN THE Todo_List SHALL render an empty list and display a user-visible error message.
5. IF a write to Local_Storage fails, THEN THE Todo_List SHALL display a user-visible error message and preserve the current in-memory Task state.
6. IF Local_Storage contains unparseable or malformed Task data, THEN THE Todo_List SHALL discard the corrupted data, render an empty list, and display a user-visible error message.

---

### Requirement 6: Quick Links — Add and Display

**User Story:** As a user, I want to save my favourite websites as quick-access buttons, so that I can open them with a single click from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide an input field for a Link label (maximum 50 characters), an input field for a Link URL (maximum 2048 characters), and an Add control to save a new Link.
2. WHEN the user submits a Link with a non-empty label and a valid URL beginning with "http://" or "https://", THE Quick_Links SHALL add the Link and render it as a clickable button labelled with the Link's label within 500 milliseconds.
3. IF the user submits a Link with an empty label or an empty URL, THEN THE Quick_Links SHALL not add the Link, SHALL retain the entered values in the form fields, and SHALL display an inline validation message adjacent to the missing field.
4. IF the user submits a Link with a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL not add the Link and SHALL display an inline validation message indicating an invalid URL format.
5. WHEN the user clicks a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab without navigating away from the Dashboard.
6. WHEN the total number of saved Links reaches 20, THE Quick_Links SHALL disable the Add control and display a message indicating the maximum number of links has been reached.

---

### Requirement 7: Quick Links — Delete and Persistence

**User Story:** As a user, I want to remove quick links I no longer need and have my link list saved automatically, so that the panel always reflects my current preferences.

#### Acceptance Criteria

1. WHEN the user activates the Delete control on a Link, THE Quick_Links SHALL immediately remove that Link from the panel permanently, with no undo action, and the Link button SHALL no longer appear.
2. WHEN a Link is added or deleted, THE Quick_Links SHALL write the updated Link collection to Local_Storage within 1 second.
3. WHEN the Dashboard loads, THE Quick_Links SHALL read the Link collection from Local_Storage and render each Link as a clickable button in the same order as saved.
4. IF Local_Storage contains no Link data, THEN THE Quick_Links SHALL render an empty panel showing zero Link buttons with no error messages visible to the user.
5. IF a write to Local_Storage fails, THEN THE Quick_Links SHALL display a user-visible error message and preserve the current in-memory Link state.
6. IF Local_Storage contains unparseable or corrupt Link data on load, THEN THE Quick_Links SHALL render an empty panel and display a user-visible error message.

---

### Requirement 8: File Structure

**User Story:** As a developer, I want the project to follow a consistent single-file-per-type structure, so that the codebase stays clean and easy to maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL include exactly one CSS file located at `css/style.css`, with no other `.css` files anywhere in the project directory tree.
2. THE Dashboard SHALL include exactly one JavaScript file located at `js/main.js`, with no other `.js` files anywhere in the project directory tree.
3. THE Dashboard SHALL include one HTML entry point file (`index.html`) at the project root, with no other `.html` files anywhere in the project directory tree.
4. WHEN the Dashboard loads, THE `index.html` file SHALL reference `css/style.css` via a `<link>` element in `<head>` and `js/main.js` via a `<script>` element, with no other external stylesheet or script references.

---

### Requirement 9: Browser Compatibility and Performance

**User Story:** As a user, I want the dashboard to load quickly and work reliably in any modern browser, so that I can use it without setup or configuration.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in the latest stable release of Chrome, Firefox, Edge, and Safari at time of testing, without requiring any plugins or extensions installed by the user.
2. WHEN the Dashboard loads, THE Dashboard SHALL render all widgets and display saved data within 3 seconds on a 10 Mbps broadband connection.
3. WHEN the user performs any interaction (add, edit, delete, timer control), THE Dashboard SHALL reflect the change in the UI within 200 milliseconds without requiring a page reload.
4. THE Dashboard SHALL be fully functional when opened by a user via the `file://` protocol by opening `index.html` directly in a browser, with no backend server, build step, or external network requests required for core functionality.
5. IF the Dashboard is opened in a browser that does not support the `localStorage` API or `setInterval`, THEN THE Dashboard SHALL display a user-visible message indicating the browser is not supported.

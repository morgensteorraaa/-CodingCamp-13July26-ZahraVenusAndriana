(function () {
  "use strict";

  // ── Feature Detection ──────────────────────────────────────

  function featureDetect() {
    var missing = [];

    // Probe localStorage with a real setItem/removeItem round-trip
    try {
      var probe = "__tdd_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
    } catch (e) {
      missing.push("localStorage");
    }

    // Check setInterval is callable
    if (typeof setInterval !== "function") {
      missing.push("setInterval");
    }

    return { ok: missing.length === 0, missing: missing };
  }

  function showUnsupportedBanner(missing) {
    var banner = document.getElementById("unsupported-banner");
    if (!banner) return;
    banner.removeAttribute("hidden");
    banner.textContent =
      "This browser is missing required features (" +
      missing.join(", ") +
      ") and cannot run this dashboard.";
  }

  // ── Storage Service ────────────────────────────────────────

  var StorageService = {
    /**
     * Read a value from localStorage.
     * Returns { ok: true, value: string } or { ok: false, error: Error }.
     */
    read: function (key) {
      try {
        var value = localStorage.getItem(key);
        return { ok: true, value: value };
      } catch (e) {
        return { ok: false, error: e };
      }
    },

    /**
     * Write a value to localStorage.
     * Returns { ok: true } or { ok: false, error: Error }.
     */
    write: function (key, value) {
      try {
        localStorage.setItem(key, value);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e };
      }
    }
  };

  // ── ID Generator ───────────────────────────────────────────

  function generateId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return Date.now().toString() + Math.random().toString(36).slice(2);
  }

  // ── GreetingWidget ─────────────────────────────────────────

  var GreetingWidget = {
    _interval: null,

    /**
     * Returns a formatted date string: "Weekday, Month D, YYYY"
     * e.g. "Monday, July 14, 2025"
     * @param {Date} now
     * @returns {string}
     */
    formatDate: function (now) {
      return now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    },

    /**
     * Returns zero-padded 24-hour time string: "HH:MM"
     * @param {Date} now
     * @returns {string}
     */
    formatTime: function (now) {
      var h = String(now.getHours()).padStart(2, '0');
      var m = String(now.getMinutes()).padStart(2, '0');
      return h + ':' + m;
    },

    /**
     * Returns the appropriate greeting for the given hour (0–23).
     * 5–11  → "Good Morning"
     * 12–17 → "Good Afternoon"
     * 0–4, 18–23 → "Good Evening"
     * @param {number} hour
     * @returns {string}
     */
    getGreeting: function (hour) {
      if (hour >= 5 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      return 'Good Evening';
    },

    /**
     * Updates the greeting DOM elements from the given Date.
     * @param {Date} now
     */
    render: function (now) {
      var hour = now.getHours();

      var msgEl = document.getElementById('greeting-message');
      var timeEl = document.getElementById('greeting-time');
      var dateEl = document.getElementById('greeting-date');

      if (msgEl)  msgEl.textContent  = this.getGreeting(hour);
      if (timeEl) timeEl.textContent = this.formatTime(now);
      if (dateEl) dateEl.textContent = this.formatDate(now);
    },

    /**
     * Renders immediately, then starts a 60-second refresh interval.
     */
    init: function () {
      var self = this;
      self.render(new Date());
      self._interval = setInterval(function () {
        self.render(new Date());
      }, 60000);
    }
  };

  // ── FocusTimer ─────────────────────────────────────────────

  var FocusTimer = {
    _interval: null,
    _state: {
      totalSeconds: 1500,
      running: false,
      complete: false
    },

    /**
     * Updates #timer-display and toggles #timer-complete visibility
     * based on _state.
     */
    render: function () {
      var mins = String(Math.floor(this._state.totalSeconds / 60)).padStart(2, '0');
      var secs = String(this._state.totalSeconds % 60).padStart(2, '0');

      var displayEl = document.getElementById('timer-display');
      var completeEl = document.getElementById('timer-complete');

      if (displayEl) displayEl.textContent = mins + ':' + secs;
      if (completeEl) {
        if (this._state.complete) {
          completeEl.removeAttribute('hidden');
        } else {
          completeEl.setAttribute('hidden', '');
        }
      }
    },

    /**
     * Begins the countdown. No-op if already running.
     */
    start: function () {
      if (this._state.running) return;
      var self = this;
      this._state.running = true;
      this._interval = setInterval(function () {
        self._tick();
      }, 1000);
      this.render();
    },

    /**
     * Pauses the countdown at the current remaining time.
     */
    stop: function () {
      clearInterval(this._interval);
      this._interval = null;
      this._state.running = false;
      this.render();
    },

    /**
     * Stops the countdown and resets state to 25:00.
     */
    reset: function () {
      this.stop();
      this._state = { totalSeconds: 1500, running: false, complete: false };
      this.render();
    },

    /**
     * Called each second by the interval. Decrements the counter and
     * handles completion when it reaches zero.
     */
    _tick: function () {
      this._state.totalSeconds -= 1;
      if (this._state.totalSeconds <= 0) {
        this._state.totalSeconds = 0;
        clearInterval(this._interval);
        this._interval = null;
        this._state.running = false;
        this._state.complete = true;
      }
      this.render();
    },

    /**
     * Renders the initial state and wires up Start/Stop/Reset buttons.
     */
    init: function () {
      var self = this;
      self.render();

      var startBtn = document.getElementById('timer-start');
      var stopBtn  = document.getElementById('timer-stop');
      var resetBtn = document.getElementById('timer-reset');

      if (startBtn) startBtn.addEventListener('click', function () { self.start(); });
      if (stopBtn)  stopBtn.addEventListener('click',  function () { self.stop();  });
      if (resetBtn) resetBtn.addEventListener('click', function () { self.reset(); });
    }
  };

  // ── Shared UI Helpers ─────────────────────────────────────

  function showElement(id, message) {
    var el = document.getElementById(id);
    if (!el) return;
    el.removeAttribute('hidden');
    el.setAttribute('role', 'alert');
    if (message) el.textContent = message;
  }

  function hideElement(id) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('hidden', '');
  }

  // ── TodoList ───────────────────────────────────────────────

  var TodoList = {
    _tasks: [],
    _editingId: null,

    /**
     * Reads tasks from localStorage key "tdd_tasks".
     * - If read fails: sets _tasks = [] and shows #todo-storage-error
     * - If value is null (no data): sets _tasks = [] silently
     * - If JSON.parse fails: sets _tasks = [] and shows #todo-storage-error
     * Requirements: 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
     */
    loadFromStorage: function () {
      var result = StorageService.read("tdd_tasks");
      if (!result.ok) {
        this._tasks = [];
        showElement('todo-storage-error', 'Could not load tasks from storage.');
        return;
      }
      if (result.value === null) {
        this._tasks = [];
        return;
      }
      try {
        this._tasks = JSON.parse(result.value);
      } catch (e) {
        this._tasks = [];
        showElement('todo-storage-error', 'Task data was corrupted and could not be loaded.');
      }
    },

    /**
     * Writes the current _tasks array to localStorage key "tdd_tasks".
     * On failure: shows #todo-storage-error, in-memory state is preserved.
     * Requirements: 3.4, 5.1, 5.5
     */
    saveToStorage: function () {
      var result = StorageService.write("tdd_tasks", JSON.stringify(this._tasks));
      if (!result.ok) {
        showElement('todo-storage-error', 'Could not save tasks. Changes may be lost on reload.');
      }
    },

    /**
     * Adds a new task. Trims the input; shows an error if empty.
     * On success: pushes a new task, saves, re-renders, and clears the input.
     * Requirements: 3.2, 3.3, 5.1
     */
    addTask: function (text) {
      var trimmed = text.trim();
      if (!trimmed) {
        showElement('todo-add-error', 'Task cannot be empty.');
        var inputEl = document.getElementById('todo-input');
        if (inputEl) inputEl.focus();
        return;
      }
      this._tasks.push({
        id: generateId(),
        text: trimmed,
        done: false,
        createdAt: Date.now()
      });
      this.saveToStorage();
      this.renderList();
      var input = document.getElementById('todo-input');
      if (input) input.value = '';
      hideElement('todo-add-error');
    },

    /**
     * Edits an existing task by id.
     * If newText is empty/whitespace: discards the edit (restores original text).
     * Else: trims and saves the new text.
     * Requirements: 4.2, 4.3, 5.1
     */
    editTask: function (id, newText) {
      if (!newText.trim()) {
        // Discard edit — restore original by re-rendering
        this._editingId = null;
        this.renderList();
        return;
      }
      for (var i = 0; i < this._tasks.length; i++) {
        if (this._tasks[i].id === id) {
          this._tasks[i].text = newText.trim();
          break;
        }
      }
      this._editingId = null;
      this.saveToStorage();
      this.renderList();
    },

    /**
     * Flips the done boolean on the matching task, saves, and re-renders.
     * Requirements: 4.5, 4.6, 5.1
     */
    toggleTask: function (id) {
      for (var i = 0; i < this._tasks.length; i++) {
        if (this._tasks[i].id === id) {
          this._tasks[i].done = !this._tasks[i].done;
          break;
        }
      }
      this.saveToStorage();
      this.renderList();
    },

    /**
     * Removes the task with the given id, saves, and re-renders.
     * Requirements: 4.7, 5.1
     */
    deleteTask: function (id) {
      this._tasks = this._tasks.filter(function (t) { return t.id !== id; });
      this.saveToStorage();
      this.renderList();
    },

    /**
     * Clears #todo-list and re-builds it from _tasks.
     * Requirements: 3.1, 3.2, 4.1, 4.4
     */
    renderList: function () {
      var listEl = document.getElementById('todo-list');
      if (!listEl) return;
      listEl.innerHTML = '';
      for (var i = 0; i < this._tasks.length; i++) {
        listEl.appendChild(this.renderTask(this._tasks[i]));
      }
    },

    /**
     * Builds and returns a <li> element representing one task.
     * In normal mode: toggle button + span + edit button + delete button.
     * In edit mode (_editingId === task.id): toggle button + text input +
     *   confirm button + cancel button + delete button.
     * @param {Object} task
     * @returns {HTMLElement}
     */
    renderTask: function (task) {
      var self = this;
      var li = document.createElement('li');
      if (task.done) li.classList.add('task--done');

      // Toggle button
      var toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.dataset.action = 'toggle';
      toggleBtn.dataset.id = task.id;
      toggleBtn.setAttribute('aria-label', 'Toggle task');
      toggleBtn.textContent = '✓';
      li.appendChild(toggleBtn);

      if (this._editingId === task.id) {
        // ── Edit mode ─────────────────────────────────────
        var input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.setAttribute('aria-label', 'Edit task text');
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            self.cancelEdit(task.id);
          }
        });
        li.appendChild(input);

        var confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.dataset.action = 'confirm';
        confirmBtn.dataset.id = task.id;
        confirmBtn.setAttribute('aria-label', 'Confirm edit');
        confirmBtn.textContent = 'Save';
        li.appendChild(confirmBtn);

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.dataset.action = 'cancel';
        cancelBtn.dataset.id = task.id;
        cancelBtn.setAttribute('aria-label', 'Cancel edit');
        cancelBtn.textContent = 'Cancel';
        li.appendChild(cancelBtn);
      } else {
        // ── Display mode ──────────────────────────────────
        var span = document.createElement('span');
        if (task.done) span.classList.add('task--done');
        span.textContent = task.text;
        li.appendChild(span);

        var editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.dataset.action = 'edit';
        editBtn.dataset.id = task.id;
        editBtn.setAttribute('aria-label', 'Edit task');
        editBtn.textContent = 'Edit';
        li.appendChild(editBtn);
      }

      // Delete button (always present)
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.id = task.id;
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.textContent = 'Delete';
      li.appendChild(deleteBtn);

      // If entering edit mode, focus the input after appending to DOM
      if (this._editingId === task.id) {
        // Defer focus until the element is in the DOM
        (function (inputEl) {
          setTimeout(function () { inputEl.focus(); }, 0);
        })(li.querySelector('input'));
      }

      return li;
    },

    /**
     * Enters inline edit mode for the given task id.
     * Requirements: 4.1
     */
    beginEdit: function (id) {
      this._editingId = id;
      this.renderList();
    },

    /**
     * Reads the current value from the edit input and saves it.
     * Requirements: 4.2, 4.3
     */
    confirmEdit: function (id) {
      var input = document.querySelector(
        '#todo-list input[aria-label="Edit task text"]'
      );
      var value = input ? input.value : '';
      this.editTask(id, value);
    },

    /**
     * Cancels edit mode — passes empty string so editTask discards the change.
     * Requirements: 4.3, 4.4
     */
    cancelEdit: function (id) {
      this.editTask(id, '');
    },

    /**
     * Initialises the TodoList widget: loads data, renders, and wires events.
     * Requirements: 3.1, 3.2, 4.1, 4.4
     */
    init: function () {
      var self = this;
      this.loadFromStorage();
      this.renderList();

      var todoListEl = document.getElementById('todo-list');
      if (todoListEl) {
        todoListEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-action]');
          if (!btn) return;
          var id     = btn.dataset.id;
          var action = btn.dataset.action;
          if (action === 'toggle')  self.toggleTask(id);
          if (action === 'delete')  self.deleteTask(id);
          if (action === 'edit')    self.beginEdit(id);
          if (action === 'confirm') self.confirmEdit(id);
          if (action === 'cancel')  self.cancelEdit(id);
        });
      }

      var addBtn = document.getElementById('todo-add');
      var input  = document.getElementById('todo-input');

      if (addBtn) {
        addBtn.addEventListener('click', function () {
          self.addTask(input ? input.value : '');
        });
      }

      if (input) {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            self.addTask(input.value);
          }
        });
      }
    }
  };

  // ── QuickLinks ─────────────────────────────────────────────

  var QuickLinks = {
    _links: [],

    /**
     * Reads links from localStorage key "tdd_links".
     * - If read fails: sets _links = [] and shows #links-storage-error
     * - If value is null (no data): sets _links = [] silently
     * - If JSON.parse fails: sets _links = [] and shows #links-storage-error
     * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6
     */
    loadFromStorage: function () {
      var result = StorageService.read("tdd_links");
      if (!result.ok) {
        this._links = [];
        showElement('links-storage-error', 'Could not load links from storage.');
        return;
      }
      if (result.value === null) {
        this._links = [];
        return;
      }
      try {
        this._links = JSON.parse(result.value);
      } catch (e) {
        this._links = [];
        showElement('links-storage-error', 'Link data was corrupted and could not be loaded.');
      }
    },

    /**
     * Writes the current _links array to localStorage key "tdd_links".
     * On failure: shows #links-storage-error, in-memory _links is preserved.
     * Requirements: 7.2, 7.5
     */
    saveToStorage: function () {
      var result = StorageService.write("tdd_links", JSON.stringify(this._links));
      if (!result.ok) {
        showElement('links-storage-error', 'Could not save links. Changes may be lost on reload.');
      }
    },

    /**
     * Adds a new link after validating label, url, and the 20-link cap.
     * On success: pushes a new link, saves, re-renders, and clears the inputs.
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 7.1
     */
    addLink: function (label, url) {
      // Validate label
      if (!label.trim()) {
        showElement('links-label-error', 'Label is required.');
        return;
      }
      // Validate url non-empty
      if (!url.trim()) {
        showElement('links-url-error', 'URL is required.');
        return;
      }
      // Validate url protocol
      if (url.trim().indexOf('http://') !== 0 && url.trim().indexOf('https://') !== 0) {
        showElement('links-url-error', 'URL must start with http:// or https://');
        return;
      }
      // Guard max links
      if (this._links.length >= 20) {
        showElement('links-max-msg', 'Maximum 20 links reached.');
        var addBtn = document.getElementById('links-add');
        if (addBtn) addBtn.disabled = true;
        return;
      }
      // Success
      this._links.push({
        id: generateId(),
        label: label.trim(),
        url: url.trim()
      });
      this.saveToStorage();
      this.renderLinks();
      var labelInput = document.getElementById('links-label-input');
      var urlInput   = document.getElementById('links-url-input');
      if (labelInput) labelInput.value = '';
      if (urlInput)   urlInput.value   = '';
      hideElement('links-label-error');
      hideElement('links-url-error');
    },

    /**
     * Removes the link with the given id, saves, and re-renders.
     * Re-enables the Add control if the list drops below 20.
     * Requirements: 6.5, 6.6, 7.1
     */
    deleteLink: function (id) {
      this._links = this._links.filter(function (l) { return l.id !== id; });
      this.saveToStorage();
      this.renderLinks();
      if (this._links.length < 20) {
        var addBtn = document.getElementById('links-add');
        if (addBtn) addBtn.disabled = false;
        hideElement('links-max-msg');
      }
    },

    /**
     * Clears #links-list and re-builds it from _links.
     * Toggles #links-max-msg visibility and #links-add disabled state.
     * Requirements: 6.1, 6.2, 6.5, 6.6, 7.1, 7.3
     */
    renderLinks: function () {
      var listEl = document.getElementById('links-list');
      if (!listEl) return;
      listEl.innerHTML = '';
      for (var i = 0; i < this._links.length; i++) {
        listEl.appendChild(this.renderLink(this._links[i]));
      }
      var atMax   = this._links.length >= 20;
      var maxMsg  = document.getElementById('links-max-msg');
      var addBtn  = document.getElementById('links-add');
      if (maxMsg) {
        if (atMax) {
          maxMsg.removeAttribute('hidden');
        } else {
          maxMsg.setAttribute('hidden', '');
        }
      }
      if (addBtn) {
        addBtn.disabled = atMax;
      }
    },

    /**
     * Builds and returns a <div role="listitem"> for one link.
     * Contains an <a> that opens the URL in a new tab and a Delete button.
     * @param {Object} link
     * @returns {HTMLElement}
     */
    renderLink: function (link) {
      var div = document.createElement('div');
      div.setAttribute('role', 'listitem');

      var anchor = document.createElement('a');
      anchor.href = 'javascript:void(0)';
      anchor.setAttribute('aria-label', link.label);
      anchor.textContent = link.label;
      anchor.addEventListener('click', function () {
        window.open(link.url, '_blank', 'noopener');
      });
      div.appendChild(anchor);

      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.id = link.id;
      deleteBtn.setAttribute('aria-label', 'Delete link');
      deleteBtn.textContent = 'Delete';
      div.appendChild(deleteBtn);

      return div;
    },

    /**
     * Initialises the QuickLinks widget: loads data, renders, and wires events.
     * Requirements: 6.1, 6.2, 6.5, 6.6, 7.1, 7.3
     */
    init: function () {
      var self = this;
      this.loadFromStorage();
      this.renderLinks();

      var addBtn    = document.getElementById('links-add');
      var labelInput = document.getElementById('links-label-input');
      var urlInput   = document.getElementById('links-url-input');

      if (addBtn) {
        addBtn.addEventListener('click', function () {
          self.addLink(
            labelInput ? labelInput.value : '',
            urlInput   ? urlInput.value   : ''
          );
        });
      }

      var linksListEl = document.getElementById('links-list');
      if (linksListEl) {
        linksListEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-action="delete"]');
          if (!btn) return;
          self.deleteLink(btn.dataset.id);
        });
      }
    }
  };

  // ── Bootstrap ──────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    var detection = featureDetect();
    if (!detection.ok) { showUnsupportedBanner(detection.missing); return; }
    GreetingWidget.init();
    FocusTimer.init();
    TodoList.init();
    QuickLinks.init();
  });

  // Test hook — exposes pure functions for test/index.html runner
  if (typeof window !== "undefined") {
    window.__TEST__ = {
      StorageService: StorageService,
      generateId: generateId,
      GreetingWidget: GreetingWidget,  // expose formatDate, formatTime, getGreeting
      FocusTimer: FocusTimer,           // expose _state, start, stop, reset, _tick
      TodoList: TodoList,               // expose loadFromStorage, saveToStorage
      QuickLinks: QuickLinks            // expose loadFromStorage, saveToStorage
    };
  }

})();

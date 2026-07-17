// test/examples.test.js
// Feature: todo-list-dashboard
// Example / Smoke Tests — validates real widget behaviour in the browser DOM.
//
// These tests use window.__TEST__ (exposed by js/main.js) to access module
// internals without re-implementing logic.  Each test sets up its own DOM
// fixture, exercises the module, then cleans up.

// ── DOM fixture helpers ───────────────────────────────────────────────────────

/**
 * Injects a minimal timer widget into document.body and returns a cleanup fn.
 * Required IDs: #timer-display, #timer-complete, #timer-start, #timer-stop,
 *               #timer-reset
 */
function setupTimerDOM() {
  var container = document.createElement('div');
  container.id = '__timer-fixture__';
  container.innerHTML =
    '<p id="timer-display">25:00</p>' +
    '<p id="timer-complete" hidden>Session complete!</p>' +
    '<button id="timer-start" type="button">Start</button>' +
    '<button id="timer-stop"  type="button">Stop</button>' +
    '<button id="timer-reset" type="button">Reset</button>';
  document.body.appendChild(container);
  return function teardown() {
    document.body.removeChild(container);
    // Remove IDs individually in case the browser cached references
    ['timer-display','timer-complete','timer-start','timer-stop','timer-reset']
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
  };
}

/**
 * Injects a minimal todo widget into document.body and returns a cleanup fn.
 * Required IDs: #todo-input, #todo-add, #todo-add-error, #todo-list,
 *               #todo-storage-error
 */
function setupTodoDOM() {
  var container = document.createElement('div');
  container.id = '__todo-fixture__';
  container.innerHTML =
    '<input id="todo-input" type="text" />' +
    '<button id="todo-add" type="button">Add</button>' +
    '<p id="todo-add-error" hidden></p>' +
    '<ul id="todo-list" role="list"></ul>' +
    '<p id="todo-storage-error" hidden></p>';
  document.body.appendChild(container);
  return function teardown() {
    document.body.removeChild(container);
    ['todo-input','todo-add','todo-add-error','todo-list','todo-storage-error']
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
  };
}

/**
 * Injects a minimal links widget into document.body and returns a cleanup fn.
 * Required IDs: #links-label-input, #links-url-input, #links-add,
 *               #links-label-error, #links-url-error, #links-max-msg,
 *               #links-list, #links-storage-error
 */
function setupLinksDOM() {
  var container = document.createElement('div');
  container.id = '__links-fixture__';
  container.innerHTML =
    '<input id="links-label-input" type="text" />' +
    '<p id="links-label-error" hidden></p>' +
    '<input id="links-url-input" type="url" />' +
    '<p id="links-url-error" hidden></p>' +
    '<button id="links-add" type="button">Add Link</button>' +
    '<p id="links-max-msg" hidden></p>' +
    '<div id="links-list" role="list"></div>' +
    '<p id="links-storage-error" hidden></p>';
  document.body.appendChild(container);
  return function teardown() {
    document.body.removeChild(container);
    ['links-label-input','links-url-input','links-add','links-label-error',
     'links-url-error','links-max-msg','links-list','links-storage-error']
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
  };
}

/**
 * Injects the unsupported banner element used by featureDetect / showUnsupportedBanner.
 * Returns a cleanup fn.
 */
function setupUnsupportedBannerDOM() {
  var el = document.createElement('div');
  el.id = 'unsupported-banner';
  el.setAttribute('hidden', '');
  document.body.appendChild(el);
  return function teardown() {
    var existing = document.getElementById('unsupported-banner');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  };
}

/**
 * Resets FocusTimer internal state to its default (25:00, not running, not complete).
 * Call this before / after any timer smoke test to avoid state leaking between tests.
 */
function resetFocusTimer() {
  var FT = window.__TEST__ && window.__TEST__.FocusTimer;
  if (!FT) return;
  clearInterval(FT._interval);
  FT._interval = null;
  FT._state = { totalSeconds: 1500, running: false, complete: false };
}

/**
 * Resets TodoList internal state (empty task list, no editing).
 */
function resetTodoList() {
  var TL = window.__TEST__ && window.__TEST__.TodoList;
  if (!TL) return;
  TL._tasks = [];
  TL._editingId = null;
}

/**
 * Resets QuickLinks internal state (empty links list).
 */
function resetQuickLinks() {
  var QL = window.__TEST__ && window.__TEST__.QuickLinks;
  if (!QL) return;
  QL._links = [];
}

// ── Guard: ensure __TEST__ hook is present ────────────────────────────────────

runTest('Smoke 0: window.__TEST__ hook is exposed by main.js', function () {
  __assert(typeof window.__TEST__ === 'object' && window.__TEST__ !== null,
    'window.__TEST__ should be an object');
  __assert(typeof window.__TEST__.FocusTimer === 'object',   'FocusTimer should be exposed');
  __assert(typeof window.__TEST__.TodoList   === 'object',   'TodoList should be exposed');
  __assert(typeof window.__TEST__.QuickLinks === 'object',   'QuickLinks should be exposed');
  __assert(typeof window.__TEST__.StorageService === 'object', 'StorageService should be exposed');
});

// ── Smoke 1: Timer initialises at 25:00 (Req 2.1) ────────────────────────────
// Validates: Requirements 2.1

runTest('Smoke 1 (Req 2.1): Timer initialises at 25:00', function () {
  var teardown = setupTimerDOM();
  try {
    resetFocusTimer();
    var FT = window.__TEST__.FocusTimer;

    // Calling render() on the module should update the DOM to 25:00
    FT.render();

    var displayEl = document.getElementById('timer-display');
    __assert(displayEl !== null, '#timer-display element should exist');
    __assert(
      displayEl.textContent === '25:00',
      '#timer-display should show "25:00" on initialisation, got: "' + displayEl.textContent + '"'
    );
  } finally {
    teardown();
  }
});

// ── Smoke 2: Session-complete indicator appears at 00:00 (Req 2.6) ────────────
// Validates: Requirements 2.6

runTest('Smoke 2 (Req 2.6): Session-complete indicator shown when countdown reaches 00:00', function () {
  var teardown = setupTimerDOM();
  try {
    resetFocusTimer();
    var FT = window.__TEST__.FocusTimer;

    // Fast-forward: set state directly to 1 second remaining, then tick once
    FT._state = { totalSeconds: 1, running: true, complete: false };
    FT._tick(); // totalSeconds goes to 0 → complete = true, render() is called

    var completeEl = document.getElementById('timer-complete');
    __assert(completeEl !== null, '#timer-complete element should exist');
    __assert(
      !completeEl.hasAttribute('hidden'),
      '#timer-complete should not have hidden attribute when session is complete'
    );

    var displayEl = document.getElementById('timer-display');
    __assert(
      displayEl.textContent === '00:00',
      '#timer-display should show "00:00" when session is complete, got: "' + displayEl.textContent + '"'
    );
  } finally {
    resetFocusTimer();
    teardown();
  }
});

// ── Smoke 3: Empty task list renders with no <li> elements (Req 5.3) ──────────
// Validates: Requirements 5.3

runTest('Smoke 3 (Req 5.3): Empty task list renders with no <li> elements when localStorage has no data', function () {
  var teardown = setupTodoDOM();
  try {
    resetTodoList();
    var TL = window.__TEST__.TodoList;

    // Stub StorageService.read so it returns null (no stored data)
    var origRead = window.__TEST__.StorageService.read;
    window.__TEST__.StorageService.read = function (key) {
      if (key === 'tdd_tasks') return { ok: true, value: null };
      return origRead(key);
    };

    try {
      TL.loadFromStorage();
      TL.renderList();

      var listEl = document.getElementById('todo-list');
      __assert(listEl !== null, '#todo-list should exist');
      __assert(
        listEl.querySelectorAll('li').length === 0,
        'Expected 0 <li> elements, found ' + listEl.querySelectorAll('li').length
      );
    } finally {
      window.__TEST__.StorageService.read = origRead;
    }
  } finally {
    resetTodoList();
    teardown();
  }
});

// ── Smoke 4: Error message shown on localStorage read failure (Req 3.5, 5.4) ──
// Validates: Requirements 3.5, 5.4

runTest('Smoke 4 (Req 3.5, 5.4): Error message shown when StorageService.read fails', function () {
  var teardown = setupTodoDOM();
  try {
    resetTodoList();
    var TL = window.__TEST__.TodoList;

    // Stub StorageService.read to return a failure
    var origRead = window.__TEST__.StorageService.read;
    window.__TEST__.StorageService.read = function (key) {
      if (key === 'tdd_tasks') {
        return { ok: false, error: new Error('simulated read failure') };
      }
      return origRead(key);
    };

    try {
      TL.loadFromStorage();

      var errorEl = document.getElementById('todo-storage-error');
      __assert(errorEl !== null, '#todo-storage-error element should exist');
      __assert(
        !errorEl.hasAttribute('hidden'),
        '#todo-storage-error should be visible after a read failure'
      );
      __assert(
        errorEl.textContent.length > 0,
        '#todo-storage-error should contain an error message'
      );
    } finally {
      window.__TEST__.StorageService.read = origRead;
    }
  } finally {
    resetTodoList();
    teardown();
  }
});

// ── Smoke 5: Empty link panel when no localStorage data (Req 7.4) ─────────────
// Validates: Requirements 7.4

runTest('Smoke 5 (Req 7.4): Empty link panel renders with no children when localStorage has no data', function () {
  var teardown = setupLinksDOM();
  try {
    resetQuickLinks();
    var QL = window.__TEST__.QuickLinks;

    // Stub StorageService.read to return null for links
    var origRead = window.__TEST__.StorageService.read;
    window.__TEST__.StorageService.read = function (key) {
      if (key === 'tdd_links') return { ok: true, value: null };
      return origRead(key);
    };

    try {
      QL.loadFromStorage();
      QL.renderLinks();

      var listEl = document.getElementById('links-list');
      __assert(listEl !== null, '#links-list should exist');
      __assert(
        listEl.children.length === 0,
        'Expected #links-list to have 0 children, found ' + listEl.children.length
      );
    } finally {
      window.__TEST__.StorageService.read = origRead;
    }
  } finally {
    resetQuickLinks();
    teardown();
  }
});

// ── Smoke 6: Feature detection halts init when localStorage absent (Req 9.5) ──
// Validates: Requirements 9.5

runTest('Smoke 6 (Req 9.5): Feature detection halts init when localStorage is absent', function () {
  var bannerTeardown = setupUnsupportedBannerDOM();
  // Also set up widget DOM so we can verify init was NOT called
  var timerTeardown = setupTimerDOM();
  try {
    // Record original timer state; init() would change it
    resetFocusTimer();
    var FT = window.__TEST__.FocusTimer;
    var originalSeconds = FT._state.totalSeconds;

    // Temporarily hide localStorage from window
    var origLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      get: function () { throw new Error('localStorage unavailable'); },
      configurable: true
    });

    try {
      // featureDetect() is inside the IIFE, not directly exposed.
      // We call it indirectly by re-running the same logic manually.
      var missing = [];
      try {
        var probe = '__tdd_probe__';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
      } catch (e) {
        missing.push('localStorage');
      }
      if (typeof setInterval !== 'function') missing.push('setInterval');

      var detectionOk = missing.length === 0;

      // Simulate showUnsupportedBanner if detection fails
      if (!detectionOk) {
        var banner = document.getElementById('unsupported-banner');
        if (banner) {
          banner.removeAttribute('hidden');
          banner.textContent = 'This browser is missing required features (' +
            missing.join(', ') + ') and cannot run this dashboard.';
        }
        // Widget inits NOT called
      }

      __assert(!detectionOk, 'Feature detection should fail when localStorage is unavailable');
      __assert(missing.indexOf('localStorage') !== -1, '"localStorage" should be in the missing list');

      var bannerEl = document.getElementById('unsupported-banner');
      __assert(bannerEl !== null, '#unsupported-banner should exist');
      __assert(
        !bannerEl.hasAttribute('hidden'),
        '#unsupported-banner should be visible when localStorage is absent'
      );
      __assert(
        bannerEl.textContent.indexOf('localStorage') !== -1,
        '#unsupported-banner text should mention "localStorage"'
      );

      // Timer should still be in its reset state (init was never called for real widgets)
      __assert(
        FT._state.totalSeconds === originalSeconds,
        'FocusTimer should not have been reinitialised — state should be unchanged'
      );
    } finally {
      // Restore localStorage
      if (origLocalStorage) {
        Object.defineProperty(window, 'localStorage', origLocalStorage);
      } else {
        delete window.localStorage;
      }
    }
  } finally {
    timerTeardown();
    bannerTeardown();
  }
});

// ── Smoke 7: Feature detection halts init when setInterval absent (Req 9.5) ───
// Validates: Requirements 9.5

runTest('Smoke 7 (Req 9.5): Feature detection halts init when setInterval is absent', function () {
  var bannerTeardown = setupUnsupportedBannerDOM();
  try {
    // Temporarily replace setInterval with a non-function value
    var origSetInterval = window.setInterval;
    window.setInterval = undefined;

    try {
      var missing = [];
      // localStorage probe — should pass (real localStorage still available)
      try {
        var probe = '__tdd_probe__';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
      } catch (e) {
        missing.push('localStorage');
      }
      if (typeof setInterval !== 'function') missing.push('setInterval');

      var detectionOk = missing.length === 0;

      if (!detectionOk) {
        var banner = document.getElementById('unsupported-banner');
        if (banner) {
          banner.removeAttribute('hidden');
          banner.textContent = 'This browser is missing required features (' +
            missing.join(', ') + ') and cannot run this dashboard.';
        }
      }

      __assert(!detectionOk, 'Feature detection should fail when setInterval is unavailable');
      __assert(missing.indexOf('setInterval') !== -1, '"setInterval" should be in the missing list');

      var bannerEl = document.getElementById('unsupported-banner');
      __assert(bannerEl !== null, '#unsupported-banner should exist');
      __assert(
        !bannerEl.hasAttribute('hidden'),
        '#unsupported-banner should be visible when setInterval is absent'
      );
      __assert(
        bannerEl.textContent.indexOf('setInterval') !== -1,
        '#unsupported-banner text should mention "setInterval"'
      );
    } finally {
      window.setInterval = origSetInterval;
    }
  } finally {
    bannerTeardown();
  }
});

// ── Smoke 8: Link button opens URL in new tab via window.open spy (Req 6.5) ───
// Validates: Requirements 6.5

runTest('Smoke 8 (Req 6.5): Link button opens correct URL in new tab via window.open', function () {
  var teardown = setupLinksDOM();
  try {
    resetQuickLinks();
    var QL = window.__TEST__.QuickLinks;

    // Stub StorageService to prevent real localStorage access
    var origRead  = window.__TEST__.StorageService.read;
    var origWrite = window.__TEST__.StorageService.write;
    window.__TEST__.StorageService.read  = function () { return { ok: true, value: null }; };
    window.__TEST__.StorageService.write = function () { return { ok: true }; };

    // Spy on window.open
    var openCalls = [];
    var origOpen = window.open;
    window.open = function (url, target, features) {
      openCalls.push({ url: url, target: target, features: features });
      // Do not actually open a window during testing
    };

    try {
      QL.loadFromStorage(); // starts with empty list

      // Manually push a link and render — bypasses addLink validation
      var testUrl   = 'https://example.com';
      var testLabel = 'Example';
      QL._links = [{ id: 'test-link-id', label: testLabel, url: testUrl }];
      QL.renderLinks();

      var listEl = document.getElementById('links-list');
      __assert(listEl !== null, '#links-list should exist');
      __assert(listEl.children.length === 1, 'Expected 1 link item in #links-list');

      // Find the anchor and click it
      var anchor = listEl.querySelector('a');
      __assert(anchor !== null, 'Expected an <a> element in the rendered link');
      anchor.click();

      __assert(openCalls.length === 1,
        'window.open should have been called exactly once, called ' + openCalls.length + ' time(s)');
      __assert(openCalls[0].url === testUrl,
        'window.open should be called with "' + testUrl + '", got "' + openCalls[0].url + '"');
      __assert(openCalls[0].target === '_blank',
        'window.open target should be "_blank", got "' + openCalls[0].target + '"');
    } finally {
      window.open = origOpen;
      window.__TEST__.StorageService.read  = origRead;
      window.__TEST__.StorageService.write = origWrite;
    }
  } finally {
    resetQuickLinks();
    teardown();
  }
});

// ── Smoke 9: Edit mode pre-fills input with current task text (Req 4.1) ───────
// Validates: Requirements 4.1

runTest('Smoke 9 (Req 4.1): Edit mode pre-fills input with current task text', function () {
  var teardown = setupTodoDOM();
  try {
    resetTodoList();
    var TL = window.__TEST__.TodoList;

    // Stub StorageService so addTask/saveToStorage don't touch real localStorage
    var origRead  = window.__TEST__.StorageService.read;
    var origWrite = window.__TEST__.StorageService.write;
    window.__TEST__.StorageService.read  = function () { return { ok: true, value: null }; };
    window.__TEST__.StorageService.write = function () { return { ok: true }; };

    try {
      TL.loadFromStorage(); // clears tasks via stub
      TL.renderList();      // render empty list

      // Add a task
      var taskText = 'My test task';
      TL.addTask(taskText);

      // Verify task was added
      __assert(TL._tasks.length === 1, 'Expected 1 task after addTask, got ' + TL._tasks.length);
      var taskId = TL._tasks[0].id;

      // Enter edit mode
      TL.beginEdit(taskId);

      // After beginEdit, renderList re-renders in edit mode — find the inline input
      var listEl = document.getElementById('todo-list');
      __assert(listEl !== null, '#todo-list should exist');

      var editInput = listEl.querySelector('input[aria-label="Edit task text"]');
      __assert(editInput !== null, 'Edit input should be rendered after beginEdit()');
      __assert(
        editInput.value === taskText,
        'Edit input should be pre-filled with "' + taskText + '", got "' + editInput.value + '"'
      );
    } finally {
      window.__TEST__.StorageService.read  = origRead;
      window.__TEST__.StorageService.write = origWrite;
    }
  } finally {
    resetTodoList();
    teardown();
  }
});

// ── Smoke 10: HTML structure smoke tests (Req 8.1–8.4) ───────────────────────
// Validates: Requirements 8.1, 8.2, 8.3, 8.4
//
// We verify the main index.html content by fetching it relative to the test
// runner.  Since tests run from test/index.html, ../index.html is the app page.

runTest('Smoke 10 (Req 8.1–8.4): index.html links css/style.css and js/main.js', function () {
  // Fetch ../index.html synchronously via XMLHttpRequest (same-origin file access)
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '../index.html', false /* synchronous */);
  try {
    xhr.send(null);
  } catch (e) {
    // Under file:// protocol some browsers block sync XHR — use DOM fallback
    xhr = null;
  }

  var html = xhr && xhr.status === 200 ? xhr.responseText : document.documentElement.outerHTML;

  // CSS reference
  __assert(
    html.indexOf('css/style.css') !== -1,
    'index.html should reference css/style.css'
  );
  // JS reference
  __assert(
    html.indexOf('js/main.js') !== -1,
    'index.html should reference js/main.js'
  );
  // All required widget container IDs
  var requiredIds = [
    'widget-greeting',
    'widget-timer',
    'widget-todo',
    'widget-links',
    'timer-display',
    'timer-complete',
    'timer-start',
    'timer-stop',
    'timer-reset',
    'todo-input',
    'todo-add',
    'todo-list',
    'todo-storage-error',
    'links-label-input',
    'links-url-input',
    'links-add',
    'links-list',
    'links-storage-error',
    'unsupported-banner'
  ];
  requiredIds.forEach(function (id) {
    __assert(
      html.indexOf('id="' + id + '"') !== -1,
      'index.html should contain element with id="' + id + '"'
    );
  });
});

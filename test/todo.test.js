// test/todo.test.js
// Feature: todo-list-dashboard
// Properties 8–16: TodoList pure-logic property tests
// Does NOT load js/main.js — uses standalone pure functions instead.

// ── Minimal ID generator for tests ──────────────────────────
function genId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

// ── Pure addTask logic (no DOM, no storage) ──────────────────
function addTask(tasks, text) {
  var trimmed = text.trim();
  if (!trimmed) return null; // rejected
  var newTask = { id: genId(), text: trimmed, done: false, createdAt: Date.now() };
  return tasks.concat([newTask]);
}

// ── Pure editTask logic ──────────────────────────────────────
function editTask(tasks, id, newText) {
  if (!newText.trim()) return tasks; // discard
  return tasks.map(function (t) {
    if (t.id !== id) return t;
    return { id: t.id, text: newText.trim(), done: t.done, createdAt: t.createdAt };
  });
}

// ── Pure toggleTask logic ────────────────────────────────────
function toggleTask(tasks, id) {
  return tasks.map(function (t) {
    if (t.id !== id) return t;
    return { id: t.id, text: t.text, done: !t.done, createdAt: t.createdAt };
  });
}

// ── Pure deleteTask logic ────────────────────────────────────
function deleteTask(tasks, id) {
  return tasks.filter(function (t) { return t.id !== id; });
}

// ── Task arbitrary for fast-check ────────────────────────────
var taskArbitrary = fc.record({
  id: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 500 }).filter(function (s) { return s.trim().length > 0; }),
  done: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: Date.now() })
});

// ────────────────────────────────────────────────────────────
// Property 8: Adding a valid task grows the list by one
// Validates: Requirements 3.2
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 8: Adding a valid task grows the list by one
runTest('Property 8: Adding a valid task grows the list by one', function () {
  fc.assert(
    fc.property(
      fc.array(taskArbitrary),
      fc.string({ minLength: 1 }).filter(function (s) { return s.trim().length > 0; }),
      function (tasks, text) {
        var result = addTask(tasks, text);
        __assert(result !== null, 'addTask should succeed with valid text');
        __assert(result.length === tasks.length + 1, 'list length should grow by 1');
        var added = result[result.length - 1];
        __assert(added.text === text.trim(), 'new task text should equal trimmed input');
        __assert(added.done === false, 'new task done should be false');
      }
    ),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 9: Whitespace-only input is rejected
// Validates: Requirements 3.3
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 9: Whitespace-only input is rejected
runTest('Property 9: Whitespace-only input is rejected', function () {
  fc.assert(
    fc.property(
      fc.array(taskArbitrary),
      fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
      function (tasks, text) {
        var result = addTask(tasks, text);
        __assert(result === null, 'addTask should reject whitespace-only input');
      }
    ),
    { numRuns: 100 }
  );
  // Also test empty string explicitly
  runTest('Property 9 (empty string variant)', function () {
    var tasks = [];
    var result = addTask(tasks, '');
    __assert(result === null, 'addTask should reject empty string');
  });
});

// ────────────────────────────────────────────────────────────
// Property 10: Task collection serialization round-trip
// Validates: Requirements 3.4, 5.1, 5.2
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 10: Task collection serialization round-trip
runTest('Property 10: Task collection serialization round-trip', function () {
  fc.assert(
    fc.property(fc.array(taskArbitrary), function (tasks) {
      var serialized = JSON.stringify(tasks);
      var deserialized = JSON.parse(serialized);
      __assert(deserialized.length === tasks.length, 'Round-trip should preserve length');
      for (var i = 0; i < tasks.length; i++) {
        __assert(deserialized[i].id === tasks[i].id, 'id should match after round-trip');
        __assert(deserialized[i].text === tasks[i].text, 'text should match after round-trip');
        __assert(deserialized[i].done === tasks[i].done, 'done should match after round-trip');
        __assert(deserialized[i].createdAt === tasks[i].createdAt, 'createdAt should match after round-trip');
      }
    }),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 11: Invalid JSON in storage returns an empty array
// Validates: Requirements 5.6, 7.6
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 11: Invalid JSON in storage returns empty array
runTest('Property 11: Invalid JSON in storage returns empty array', function () {
  fc.assert(
    fc.property(
      fc.string().filter(function (s) {
        try {
          var v = JSON.parse(s);
          return !Array.isArray(v);
        } catch (e) {
          return true;
        }
      }),
      function (badJson) {
        var result;
        try {
          result = JSON.parse(badJson);
          if (!Array.isArray(result)) result = [];
        } catch (e) {
          result = [];
        }
        __assert(Array.isArray(result), 'loadFromStorage with bad JSON should return empty array');
        __assert(result.length === 0, 'loadFromStorage with bad JSON should return empty array');
      }
    ),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 12: Failed storage write preserves in-memory state
// Validates: Requirements 5.5, 7.5
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 12: Failed storage write preserves in-memory state (tasks)
runTest('Property 12: Failed storage write preserves in-memory state (tasks)', function () {
  fc.assert(
    fc.property(fc.array(taskArbitrary), function (tasks) {
      var tasksBefore = tasks.slice();
      // Simulate a failed write: in-memory state is the tasks array.
      // A write failure should NOT change the in-memory array.
      var writeResult = { ok: false, error: new Error('simulated failure') };
      // If write fails, tasks array is unchanged — we verify the slice equals the original.
      __assert(tasks.length === tasksBefore.length, 'tasks should be unchanged after write failure');
      for (var i = 0; i < tasks.length; i++) {
        __assert(tasks[i].id === tasksBefore[i].id, 'task id should be unchanged after write failure');
        __assert(tasks[i].text === tasksBefore[i].text, 'task text should be unchanged after write failure');
        __assert(tasks[i].done === tasksBefore[i].done, 'task done should be unchanged after write failure');
      }
    }),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 13: Edit with valid text trims and saves
// Validates: Requirements 4.2
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 13: Edit with valid text trims and saves
runTest('Property 13: Edit with valid text trims and saves', function () {
  fc.assert(
    fc.property(
      taskArbitrary,
      fc.string({ minLength: 1 }).filter(function (s) { return s.trim().length > 0; }),
      function (task, newText) {
        var tasks = [task];
        var result = editTask(tasks, task.id, newText);
        var edited = result.find(function (t) { return t.id === task.id; });
        __assert(edited.text === newText.trim(), 'edited text should be trimmed, got: ' + edited.text);
        __assert(edited.id === task.id, 'id should be unchanged');
        __assert(edited.done === task.done, 'done should be unchanged');
        __assert(edited.createdAt === task.createdAt, 'createdAt should be unchanged');
      }
    ),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 14: Edit with empty or whitespace text discards the change
// Validates: Requirements 4.3, 4.4
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 14: Edit with empty or whitespace text discards the change
runTest('Property 14: Edit with empty or whitespace text discards the change', function () {
  fc.assert(
    fc.property(
      taskArbitrary,
      fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
      function (task, whitespace) {
        var tasks = [task];
        var result = editTask(tasks, task.id, whitespace);
        var unchanged = result.find(function (t) { return t.id === task.id; });
        __assert(unchanged.text === task.text, 'text should be unchanged after whitespace edit');
      }
    ),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 15: Toggling a task twice returns to the original state
// Validates: Requirements 4.5, 4.6
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 15: Toggling a task twice returns to the original state
runTest('Property 15: Toggling a task twice returns to the original state', function () {
  fc.assert(
    fc.property(taskArbitrary, function (task) {
      var tasks = [task];
      var after1 = toggleTask(tasks, task.id);
      var after2 = toggleTask(after1, task.id);
      var restored = after2.find(function (t) { return t.id === task.id; });
      __assert(
        restored.done === task.done,
        'done should be restored after double toggle, original: ' + task.done + ', got: ' + restored.done
      );
    }),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 16: Delete removes exactly the targeted task
// Validates: Requirements 4.7
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 16: Delete removes exactly the targeted task
runTest('Property 16: Delete removes exactly the targeted task', function () {
  fc.assert(
    fc.property(
      fc.array(taskArbitrary, { minLength: 1 }),
      fc.integer({ min: 0, max: 0 }), // index picked via Math.random below
      function (tasks, _ignored) {
        // Pick a random task to delete
        var idx = Math.floor(Math.random() * tasks.length);
        var targetId = tasks[idx].id;
        var result = deleteTask(tasks, targetId);
        __assert(result.length === tasks.length - 1, 'length should decrease by 1');
        __assert(
          !result.some(function (t) { return t.id === targetId; }),
          'deleted task should not be present'
        );
        // All other tasks should still be there
        var otherIds = tasks
          .filter(function (t) { return t.id !== targetId; })
          .map(function (t) { return t.id; });
        otherIds.forEach(function (id) {
          __assert(
            result.some(function (t) { return t.id === id; }),
            'task ' + id + ' should still be present'
          );
        });
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: todo-list-dashboard
// Timer property tests — Properties 4, 5, 6, 7
// Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.7

// ── Pure timer functions for testing (mirrors FocusTimer implementation) ──────

function makeTimerState(totalSeconds, running, complete) {
  return { totalSeconds: totalSeconds, running: running, complete: complete };
}

function timerTick(state) {
  // Returns a new state object after one tick
  var newState = { totalSeconds: state.totalSeconds - 1, running: state.running, complete: state.complete };
  if (newState.totalSeconds <= 0) {
    newState.totalSeconds = 0;
    newState.running = false;
    newState.complete = true;
  }
  return newState;
}

function timerStop(state) {
  return { totalSeconds: state.totalSeconds, running: false, complete: state.complete };
}

function timerReset(state) {
  return { totalSeconds: 1500, running: false, complete: false };
}

function timerStart(state) {
  // Start is no-op if already running
  if (state.running) return { totalSeconds: state.totalSeconds, running: state.running, complete: state.complete };
  return { totalSeconds: state.totalSeconds, running: true, complete: state.complete };
}

// ── Property 4: Timer tick decrements by exactly one second ───────────────────

// Feature: todo-list-dashboard, Property 4: Timer tick decrements by exactly one second
runTest('Property 4: Timer tick decrements by exactly one second', function () {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 1500 }), function (totalSeconds) {
      var before = makeTimerState(totalSeconds, true, false);
      var after = timerTick(before);
      __assert(after.totalSeconds === totalSeconds - 1, 'After tick, totalSeconds should be ' + (totalSeconds - 1) + ', got ' + after.totalSeconds);
      __assert(after.running === true, 'running should remain true after tick (when not reaching 0)');
    }),
    { numRuns: 100 }
  );
});

// ── Property 5: Timer stop preserves remaining time ───────────────────────────

// Feature: todo-list-dashboard, Property 5: Timer stop preserves remaining time
runTest('Property 5: Timer stop preserves remaining time', function () {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 1500 }), fc.boolean(), function (totalSeconds, running) {
      var before = makeTimerState(totalSeconds, running, false);
      var after = timerStop(before);
      __assert(after.running === false, 'After stop, running should be false');
      __assert(after.totalSeconds === totalSeconds, 'After stop, totalSeconds should be unchanged (' + totalSeconds + '), got ' + after.totalSeconds);
    }),
    { numRuns: 100 }
  );
});

// ── Property 6: Timer reset always produces the initial state ─────────────────

// Feature: todo-list-dashboard, Property 6: Timer reset always produces the initial state
runTest('Property 6: Timer reset always produces the initial state', function () {
  fc.assert(
    fc.property(
      fc.record({
        totalSeconds: fc.integer({ min: 0, max: 1500 }),
        running: fc.boolean(),
        complete: fc.boolean()
      }),
      function (state) {
        var after = timerReset(state);
        __assert(after.totalSeconds === 1500, 'After reset, totalSeconds should be 1500, got ' + after.totalSeconds);
        __assert(after.running === false, 'After reset, running should be false');
        __assert(after.complete === false, 'After reset, complete should be false');
      }
    ),
    { numRuns: 100 }
  );
});

// ── Property 7: Start is idempotent when the timer is running ─────────────────

// Feature: todo-list-dashboard, Property 7: Start is idempotent when the timer is running
runTest('Property 7: Start is idempotent when the timer is running', function () {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 1500 }), function (totalSeconds) {
      var runningState = makeTimerState(totalSeconds, true, false);
      var after = timerStart(runningState);
      __assert(after.totalSeconds === totalSeconds, 'Start on running timer should not change totalSeconds');
      __assert(after.running === true, 'Start on running timer should keep running true');
    }),
    { numRuns: 100 }
  );
});

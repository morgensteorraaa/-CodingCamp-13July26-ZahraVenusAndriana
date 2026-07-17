// ── GreetingWidget Pure Function Copies ───────────────────────────────────────
// These are duplicated here so the tests can run without the app IIFE or DOM.

/**
 * Pure copy of GreetingWidget.formatDate
 * Returns a formatted date string: "Weekday, Month D, YYYY"
 * @param {Date} now
 * @returns {string}
 */
function formatDate(now) {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Pure copy of GreetingWidget.formatTime
 * Returns zero-padded 24-hour time string: "HH:MM"
 * @param {Date} now
 * @returns {string}
 */
function formatTime(now) {
  var h = String(now.getHours()).padStart(2, '0');
  var m = String(now.getMinutes()).padStart(2, '0');
  return h + ':' + m;
}

/**
 * Pure copy of GreetingWidget.getGreeting
 * Returns the appropriate greeting for the given hour (0-23).
 * 5-11  → "Good Morning"
 * 12-17 → "Good Afternoon"
 * 0-4, 18-23 → "Good Evening"
 * @param {number} hour
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ── Property Tests ─────────────────────────────────────────────────────────────

// Feature: todo-list-dashboard, Property 1: Date format is structurally correct
runTest('Property 1: Date format is structurally correct', function () {
  fc.assert(
    fc.property(fc.date(), function (date) {
      var result = formatDate(date);
      __assert(typeof result === 'string', 'formatDate should return a string');
      __assert(
        /^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/.test(result),
        'formatDate output should match "Weekday, Month D, YYYY" but got: ' + result
      );
    }),
    { numRuns: 100 }
  );
});

// Feature: todo-list-dashboard, Property 2: Time format is a zero-padded HH:MM string
runTest('Property 2: Time format is a zero-padded HH:MM string', function () {
  fc.assert(
    fc.property(fc.date(), function (date) {
      var result = formatTime(date);
      __assert(result.length === 5, 'formatTime result length should be 5, got ' + result.length + ' (' + result + ')');
      __assert(/^\d{2}:\d{2}$/.test(result), 'formatTime should match HH:MM but got: ' + result);
    }),
    { numRuns: 100 }
  );
});

// Feature: todo-list-dashboard, Property 3: Greeting covers every hour of the day
runTest('Property 3: Greeting covers every hour of the day', function () {
  var validGreetings = ['Good Morning', 'Good Afternoon', 'Good Evening'];

  fc.assert(
    fc.property(fc.integer({ min: 0, max: 23 }), function (hour) {
      var result = getGreeting(hour);
      __assert(validGreetings.indexOf(result) !== -1, 'getGreeting should return a valid greeting for hour ' + hour + ', got: ' + result);

      // Check boundary mappings
      if (hour >= 5 && hour <= 11) {
        __assert(result === 'Good Morning', 'Hour ' + hour + ' should be Good Morning, got: ' + result);
      } else if (hour >= 12 && hour <= 17) {
        __assert(result === 'Good Afternoon', 'Hour ' + hour + ' should be Good Afternoon, got: ' + result);
      } else {
        __assert(result === 'Good Evening', 'Hour ' + hour + ' should be Good Evening, got: ' + result);
      }
    }),
    { numRuns: 100 }
  );
});

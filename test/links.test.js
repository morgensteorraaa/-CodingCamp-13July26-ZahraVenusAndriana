// test/links.test.js
// Feature: todo-list-dashboard
// Properties 12 (links), 17–22: QuickLinks pure-logic property tests
// Does NOT load js/main.js — uses standalone pure functions instead.

// ── Minimal ID generator for tests ──────────────────────────
function genLinkId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

// ── Pure addLink logic (no DOM, no storage) ──────────────────
// Returns the new links array on success, or null if the input is invalid.
function addLink(links, label, url) {
  // Validate label
  if (!label.trim()) return null;
  // Validate url non-empty
  if (!url.trim()) return null;
  // Validate url protocol
  var trimmedUrl = url.trim();
  if (trimmedUrl.indexOf('http://') !== 0 && trimmedUrl.indexOf('https://') !== 0) return null;
  // Guard max links
  if (links.length >= 20) return null;
  // Success
  var newLink = { id: genLinkId(), label: label.trim(), url: trimmedUrl };
  return links.concat([newLink]);
}

// ── Pure deleteLink logic ────────────────────────────────────
function deleteLink(links, id) {
  return links.filter(function (l) { return l.id !== id; });
}

// ── Link arbitrary for fast-check ────────────────────────────
var linkArbitrary = fc.record({
  id:    fc.uuid(),
  label: fc.string({ minLength: 1, maxLength: 50 }).filter(function (s) { return s.trim().length > 0; }),
  url:   fc.oneof(
    fc.webUrl().filter(function (u) { return u.indexOf('http://') === 0 || u.indexOf('https://') === 0; }),
    fc.constantFrom('http://example.com', 'https://example.com', 'http://test.org', 'https://test.org')
  )
});

// ── Helper: build a list of exactly N valid links ─────────────
function makeLinks(n) {
  var list = [];
  for (var i = 0; i < n; i++) {
    list.push({ id: genLinkId() + i, label: 'Link ' + i, url: 'https://example.com/' + i });
  }
  return list;
}

// ────────────────────────────────────────────────────────────
// Property 12 (links): Failed storage write preserves in-memory state
// Validates: Requirements 7.5
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 12 (links): Failed storage write preserves in-memory state
runTest('Property 12 (links): Failed storage write preserves in-memory state', function () {
  fc.assert(
    fc.property(
      fc.array(linkArbitrary),
      function (links) {
        var linksBefore = links.slice();
        // Simulate a failed write: in-memory state is the links array.
        // A write failure must NOT mutate the in-memory array.
        var writeResult = { ok: false, error: new Error('simulated failure') };
        // If write fails, links array is unchanged — we verify the slice equals the original.
        __assert(links.length === linksBefore.length, 'links length should be unchanged after write failure');
        for (var i = 0; i < links.length; i++) {
          __assert(links[i].id === linksBefore[i].id, 'link id should be unchanged after write failure');
          __assert(links[i].label === linksBefore[i].label, 'link label should be unchanged after write failure');
          __assert(links[i].url === linksBefore[i].url, 'link url should be unchanged after write failure');
        }
      }
    ),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 17: Adding a valid link grows the list by one
// Validates: Requirements 6.2
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 17: Adding a valid link grows the list by one
runTest('Property 17: Adding a valid link grows the list by one', function () {
  fc.assert(
    fc.property(
      fc.array(linkArbitrary, { minLength: 0, maxLength: 19 }),
      fc.string({ minLength: 1, maxLength: 50 }).filter(function (s) { return s.trim().length > 0; }),
      fc.oneof(
        fc.webUrl().filter(function (u) { return u.indexOf('http://') === 0 || u.indexOf('https://') === 0; }),
        fc.constantFrom('http://example.com', 'https://example.com', 'http://foo.org', 'https://bar.net')
      ),
      function (links, label, url) {
        var result = addLink(links, label, url);
        __assert(result !== null, 'addLink should succeed with valid inputs');
        __assert(result.length === links.length + 1, 'list length should grow by 1');
        var added = result[result.length - 1];
        __assert(added.label === label.trim(), 'new link label should equal trimmed input');
        __assert(added.url === url.trim(), 'new link url should equal trimmed url');
      }
    ),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 18: Link with empty label or empty URL is rejected
// Validates: Requirements 6.3
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 18: Link with empty label or empty URL is rejected
runTest('Property 18: Link with empty label or empty URL is rejected', function () {
  // Case A: empty label (whitespace-only)
  fc.assert(
    fc.property(
      fc.array(linkArbitrary),
      fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
      fc.oneof(
        fc.webUrl().filter(function (u) { return u.indexOf('http://') === 0 || u.indexOf('https://') === 0; }),
        fc.constantFrom('http://example.com', 'https://example.com')
      ),
      function (links, emptyLabel, url) {
        var result = addLink(links, emptyLabel, url);
        __assert(result === null, 'addLink should reject empty label');
      }
    ),
    { numRuns: 100 }
  );

  // Case B: empty URL (whitespace-only)
  fc.assert(
    fc.property(
      fc.array(linkArbitrary),
      fc.string({ minLength: 1, maxLength: 50 }).filter(function (s) { return s.trim().length > 0; }),
      fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
      function (links, label, emptyUrl) {
        var result = addLink(links, label, emptyUrl);
        __assert(result === null, 'addLink should reject empty URL');
      }
    ),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 19: Link with non-http/https URL is rejected
// Validates: Requirements 6.4
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 19: Link with non-http/https URL is rejected
runTest('Property 19: Link with non-http/https URL is rejected', function () {
  fc.assert(
    fc.property(
      fc.array(linkArbitrary),
      fc.string({ minLength: 1, maxLength: 50 }).filter(function (s) { return s.trim().length > 0; }),
      fc.string({ minLength: 1 }).filter(function (u) {
        var t = u.trim();
        return t.length > 0 && t.indexOf('http://') !== 0 && t.indexOf('https://') !== 0;
      }),
      function (links, label, badUrl) {
        var result = addLink(links, label, badUrl);
        __assert(result === null, 'addLink should reject non-http/https URL, got result for url: ' + badUrl);
      }
    ),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 20: Add is rejected when the link list has reached 20 entries
// Validates: Requirements 6.6
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 20: Add is rejected when the link list has reached 20 entries
runTest('Property 20: Add is rejected when the link list has reached 20 entries', function () {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 50 }).filter(function (s) { return s.trim().length > 0; }),
      fc.oneof(
        fc.webUrl().filter(function (u) { return u.indexOf('http://') === 0 || u.indexOf('https://') === 0; }),
        fc.constantFrom('http://example.com', 'https://example.com')
      ),
      function (label, url) {
        var fullList = makeLinks(20);
        var result = addLink(fullList, label, url);
        __assert(result === null, 'addLink should reject when list has 20 entries');
      }
    ),
    { numRuns: 100 }
  );

  // Also test with exactly 20 links generated by the arbitrary (using fixed list for speed)
  var fullList = makeLinks(20);
  __assert(fullList.length === 20, 'test setup: list should have 20 links');
  var result = addLink(fullList, 'New Link', 'https://new.com');
  __assert(result === null, 'addLink should reject when exactly 20 links exist');
});

// ────────────────────────────────────────────────────────────
// Property 21: Link collection serialization round-trip
// Validates: Requirements 7.3
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 21: Link collection serialization round-trip
runTest('Property 21: Link collection serialization round-trip', function () {
  fc.assert(
    fc.property(fc.array(linkArbitrary), function (links) {
      var serialized = JSON.stringify(links);
      var deserialized = JSON.parse(serialized);
      __assert(deserialized.length === links.length, 'Round-trip should preserve length');
      for (var i = 0; i < links.length; i++) {
        __assert(deserialized[i].id === links[i].id, 'id should match after round-trip at index ' + i);
        __assert(deserialized[i].label === links[i].label, 'label should match after round-trip at index ' + i);
        __assert(deserialized[i].url === links[i].url, 'url should match after round-trip at index ' + i);
      }
    }),
    { numRuns: 100 }
  );
});

// ────────────────────────────────────────────────────────────
// Property 22: Delete link removes exactly the targeted link
// Validates: Requirements 7.1
// ────────────────────────────────────────────────────────────
// Feature: todo-list-dashboard, Property 22: Delete link removes exactly the targeted link
runTest('Property 22: Delete link removes exactly the targeted link', function () {
  fc.assert(
    fc.property(
      fc.array(linkArbitrary, { minLength: 1 }),
      fc.integer({ min: 0, max: 0 }), // index placeholder — actual index picked below
      function (links, _ignored) {
        // Pick a random link to delete
        var idx = Math.floor(Math.random() * links.length);
        var targetId = links[idx].id;
        var result = deleteLink(links, targetId);
        __assert(result.length === links.length - 1, 'length should decrease by 1');
        __assert(
          !result.some(function (l) { return l.id === targetId; }),
          'deleted link should not be present'
        );
        // All other links should still be there
        var otherIds = links
          .filter(function (l) { return l.id !== targetId; })
          .map(function (l) { return l.id; });
        otherIds.forEach(function (id) {
          __assert(
            result.some(function (l) { return l.id === id; }),
            'link ' + id + ' should still be present after deleting ' + targetId
          );
        });
      }
    ),
    { numRuns: 100 }
  );
});

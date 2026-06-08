# Frontend Helper Modules

## Purpose

The frontend page controllers in `src/frontend/scripts/` are browser entry
points. They read from the DOM, session storage, the current URL, and browser
APIs as soon as the page loads. That makes them difficult to import directly in
Node tests.

When a page controller contains pure logic, move that logic into
`src/frontend/lib/` and import it back into the browser controller. This keeps
the browser behavior the same while allowing the pure logic to be covered by
`node --test`.

## Current Helpers

### `src/frontend/lib/text-boxes.js`

Used by `src/frontend/scripts/edit.js`.

- `defaultTextBoxes(count)` creates normalized default text box positions for a
  meme template.
- `labelForBox(index, total)` creates user-facing labels such as `Top text`,
  `Bottom text`, and `Text N`.

Tests live in `tests/text-boxes.test.js`.

### `src/frontend/lib/share-spec.js`

Used by `src/frontend/scripts/result.js`.

- `encodeSpec(spec)` serializes a meme spec into a base64 URL parameter.
- `decodeSpec(param)` safely parses that parameter and returns `null` for
  missing or malformed input.

Tests live in `tests/share-spec.test.js`.

## Testing Pattern

Pure helper modules should not touch `document`, `window`, `sessionStorage`, or
network APIs at import time. If a helper needs browser state, pass that state in
as an argument from the page controller.

Add new helper tests to the explicit `npm test` file list in `package.json` so
CI runs them.

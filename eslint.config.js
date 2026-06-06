import js from "@eslint/js";
import globals from "globals";

// ESLint flat config. See docs/decisions/0003-javascript-linting.md for the "why".
export default [
  // Don't lint generated, vendored, or minified output.
  {
    ignores: ["node_modules/", "dist/", "build/", "out/", "coverage/", ".wrangler/", "**/*.min.js"],
  },

  // Baseline correctness rules from ESLint's recommended set.
  js.configs.recommended,

  // Project-wide language settings.
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Our code runs in both the browser (src/frontend) and Node
      // (src/backend, tests, tools). We allow both global sets everywhere
      // to keep the config simple for contributors.
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Flag unused code, but allow intentionally-unused args/vars prefixed
      // with "_" (a common, readable convention).
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Pre-existing code re-throws errors in catch blocks without forwarding
      // the original via `cause`. We surface this as a warning (not a build
      // failure) so adopting the linter doesn't block merges on day one.
      // Promote back to "error" once the existing call sites are fixed
      // (see docs/decisions/0003-javascript-linting.md follow-up).
      "preserve-caught-error": "warn",
    },
  },
];

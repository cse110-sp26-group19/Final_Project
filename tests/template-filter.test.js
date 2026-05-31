import { test } from "node:test";
import assert from "node:assert/strict";

import { filterTemplates } from "../src/frontend/lib/template-filter.js";

const templates = [
  { id: "1", name: "Drake Hotline Bling", box_count: 2 },
  { id: "2", name: "Distracted Boyfriend", box_count: 3 },
  { id: "3", name: "Two Buttons", box_count: 3 },
  { id: "4", name: "Expanding Brain", box_count: 4 },
  { id: "5", name: "Change My Mind", box_count: 2 },
  { id: "6", name: "Galaxy Brain", box_count: 6 },
];

test("filterTemplates: empty query and 'all' category returns full list", () => {
  const result = filterTemplates(templates, { query: "", category: "all" });
  assert.equal(result.length, templates.length);
  assert.deepEqual(result, templates);
});

test("filterTemplates: no criteria object also returns full list", () => {
  const result = filterTemplates(templates);
  assert.equal(result.length, templates.length);
});

test("filterTemplates: case-insensitive substring match on name", () => {
  const lower = filterTemplates(templates, { query: "drake" });
  const upper = filterTemplates(templates, { query: "DRAKE" });
  const mixed = filterTemplates(templates, { query: "DrAkE" });
  assert.equal(lower.length, 1);
  assert.equal(lower[0].name, "Drake Hotline Bling");
  assert.deepEqual(upper, lower);
  assert.deepEqual(mixed, lower);
});

test("filterTemplates: query whitespace is trimmed", () => {
  const result = filterTemplates(templates, { query: "  brain  " });
  assert.equal(result.length, 2);
  assert.ok(result.every((t) => /brain/i.test(t.name)));
});

test("filterTemplates: category 'popular' keeps templates with box_count >= 4", () => {
  const result = filterTemplates(templates, { category: "popular" });
  assert.equal(result.length, 2);
  assert.ok(result.every((t) => t.box_count >= 4));
});

test("filterTemplates: unknown category falls back to 'no filter'", () => {
  const result = filterTemplates(templates, { category: "made-up-category" });
  assert.equal(result.length, templates.length);
});

test("filterTemplates: combined query + popular AND-filters correctly", () => {
  const result = filterTemplates(templates, { query: "brain", category: "popular" });
  // Both "Expanding Brain" (4) and "Galaxy Brain" (6) match name + popularity
  assert.equal(result.length, 2);
  assert.ok(result.every((t) => /brain/i.test(t.name) && t.box_count >= 4));
});

test("filterTemplates: returns empty array when nothing matches", () => {
  const result = filterTemplates(templates, { query: "nonexistent-meme" });
  assert.deepEqual(result, []);
});

import { test } from "node:test";
import assert from "node:assert/strict";

import { getTemplates, __testing } from "../src/frontend/templates.js";

function makeStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    _store: store,
  };
}

const sampleMemes = [
  {
    id: "1",
    name: "Drake",
    url: "https://i.imgflip.com/drake.jpg",
    width: 1200,
    height: 1200,
    box_count: 2,
  },
  {
    id: "2",
    name: "Distracted Boyfriend",
    url: "https://i.imgflip.com/df.jpg",
    width: 1200,
    height: 800,
    box_count: 3,
  },
];

test("getTemplates fetches and returns memes when cache is empty", async () => {
  const storage = makeStorage();
  let calls = 0;
  const fetchFn = async (url) => {
    calls += 1;
    assert.equal(url, __testing.IMGFLIP_GET_MEMES_URL);
    return { ok: true, json: async () => ({ success: true, data: { memes: sampleMemes } }) };
  };
  const memes = await getTemplates({ storage, fetchFn, now: 1000 });
  assert.deepEqual(memes, sampleMemes);
  assert.equal(calls, 1);
  assert.ok(storage.getItem(__testing.CACHE_KEY));
});

test("getTemplates returns cached memes within TTL without fetching", async () => {
  const cached = JSON.stringify({ timestamp: 5000, memes: sampleMemes });
  const storage = makeStorage({ [__testing.CACHE_KEY]: cached });
  const fetchFn = async () => {
    throw new Error("fetch should not be called");
  };
  const memes = await getTemplates({ storage, fetchFn, now: 6000 });
  assert.deepEqual(memes, sampleMemes);
});

test("getTemplates refetches when cache is stale", async () => {
  const stale = JSON.stringify({ timestamp: 0, memes: [{ id: "old" }] });
  const storage = makeStorage({ [__testing.CACHE_KEY]: stale });
  let called = false;
  const fetchFn = async () => {
    called = true;
    return { ok: true, json: async () => ({ success: true, data: { memes: sampleMemes } }) };
  };
  const memes = await getTemplates({ storage, fetchFn, now: __testing.CACHE_TTL_MS + 1 });
  assert.ok(called);
  assert.deepEqual(memes, sampleMemes);
});

test("getTemplates throws on malformed response", async () => {
  const storage = makeStorage();
  const fetchFn = async () => ({ ok: true, json: async () => ({ success: false }) });
  await assert.rejects(() => getTemplates({ storage, fetchFn, now: 0 }), /malformed/);
});

test("getTemplates throws on non-OK response", async () => {
  const storage = makeStorage();
  const fetchFn = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(() => getTemplates({ storage, fetchFn, now: 0 }), /HTTP 503/);
});

test("getTemplates forceRefresh bypasses the cache", async () => {
  const cached = JSON.stringify({ timestamp: 5000, memes: [{ id: "cached" }] });
  const storage = makeStorage({ [__testing.CACHE_KEY]: cached });
  let called = false;
  const fetchFn = async () => {
    called = true;
    return { ok: true, json: async () => ({ success: true, data: { memes: sampleMemes } }) };
  };
  const memes = await getTemplates({ storage, fetchFn, now: 5500, forceRefresh: true });
  assert.ok(called);
  assert.deepEqual(memes, sampleMemes);
});

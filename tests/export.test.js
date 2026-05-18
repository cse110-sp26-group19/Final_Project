import { test } from "node:test";
import assert from "node:assert/strict";

import { exportMeme } from "../src/export.js";

function makeCanvas({ failBlob = false, throwOnToBlob = false } = {}) {
  return {
    toBlob(cb, type) {
      if (throwOnToBlob) throw new Error("tainted");
      this._lastType = type;
      queueMicrotask(() => cb(failBlob ? null : { type }));
    },
  };
}

function makeAnchor() {
  return {
    href: "",
    download: "",
    rel: "",
    click() {
      this._clicked = true;
    },
    remove() {
      this._removed = true;
    },
  };
}

function makeDocument(anchor) {
  return {
    createElement: () => anchor,
    body: {
      appendChild(el) {
        anchor._appended = true;
        return el;
      },
    },
  };
}

function makeURL() {
  const created = [];
  const revoked = [];
  return {
    createObjectURL: (blob) => {
      const url = `blob:${created.length}`;
      created.push({ url, blob });
      return url;
    },
    revokeObjectURL: (url) => revoked.push(url),
    _created: created,
    _revoked: revoked,
  };
}

test("exportMeme rejects non-canvas input", () => {
  assert.throws(() => exportMeme(null), /HTMLCanvasElement/);
  assert.throws(() => exportMeme({}), /HTMLCanvasElement/);
});

test("exportMeme triggers a PNG download with the given filename", async () => {
  const canvas = makeCanvas();
  const anchor = makeAnchor();
  const documentRef = makeDocument(anchor);
  const URLRef = makeURL();

  await exportMeme(canvas, "spicy-meme.png", { documentRef, URLRef });

  assert.equal(canvas._lastType, "image/png");
  assert.equal(anchor.download, "spicy-meme.png");
  assert.equal(anchor.href, "blob:0");
  assert.equal(anchor._appended, true);
  assert.equal(anchor._clicked, true);
  assert.equal(anchor._removed, true);
  assert.deepEqual(URLRef._revoked, ["blob:0"]);
});

test("exportMeme appends .png when filename is missing the extension", async () => {
  const canvas = makeCanvas();
  const anchor = makeAnchor();
  await exportMeme(canvas, "no-extension", {
    documentRef: makeDocument(anchor),
    URLRef: makeURL(),
  });
  assert.equal(anchor.download, "no-extension.png");
});

test("exportMeme defaults filename to meme.png", async () => {
  const canvas = makeCanvas();
  const anchor = makeAnchor();
  await exportMeme(canvas, undefined, {
    documentRef: makeDocument(anchor),
    URLRef: makeURL(),
  });
  assert.equal(anchor.download, "meme.png");
});

test("exportMeme rejects when toBlob yields no blob", async () => {
  const canvas = makeCanvas({ failBlob: true });
  await assert.rejects(
    () =>
      exportMeme(canvas, "x.png", {
        documentRef: makeDocument(makeAnchor()),
        URLRef: makeURL(),
      }),
    /no blob/
  );
});

test("exportMeme rejects when toBlob throws (tainted canvas / CORS)", async () => {
  const canvas = makeCanvas({ throwOnToBlob: true });
  await assert.rejects(
    () =>
      exportMeme(canvas, "x.png", {
        documentRef: makeDocument(makeAnchor()),
        URLRef: makeURL(),
      }),
    /tainted/
  );
});

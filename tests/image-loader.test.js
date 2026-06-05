import { test } from "node:test";
import assert from "node:assert/strict";

import { loadImage, loadUserPhoto } from "../src/frontend/image-loader.js";

function makeImageCtor() {
  const created = [];
  class FakeImage {
    constructor() {
      created.push(this);
      this.onload = null;
      this.onerror = null;
      this.crossOrigin = null;
      Object.defineProperty(this, "src", {
        set(value) {
          this._src = value;
          queueMicrotask(() => {
            if (value && value.includes("fail")) this.onerror?.();
            else this.onload?.();
          });
        },
        get() {
          return this._src;
        },
      });
    }
  }
  return { FakeImage, created };
}

function makeFileReaderCtor(result) {
  class FakeFileReader {
    constructor() {
      this.onload = null;
      this.onerror = null;
      this.result = null;
    }
    readAsDataURL(file) {
      queueMicrotask(() => {
        if (file && file._fail) {
          this.onerror?.();
        } else {
          this.result = result;
          this.onload?.();
        }
      });
    }
  }
  return FakeFileReader;
}

test("loadImage rejects when url is empty or non-string", () => {
  assert.throws(() => loadImage("", { ImageCtor: class {} }), /non-empty/);
  assert.throws(() => loadImage(null, { ImageCtor: class {} }), /non-empty/);
});

test("loadImage sets crossOrigin=anonymous and resolves on load", async () => {
  const { FakeImage, created } = makeImageCtor();
  const img = await loadImage("https://i.imgflip.com/drake.jpg", { ImageCtor: FakeImage });
  assert.equal(img.crossOrigin, "anonymous");
  assert.equal(img.src, "https://i.imgflip.com/drake.jpg");
  assert.equal(created.length, 1);
});

test("loadImage rejects with descriptive error on load failure", async () => {
  const { FakeImage } = makeImageCtor();
  await assert.rejects(
    () => loadImage("https://example.com/fail.jpg", { ImageCtor: FakeImage }),
    /failed to load/
  );
});

test("loadUserPhoto rejects non-Blob input", () => {
  assert.throws(() => loadUserPhoto(null), /File or Blob/);
  assert.throws(() => loadUserPhoto("not a file"), /File or Blob/);
});

test("loadUserPhoto reads file and resolves with an image", async () => {
  const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
  const FakeFileReader = makeFileReaderCtor(dataUrl);
  const { FakeImage } = makeImageCtor();
  const fakeFile = { size: 42, type: "image/png" };

  const img = await loadUserPhoto(fakeFile, {
    FileReaderCtor: FakeFileReader,
    ImageCtor: FakeImage,
  });
  assert.equal(img.src, dataUrl);
});

test("loadUserPhoto rejects when FileReader errors", async () => {
  const FakeFileReader = makeFileReaderCtor(null);
  const { FakeImage } = makeImageCtor();
  await assert.rejects(
    () =>
      loadUserPhoto(
        { size: 1, _fail: true },
        { FileReaderCtor: FakeFileReader, ImageCtor: FakeImage }
      ),
    /FileReader error/
  );
});

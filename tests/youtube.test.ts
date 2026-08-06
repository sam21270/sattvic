// Run with `npm test`. Only the id parsing is covered — youtubeText() talks to
// Google and needs a key, so it is not something to assert against here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { youtubeVideoId } from "../src/lib/youtube.ts";

test("reads the id from every YouTube URL shape", () => {
  const cases: [string, string][] = [
    ["https://www.youtube.com/watch?v=1QT2bDBsrYw", "1QT2bDBsrYw"],
    ["https://www.youtube.com/watch?v=1QT2bDBsrYw&t=30s", "1QT2bDBsrYw"],
    ["https://youtu.be/1QT2bDBsrYw", "1QT2bDBsrYw"],
    ["https://youtu.be/1QT2bDBsrYw?si=abc", "1QT2bDBsrYw"],
    // The shape that started this: a Short.
    ["https://www.youtube.com/shorts/gGzt0Xqp2vw", "gGzt0Xqp2vw"],
    ["https://www.youtube.com/embed/gGzt0Xqp2vw", "gGzt0Xqp2vw"],
    ["https://m.youtube.com/watch?v=gGzt0Xqp2vw", "gGzt0Xqp2vw"],
  ];
  for (const [url, id] of cases) {
    assert.equal(youtubeVideoId(url), id, `failed on ${url}`);
  }
});

test("returns null for things that are not YouTube videos", () => {
  for (const url of [
    "https://www.loveandlemons.com/almond-butter-recipe/",
    "https://www.youtube.com/",
    "https://www.youtube.com/@somechannel",
    "https://www.tiktok.com/@user/video/12345",
    "not a url at all",
  ]) {
    assert.equal(youtubeVideoId(url), null, `should not have matched ${url}`);
  }
});

test("ignores an id of the wrong length", () => {
  assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=tooshort"), null);
  assert.equal(youtubeVideoId("https://www.youtube.com/shorts/waaaaaaaaaaytoolong"), null);
});

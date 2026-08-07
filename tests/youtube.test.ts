// Run with `npm test`. Only the id parsing is covered — youtubeText() talks to
// Google and needs a key, so it is not something to assert against here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { youtubeVideoId, recipeLinkFrom } from "../src/lib/youtube.ts";

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

/* ── the recipe link inside a description ──────────────────────── */

test("picks the labelled recipe link out of a description full of promo links", () => {
  // Shape taken from a real Preppy Kitchen description: the recipe is one link
  // among book, store and social links, and none of the ingredients are inline.
  const link = recipeLinkFrom(`Fluffy pancakes!

RECIPE: https://preppykitchen.com/pancake-recipe/

ORDER MY BOOK!
Amazon: https://www.amazon.com/exec/obidos/ASIN/1668026821
Bookshop: https://bookshop.org/p/books/preppy-kitchen/20713006
Amazon CA: https://a.co/d/fuve5Xj
Instagram: https://www.instagram.com/preppykitchen`);
  assert.equal(link, "https://preppykitchen.com/pancake-recipe/");
});

test("falls back to the creator's own site when no link says 'recipe'", () => {
  assert.equal(recipeLinkFrom("full method at https://myfoodblog.com/dal-tadka"), "https://myfoodblog.com/dal-tadka");
});

test("never follows a store or social link", () => {
  assert.equal(recipeLinkFrom("https://www.instagram.com/x and https://tiktok.com/@y"), null);
  assert.equal(recipeLinkFrom("buy it https://a.co/d/fuve5Xj"), null);
  assert.equal(recipeLinkFrom("watch https://youtu.be/1QT2bDBsrYw"), null);
});

test("returns null when the description has no links", () => {
  assert.equal(recipeLinkFrom("just a description with no urls in it"), null);
});

test("drops sentence punctuation stuck to the end of a URL", () => {
  assert.equal(recipeLinkFrom("see https://myblog.com/pancake-recipe."), "https://myblog.com/pancake-recipe");
});

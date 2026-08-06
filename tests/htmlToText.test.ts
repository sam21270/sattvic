// Run with `npm test`. The failure these guard against is silent: a video page
// imports, returns 200, and just says "no recipe found" — because the recipe was
// in the description and the extractor threw the description away.
import { test } from "node:test";
import assert from "node:assert/strict";
import { htmlToText } from "../src/lib/safeFetch.ts";

// Shaped like a real YouTube response: recipe lives in a meta attribute and in
// JSON inside a <script>, never in the visible markup.
const videoPage = `<!doctype html><html><head>
<title>Best Dal Tadka &amp; Rice</title>
<meta name="description" content="1 cup toor dal, 2 tbsp ghee, 1 tsp cumin">
<meta property="og:description" content="1 cup toor dal, 2 tbsp ghee, 1 tsp cumin">
<script>var x = {"shortDescription":"Full recipe:\\n1 cup toor dal\\n2 tbsp ghee\\nSimmer 20 minutes."};</script>
</head><body><div>Subscribe</div><div>Comments</div></body></html>`;

test("keeps a video description that only exists in meta and script JSON", () => {
  const out = htmlToText(videoPage);
  assert.ok(out.includes("toor dal"), "lost the meta description");
  assert.ok(out.includes("Simmer 20 minutes"), "lost the shortDescription JSON");
  assert.ok(out.includes("Best Dal Tadka & Rice"), "lost the title, and did not decode entities");
});

test("the description comes before the page chrome", () => {
  const out = htmlToText(videoPage);
  assert.ok(
    out.indexOf("toor dal") < out.indexOf("Subscribe"),
    "chrome ranked above the recipe, which is what buried it past the char cap",
  );
});

test("a plain recipe blog still yields its visible text", () => {
  const out = htmlToText(`<html><body><h1>Poha</h1><p>Flatten rice, add peanuts.</p></body></html>`);
  assert.ok(out.includes("Poha") && out.includes("Flatten rice, add peanuts."));
});

test("scripts and styles stay stripped out of the body text", () => {
  const out = htmlToText(`<html><body><style>.a{color:red}</style><script>alert(1)</script><p>Idli</p></body></html>`);
  assert.ok(out.includes("Idli"));
  assert.ok(!out.includes("alert(1)") && !out.includes("color:red"));
});

test("drops YouTube's own boilerplate description", () => {
  // Shorts with no creator description serve this marketing copy in every
  // description meta. Keeping it buries the title, which is the only real signal.
  const out = htmlToText(`<html><head><title>Easy Masala Bread - YouTube</title>
    <meta name="description" content="Enjoy the videos and music that you love, upload original content and share it all with friends, family and the world on YouTube.">
    <meta property="og:description" content="Enjoy the videos and music that you love, upload original content and share it all with friends, family and the world on YouTube.">
    </head><body></body></html>`);
  assert.ok(!out.includes("upload original content"), "kept YouTube's boilerplate");
  assert.ok(out.includes("Easy Masala Bread"), "lost the title");
});

test("a real description that merely mentions music is still kept", () => {
  const out = htmlToText(`<html><head><title>Dal</title>
    <meta name="description" content="Enjoy the videos below for 1 cup toor dal and 2 tbsp ghee."></head><body></body></html>`);
  assert.ok(out.includes("toor dal"), "boilerplate filter was too greedy");
});

test("output respects the character cap", () => {
  assert.ok(htmlToText(`<p>${"x".repeat(50000)}</p>`, 500).length <= 500);
});

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(
  path.join(__dirname, "..", "crew-translate", "index.html"),
  "utf8",
);

let server, baseURL, browser, page;

before(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseURL = `http://127.0.0.1:${server.address().port}/`;

  browser = await chromium.launch();
  page = await browser.newPage();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(baseURL).origin,
  });
  await page.goto(baseURL);
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

test("shows the app title", async () => {
  assert.equal(await page.textContent("h1"), "Crew Translate");
});

test("feedback button opens a pre-filled email", async () => {
  const href = await page.getAttribute("#feedback-link", "href");
  assert.match(href, /^mailto:/);
  assert.match(href, /subject=Crew%20Translate%20feedback/);
});

test("lists all seeded phrases on load", async () => {
  assert.equal(await page.locator(".phrase-card").count(), 18);
});

test("category chips filter the list", async () => {
  const chips = page.locator("#category-chips");
  await chips.getByRole("button", { name: "Safety", exact: true }).click();
  assert.equal(await page.locator(".phrase-card").count(), 7);
  await chips.getByRole("button", { name: "All", exact: true }).click();
  assert.equal(await page.locator(".phrase-card").count(), 18);
});

test("search filters by phrase text", async () => {
  await page.fill("#search-input", "wet floor");
  assert.equal(await page.locator(".phrase-card").count(), 1);
  await page.fill("#search-input", "");
});

test("flags S'gaw Karen drafts and leaves Pwo Karen blank", async () => {
  const firstCard = page.locator(".phrase-card").first();
  const kswBadge = firstCard.locator(".lang-row", { hasText: "S'gaw Karen" }).locator(".badge");
  assert.equal((await kswBadge.textContent()).trim(), "AI draft — verify before use");

  const pwoBadge = firstCard.locator(".lang-row", { hasText: "Pwo Karen" }).locator(".badge");
  assert.equal((await pwoBadge.textContent()).trim(), "Not yet added");
});

test("copy button attempts to copy the phrase to the clipboard", async () => {
  const firstCard = page.locator(".phrase-card").first();
  const copyAllBtn = firstCard.getByRole("button", { name: "Copy all languages" });
  await copyAllBtn.click();
  const handle = await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "Copied" || b.textContent === "Copy failed",
    );
    return btn ? btn.textContent : false;
  });
  assert.equal(await handle.jsonValue(), "Copied");
});

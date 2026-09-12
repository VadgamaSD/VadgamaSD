# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A single-page static web app, "Crew Translate" — an internal hotel housekeeping/safety phrasebook
(English ↔ Spanish, Burmese, S'gaw Karen, Pwo Karen). There is no build system, package manager, or
test suite: `crew-translate/index.html` is the entire application (inline `<style>` and `<script>`,
no external JS/CSS files, no dependencies beyond two Google Fonts `<link>` tags).

## Running it

Open `crew-translate/index.html` directly in a browser — there is nothing to install or build.

## Testing

There's a small Playwright + `node:test` suite under `tests/` that serves the HTML file locally and
drives it in a real (headless Chromium) browser — it's dev tooling only and doesn't add a build step to
the app itself.

```
npm install   # once, installs the `playwright` devDependency
npm test      # runs tests/*.test.mjs via `node --test`
```

To run a single test, use Node's built-in filter: `node --test --test-name-pattern="category chips"`.
Update `tests/app.test.mjs` when phrase content or DOM structure changes (e.g. phrase count assertions,
badge text, selector names).

This same file is also published as a Claude Artifact for the team to use on their phones without a
GitHub/dev environment. When editing `index.html` for a real change, republish it via the Artifact tool
to the existing artifact URL (`url:` param, not a fresh publish) so the live link stays the same instead
of forking into a new artifact.

**Capabilities constraint:** this artifact must NOT declare `db` or `sample` capabilities. Those are
org-internal on the Artifacts platform — only viewers signed into the *same Claude organization* as the
owner can use them, which breaks the page for hourly hotel staff who have no Claude account at all. The
page was originally built with `db`/`sample` (a live AI-translate tab + shared editable phrase database)
and deliberately rebuilt as capability-free static HTML for exactly this reason. Keep it that way unless
the deployment model changes (e.g., the whole team gets Claude org seats).

## Content model

All phrases live in the `phrases` array inside the `<script>` block in `index.html` — plain objects with
`category` (`housekeeping` | `safety` | `general`), `english`, and per-language fields `es`, `my`, `ksw`
(S'gaw Karen), `pwo` (Pwo Karen). A missing language field renders as "Not yet added"; a present one
always renders with an "AI draft" badge — there is no "verified" state in the UI, because no phrase here
has been confirmed by a fluent speaker yet.

Translation confidence is intentionally uneven and the UI reflects it:
- `es` / `my`: standard "AI draft — unverified" badge.
- `ksw`: a distinct, more alarming "AI draft — verify before use" badge (`badge-caution`), because S'gaw
  Karen is a low-resource language for AI translation and errors are more likely and harder to catch.
- `pwo`: left blank everywhere. Do not fill this in with AI-generated guesses — the judgment call made in
  this repo is that an unverified guess at Pwo Karen script is worse than no translation at all for a
  safety-communication tool. Only add `pwo` text that came from a real fluent speaker or interpreter.

When adding or editing phrases, preserve this pattern (all four language keys present per phrase, `pwo`
omitted/empty until real translations exist) and keep the safety disclaimers in the top `.callout` and
bottom `.footer-panel` accurate to whatever content actually ships.

## Feedback button

The header's "Feedback" link opens a pre-filled `mailto:` (built at runtime from `FEEDBACK_EMAIL`,
`FEEDBACK_SUBJECT`, `FEEDBACK_BODY` near the top of the `<script>` block) rather than posting anywhere —
there's no backend, by design (see capabilities constraint above). `FEEDBACK_EMAIL` is still a placeholder
(`feedback@your-hotel.example`); replace it with the real inbox before treating this as done.

## Design tokens

Colors, type (Fraunces for headings, Work Sans for body/UI, Noto Sans Myanmar for `my`/`ksw`/`pwo` text)
and spacing are defined as CSS custom properties in `:root` with light/dark variants — follow the existing
token names rather than hardcoding new colors if the UI is extended.

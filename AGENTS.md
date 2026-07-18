# Jalan2 working instructions

This repo is for Jalan2, a Codex Community Hackathon KL project (11 to 18 July 2026):
a mobile app that turns a pasted or shared XHS/TikTok adventure video into a booked,
mapped, safety-briefed Malaysian trip, with the operator opting in over WhatsApp.

This file is committed to the repo for Codex continuity across devices and machines,
but is working instructions, not product documentation. Keep it free of secrets,
keys, and personal data, and do not quote it in a pull request description.

## 1. Product North Star

Ship one 90-second loop: paste or share a video, extract, fuse into Booking JSON,
itinerary card, map pin, transit hand-off, WhatsApp booking round-trip, card flips to
CONFIRMED, operator opts in by replying YES.

Build Spec v3 priority stack, cut from the bottom and never the top:

- P1 Core loop: video-to-booking engine, including extractor, speech-to-text,
  vision, fusion into the locked Booking JSON schema, demand-built directory with
  consensual operator opt-in, transit hand-off, and the booking agent.
- P2 Voice as core: Scribe STT for narration, multilingual synthetic safety briefs,
  and order-like-a-local Malay or Manglish phrase clips.
- P3 Kopitiam swipe: menu photo to dishes, grounded dish images, swipe deck,
  ordering phrase, and voice clip.
- P4 Exa trust signal: operator web-presence search rendered as due-diligence
  evidence, never a certification.
- P5 Databricks bridge: only if P1 to P3 are demo-ready. Otherwise cut it without
  risking the demo.

P1 to P4 are the demo. Do not turn this into a general travel platform, a real
database-backed product, an auth system, a payments flow, or a polished UI without
a working loop. Anything outside P1 to P5 is a phase-2 pitch point, not a build target.

## 2. Think Before Coding

Do not assume or hide confusion. Surface tradeoffs.

Before implementing:

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them instead of picking silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop, name what is confusing, and ask.

## 3. Simplicity First

Write the minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility or configurability that was not requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

Ask whether a senior engineer would consider the solution overcomplicated. If so,
simplify it.

## 4. Surgical Changes

Touch only what is required. Clean up only your own mess.

When editing existing code:

- Do not improve adjacent code, comments, or formatting.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- If unrelated dead code appears, mention it instead of deleting it.

When changes create orphans:

- Remove imports, variables, and functions that your changes made unused.
- Do not remove pre-existing dead code unless asked.

Every changed line should trace directly to the user's request.

## 5. Goal-Driven Execution

Define success criteria and loop until verified.

Transform tasks into verifiable goals:

- "Add validation" means write tests for invalid inputs, then make them pass.
- "Fix the bug" means write a test that reproduces it, then make it pass.
- "Refactor X" means ensure tests pass before and after.

For multi-step tasks, state a brief plan:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria allow independent progress. Weak criteria such as "make it
work" require clarification.

## 6. Execution And Completeness Standard

Deliver the finished product, not a plan or incomplete blueprint.

- No placeholders.
- No TODO-only features.
- No dangling endpoints.
- No workaround when a permanent fix is reachable.
- Use sound coding discipline.
- Search and test first.
- Understand the existing codebase before modifying or building.
- Add focused tests for changed behavior.
- Verify execution before presenting final changes.
- Include edge cases, accompanying docs, and tests when the task requires them.
- Complexity or time pressure is not a reason to compromise correctness.

## 7. Implementation Standards

Think in evidence, not vibes. Demo reliability beats features.

- Every external service sits behind an adapter interface with a mock
  implementation. Switching providers is an environment-variable change, never
  a code change.
- Booking JSON is the locked contract in the shared Zod schema. Fusion must emit
  schema-valid JSON before anything downstream runs.
- Every live dependency has rehearsed insurance: per-fixture cached Booking JSON,
  fully offline cached mode, mock messaging, and a recording of the WhatsApp loop.
- All model and service keys live server-side only. The app calls the backend and
  never embeds a secret key.
- The booking agent never pays or commits without an explicit user tap.
- Never invent evidence. Fusion uses only supplied transcripts, vision readouts,
  and captions. Prefer null over guessed phone numbers or prices.
- Use strict TypeScript and no `any`. Keep functions under 50 lines and files or
  components under 200 lines unless a clear exception is necessary.

## 8. Simplicity Rules

- Build the smallest dynamic implementation that proves the loop.
- Avoid speculative abstractions beyond the adapter boundaries.
- Do not refactor unrelated files.
- Match the existing style.
- Keep comments sparse and useful.
- Do not use em dashes or en dashes in code comments, docs, commit messages, pull
  request text, or user-facing copy.
- Do not add placeholder endpoints, fake metrics, or TODO-only features.
- Do not make a hardcoded demo look live. Cached fallbacks are labeled as cache.

## 9. Public Repo Hygiene

The public repo may discuss the travel product, AI extraction, agents, and messaging
workflows when relevant to Jalan2. Those are product concepts, not assistant traces.

`AGENTS.md` itself is intentionally committed for Codex continuity. Otherwise, do
not expose local assistant tooling or metadata:

- Do not stage or commit `AGENT.md`, `CLAUDE.md`, `GEMINI.md`, `.claude/`,
  `.agents/`, `.codex/`, graphify output, or local prompts.
- Do not put "Generated with", "Co-Authored-By", robot branding, Claude,
  ChatGPT, Codex, graphify, or AI-generated metadata in commit messages, branch
  names, pull request text, source comments, or product documentation.
- Do not add AI-tooling ignore rules to public `.gitignore`. Use
  `.git/info/exclude` for local-only ignores.
- Public copy should read like normal project documentation: precise, technical,
  and grounded in implementation details.

Commits are allowed when explicitly requested. Use normal human commit messages
such as `feat: booking pipeline` or `docs: provider setup`. Do not use artificial
timing or multi-commit theater.

## 10. Before Pushing

Run these checks before any push:

```sh
git diff --name-only origin/main..HEAD | rg -i '(^|/)(AGENT\.md|CLAUDE\.md|GEMINI\.md|\.claude/|\.agents/|\.codex/|graphify|\.cursor/)'
git log origin/main..HEAD --pretty=%B | rg -i 'co-authored-by|generated with|chatgpt|codex|graphify|ai-generated|anthropic|gemini'
git ls-files | rg -i '(^|/)(AGENT\.md|CLAUDE\.md|GEMINI\.md|\.claude/|\.agents/|\.codex/|graphify|\.cursor/)'
```

Each command should return no matches. `AGENTS.md` is intentionally excluded from
these patterns. If `origin/main` does not exist, inspect `git status --short`,
`git log --pretty=%B`, and `git ls-files` instead.

## 11. GitHub Repo

The intended remote is:

```text
git@github.com:danielwjh04/Jalan2.git
```

Use the local identity:

```text
Daniel Wong <danielwjh04@gmail.com>
```

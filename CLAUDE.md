# Jalan2 working instructions

This repo is for Jalan2, a Codex Community Hackathon KL project (11 to 18 July 2026):
a mobile app that turns a pasted or shared XHS/TikTok adventure video into a booked,
mapped, safety-briefed Malaysian trip, with the operator opting in over WhatsApp.

This file is committed to the repo (for continuity across devices/machines) but
is working instructions, not product documentation: keep it free of secrets,
keys, and personal data, and do not quote it in a pull request description.

## 1. Product North Star

Ship one 90-second loop: paste (or share) a video, extract, fuse into Booking JSON,
itinerary card, map pin, transit hand-off, WhatsApp booking round-trip, card flips to
CONFIRMED, operator opts in by replying YES.

Jalan2 should:
- Feature 1: video-to-booking engine (extractor, speech-to-text, vision, fusion into
  a locked Booking JSON schema).
- Feature 2: demand-built directory with consensual operator opt-in. No speculative
  spam, no PII harvesting.
- Feature 3: transit hand-off. Map pins plus an EasyBook/redBus deep-link. A hand-off,
  not an integration.
- Feature 4: booking agent. Real WhatsApp send plus inbound webhook that flips the
  itinerary to CONFIRMED.
- Feature 5 (optional polish, cut first): trust badge plus spoken safety brief.

Features 1 to 4 are the demo. Do not turn this into a general travel platform, a real
database-backed product, an auth system, a payments flow, or a polished UI without a
working loop. Anything not in features 1 to 5 is a phase-2 sentence in the pitch, not
a build target.

## 2. Think Before Coding

Do not assume. Do not hide confusion. Surface tradeoffs.

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them instead of picking silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop, name what is confusing, and ask.

## 3. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility or configurability that was not requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

Ask: would a senior engineer say this is overcomplicated? If yes, simplify.

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

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass."
- "Fix the bug" -> "Write a test that reproduces it, then make it pass."
- "Refactor X" -> "Ensure tests pass before and after."

For multi-step tasks, state a brief plan:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria allow independent progress. Weak criteria such as "make
it work" require clarification.

## 6. Execution And Completeness Standard

Deliver the finished product, not a plan or incomplete blueprint.

- No placeholders.
- No TODO-only features.
- No dangling endpoints.
- No workaround when a permanent fix is reachable.
- Always do dynamic coding with good coding discipline.
- Search and test first.
- Understand the existing codebase before modifying or building.
- Add focused tests for changed behavior.
- Verify execution before presenting final changes.
- Include edge cases, accompanying docs, and tests when the task requires them.
- Complexity or time pressure is not a reason to compromise correctness.

## 7. Implementation Standards

Think in evidence, not vibes. Demo reliability beats features.

- Every external service (video extractor, speech-to-text, messaging, TTS) sits
  behind an adapter interface with a mock implementation. Switching providers is
  an env var change, never a code change.
- Booking JSON is the locked contract (zod schema in shared/). The fusion step must
  emit schema-valid JSON before anything downstream runs.
- Every live dependency has rehearsed insurance: per-fixture cached Booking JSON,
  a fully offline cached pipeline mode, the mock messaging provider, and a
  screen-recording of the WhatsApp round-trip.
- All model and service keys live server-side only (backend env vars). The app
  calls the backend; it never embeds a key.
- Human-in-the-loop: the booking agent never pays or commits without an explicit
  user tap.
- Never invent evidence. Fusion uses only the supplied transcript, vision readout,
  and caption. Prefer null over a guessed phone number or price. Confidence and
  raw_evidence must reflect the actual sources.
- Strict TypeScript, no any. Functions stay under 50 lines; files and components
  stay under 200 lines.

## 8. Simplicity Rules

- Build the smallest thing that proves the loop. But no hardcoding and ensure everything is dynamic.
- Avoid speculative abstractions beyond the four adapter interfaces.
- Do not refactor unrelated files.
- Match the existing style once the repo has one.
- Keep comments sparse and useful.
- No em dashes or en dashes in code comments, docs, commit messages, PR text, or
  user-facing copy.
- No placeholder endpoints, fake metrics, or TODO-only features.
- If a hardcoded demo would make the system look better than it is, do not do it.
  Cached fallbacks are tagged as cache internally, never passed off as live output.

## 9. Public Repo Hygiene

The public repo can and should discuss the travel product, AI extraction, agents,
and messaging workflows when relevant to Jalan2. Those are product concepts, not
traces of assistant tooling.

CLAUDE.md itself is committed (see above), but the public repo must not
otherwise expose local assistant tooling or assistant metadata:
- Do not stage or commit `AGENT.md`, `AGENTS.md`, `GEMINI.md`, `.claude/`,
  `.agents/`, `.codex/`, graphify output, or local prompts.
- Do not put "Generated with", "Co-Authored-By", robot branding, Claude,
  ChatGPT, Codex, graphify, or AI-generated metadata in commit messages, branch
  names, PR titles, PR bodies, source comments, or docs.
- Do not add AI-tooling ignore rules to public `.gitignore`; use
  `.git/info/exclude` for local-only ignores.
- Public copy should read like normal project documentation: precise, technical,
  and grounded in implementation details.

Commits are allowed when explicitly requested. Use normal human commit messages
such as `feat: booking pipeline` or `docs: provider setup`. Do not use artificial
timing or multi-commit theater; just keep the public history clean.

## 10. Before Pushing

Run these local checks before any push:

```powershell
git diff --name-only origin/main..HEAD | Select-String -Pattern '(^|/)(AGENT\.md|AGENTS\.md|GEMINI\.md|\.claude/|\.agents/|\.codex/|graphify|\.cursor/)' -CaseSensitive:$false
git log origin/main..HEAD --pretty=%B | Select-String -Pattern 'co-authored-by|generated with|chatgpt|codex|graphify|ai-generated|anthropic|gemini' -CaseSensitive:$false
git ls-files | Select-String -Pattern '(^|/)(AGENT\.md|AGENTS\.md|GEMINI\.md|\.claude/|\.agents/|\.codex/|graphify|\.cursor/)' -CaseSensitive:$false
```

(CLAUDE.md itself is intentionally tracked, so it is excluded from these
patterns; the `claude` keyword is dropped from the commit-message scan for
the same reason it would otherwise self-match this file's own history.)

Each command should return no matches. If `origin/main` does not exist yet, run
the same checks against the current branch contents with `git status --short`,
`git log --pretty=%B`, and `git ls-files`.

## 11. GitHub Repo

The intended remote is:

```text
git@github.com:danielwjh04/Jalan2.git
```

Use the local identity:

```text
Daniel Wong <danielwjh04@gmail.com>
```

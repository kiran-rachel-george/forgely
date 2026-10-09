# Product Requirements Document: Forgely

Status: Draft, derived from the current codebase. Date: 2026-10-08.

## 1. Summary

Forgely lets a non-expert turn a text description into a working, editable web front end in seconds. Users describe an app, watch it generate, preview it live, refine it through chat, and download or deploy it.

## 2. Problem

Starting a UI project means scaffolding, picking libraries and writing boilerplate before anything is visible. Founders, designers and students want a working prototype from an idea, with the option to edit the real code afterwards.

## 3. Target users

| Persona | Need |
|---|---|
| Founder / PM | Quick clickable prototype to validate an idea |
| Designer | Turn a concept into real React and Tailwind code |
| Student / hobbyist | Learn by editing generated code |
| Developer | Skip boilerplate, export a starting point |

## 4. Goals and non-goals

**Goals**
- Prompt to a visible, working preview in under 60 seconds
- Safe iteration: every change is versioned and reversible
- Simple account and project management

**Non-goals (current release)**
- Generating backends, databases or server code. Output is frontend-only with mocked data.
- Real-time multi-user collaboration
- Native mobile apps

## 5. Current functionality (as built)

| Area | Behaviour | State |
|---|---|---|
| Auth | Email/password, Google OAuth, session cookies, route protection for `/dashboard` and `/project` | Working |
| Dashboard | List, create, rename and delete projects | Working |
| Generation | Streaming from Gemini via an OpenAI-compatible API, parsed into files | Working |
| Workspace | File explorer, Monaco editor, live preview, terminal, resizable panes, multi-tab | Working |
| Preview | WebContainer dev server, with a Babel + Tailwind inline fallback | Working |
| Chat | Follow-ups with the last N messages as context, undo | Working |
| Versions | Auto-save per generation, diff view, restore | Working |
| Export | Download as ZIP | Working |
| Credits | `users.credits` column (default 10) | Stored only, not enforced |
| Billing | Pricing page and buy-credits modal | Placeholder / unused |
| Deploy | Deploy button | No handler |
| Workspaces / public projects | Tables and columns exist | Not used in the UI |

## 6. Requirements

### 6.1 Must have (before public launch)

| ID | Requirement |
|---|---|
| M1 | Enforce credits: check before generation, deduct atomically, refund on failure. Return 402 with a clear message when empty. |
| M2 | Rate-limit `/api/generate` per user and cap request body, prompt and history sizes. |
| M3 | Store session tokens in `httpOnly` cookies, using `@supabase/ssr` server helpers. Verify tokens in middleware. |
| M4 | Validate every API input with a schema (zod): types, lengths, allowed roles, and a maximum size for `previousFiles`. |
| M5 | Save generation results transactionally. A failed DB write must not leave a streamed response that was never saved. Surface the error to the client. |
| M6 | Remove or hide non-functional UI (Deploy, buy credits, fake testimonials and referral text) until implemented. |
| M7 | Version numbers allocated atomically (DB function or retry on the unique-constraint conflict). |
| M8 | Security headers (CSP, X-Frame-Options, Referrer-Policy) and a documented COOP/COEP exception for project pages. |
| M9 | CI running lint, typecheck and build on every pull request, plus a minimal test suite (see section 9). |

### 6.2 Should have

| ID | Requirement |
|---|---|
| S1 | Password reset and email-change flow. |
| S2 | Model selection wired to the backend (persist `projects.ai_model`). |
| S3 | Real deployment: one-click publish to a hosting provider or a shareable public URL (`is_public`). |
| S4 | Payments (e.g. Stripe or Razorpay) for credit packs and plans, with webhooks. |
| S5 | Structured logging and error tracking. Replace `console.log` debugging in the preview code. |
| S6 | Auto-trim context: send only the files relevant to the request and respect model token limits. |
| S7 | Generated-code safety: run previews in a sandboxed iframe and warn on risky output. |

### 6.3 Could have

- Workspaces and team sharing, using the existing `workspaces` table
- Templates gallery
- Import from GitHub, export to GitHub
- Backend scaffolding (Supabase) as an opt-in project type
- Usage analytics dashboard

## 7. Key user flows

1. **First run:** landing page, enter a prompt, sign up, project is created, generation starts, the workspace opens with the preview.
2. **Iterate:** type a follow-up in chat, a new version is generated and saved, the preview updates.
3. **Recover:** open version history, diff, restore. The restore creates a new version, so nothing is lost.
4. **Export:** download ZIP, or deploy (once S3 ships).

## 8. Data model

`users` (credits, plan) 1:N `projects` 1:N `versions` and `messages`. `workspaces` is optional and not yet used. Row-level security restricts every table to its owner. The server uses the service-role key and enforces ownership manually through `ensureProjectOwnership`.

## 9. Success metrics and quality bar

| Metric | Target |
|---|---|
| Prompt to first preview | p50 under 30 s, p90 under 60 s |
| Generation success rate (valid, buildable output) | at least 90% |
| Day-7 retention of signups | track from launch |
| Prompts per active user per week | track from launch |

Test plan (minimum): unit tests for `file-converter` parsing, which is the most fragile piece of logic; API tests for ownership checks and the 401/404 paths; one end-to-end test covering signup, generate and restore.

## 10. Risks

| Risk | Mitigation |
|---|---|
| AI cost abuse | Credits enforcement, rate limits, request size caps (M1, M2) |
| Malformed model output breaks the preview | Parser repair plus validation, retry on failure |
| Token theft through XSS | httpOnly cookies and CSP (M3, M8) |
| Browser support for WebContainers (needs Chromium and cross-origin isolation) | Keep the inline-preview fallback |
| Provider lock-in or model deprecation | Model and base URL are configurable through environment variables |

## 11. Open questions

- Pricing and credit cost per generation
- Hosting target for published apps
- Whether to keep Gemini as the default model or add a model picker at launch
- Licence for the open-source release

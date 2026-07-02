# HANDOFF — influ-app-frontend (deploy continuation)

> Local handoff note. **Not committed** — read once to get oriented.
> Repo state at handoff: branch `main`, clean, synced with `origin/main` (tip `f2310fa`).

## Current State

- **NOT deployed yet.** Target: **Vercel.** The backend it talks to is **live** at https://influ-app-backend.onrender.com.
- **Repo:** `main` clean, synced with origin (tip `f2310fa`).
- **API wiring:** the whole app reads a single build-time env var **`NEXT_PUBLIC_API_URL`** (defaults to `http://localhost:3001`). No hardcoded prod/tunnel URLs anywhere.
- **Proven working:** `next build` compiles clean and `tsc --noEmit` is clean (prior deploy-readiness pass). The Brand dashboard "**applications to review**" attention item is wired (`f2310fa`) and depends on backend fields that are **live** on backend `main`.
- **Deliberately NOT done (and why):**
  - Not deployed to Vercel yet (that's step 1).
  - **Dark mode never visually verified** on a deployed build — only reasoned about via design tokens.
  - Public info pages (`/how-it-works`, `/creators`, `/agencies`) are **placeholder**.
  - **Campaigns list/create still use mock data** (`src/mock/brand-campaigns.ts`); **Smart Plan AI brief is a stub**. (See CLAUDE.md mock-vs-real table.)
- **Recent work merged:** full visual redesign (Tier 0–4 + Discover shelves + polish, commits `ea660ae..5ff6c1d` and later), brand dashboard reworked with a "Needs your attention" section (live conversations + applications + payments), influencer dashboard's previously-dead buttons (Find Campaigns / View Messages / Apply Now / Details) now wired and functional. The end-to-end smoke test in step 4 should exercise these, not just baseline auth/dashboard/messaging.

## Deliberate Decisions (don't second-guess / redo)

- **`NEXT_PUBLIC_API_URL` is inlined at BUILD time** — it MUST be set on the Vercel project (Production) **before** the build runs, not just at runtime. This is the only frontend env var.
- **No `vercel.json` needed** for standard Next.js — don't add one expecting it's required.
- **Brand dashboard reads application `status`/`origin` straight off the campaigns list** (not a separate endpoint), backed by a deliberately widened backend select. **Don't refactor to per-campaign fetches (N+1).**
- **Backend is free tier → cold starts.** The first request after idle is slow (~10–30s). No frontend code change needed — just don't mistake it for a bug.

## Immediate Next Steps (in order)

1. **Deploy to Vercel.** Set `NEXT_PUBLIC_API_URL=https://influ-app-backend.onrender.com` in the Vercel project (Production) **before building**.
2. **Once the Vercel URL exists**, have the backend owner set **`FRONTEND_URL`** on Render to that URL — otherwise CORS blocks all browser calls (backend currently allows only `localhost:3000`).
3. **Live dark-mode pass** across all three roles (Brand / Agency / Influencer) on the deployed build — never visually verified, only reasoned via tokens. Most-worth-checking surfaces: **sidebar active indicators, dashboard header, tracking page gradients, messages chat bubbles, profile surfaces, Discover cards.**
4. **End-to-end smoke test against the live backend:** register → role select → login → dashboard KPIs → Discover search → messaging → create a campaign. (Auth / dashboard / Discover / messaging **and campaigns** are all **real** backend — campaign create/update/delete persist; include a campaign create + refresh in the smoke test.)

## Things NOT to do without asking

- **Don't point `NEXT_PUBLIC_API_URL`** at a tunnel/localhost/anything but the live backend URL in a prod build.
- **Don't assume campaigns / Smart Plan are real** — they're mock/stub. Don't wire destructive UI expecting a backend to be there.
- **Don't debug a deployed "CORS error" as a frontend bug** — it's almost certainly the backend's missing `FRONTEND_URL` (step 2).
- **Backend deploy nuance:** the backend deploys from `main` (its free-tier config comes from a `render-free-test` Blueprint, but the code is `main`). Confirm the live backend commit before debugging cross-repo issues rather than assuming a fresh push is live.

## Who to ask

- **Nontapat (kimcastergamer@gmail.com)** for: Vercel + Render dashboard access, real env values, and product decisions.
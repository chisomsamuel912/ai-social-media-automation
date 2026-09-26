# Private Beta Kit — $0 MVP

**Goal:** 10–20 real small businesses feel “my social is handled.” Bill stays $0.

## Before inviting anyone

- [ ] Supabase free project created; SQL in `supabase/migrations` applied (0001–0003).
- [ ] Storage buckets created: `brand-assets`, `uploads`, `generated-templates` (or skip uploads; URL-based media works).
- [ ] `.env` on the host: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `AI_PROVIDER=template`.
- [ ] Deployed to Vercel Hobby (free) from `main`. Cron: add `GET /api/cron/dispatch` on a free schedule (optional — device reminders work without it).
- [ ] CI green: unit + build + Playwright loop (`tests/e2e/loop.spec.ts`).
- [ ] Open `/privacy` and `/terms` render; “Delete my data” tested on a throwaway business.

## $0 bill guards

- Supabase dashboard: DB < 400MB, bandwidth < 2GB, else pause new invites.
- Vercel Hobby: 1 project, preview deploys pruned.
- Quotas in-app: 20 plans/day, 50 renders/day per IP; rate limits on all hot routes.
- No paid AI keys on the server. Businesses may paste their own free-tier keys later (BYO), never required.

## Invite script (WhatsApp-friendly)

> “I built a small tool that plans a week of WhatsApp/Facebook posts for you — you review, tap approve, it reminds you when to post. Free while in beta. 3-minute setup. Want in?”

## Onboarding each business (concierge)

1. Watch them finish `/onboarding` — note anything >3 min or confusing.
2. Add 3–5 verified facts on `/brand` (real prices first — this is what stops AI invention).
3. Generate one plan in `/autopilot`, approve to `/schedule`, copy-pack one post live with them.
4. Log 2–3 results, run learning on `/results`, show them the insight card.

## Success survey (ask after week 2)

1. “I don’t worry about what I’m posting anymore.” (1–5)
2. “Reviewing + approving took less than 20 min/week.” (yes/no)
3. “I got at least one customer conversation from a post.” (yes/no)
4. “What should the AI stop doing?” (free text)

**Ship bar:** ≥70% agree on Q1 across 10+ businesses.

## Red-team before scaling invites

- [ ] 20 adversarial promo prompts → zero invented prices (promo-guard + MissingInfoBanner).
- [ ] Retry Approve All twice → zero duplicate queue items (idempotency keys).
- [ ] Follow-up a fake lead 3× → stops at 2; mark purchased/opt-out stops instantly.
- [ ] Expired/missing Supabase keys → clean offline messages, no crashes, no data loss (drafts in localStorage).

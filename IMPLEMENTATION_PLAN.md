# Implementation Plan — AI Social Media Growth & Automation Platform ($0 MVP)

**Sources:** `AI SOCIAL MEDIA GROWTH &AUTOMATION PLATFRORM.md` (MVP PRD) + `README.md`
**Status:** Pre-implementation. No code yet.
**Constraint:** $0 MVP first. Free tiers only. No paid services or unnecessary infra.
**Allowed now:** Next.js, TypeScript, Tailwind, shadcn/ui, Supabase, provider-agnostic AI interface.
**Banned until actually required:** Replicate, Inngest, Trigger.dev, PostHog, Sentry, Prisma/Drizzle, paid AI models.
**Goal:** “I need to post something.” → “My social media is being handled.”
**Platform scope:** WhatsApp + Facebook only for MVP. Instagram, TikTok, YouTube, LinkedIn deferred to post-MVP.
**Core loop:** Profile → Plan → Create → Template visuals (WhatsApp 1:1 + Facebook) → WhatsApp/Facebook formatting → Review → Approve → Schedule/Remind → Mark posted → Monitor (manual) → Learn → Replies/Leads/Follow-up → Repeat

> Upgrade-ready: every banned tool has a defined insertion point. Do not pre-build abstractions beyond a thin interface.

---

## 1. $0 Rules (binding)

1. If it costs money or needs a credit card, do not add it.
2. Use Supabase Free (Postgres + Auth + Storage) as the only backend. No extra DB, queue, or analytics service.
3. No ORM. Use `@supabase/supabase-js` + SQL files in `/supabase/migrations`. Keeps zero deps and easy Prisma/Drizzle adoption later.
4. No job service. Use DB-as-queue (status columns) + Next.js Route Handlers + Vercel Cron (free) + manual “Run now” buttons.
5. No paid AI. Ship `AIProvider` interface with free-first providers: Ollama (local dev, $0), Gemini Flash free tier / Groq Llama free tier (user brings free key), template fallback when no key. Never hardcode OpenAI/Replicate.
6. No generated images/video APIs. Visuals = code-rendered templates (Tailwind/SVG/Canvas) + user uploads. AI supplies text/headlines only.
7. No PostHog/Sentry. Use Vercel logs + Supabase `app_logs` table + simple `/api/health` + user feedback form.
8. WhatsApp + Facebook publish only: Remind Me + copy-pack per platform (WhatsApp: message + 1:1 image + wa.me CTA; Facebook: post text + image/link + Page/profile deep-link) + mark-posted. No auto-post APIs in MVP. Add other platforms one at a time post-MVP.
9. Every phase must end in a usable $0 slice. If a task needs a banned tool, split it: ship manual/template version now, flag auto/paid version as upgrade.

**Upgrade triggers (only then consider paid):**
Replicate → users reject template visuals in testing; Inngest/Trigger → Vercel Cron + DB queue misses SLAs; Prisma → Supabase client queries unmaintainable; PostHog/Sentry → cannot diagnose with logs; paid AI → free models fail evals.

---

## 2. Phase 0 — Design System v2: Sleek Dark Pro (2026, $0, no new deps)

Goal: calm, mature, premium tool for non-expert owners. Soft muted palette, never harsh black or neon. Direction locked per user: **soft smooth light, muted moss + warm paper**.
Deliverable: soft tokens + shadcn light components + app-shell mock (`design-system-preview.html`) + 7-screen wireframes.

- Principles: 1 action/screen, defaults over config, plain language (“7 posts ready” not scores), mobile-first review.
- IA: `/home /autopilot /create /schedule /customers /results /brand /onboarding` (same as PRD §28).
- Onboarding 5 steps <3 min: Business → Audience → Preferences → Platforms (WhatsApp + Facebook fixed, frequency + Remind Me) → Sales (WhatsApp default) + Dates.
- Visual: soft light theme — paper #F4F2ED, card #FBFAF7, sand #ECE9E2, moss #4A5D4E (no black, no neon).
- Type: editorial premium — Fraunces serif headings, Inter body 14px, tabular-nums. Radius 10–14, soft 1px borders #E3DED2. Brand colors only inside previews.
- Components: shadcn base only + custom `PostPreviewCard, ReviewBatchHeader, FormatPicker, MissingInfoBanner, LeadCard, InsightCard, AttentionQueueItem, GuideMeInput` built from shadcn primitives.
- States for every async view: skeleton → content → empty (with example) → error (retry). Review states: ready/regenerating/missing-info/failed.
- A11y: AA contrast, keyboard review actions, aria-live progress, alt text required.
- Exit: wireframes approved, 5 mock onboardings <3 min.

No cost: Figma free / v0 free tier, no paid UI kits.

---

## 3. Phase 1 — $0 Architecture Decisions

### 3.1 Stack

| Layer | $0 Choice | Upgrade path |
|---|---|---|
| Web + API | Next.js 14+ App Router + TS (Vercel Hobby free) | Same, scale plan later |
| UI | Tailwind + shadcn/ui + Lucide | Same |
| Data/Auth/Storage | Supabase Free (Postgres + Auth + Storage) | Paid tier only if limits hit |
| DB access | Supabase JS client + raw SQL migrations | Add Prisma/Drizzle only when queries unmaintainable |
| AI | `AIProvider` interface, free-first: Ollama local + Gemini Flash / Groq free (BYO free key) + deterministic template fallback | Plug OpenAI/Claude/Replicate behind same interface later |
| Images/video | Template renderer (HTML/SVG/Canvas via satori/canvas, no API) + user uploads, WhatsApp 1:1 + Facebook sizes first | Add Replicate/Runway only if templates rejected |
| Jobs/scheduling | DB status columns + Route Handlers + Vercel Cron free + manual triggers | Migrate to Inngest/Trigger when volume/SLA demands |
| Observability | Vercel logs + `app_logs` table + health endpoint | Add Sentry/PostHog only when logs insufficient |
| Tests | Vitest + Playwright (free, local + GH Actions free) | Same |

Monorepo (single repo, no Turborepo):
```
/app                    # routes + /api/...
/components/ui          # shadcn
/components/custom      # preview/lead/insight cards
/lib/ai                 # provider.ts, free-providers, planner, whatsapp + facebook adapters, memory, guards
/lib/social             # whatsapp + facebook: copy-pack + remind-me + wa.me / Page deep-link helpers (no auto-post SDKs; other platforms post-MVP)
/lib/scheduling         # time-picker heuristic (pure function)
/lib/templates          # image/carousel/slideshow renderers
/supabase/migrations    # SQL only
/public
/tests
```

### 3.2 AI Interface (provider-agnostic, $0)

```ts
// lib/ai/provider.ts
export interface AIProvider {
  name: string; // 'ollama' | 'gemini-free' | 'groq-free' | 'template'
  plan(input: PlanInput): Promise<ContentIdea[]>;
  generate(idea: ContentIdea, platform: 'whatsapp' | 'facebook'): Promise<Variant>; // WhatsApp + Facebook only; IG/TikTok/YT/LinkedIn adapters post-MVP
  reply(context: ReplyContext): Promise<{text: string; confidence: number}>;
  classifyLead(text: string): Promise<{isLead: boolean; score: number}>;
}
// Select via env: AI_PROVIDER=template|ollama|gemini|groq. Missing key → template fallback, never crash.
```

- Prompts in `/lib/ai/prompts/*.md`, zod-validated JSON, temps fixed (plan 0.7, generate 0.8).
- Free-model policy: short outputs, JSON mode, retry once, then template fallback.
- WhatsApp adapter (pure function): short message + hook first line + 1 CTA (wa.me link) + optional 1:1 image; Status/broadcast-safe length. Facebook adapter (pure function): post text (hook + 2-4 lines + optional link) + image note, no hashtags spam. Other platform adapters deferred.
- No business-fact invention: all facts from `verified_facts`; missing → `MissingInfoBanner`.

### 3.3 Data Model (Supabase SQL, no ORM)

```sql
businesses (id uuid pk, owner_id uuid, name text, description text, sales_channels text[], publishing_mode text, posting_frequency text);
content_profiles (business_id pk fk, audience_json jsonb, tone text, topics text[], avoid_topics text[], goals text[], important_dates jsonb);
brands (business_id pk fk, logo_url text, colors text[], visual_style text, writing_style text, avoid_list text[]);
media_assets (id uuid pk, business_id fk, url text, type text, tags text[]);
verified_facts (business_id fk, key text, value text, source text);
content_ideas (id uuid pk, business_id fk, topic text, angle text, format text, pillar text, event_ref text, status text);
posts (id uuid pk, business_id fk, idea_id fk, status text, scheduled_at timestamptz);
post_variants (post_id fk, platform text, caption text, hashtags text[], script text, media_url text, status text); -- MVP: platform='whatsapp' | 'facebook' only
content_history (business_id fk, topic text, angle text, hook text, format text, platform text, created_at timestamptz); -- MVP: 'whatsapp' | 'facebook'
post_metrics (variant_row bigint fk, views int, reach int, likes int, comments int, shares int, clicks int, leads int, pulled_at timestamptz);
learnings (business_id fk, insight_text text, confidence numeric, applied_count int);
customers (business_id fk, handle text, platform text, interested_in text, context_json jsonb, status text);
conversations (customer_ref bigint fk, messages_json jsonb, needs_owner bool, follow_up_at timestamptz, follow_up_count int);
app_logs (created_at timestamptz, level text, scope text, message text, meta jsonb);
```

- pgvector deferred: dedupe via normalized text match + 30d rule. Add pgvector (still free) only if rules fail.
- Buckets (free): `brand-assets, uploads, generated-templates`.
- RLS: owner-only per `business_id`; service key server-only.
- Queue pattern: `posts.status` + `scheduled_at`; cron or button flips ready→scheduled→published; no external queue.

### 3.4 Scheduling Without Job Service

- `lib/scheduling/pickTime.ts`: pure function (WhatsApp + Facebook audience baseline, e.g. mornings/evenings WAT + history). No ML service.
- Dispatch: `GET /api/cron/dispatch` checks due rows, marks published or creates Remind-Me task. Triggered by Vercel Cron free + “Run now” button. Idempotency key `post_id:platform`.
- Follow-ups: same pattern, `follow_up_at` + max 2 + stop conditions.

---

## 4. Phased $0 Build

### Phase 2 — Foundations (Week 1-2, $0)

- [ ] Next.js+TS+Tailwind+shadcn init, ESLint/Prettier, Vitest + Playwright smoke, GH Actions free CI.
- [ ] Supabase free project, SQL migrations v1, Auth email+Google, 3 buckets, RLS.
- [ ] `AIProvider` + `template` provider working with zero keys; Ollama optional local.
- [ ] App shell: 7 empty routes + health endpoint + `app_logs` writer.
- Exit: signup → empty dashboard, CI green, $0 spent.

### Phase 3 — Onboarding/Profile/Brand/Media (Week 3-4)

- [ ] 5-step wizard, drafts, completeness score. Defaults: WhatsApp + Facebook fixed, Let AI decide frequency, Remind Me first; sales channel defaults to WhatsApp.
- [ ] Brand editor + Media Library upload/tag/filter + Verified Facts editor.
- [ ] Media rule (code, no AI): product post → suggest real photo; educational → template.
- Exit: 5 test businesses onboarded. Zero paid AI calls.

### Phase 4 — Content Engine, Free-AI Only (Week 5-7, highest risk)

- [ ] `planner` via provider with template fallback; rotation value→engagement→story→promo, promo ≤40%.
- [ ] Two adapters only: WhatsApp (short message + hook + 1 wa.me CTA + 1:1 image note) and Facebook (post text + image/link note). No IG/TikTok/YT/LinkedIn in MVP.
- [ ] Dedupe without vectors: normalized match + 30d window + rejected-history. UI “0 recent duplicates”.
- [ ] `promo-guard`: code check vs `verified_facts`; missing → banner.
- [ ] Events/trends stub: static holiday JSON + manual trend box + fit checklist (≥4/5).
- [ ] Create Content mode reuses pipeline with prompt override.
- Exit: 7 ideas × 2 platforms (WhatsApp + Facebook) drafts, no dupes, 20 adversarial promos invent nothing. Works with `AI_PROVIDER=template`.

### Phase 5 — Template Visuals (Week 8-9, $0)

- [ ] Templates: quote/tip/list/promo/announcement/carousel/slideshow-script. Brand colors + logo + headline injected.
- [ ] Renderer: React → SVG/satori/canvas → PNG in `generated-templates`. No external image API.
- [ ] Format switch re-renders locally.
- Exit: every post has preview media, local render p95 <10s.

### Phase 6 — Review/Approve/Schedule/WhatsApp Remind-Me Publish (Week 10-11)

- [ ] Review screen: batch header + Redo/AI-Edit/Manual/Reject + FormatPicker + Approve All. Preview cards: WhatsApp-style (message bubble + 1:1 image + CTA) and Facebook-style (post + image/link).
- [ ] Scheduler: suggested time (pure function) editable; dispatch route + Cron + manual run.
- [ ] Publish v1 = Remind Me + copy-pack per platform (WhatsApp: message + 1:1 image + wa.me link for Status/broadcast/direct; Facebook: post text + image/link for Page/profile) + mark-posted + manual metrics entry. No auto-post API in MVP.
- Exit: plan → review → approve → reminded → posted to WhatsApp + Facebook, no double-send on retry.

### Phase 7 — Results + Learning, Manual-First (Week 12-13)

- [ ] Results reads `post_metrics` (manual entry + CSV import first).
- [ ] Weekly learner = SQL aggregates → `learnings` → planner weight tweak. No ML service.
- Exit: 2 weeks sample data shifts mix.

### Phase 8 — Comments/Leads/Follow-up, Safe + Manual (Week 14-15)

- [ ] WhatsApp reply inbox (manual paste first) + Facebook comment watcher (manual paste first): suggested reply one-tap copy; question → facts-only RAG; low-confidence → escalate, no auto-send. WhatsApp is content + sales channel (native wa.me link); Facebook routes to WhatsApp/website.
- [ ] Lead classifier via provider or keyword fallback → card + WhatsApp CTA.
- [ ] Follow-up queue: 24-72h, max 2, stop on purchase/opt-out/disable; manual send first.
- [ ] Customer memory minimal, delete on request.
- Exit: red-team safe, caps verified.

### Phase 9 — Harden + Beta ($0, Week 16-17)

- [ ] Attention queue, all states, feedback form, funnel logged to Supabase.
- [ ] In-code rate limits, audit table, privacy/terms, data-deletion button.
- [ ] Quota counters (plans/day, renders/day). Playwright E2E full loop.
- [ ] Beta 10-20 businesses on free tiers, “handled” survey.
- Exit: beta live, $0 bill.

### Phase 10 — Paid Upgrades (only on trigger, not now)

Backlog: Instagram/TikTok/YouTube/LinkedIn adapters + auto-post APIs (incl. Facebook Graph auto-post later), Replicate, Inngest, Prisma, PostHog/Sentry, paid AI, pgvector, advanced CRM. Each needs written trigger + eval first.

---

## 5. API Contracts ($0)

```
POST /api/onboarding
POST /api/autopilot/plan        {businessId, guide?, count?} → ideas[]
POST /api/content/create        {businessId, prompt} → variants
POST /api/posts/:id/{regenerate,edit,reject,approve,format}
POST /api/schedule/approve-all
GET  /api/schedule /api/results /api/customers /api/health
GET  /api/cron/dispatch          (Cron + manual button; idempotent)
POST /api/metrics/import        (manual/CSV first)
```

No workers; long renders run in-request with progress + retry.

---

## 6. Testing (free)

Vitest + Playwright only. Pre-beta: 20 adversarial promos → zero inventions; 50 gens → zero 30d dupes; WhatsApp checks (short message, hook first, 1 wa.me CTA, 1:1 media) + Facebook checks (hook + concise post + image/link, no hashtag spam); 30 templates rated; retry storm → 1 row; follow-ups ≤2; missing key → template fallback offline.

---

## 7. DevOps/Security ($0)

`main` + PR previews (Vercel Hobby), GH Actions free, secrets in Vercel/Supabase only, RLS everywhere, Vercel + `app_logs`, rollback = redeploy + SQL down-migration, minimal PII + delete-account purge.

---

## 8. Metrics (no paid analytics)

Supabase queries only: time-to-first-plan, Approve-All-clean %, edit rate, remind→posted (WhatsApp + Facebook) %, lead→WhatsApp CTR, opt-out %, “handled” ≥70%. Tech: p95 plan→ready, render p95, dispatch success %, cost = $0, usage <80% quota.

---

## 9. Next Steps This Week ($0)

1. Scaffold Next.js+TS+Tailwind+shadcn + Supabase free + SQL v1 + Auth.
2. Build `AIProvider` + template provider; verify loop with no keys.
3. Ship tokens + WhatsApp + Facebook preview cards + onboarding prototype (both platforms fixed).
4. Seed 2 businesses; run 20-prompt promo red-team on template provider.

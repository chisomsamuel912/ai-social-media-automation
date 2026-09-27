# PRD — AI Social Media Growth & Automation Platform

Source: `AI SOCIAL MEDIA GROWTH &AUTOMATION PLATFRORM.md` (full MVP product definition).
Status: Planning document for assessment Task 1. No application build is performed in this task.

---

## 1. Product Overview

The AI Social Media Growth & Automation Platform is an AI-powered social media assistant for businesses that cannot afford a social media manager. Instead of the owner acting as strategist, writer, designer, scheduler, publisher, and analyst, the AI handles the content work end to end.

Core promise: **Give the AI direction once. Let it handle the content work.**

Product philosophy: **powerful behind the scenes, extremely simple for the business owner.** The owner sets up a business/content profile once, reviews AI-generated posts, approves them, and lets the system schedule, publish (or remind), monitor performance, learn what works, handle routine customer comments, detect leads, and follow up within safeguards.

Positioning: not "an AI that writes captions" but **an AI social-media employee** — it remembers the business, plans content, creates posts and matching visuals, adapts them per platform, publishes, watches results, learns, handles simple customer interactions, identifies leads, and follows up. The owner mainly does: set direction → review → approve.

---

## 2. The Problem

Small businesses depend on social media for awareness, engagement, leads, and sales, but they:

- Don't know what to post consistently and repeat the same ideas.
- Spend too much time creating content (captions, images, videos).
- Don't know how to adapt one idea to different platforms.
- Forget to post and don't know what performs well.
- Struggle to create good visuals and to respond to customers consistently.
- Lose potential customers who show interest but never get a follow-up.
- Can't afford to hire a social media manager.

Existing AI tools generate captions, but the owner still has to do every other job. This product removes that workload rather than adding another tool to it.

---

## 3. Target Users

Primary: small business owners, creators, and service businesses that rely on social media for awareness, engagement, leads, sales, and customer communication.

Examples: fashion, restaurants, beauty, coaches, consultants, online stores, service providers, personal brands, local businesses, education, finance creators, real estate.

The product supports many niches through one mechanism: each business's Content Profile makes the AI behave specifically for that business.

---

## 4. Main User Journey

**Setup once:** Business Profile → Content Profile → Brand → Platforms → Sales Channel.
The owner provides business info, audience, tone/topics, platforms, posting frequency (default: let AI decide), publishing mode (Auto Publish / Remind Me), sales channel (e.g. WhatsApp), and key business facts such as prices.

**Then repeatedly (Auto Pilot loop):**

Business Profile → AI understands business → AI plans content → AI creates posts → AI creates matching visuals → AI adapts content for platforms → User reviews → User approves → AI schedules/publishes → AI monitors performance → AI learns → AI improves future content → AI handles relevant comments/leads → AI follows up when appropriate → Repeat.

A second entry point, **Create Content**, lets the owner start from something specific ("new product", "discount", "event") and the AI turns it into platform-ready posts. This loop is the heart of the product: success means moving the owner from "I need to post something" to "my social media is being handled."

---

## 5. Ordered Implementation Phases

### Phase 1 — Project Foundation

Concrete outputs:

- Next.js + TypeScript project scaffold with Tailwind CSS styling.
- Local Postgres database with initial schema migrations (businesses, profiles, posts).
- Health-check API route (`/api/health`) proving app + database boot locally.
- Lint, type-check, unit-test, and CI configuration.

### Phase 2 — Business/Content Profile

Concrete outputs:

- Onboarding flow capturing business info, audience, tone, platforms, frequency, publishing mode, and sales channel.
- Brand store (logo, colors, styles) plus media library for the business's own photos/videos.
- Verified-facts store (prices, products, policies) that the AI must use instead of inventing facts.
- Profile completeness scoring.

### Phase 3 — AI Content Planning and Generation

Concrete outputs:

- Planner producing weekly content ideas (topic, angle, format, content pillar) with format rotation and promotion capped at a healthy share.
- Platform adapters producing native versions per platform (e.g. short chat-style WhatsApp posts, fuller Facebook posts) — never copy-paste.
- Content memory with duplicate prevention (no repeated topic + angle within the window).
- Promo guardrail: promotional claims without verified facts are flagged, never invented.
- Provider-agnostic AI interface so models can be swapped without rewrites.

### Phase 4 — Content Review

Concrete outputs:

- Review screen showing each post with its visual, caption, and suggested time.
- Per-post actions: regenerate, AI edit, manual edit, reject, change format.
- Missing-information banners ("add price or create without it").
- Approve-all action moving approved posts to scheduling.

### Phase 5 — Scheduling and Publishing

Concrete outputs:

- AI-suggested posting times (per platform, audience, and history) editable by the owner.
- Schedule queue with idempotent dispatch (retries never double-post).
- Auto Publish mode plus Remind Me mode (reminder + copy pack when official APIs are unavailable).
- Manual metrics entry for published posts.

### Phase 6 — Performance and Learning

Concrete outputs:

- Results dashboard (views, likes, comments, leads) from logged metrics.
- Learning job aggregating performance by format/topic into stored insights.
- Planner weighting shifted toward proven winners ("Analytics → Learning → Better future content").
- Trend/event fit-check so only fitting trends enter the plan.

### Phase 7 — Comments, Leads and Customer Follow-Up

Concrete outputs:

- Comment inbox with lead detection (buying-intent scoring and 🔥 lead cards).
- Facts-only reply drafting (thanks answered warmly, fact-covered questions quoted, everything else escalated to the owner — the AI never invents answers).
- Follow-up scheduler (capped frequency, stops on purchase/opt-out).
- Minimal customer memory with delete-on-request.

---

## 6. Technology Stack

- **Frontend framework:** Next.js 14 (App Router) with React 18, TypeScript, and Tailwind CSS.
- **Database:** Postgres (relational tables for businesses, profiles, posts, metrics, inbox; accessed via SQL migrations, no ORM required for the MVP slice).
- **Authentication:** Supabase Auth (email + password sign-up/login, guest/anonymous sign-in, Google OAuth optional) with owner-scoped row-level security.
- **File/media storage:** Supabase Storage buckets (`brand-assets`, `uploads`, `generated-templates`); URL-based media library works without uploads.

**Local-first statement:** for this assessment the application and the database run locally — the Next.js dev server on the local machine against a local Postgres database. No cloud deployment is required, and the repository contains no real passwords, API keys, access tokens, or private credentials (secrets live only in a gitignored local `.env`, with a placeholder `.env.example` committed instead).

---

## Agent Steering Decision — Authentication

1. **The original choice.** Supabase Auth (email + password, anonymous/guest sign-in, optional Google OAuth), with owner-scoped row-level security in Postgres.

2. **The alternative considered.** Better Auth — a lightweight authentication library that runs inside the Next.js app and stores users and sessions directly in our own local Postgres database (email/password + anonymous + OAuth providers, no external service).

3. **The decision we made.** Use **Better Auth** for this local prototype.

4. **Why we made that decision.**
   - **Local development:** Better Auth runs entirely locally with zero external dependencies. Supabase Auth needs either a cloud project (breaks the local-only rule) or a self-hosted Supabase stack via Docker (heavy: many containers, slow, fragile on a laptop).
   - **Simplicity and setup complexity:** Better Auth is one library, one API route, and a few tables in the database we already own. Supabase Auth means provisioning and configuring a whole second system before login works.
   - **Stack compatibility:** with Next.js + plain local Postgres, Better Auth plugs straight into our tables and migrations. Supabase Auth fits best when the whole backend already lives on Supabase cloud, which is not this stage.
   - **Need in this prototype:** a single-user local prototype barely needs auth at all, so auth must be minimal — anonymous/guest plus email/password covers the PRD's login promise without ceremony.
   - **Upgrade path:** nothing is thrown away. Better Auth is production-grade, so growth means adding providers (Google, passkeys) and organizations, not rebuilding.

5. **What we will use later if the project grows.** Keep Better Auth and extend it (more OAuth providers, passkeys, team/organization support). Only switch to Supabase Auth if the project standardizes on Supabase cloud hosting — that migration means moving user rows over and reworking row-level security around the new issuer, so it is deferred until the hosting decision is made.

---

## Design Refinement Note

- **The original design approach.** `design.html` v1 used Georgia serif headings with system sans body, a warm paper/moss/sage/amber palette, gradient primary buttons, and soft-bordered inputs — clean but with a flat heading hierarchy, muted-on-paper small text, and a light placeholder that was hard to read.
- **The specific refinement requested.** Improve typography and readability only: clearer scannable headings, stronger heading/body/supporting distinction, and an easy-to-read sample input — keeping the palette and layout.
- **Why the refinement was made.** Small business owners scan rather than read; the original headings, body, and captions were too close in size and weight, and low-contrast small text plus a pale placeholder hurt readability.
- **What changed in design.html.**
  - Hero heading enlarged (38–60px), tighter tracking, balanced line breaks; lede set in full ink at 18px/1.7 instead of muted 17px.
  - Numbered section kickers added ("01 · Colors" …) above larger 28px section headings; section spacing increased.
  - Type scale separated: display 34px serif / section 23px serif / body 16px at 1.75 line-height / captions 13px.
  - Two minimal contrast adjustments (palette otherwise untouched): supporting captions moved from stone `#6E675C` to `#5F594E`, and input placeholders from pale `#A39B8C` to stone `#6E675C` at full opacity.
  - Input enlarged to 16px on white with a 2px border and roomier padding for legibility.

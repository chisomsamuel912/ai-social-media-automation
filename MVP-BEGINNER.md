# Beginner MVP — Simple AI Content Generator

The full dream (auto-posting, analytics, video, 10 networks) is deferred.
Version 1 does ONE thing well.

## The promise

Business owner → tells the AI about their business → AI creates 5 posts → owner reviews → copies/downloads them.

## The flow (`/start`, no account needed)

1. User enters one line: “I sell rechargeable fans.”
2. User chooses: WhatsApp, Facebook, or Instagram.
3. AI generates 5 posts, each with: Hook, Caption, Hashtags, Call to action.
   Types rotate: Educational, Promotional, Engagement, Story, Customer.
4. User sees the result instantly.
5. Per post, the user can: Regenerate, Edit, Copy.
6. User can download all 5 as `.txt`.

Then, and only then: “Create a free account to save your business and get fresh posts weekly.”

## Deliberately OUT of v1

No automatic posting. No video generation. No scheduling. No analytics.
No payments. No extra networks. No complicated AI infrastructure.

## $0 stack for v1

Next.js + template/OpenRouter-free provider (existing `AIProvider`, falls back offline),
SVG-free plain post cards, clipboard + `.txt` download. No keys required to try;
OpenRouter free key makes the words smarter. Everything else in the repo
(review queue, schedule, inbox, learnings) is v2 and stays untouched until
5–10 real owners validate v1.

## Validation plan

Give `/start` to 5–10 real Nigerian business owners. One question:
“Did you copy a post and actually publish it?” Ship v2 only on yes.

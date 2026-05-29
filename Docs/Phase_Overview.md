# Influencer–Provider Marketplace — Phased Implementation Plan

| Field | Value |
|---|---|
| Document type | Master Phase Overview |
| Version | 1.0 |
| Stack | **Next.js** (App Router) + **Supabase** (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Total Duration | ~10–14 weeks |
| UI/UX Framework | ui-ux-pro-max skill guidelines |

---

## Architecture Summary

```mermaid
flowchart TB
    subgraph Frontend ["Next.js App (App Router)"]
      PUB["Public Pages\n/services, /influencers"]
      DASH["User Dashboard\n/dashboard/*"]
      ADM["Admin Panel\n/admin/*"]
      AUTH["Auth Pages\n/login, /onboarding"]
    end

    subgraph Backend ["Next.js API Routes + Supabase"]
      API["/api/* Route Handlers"]
      SB_AUTH["Supabase Auth\n(Phone OTP + JWT)"]
      SB_DB["Supabase Postgres\n(RLS Enabled)"]
      SB_STORE["Supabase Storage\n(Media)"]
      SB_EDGE["Supabase Edge Functions\n(Background Jobs)"]
      SB_RT["Supabase Realtime\n(Live Updates)"]
    end

    subgraph External
      SMS["SMS Gateway"]
      IG["Instagram API"]
      YT["YouTube API"]
      FB["Facebook API"]
      WA["WhatsApp\nwa.me deep links"]
    end

    PUB --> API
    DASH --> API
    ADM --> API
    AUTH --> SB_AUTH
    API --> SB_DB
    API --> SB_STORE
    SB_EDGE --> SB_DB
    SB_AUTH --> SMS
    SB_EDGE --> IG & YT & FB
    PUB -. contact .-> WA
```

---

## Phase Roadmap

```mermaid
gantt
    title Implementation Phases
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Phase 1
    Database Schema & Seed Data    :p1a, 2025-01-06, 5d
    Auth (OTP + JWT)               :p1b, after p1a, 5d
    User Registration & Onboarding :p1c, after p1b, 4d

    section Phase 2
    Business Profile CRUD          :p2a, after p1c, 5d
    Influencer Profile CRUD        :p2b, after p1c, 5d
    Media Upload System            :p2c, after p2a, 3d
    Public Directories (Services + Influencers) :p2d, after p2c, 5d
    Search & Filters               :p2e, after p2d, 3d

    section Phase 3
    Opportunities CRUD             :p3a, after p2e, 5d
    Applications System            :p3b, after p3a, 4d
    Contact Flow & Reveal Log      :p3c, after p3b, 3d
    Expiry (pg_cron)               :p3d, after p3a, 2d

    section Phase 4
    Admin Panel Shell & Dashboard  :p4a, after p3c, 4d
    Approval Workflow              :p4b, after p4a, 4d
    User & Content Moderation      :p4c, after p4b, 3d
    Categories & Config            :p4d, after p4c, 2d
    Social Sync Jobs               :p4e, after p4d, 4d
    Audit Log & Notifications      :p4f, after p4e, 3d
    Launch Prep                    :p4g, after p4f, 3d
```

---

## Phase Summary

| Phase | Title | Duration | Key Deliverables | Dependencies |
|---|---|---|---|---|
| [**Phase 1**](./Phase_1_Foundation.md) | Foundation & Auth | 2–3 weeks | DB schema, OTP auth, user registration, multi-role, reference data, RLS | — |
| [**Phase 2**](./Phase_2_Profiles_Directories.md) | Profiles & Directories | 3–4 weeks | Business profiles, influencer profiles, media upload, public directories, search/filter | Phase 1 |
| [**Phase 3**](./Phase_3_Opportunities.md) | Opportunities & Connections | 2–3 weeks | Opportunity CRUD, applications, contact flow, expiry handling | Phase 2 |
| [**Phase 4**](./Phase_4_Admin_Automation.md) | Admin Panel & Automation | 3–4 weeks | Admin panel, approvals, moderation, social sync, notifications, audit log | Phase 3 |

---

## Database Tables by Phase

| Phase | Tables Created |
|---|---|
| **1** | `countries`, `states`, `cities`, `categories`, `users`, `user_roles`, `otp_verifications`, `platform_config` |
| **2** | `business_profiles`, `business_media`, `profile_approvals`, `influencer_profiles`, `influencer_social_accounts`, `contact_reveal_log` |
| **3** | `opportunities`, `opportunity_applications` |
| **4** | `admin_audit_log`, `notifications` |

**Total: 16 tables**

---

## User Roles Matrix

| Capability | Visitor | Customer | Influencer | Provider | Admin |
|---|---|---|---|---|---|
| Browse Services | ✅ | ✅ | ✅ | ✅ | ✅ |
| Browse Influencers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contact business (WhatsApp) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View influencer contact | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create business profile | ❌ | ❌ | ❌ | ✅ | ❌ |
| Create influencer profile | ❌ | ❌ | ✅ | ❌ | ❌ |
| Post opportunities | ❌ | ❌ | ❌ | ✅ | ❌ |
| Apply to opportunities | ❌ | ❌ | ✅ | ❌ | ❌ |
| Browse opportunities | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve/reject profiles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage users/roles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage categories/config | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Design System Quick Reference

| Property | Value |
|---|---|
| **Fonts** | Inter (body) + Outfit (headings) — Google Fonts |
| **Spacing** | 4px base increments (4/8/12/16/24/32/48) |
| **Radius** | 8px cards, 12px modals, 9999px pills |
| **Breakpoints** | 375 / 768 / 1024 / 1440 px |
| **Max width** | 1280px content container |
| **Color mode** | Dark-first with light toggle |
| **Icons** | Lucide (SVG, consistent stroke) |
| **Animations** | 150–300ms, ease-out enter / ease-in exit |
| **Touch targets** | ≥44×44px |
| **Contrast** | ≥4.5:1 body text, ≥3:1 secondary |

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js App Router | SSR for public SEO, API routes as backend, single deploy |
| **Database** | Supabase Postgres | Managed, RLS built-in, realtime, auth, storage |
| **Auth** | Supabase Phone OTP | Native phone auth, JWT sessions, no custom auth server |
| **Media storage** | Supabase Storage | Integrated with auth, CDN-ready, presigned uploads |
| **Background jobs** | pg_cron + Edge Functions | No separate worker infra needed at v1 scale |
| **Admin panel** | Same Next.js app, `/admin` route group | Single codebase, shared types, faster development |
| **Styling** | CSS Modules + CSS variables | Design tokens as CSS custom properties, no framework lock-in |
| **State management** | React Server Components + client hooks | Minimize client JS, server-first rendering |

---

*Detailed phase documents:*
1. [Phase 1: Foundation & Authentication](./Phase_1_Foundation.md)
2. [Phase 2: Profiles & Directories](./Phase_2_Profiles_Directories.md)
3. [Phase 3: Opportunities & Connections](./Phase_3_Opportunities.md)
4. [Phase 4: Admin Panel & Automation](./Phase_4_Admin_Automation.md)

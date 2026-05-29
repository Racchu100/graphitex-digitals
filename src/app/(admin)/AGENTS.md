# Admin Module — Agent Log & Architecture Instructions

This document provides localized context, design patterns, and operations details for the secure **Graphitex Admin Panel (`src/app/(admin)`)**.

---

## 1. Module Purpose & Scope
The Admin Panel facilitates platform governance, content moderation, and RBAC control under `/admin`. Access is strictly restricted to authenticated users containing the `admin` role in `user_roles`.

---

## 2. Architecture & File Structure
```
src/app/(admin)/admin/
├── actions.ts              -- Unified Next.js Server Actions Engine
├── page.tsx                -- Dashboard view showing Bento stats grids
├── page.module.css
├── approvals/              -- Moderation queue for pending brand services
├── business-profiles/      -- Moderation controls for all provider services
├── influencers/            -- Listing control panel for influencer niches & details
├── opportunities/          -- Moderation and removal suite for brand campaigns
├── users/                  -- RBAC roles toggling & user suspensions panel
├── categories/             -- CRUD console for taxonomy parent/child node merging
└── config/                 -- Platform settings variables inline editor
```

---

## 3. The Server Actions Core (`actions.ts`)
All data mutations are handled by type-safe Next.js **Server Actions** inside [actions.ts](file:///d:/Rakshith/Graphitex%20Digitals/my%20account/graphitex%20website/graphitex_digitals/src/app/%28admin%29/admin/actions.ts). 

### 🔒 Security Check
*   Every action calls the internal `requireAdmin()` helper to verify JWT presence and query the `user_roles` database constraint for `admin`.
*   All state modifications are run via `createAdminClient()` to bypass standard RLS constraints securely inside trusted server memory.

### 📝 Core Actions catalog
*   `approveBusinessProfile(id)` / `rejectBusinessProfile(id, reason)`
*   `suspendBusinessProfile(id, reason)` / `reactivateBusinessProfile(id)`
*   `suspendInfluencerProfile(id, reason)` / `reactivateInfluencerProfile(id)`
*   `removeOpportunity(id, reason)`
*   `suspendUser(id, reason)` / `reactivateUser(id)`
*   `grantRole(userId, role)` / `revokeRole(userId, role)`
*   `createCategory(name, slug, parentId)` / `updateCategory(id, name, slug, parentId, isActive)`
*   `mergeCategories(sourceId, targetId)` -- migrates listings and child reparenting
*   `updatePlatformConfig(key, value)`

---

## 4. UI/UX & Design Conventions
*   **Aesthetics:** Dark premium style aligned with `globals.css` variable tokens (`hsl(220, 18%, 12%)` card backgrounds, styled overlays, and border strokes).
*   **Table UI:** Rendered through the modular [AdminTable.tsx](file:///d:/Rakshith/Graphitex%20Digitals/my%20account/graphitex%20website/graphitex_digitals/src/components/admin/AdminTable.tsx) with automatic status badge allocations (`active`, `approved`, `suspended`, `rejected`, `pending_approval`, `expired`, etc.).
*   **Lucide Icons:** Icons are strictly Lucide-based SVG components (no emojis allowed in the sidebar or layouts).
*   **Confirmation Guards:** Destructive actions (like merging categories or granting admin roles) are protected with explicit JS window confirmation alerts.

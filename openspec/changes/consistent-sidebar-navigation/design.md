## Context

Six pages hand-wire the shell (`sidebarOpen` state + `<Sidebar isOpen onToggle currentPath>` + `<Navbar onToggleSidebar showSidebar breadcrumbs>` + flex wrapper) — e.g., `HomePage.jsx`. Eleven authenticated pages render `<Navbar>` alone; for them `Navbar.jsx` falls back to legacy top tabs (`navbar-center` row + mobile dropdown), a conditional kept precisely because those pages had no other navigation. `Sidebar.jsx` already handles all roles (admin/teacher/parent items) and takes `currentPath` as a prop.

## Goals / Non-Goals

**Goals:**
- One layout component; sidebar on all 17 authenticated pages; top tabs deleted.
- Route-derived active state (drop the hardcoded `currentPath` prop chain).

**Non-Goals:**
- No changes to sidebar contents/role rules, breadcrumbs design, or unauthenticated pages.
- No React Router nested-layout-route refactor (`<Outlet/>`) — worthwhile later, but bigger blast radius than this change needs.
- **No mobile bottom tab bar in this change** — deferred to a fast-follow (see Future Work). This change ships the omnipresent labeled sidebar (hamburger drawer on mobile) only.

## Decisions

1. **`AppLayout.jsx` wrapper component** (`mockup1/src/components/AppLayout.jsx`):
   ```jsx
   <AppLayout breadcrumbs={[...]} >{pageContent}</AppLayout>
   ```
   Owns `sidebarOpen` state, renders `<Sidebar isOpen onToggle currentPath={useLocation().pathname} />`, `<Navbar onToggleSidebar showSidebar breadcrumbs />`, and the standard `min-h-screen bg-base-200 flex` / `flex-1 overflow-auto` skeleton with children inside `<main>`. Alternative — router-level layout route with `<Outlet/>` — rejected for now: it forces touching route definitions and per-page breadcrumb plumbing in one go; the wrapper achieves the same consistency with mechanical page edits.

2. **`Sidebar` gets `currentPath` from the layout via `useLocation()`** — pages stop passing it; active-state logic in `Sidebar.jsx` is unchanged (it already does prefix matching).

3. **Refactor order:** convert the 6 existing sidebar pages to `AppLayout` first (pure deduplication, proves the component), then the 11 sidebar-less pages (each becomes: replace `<Navbar .../>` + outer divs with `<AppLayout breadcrumbs=...>`). Keep per-page content untouched otherwise.

4. **Delete the Navbar tab fallback**: remove the `!onToggleSidebar`-guarded `navbar-center` block and mobile dropdown plus their now-unused icon imports. `onToggleSidebar` becomes effectively always-present (still optional-guarded for safety).

5. **Width audit**: `DataPage` table and `ChildDataPage` charts previously had the full viewport; with the `w-72` sidebar they get ~`calc(100vw - 18rem)` on desktop. Both already render inside responsive containers (`overflow-x-auto` tables, grid charts) — verify visually at 1280px and 360px; fix with container tweaks only if something overflows.

6. **Sidebar stays labeled — no desktop icon-rail collapse.** The desktop sidebar keeps full text labels; we explicitly do NOT add an icon-only collapsed rail. The dominant users are non-technical teachers and parents, for whom icon-only navigation is a learnability tax (a 🏫 glyph is a guess; "Classrooms" is not). The mobile experience stays the existing hamburger drawer (which already has full labels). This pins the meaning of "consistent sidebar" so implementation doesn't drift toward an icon rail.

## Risks / Trade-offs

- [17 pages touched in one change → wide regression surface for purely mechanical edits] → keep edits structural (wrap/unwrap), no content changes; lint + build + click-through every route locally.
- [Parents now see a sidebar on child pages where there was none] → Sidebar already renders a correct minimal parent variant (Dashboard/Settings/Logout); verify the parent child-page flow specifically.
- [Wrapper layout duplicates what router layout routes do natively] → accepted; revisit `<Outlet/>` when routes are next reorganized.

## Migration Plan

Frontend-only, additive component + mechanical refactor; no data or API changes. Rollback = revert the commit. Local verification only; deploy separately on request.

## Future Work

- **Mobile bottom tab bar (fast-follow).** The dominant users are non-technical teachers and parents on phones, and they have few primary destinations (parent ~1, teacher ~4) — the sweet spot for a thumb-reachable, always-visible bottom tab bar, which has higher discoverability than a hamburger drawer (nav hidden behind a tap). A follow-up change would render a bottom tab bar on mobile for the 3–4 primary items while keeping the labeled sidebar on desktop (a responsive adaptation of one nav system, not the old random split). Intentionally deferred and **gated on the usability-testing findings** — ship the consistent sidebar first, then let real mobile usage confirm whether the hamburger is hurting discoverability before building a second pattern.

## Open Questions

- Should `TeacherProfilePage` (teacher's own profile) highlight "My Profile" while `/teachers/:username` (admin viewing) highlights "Teachers"? Current prefix matching mostly handles it; confirm during implementation.

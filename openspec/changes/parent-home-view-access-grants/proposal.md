# Parent-Controlled Home View Access Grants

## Why

Home talk recordings are currently hard-blocked for all staff: the assessment APIs strip `activityContext: 'home'` rows for teachers and admins, and the child data page hides the Home talk tab from them. Parents have no way to voluntarily share their child's home recording data with the educators who work with that child, even though that data can inform classroom instruction. Parents need explicit, revocable control over who sees home data, and staff need a lightweight way to ask for it.

## What Changes

- **Parent grant controls on the child's Home talk view.** On the child data page, parents see:
  - A per-classroom "Grant access" button for each classroom the child is enrolled in, granting home view access to that classroom's **lead teacher** individually.
  - A master "Grant access to all" button that grants home view access to **all teachers and admins** at once.
  - Corresponding revoke controls so any grant can be withdrawn.
- **New `HomeViewGrant` persistence** tracking who may see a child's home talk data: per-teacher grants (scoped via classroom lead) and an all-staff grant, with `active`/`revoked` lifecycle and pending request support.
- **Conditional server-side home data filter.** The assessment APIs continue to exclude home rows for staff by default, but include them when the requesting teacher/admin holds an active home view grant for that child. Delete of home rows remains parent-only regardless of grants.
- **Staff-facing Home talk tab.** Teachers and admins now see the Home talk tab on the child data page:
  - With an active grant: home charts, stats, and transcripts render like the parent view.
  - Without a grant: a message explains home data is private, with a "Request access" button.
- **Access request notifications.** When a teacher or admin requests home view access, the child's parent(s) receive an in-app notification (new `home-access-requested` notification type) that deep-links to the child's page where they can grant.

## Capabilities

### New Capabilities

- `home-view-access-grants`: Parent-controlled granting, revoking, and requesting of staff access to a child's home talk data — data model, API endpoints, authorization rules, and the grant/request UI on the child data page.

### Modified Capabilities

- `child-talk-data-views`: The "Home talk data is invisible to teachers and admins" requirement becomes conditional — home rows are included for staff holding an active home view grant; the "Staff child pages render classroom data only" requirement is replaced by staff Home talk tab behavior (granted vs. not-granted states). *(Delta targets the pending `separate-home-classroom-talk-views` change's spec, which introduces this capability.)*
- `parent-notifications`: Notification model gains the `home-access-requested` type, a fan-out to the child's parent(s) on staff access requests, and bell routing to the child's data page.

## Impact

- **Backend models:** new `backend/models/HomeViewGrant.js`; `Notification` type enum extended (`backend/models/Notification.js`).
- **Backend access logic:** `backend/lib/talkDataAccess.js` gains grant-aware filtering; `backend/routes/whisperRoutes.js` (child assessment endpoints) consults grants; new routes for granting/revoking/requesting home view access (e.g. under `/api/home-access`); `backend/lib/notificationService.js` fan-out for requests.
- **Frontend:** `mockup1/src/pages/ChildDataPage.jsx` — grant buttons for parents, Home talk tab + request-access state for staff; `mockup1/src/utils/talkDataViews.js` unchanged partition logic but staff now partition too when granted; `mockup1/src/utils/notifications.js` routing for the new type.
- **Security/privacy:** home data exposure is widened only via explicit parent action; default remains private. Revocation takes effect on the next API request (no caching of grants).
- **No breaking changes** to existing APIs; staff responses simply include home rows when a grant is active.

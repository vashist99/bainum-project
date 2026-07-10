# Bainum Platform — User Manual

**Document type:** User Manual  
**Version:** 1.1  
**Date:** June 2026  
**Product:** Bainum Project (Anita Zucker Center / Bainum Foundation)

---

## Table of contents

1. Product overview  
2. Getting started (all roles)  
3. Administrator guide  
4. Teacher guide  
5. Parent guide  
6. Notifications bell (all roles)  
7. Glossary  

---

## Product overview

The Bainum platform is a web application for early childhood development
assessment and tracking. Teachers and parents record children's speech and
classroom activity; the system transcribes audio and visualizes language
development across domains such as science talk, social talk, literature, and
general language growth.

**User roles:**

- **Administrator** — manages schools, teachers, children, and all classrooms.
- **Teacher** — leads or assists classrooms, records activity, adds parents, and
  reviews transcripts for assigned children.
- **Parent** — views their own child's data, enrolled classrooms (read-only),
  and may record activity at home.

Access the app in a modern browser (Chrome, Firefox, Edge, Safari). On phones,
use the menu icon (hamburger) in the top bar to open the sidebar.

---

## Getting started (all roles)

### Sign in

1. Open the application URL provided by your program administrator.
2. Enter your **email** and **password**.
3. Click **Sign in**.

### Forgot password

1. On the login page, click **Forgot password**.
2. Enter your email and submit.
3. Open the reset link from your email (check spam if needed).
4. Set a new password and sign in again.

### Sign out

1. Open the sidebar (menu icon on mobile).
2. Click **Logout** at the bottom of the sidebar.

---

## Administrator guide

Administrators see **Dashboard**, **Classrooms**, **Schools**, **Teachers**, and
**Children** in the sidebar.

### Dashboard

The dashboard shows quick actions and classroom overview. Use **Create
Classroom** to add a new classroom and assign a lead teacher.

### Schools

1. Click **Schools** in the sidebar (legacy URL `/centers` redirects here).
2. View the list of registered schools or click **Add School** to create one.
3. To edit, open a school and use **Edit**; to remove, use **Delete** (teachers
   at that school may need reassignment).

Each **school** is an organizational site; teachers and children carry a school
affiliation used for filtering and classroom enrollment rules.

### Teachers

1. Click **Teachers**.
2. Use **Filter by School** and search to find staff.
3. Click **Add Teacher** to create an account or send a teacher invitation email.
4. Open a teacher row to edit profile details or view their profile page.

### Children

1. Click **Children** in the sidebar.
2. Use **Filter by School** (dropdown built from teacher school assignments) to
   narrow the list.
3. Click **Add Child** to register a new child.
4. Open a child's name to view the full data page (charts, transcripts,
   recordings).
5. Use tile/table toggle in the header to switch list views.

### Classrooms

1. Click **Classrooms** for the full admin list.
2. Open a classroom to see the **classroom homepage**: name, school, lead and
   assistant teachers, children (names link to each child's data page), parents,
   **notes**, transcripts, and cohort stats.
3. **Add Parents** — opens a modal to select parents (with accepted
   invitations) and which of their children to enroll. Confirm with **Add**.
4. **Remove** — next to each child, remove enrollment (admin or lead teacher).
5. **Delete classroom** — at the bottom of the classroom page, expand **Advanced
   options**, then use the small **Delete classroom** control. A confirmation
   modal is required; this cannot be undone. Recordings may remain linked
   historically on child profiles.

### Recording and transcripts (admin)

Admins can open any child's data page or classroom transcripts. Transcript lists
are sorted **newest first** (the most recently saved recording appears at the top).
Transcripts may be reviewed, exported (where enabled), and expire after the
platform retention period (see FAQ).

---

## Teacher guide

Teachers see **Dashboard**, **Classrooms** (via dashboard cards), **My Profile**,
and **Children** in the sidebar.

### Dashboard and classrooms

1. Open **Dashboard** — cards appear for every classroom where you are **lead**
   or **assistant** (assistant cards show an **Assistant** badge).
2. Click a card to open the **classroom homepage**.
3. Use **Create Classroom** if you need a new room (you become lead teacher;
   school is taken from your profile).

### Classroom homepage (lead or assistant)

- View classroom name, **school**, lead teacher, and assistant teacher.
- **Children in this classroom** lists enrolled students; each name links to that
  child's data page (staff only).
- **Add Parents** — select parents and children to enroll; click **Add**.
- **Remove** — remove a child from the classroom (per-child control).
- Record or upload classroom activity and review **Transcripts** on this page.
  Parents enrolled in the classroom receive a bell notification when staff
  accept a new classroom recording.
- **Notes & Observations** — add classroom-wide notes visible to enrolled parents
  (parents can read but not add or delete).
- **Delete classroom** — lead teacher or admin only. Scroll to the bottom of the
  page, expand **Advanced options**, and use the small delete control; confirm in
  the modal. This is intentionally tucked away to reduce accidental deletion.

Assistant teachers cannot delete a classroom. They share other management
capabilities with the lead teacher (add parents, record, remove children per policy).

### Children list

1. Click **Children**.
2. Teachers automatically see every child they supervise (classroom roster plus
   any active access grants). The page shows **Viewing children at your school**
   as context; the list is not narrowed by school name matching.
3. Open a child to view charts when you have full access; **classroom transcripts**
   are listed on the child data page for every child you supervise in a classroom,
   even when chart access is still pending. Parent **Home** recordings are private
   to the family and are never visible to teachers or administrators.
4. Transcripts are sorted **newest first** — the latest upload appears at the top
   of the list and in combined downloads.
5. On a child's data page, the **Classrooms** section shows enrollment by
   **classroom name** (not internal IDs). Use **Notes & Observations** to record
   progress notes; parents linked to the child receive a bell notification when
   staff add notes.

### Record activity

1. From the dashboard, child page, or classroom homepage, use **Record
   Activity** or the recording/upload control.
2. Choose **location** (e.g., Classroom, Playground for teachers) and **activity**
   from the approved lists, or **Other** and enter a custom label (vetted by the
   system).
3. Upload or record audio, then submit. In-browser recordings can run up to
   **60 minutes**; after each **15 minutes** a pop-up reminds you the recording
   is still on and offers **Keep recording** or **Stop recording**.
4. Review the transcript when processing completes; accept or reject before it
   counts as a saved assessment.

### My Profile

Click **My Profile** to see your teacher profile, assessments, and transcript
cards. Export options (e.g., Excel) may appear where enabled.

---

## Parent guide

Parents see **Dashboard** and **My Child's Data** in the sidebar (no separate
**Classrooms** tab — enrolled rooms appear on the dashboard).

### Registration

1. Receive an invitation email from a teacher or administrator.
2. Click the registration link in the email.
3. Complete parent registration and link to your child(ren).

### Child data page

1. After sign-in, open your child's page from the dashboard or direct link.
2. Switch between two views with the tabs at the top: **Classroom talk**
   (recordings made at the program — the default) and **Home talk** (your Home
   tab recordings). Charts, words-per-minute stats, transcripts (newest first),
   and the combined download all follow the selected tab.
3. View developmental charts, transcripts, recording history, and
   **Notes & Observations** for **your child only**.
4. You cannot view other children's full records.
5. **Home talk data is private to your family** — teachers and administrators
   see classroom talk data only and can never view your home recordings.

### Enrolled classrooms (read-only)

1. On the **Dashboard**, the **My Children's Classrooms** section lists cards for
   each room where your children are enrolled.
2. Open a card to view the **read-only** classroom homepage: your children's scope,
   classroom **notes** (read-only), and roster child names that link to data pages.
   You will not see **Add Parents**, **Record**, **Delete**, or other staff controls.
3. Use **My Child's Data** in the sidebar to jump to your child's main data page.
   The **Dashboard** item stays highlighted while you view a classroom you opened
   from a dashboard card.

### Record activity at home

1. Open the **Home** tab in the sidebar (not the Dashboard).
2. Select **which child** the recording is for (required when you have more than one).
3. Select **location** (e.g., Play/free play, Mealtime or snacks) and **activity**.
4. Upload or record, then review the transcript when ready. Recordings can run
   up to **60 minutes**; a reminder pop-up appears every **15 minutes** so you
   can keep going or stop.

---

## Notifications bell (all roles)

1. Click the **bell icon** in the top navigation bar.
2. The badge shows how many active notifications you have (classroom added or
   removed events, new notes, and new classroom recordings).
3. Click a notification to go to the related classroom, child data page, or home.
4. Dismiss a notification with the dismiss control; entries also expire
   automatically after about ten days.

---

## Glossary

| Term | Meaning |
|------|---------|
| School | Organizational site (formerly called Center in older materials). |
| Classroom | A teaching group with a lead teacher, optional assistant, children, and parents. |
| Assessment | A saved recording analysis after transcript review. |
| Note | A staff or parent observation stored on a child or classroom page. |
| Transcript | Text from speech-to-text processing of an audio recording. |
| Add Parents | Enroll parents and their children into a classroom (replaces legacy "Invite Parents" label). |
| Advanced options | Collapsible section at the bottom of the classroom page; contains delete classroom. |

*End of User Manual — Version 1.1, June 2026*

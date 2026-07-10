# Bainum Platform — Frequently Asked Questions (FAQ)

**Version:** 1.1 | **Date:** June 2026

---

## Account and roles

### Who can use the Bainum platform?

**Audience: All**

Administrators (program staff), teachers, and parents each have their own sign-in.
Parents register through an invitation link; teachers may be invited or created by
an admin.

### What is the difference between admin, teacher, and parent?

**Audience: All**

- **Admin** — manages schools, teachers, children, and all classrooms.
- **Teacher** — manages assigned classrooms, recordings, and adding parents.
- **Parent** — sees only their own child's data and read-only classroom views.

### I forgot my password. What do I do?

**Audience: All**

Use **Forgot password** on the login page, submit your email, and follow the link
in the message. If email does not arrive, check spam or contact your administrator.

---

## Invitations and registration

### How does a parent get an account?

**Audience: Parent**

A teacher or admin sends a parent invitation to your email. Click the link,
complete registration, and accept linkage to your child.

### How does a teacher get an account?

**Audience: Admin, Teacher**

An administrator adds a teacher directly or sends a **teacher invitation** email
with registration instructions.

### What does "Add Parents" mean on a classroom page?

**Audience: Admin, Teacher**

**Add Parents** enrolls invited parents (and selected children) into a classroom.
It replaces the older "Invite Parents" label; the action adds membership and may
trigger an in-app notification. Enrollment is mirrored on each child's profile
(**Classrooms** section shows the room name).

---

## Classrooms and enrollment

### Why does a teacher see fewer children on a classroom page than an admin?

**Audience: Admin, Teacher**

The classroom roster should list every enrolled child for both roles. If counts
differ, refresh the classroom page after a recent enrollment — the system repairs
roster drift automatically. If a child still appears missing, confirm they were
added through **Add Parents** (same school rule) or ask an admin to re-add the
parent/child pair.

### Why does a child's profile say "Not enrolled" but they appear on the classroom roster?

**Audience: Admin, Teacher**

That was usually a data sync issue between the classroom roster and the child's
profile. Current releases repair enrollment on load; reload the child page. If it
persists, contact your administrator.

### How do I delete a classroom?

**Audience: Admin, Teacher (lead only)**

Open the classroom homepage, scroll to the bottom, expand **Advanced options**,
and click the small **Delete classroom** link. Confirm in the modal. Assistant
teachers cannot delete classrooms. Deletion is permanent for the classroom record;
child data and historical recordings on child profiles are retained.

### Where do parents find their children's classrooms?

**Audience: Parent**

On the **Dashboard** under **My Children's Classrooms** (there is no separate
**Classrooms** sidebar item for parents). Open a card for the read-only classroom
view, or use **My Child's Data** in the sidebar for charts and transcripts.

---

## Access and privacy

### Who can see my child's data?

**Audience: Parent**

Only you, your child's assigned teachers (with active access), and program
administrators can see your child's **classroom** assessment data. **Home talk
data** — recordings you make from the Home tab — is private to your family:
teachers and administrators can never see it. Other parents in the same
classroom see only roster names, not other children's full records.

### What are the Home talk and Classroom talk views?

**Audience: Parent**

Your child's data page has two tabs: **Classroom talk** (recordings made at the
program) and **Home talk** (recordings you make from the Home tab). Charts,
words-per-minute stats, transcripts, and the combined download all follow the
selected tab, so home and classroom talk are never mixed together.

### Why do I see "Access denied" or a blank page?

**Audience: All**

Your account may lack permission for that page (wrong role, expired invitation, or
no access grant). Sign out and back in, or ask your administrator to confirm
your classroom or child linkage.

### What is a School vs a Classroom?

**Audience: All**

A **School** is the physical or organizational site (e.g., a preschool building).
A **Classroom** is a teaching group within the program, led by a teacher, with
children and parents enrolled. Teachers and children are affiliated with a school;
classrooms group participants for instruction and recordings.

---

## Recordings, locations, and activities

### How do I record or upload activity?

**Audience: Teacher, Parent**

Use the **Home** tab in the sidebar (parents) or **Record** on a classroom homepage
(teachers). Choose **which child** (parents with multiple children), then pick
**location** and **activity** from the lists, or **Other** and type a custom label.
Submit audio when prompted.

### What locations can I choose?

**Audience: Teacher, Parent**

Teachers see school-oriented locations (Classroom, Playground, Excursion, etc.).
Parents see routine/setting locations (Mealtime or snacks, Play/free play,
Outdoor play, etc.). Custom locations are validated before saving.

### How long can I record?

**Audience: Teacher, Parent**

In-browser recordings can run up to **60 minutes**. Every **15 minutes**, a
pop-up reminds you the recording is still on and asks whether to keep recording
or stop — recording continues uninterrupted until you choose or the 60-minute
limit is reached. Note that very long recordings may exceed the **25 MB** upload
limit; for long sessions, consider stopping and uploading in parts.

### What happens after I upload audio?

**Audience: Teacher, Parent**

The system transcribes speech. Teachers (or admins) review transcripts and accept
or reject before they become saved assessments that feed charts and reports.

---

## Transcripts and retention

### In what order are transcripts listed?

**Audience: All**

Transcripts on child data pages, classroom transcript sections, and combined
download files are sorted **newest first** — the most recently saved recording
appears at the top, even if its recording date is earlier than an older upload.

### Can teachers see parent home recordings?

**Audience: Teacher, Parent**

No. Home recordings are private to the family. When a parent records from the
**Home** tab, accepted transcripts appear only in the parent's **Home talk**
view on the child's data page. Teachers and administrators see classroom
recordings only — home talk data is filtered out on the server, and it does not
feed classroom charts or cohort thresholds.

### How long are transcripts kept?

**Audience: All**

Transcripts are retained for **one year (365 days)** from the recording date,
then removed from active display per platform policy. Charts may still reflect
aggregated history depending on configuration.

### Why did an old transcript disappear?

**Audience: All**

It may have reached the retention expiry date. Contact your administrator if you
need policy clarification.

### Can I export data?

**Audience: Admin, Teacher**

Where enabled, use export controls on child or teacher profile pages (e.g.,
Excel download for transcript tables). Parents receive exports only for their own
child when the feature is available to them.

---

## Notifications

### What is the bell icon in the top bar?

**Audience: All**

It shows in-app notifications (e.g., added to or removed from a classroom, a
new note on your child's page or classroom, or a new classroom recording). Click
an entry to navigate; dismiss entries you no longer need. Notifications expire
after about ten days.

---

## Troubleshooting

### The page says "No schools found yet" on Children or Teachers

**Audience: Admin**

The school filter is built from teacher records. Add schools under **Schools**
and ensure teachers have a school assigned on their profile.

### API or login errors after an update

**Audience: All**

Confirm you are on the correct URL, clear browser cache, and ensure the backend
service is running (for local development). Contact support if production is down.

### Legacy `/centers` links

**Audience: Admin**

Old bookmarks to `/centers` redirect automatically to **Schools**.

---

## Support

### Whom do I contact for help?

**Audience: All**

Contact your program administrator or Anita Zucker Center / Bainum Foundation
project lead. For technical outages, provide the page URL, your role, and a
screenshot of any error message.

*End of FAQ — Version 1.1, June 2026*

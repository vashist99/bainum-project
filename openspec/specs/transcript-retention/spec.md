# transcript-retention Specification

## Purpose
TBD - created by archiving change evolve-classroom-membership-and-transcripts. Update Purpose after archive.
## Requirements
### Requirement: Transcripts persist for one year from recording date

Every newly created `Assessment` and `TeacherAssessment` document SHALL
set `transcriptExpiresAt` to exactly **one year (365 days)** after the
recording date used in the same write. The system MUST NOT set the
expiry to any shorter or longer interval at write time.

#### Scenario: New child assessment expiry
- **WHEN** a child Assessment is saved with `date = 2026-06-17T12:00:00Z`
- **THEN** the saved document has
  `transcriptExpiresAt = 2027-06-17T12:00:00Z`

#### Scenario: New teacher assessment expiry
- **WHEN** a TeacherAssessment is saved with `date = 2026-09-01T00:00:00Z`
- **THEN** the saved document has
  `transcriptExpiresAt = 2027-09-01T00:00:00Z`

#### Scenario: Leap day fall-back
- **WHEN** an assessment is saved with `date = 2024-02-29T00:00:00Z`
- **THEN** the saved document has
  `transcriptExpiresAt = 2025-02-28T00:00:00Z` (no JavaScript Date
  exception)

### Requirement: Retention constant lives in exactly one module

The system SHALL keep the transcript retention value in a single source-of-truth module at backend/lib/transcriptRetention.js, which MUST export TRANSCRIPT_RETENTION_DAYS (currently 365) and transcriptExpiryFrom(date) returning a Date exactly TRANSCRIPT_RETENTION_DAYS after the input. Every assessment write path SHALL import the helper from this module, and the legacy in-file addOneMonth helpers MUST be removed.

#### Scenario: Single source of truth
- **WHEN** the codebase is searched for inline `setMonth` or
  `setDate(... + N)` retention calculations in assessment write
  paths
- **THEN** there are zero matches outside
  `backend/lib/transcriptRetention.js`

#### Scenario: Bumping the constant changes both paths
- **WHEN** `TRANSCRIPT_RETENTION_DAYS` is changed
- **THEN** both `Assessment` and `TeacherAssessment` writes immediately
  pick up the new value without any other code change

### Requirement: Historical rows keep their original expiry

The system MUST NOT retroactively extend `transcriptExpiresAt` on rows
written before this change. Rows that were stamped with a 30-day
expiry under the old rule continue to purge on their original
schedule.

#### Scenario: Pre-change row purges on its old schedule
- **WHEN** a row written under the previous 30-day rule has
  `transcriptExpiresAt` already in the past
- **THEN** the existing purge job blanks its `transcript` and
  `ragSegments` on the next pass, exactly as before

#### Scenario: Pre-change row not re-stamped on read
- **WHEN** a row written under the previous rule is read via
  `GET /api/assessments/child/<id>` or the teacher equivalent
- **THEN** its `transcriptExpiresAt` is unchanged in storage

### Requirement: Purge job semantics unchanged

The transcript purge job (currently `purgeExpiredTranscripts`) MUST
continue to delete `transcript` and `ragSegments` on any row whose
`transcriptExpiresAt <= now`, regardless of whether the row was
written under the old 30-day rule or the new 365-day rule.

#### Scenario: Purge still wipes expired rows
- **WHEN** a row's `transcriptExpiresAt` is in the past
- **THEN** the next purge pass sets `transcript = ""` and removes
  `ragSegments` from that row

### Requirement: Visibility filter unchanged

The system MUST preserve the existing read-path visibility filter unchanged: rows whose transcriptExpiresAt is in the future remain visible, and the legacy branch (no expiry field but transcript present) also remains. Only the write-time value SHALL change in this scope.

#### Scenario: Read filter unchanged
- **WHEN** a parent or teacher reads a child's or teacher's
  transcripts
- **THEN** rows whose `transcriptExpiresAt` is still in the future
  appear; rows whose `transcriptExpiresAt` has passed do not


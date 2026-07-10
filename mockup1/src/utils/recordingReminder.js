/**
 * Still-recording reminder schedule (see openspec change recording-duration-reminder).
 *
 * Recording sessions are capped at MAX_RECORDING_MS; every REMINDER_INTERVAL_MS
 * a modal reminds the user the microphone is still on. Pure helpers so the
 * schedule logic is unit-testable without a DOM or timers.
 */

export const MAX_RECORDING_MS = 60 * 60 * 1000;
export const REMINDER_INTERVAL_MS = 15 * 60 * 1000;

/** First reminder deadline for a fresh session. */
export function initialReminderAt() {
  return REMINDER_INTERVAL_MS;
}

/** True when elapsed recording time has crossed the current reminder deadline. */
export function shouldShowReminder(elapsedMs, nextReminderAtMs) {
  return elapsedMs >= nextReminderAtMs;
}

/**
 * Deadline for the reminder after the one that just fired. Skips ahead when
 * the tab slept past several intervals so we never queue a burst of modals.
 */
export function advanceReminder(elapsedMs, nextReminderAtMs) {
  let next = nextReminderAtMs;
  while (next <= elapsedMs) {
    next += REMINDER_INTERVAL_MS;
  }
  return next;
}

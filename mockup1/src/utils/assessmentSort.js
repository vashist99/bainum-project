/**
 * Sort assessments/transcripts with the most recently saved first.
 * Uses Mongo ObjectId (creation time) so backdated recording dates don't
 * push new uploads to the bottom; falls back to recording date.
 */
export function compareAssessmentsNewestFirst(a, b) {
  const idA = a?._id != null ? String(a._id) : "";
  const idB = b?._id != null ? String(b._id) : "";
  if (idA && idB && idA !== idB) {
    return idB.localeCompare(idA);
  }
  const timeA = a?.date ? new Date(a.date).getTime() : 0;
  const timeB = b?.date ? new Date(b.date).getTime() : 0;
  return timeB - timeA;
}

/** Read school registry list from /api/schools (or legacy /api/centers) response. */
export function schoolsFromListResponse(data) {
  return data?.schools ?? data?.centers ?? [];
}

/** Read single school entity from create/update/detail response. */
export function schoolFromEntityResponse(data) {
  return data?.school ?? data?.center ?? null;
}

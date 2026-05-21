/**
 * @param {object|null|undefined} user Decoded JWT payload (parent)
 * @returns {string[]}
 */
export function getParentChildIdList(user) {
  if (!user || user.role !== "parent") return [];
  if (Array.isArray(user.childIds) && user.childIds.length > 0) {
    return user.childIds.map((id) => String(id));
  }
  if (user.childId) return [String(user.childId)];
  return [];
}

/**
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export function getPrimaryChildId(user) {
  const list = getParentChildIdList(user);
  return list[0] || null;
}

/**
 * @param {object|null|undefined} user
 * @param {string} childId
 */
export function parentHasAccessToChild(user, childId) {
  if (!childId) return false;
  return getParentChildIdList(user).includes(String(childId));
}

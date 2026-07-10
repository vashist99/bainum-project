import axios from "./axios";

/**
 * Client for /api/home-access — parent-controlled sharing of a child's
 * home talk data. Parents get the full sharing state; teachers/admins
 * get only their own status ('granted' | 'pending' | 'none').
 */

export async function fetchHomeAccessState(childId) {
    const response = await axios.get(`/api/home-access/child/${childId}`);
    return response.data;
}

/** body: { scope: "all-staff" } | { classroomId } | { grantId } */
export async function grantHomeAccess(childId, body) {
    const response = await axios.post(`/api/home-access/child/${childId}/grant`, body);
    return response.data;
}

/** body: { scope: "all-staff" } | { grantId } */
export async function revokeHomeAccess(childId, body) {
    const response = await axios.post(`/api/home-access/child/${childId}/revoke`, body);
    return response.data;
}

export async function requestHomeAccess(childId) {
    const response = await axios.post(`/api/home-access/child/${childId}/request`);
    return response.data;
}

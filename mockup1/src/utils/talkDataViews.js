/**
 * Talk-data view partitioning for the child data page.
 *
 * Assessments are split by `activityContext`:
 * - "home"   -> parent home recordings (Home talk view, parents only)
 * - anything else (including legacy rows with no activityContext, which all
 *   predate home recording) -> classroom data (Classroom talk view)
 */

export const TALK_VIEWS = {
  CLASSROOM: "classroom",
  HOME: "home",
};

/**
 * Split assessments into { home, classroom } arrays, preserving input order.
 * @param {Array} assessments
 * @returns {{ home: Array, classroom: Array }}
 */
export function partitionAssessmentsByContext(assessments) {
  const home = [];
  const classroom = [];
  for (const assessment of Array.isArray(assessments) ? assessments : []) {
    if (assessment?.activityContext === "home") {
      home.push(assessment);
    } else {
      classroom.push(assessment);
    }
  }
  return { home, classroom };
}

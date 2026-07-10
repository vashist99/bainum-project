/**
 * Pure client-side validation for the bug report form. Mirrors the
 * backend limits in backend/controllers/bugReportController.js so
 * users get feedback before a request is made.
 */

const EMAIL_REGEX = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export const BUG_REPORT_LIMITS = {
    title: 150,
    description: 5000,
    stepsToReproduce: 5000,
    pageOrFeature: 300,
};

/**
 * @param {{ recipientEmail?: string, title?: string, description?: string,
 *           stepsToReproduce?: string, pageOrFeature?: string }} form
 * @returns {{ [field: string]: string }} map of field -> error message; empty when valid
 */
export function validateBugReport(form = {}) {
    const errors = {};
    const recipientEmail = (form.recipientEmail || "").trim();
    const title = (form.title || "").trim();
    const description = (form.description || "").trim();
    const stepsToReproduce = (form.stepsToReproduce || "").trim();
    const pageOrFeature = (form.pageOrFeature || "").trim();

    if (!recipientEmail) {
        errors.recipientEmail = "Recipient email is required";
    } else if (!EMAIL_REGEX.test(recipientEmail)) {
        errors.recipientEmail = "Enter a single valid email address";
    }

    if (!title) {
        errors.title = "Title is required";
    } else if (title.length > BUG_REPORT_LIMITS.title) {
        errors.title = `Title must be at most ${BUG_REPORT_LIMITS.title} characters`;
    }

    if (!description) {
        errors.description = "Description is required";
    } else if (description.length > BUG_REPORT_LIMITS.description) {
        errors.description = `Description must be at most ${BUG_REPORT_LIMITS.description} characters`;
    }

    if (stepsToReproduce.length > BUG_REPORT_LIMITS.stepsToReproduce) {
        errors.stepsToReproduce = `Steps must be at most ${BUG_REPORT_LIMITS.stepsToReproduce} characters`;
    }

    if (pageOrFeature.length > BUG_REPORT_LIMITS.pageOrFeature) {
        errors.pageOrFeature = `Must be at most ${BUG_REPORT_LIMITS.pageOrFeature} characters`;
    }

    return errors;
}

export function isBugReportValid(form) {
    return Object.keys(validateBugReport(form)).length === 0;
}

import { useState } from "react";
import toast from "react-hot-toast";
import { Bug, Send } from "lucide-react";
import axios from "../lib/axios";
import { validateBugReport, BUG_REPORT_LIMITS } from "../utils/bugReport";

const EMPTY_FORM = {
    recipientEmail: "",
    title: "",
    description: "",
    stepsToReproduce: "",
    pageOrFeature: "",
};

const BugReportForm = () => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);

    const setField = (field) => (e) => {
        const value = e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateBugReport(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSending(true);
        try {
            const response = await axios.post("/api/bug-reports", {
                recipientEmail: form.recipientEmail.trim(),
                title: form.title.trim(),
                description: form.description.trim(),
                stepsToReproduce: form.stepsToReproduce.trim() || undefined,
                pageOrFeature: form.pageOrFeature.trim() || undefined,
                userAgent: navigator.userAgent,
            });
            toast.success(response.data?.message || `Bug report sent to ${form.recipientEmail.trim()}`);
            setForm(EMPTY_FORM);
            setErrors({});
        } catch (error) {
            // Draft is intentionally preserved on failure.
            toast.error(error.response?.data?.message || "Failed to send the bug report. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const fieldError = (field) =>
        errors[field] ? <span className="label-text-alt text-error mt-1">{errors[field]}</span> : null;

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-warning/10 p-2.5 rounded-xl">
                        <Bug className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                        <h2 className="card-title">Report a bug</h2>
                        <p className="text-sm text-base-content/70">
                            Describe the problem and we will email the details to the address you enter.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="form-control">
                        <label className="label" htmlFor="bug-recipient">
                            <span className="label-text">Send report to (email) *</span>
                        </label>
                        <input
                            id="bug-recipient"
                            type="email"
                            className={`input input-bordered w-full ${errors.recipientEmail ? "input-error" : ""}`}
                            placeholder="support@example.com"
                            value={form.recipientEmail}
                            onChange={setField("recipientEmail")}
                            disabled={sending}
                        />
                        {fieldError("recipientEmail")}
                    </div>

                    <div className="form-control">
                        <label className="label" htmlFor="bug-title">
                            <span className="label-text">Title *</span>
                            <span className="label-text-alt text-base-content/50">
                                {form.title.length}/{BUG_REPORT_LIMITS.title}
                            </span>
                        </label>
                        <input
                            id="bug-title"
                            type="text"
                            className={`input input-bordered w-full ${errors.title ? "input-error" : ""}`}
                            placeholder="Short summary of the problem"
                            maxLength={BUG_REPORT_LIMITS.title}
                            value={form.title}
                            onChange={setField("title")}
                            disabled={sending}
                        />
                        {fieldError("title")}
                    </div>

                    <div className="form-control">
                        <label className="label" htmlFor="bug-description">
                            <span className="label-text">Description *</span>
                        </label>
                        <textarea
                            id="bug-description"
                            className={`textarea textarea-bordered w-full min-h-28 ${errors.description ? "textarea-error" : ""}`}
                            placeholder="What happened? What did you expect to happen?"
                            maxLength={BUG_REPORT_LIMITS.description}
                            value={form.description}
                            onChange={setField("description")}
                            disabled={sending}
                        />
                        {fieldError("description")}
                    </div>

                    <div className="form-control">
                        <label className="label" htmlFor="bug-steps">
                            <span className="label-text">Steps to reproduce (optional)</span>
                        </label>
                        <textarea
                            id="bug-steps"
                            className={`textarea textarea-bordered w-full min-h-20 ${errors.stepsToReproduce ? "textarea-error" : ""}`}
                            placeholder={"1. Go to...\n2. Click on...\n3. See the error"}
                            maxLength={BUG_REPORT_LIMITS.stepsToReproduce}
                            value={form.stepsToReproduce}
                            onChange={setField("stepsToReproduce")}
                            disabled={sending}
                        />
                        {fieldError("stepsToReproduce")}
                    </div>

                    <div className="form-control">
                        <label className="label" htmlFor="bug-page">
                            <span className="label-text">Where did this happen? (optional)</span>
                        </label>
                        <input
                            id="bug-page"
                            type="text"
                            className={`input input-bordered w-full ${errors.pageOrFeature ? "input-error" : ""}`}
                            placeholder="e.g. Child data page, recording upload"
                            maxLength={BUG_REPORT_LIMITS.pageOrFeature}
                            value={form.pageOrFeature}
                            onChange={setField("pageOrFeature")}
                            disabled={sending}
                        />
                        {fieldError("pageOrFeature")}
                    </div>

                    <div className="card-actions justify-end pt-2">
                        <button type="submit" className="btn btn-primary" disabled={sending}>
                            {sending ? (
                                <>
                                    <span className="loading loading-spinner loading-sm" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send report
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BugReportForm;

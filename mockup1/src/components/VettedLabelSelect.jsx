import { useEffect, useState } from "react";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const CUSTOM_SENTINEL = "__custom__";

/**
 * Reusable picker for AI-vetted recording labels (activity or location).
 * Renders a select of predefined options (flat list or grouped) plus a
 * "custom (validated by AI)" entry that reveals a free-text input with a
 * Validate button hitting the given endpoint. Reports state upward via
 * `onStateChange({ value, ready })`:
 *  - value: resolved label text (normalized for accepted custom entries) or ""
 *  - ready: true when predefined is chosen (or empty and not required), or a
 *           custom entry has passed vetting — i.e. safe to submit.
 */
export default function VettedLabelSelect({
  label,
  labelAlt = "",
  groups = null,
  options = null,
  customOptionLabel,
  customPlaceholder = "",
  customHint = "",
  validatePath,
  payloadKey,
  defaultValue = "",
  required = true,
  disabled = false,
  onStateChange,
}) {
  const [selectedKey, setSelectedKey] = useState(defaultValue);
  const [customText, setCustomText] = useState("");
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null); // { accepted, reason, normalized }

  const isCustom = selectedKey === CUSTOM_SENTINEL;
  const customAccepted = isCustom && validation?.accepted;
  const customRejected = isCustom && validation && !validation.accepted;

  const resolvedValue = isCustom
    ? (validation?.accepted && (validation.normalized || customText.trim())) || ""
    : selectedKey;
  const ready = isCustom
    ? !!customAccepted
    : required
      ? !!selectedKey
      : true;

  useEffect(() => {
    onStateChange?.({ value: resolvedValue, ready });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedValue, ready]);

  const handleSelect = (value) => {
    setSelectedKey(value);
    setValidation(null);
    if (value !== CUSTOM_SENTINEL) setCustomText("");
  };

  const handleValidate = async () => {
    const text = customText.trim();
    if (!text) {
      toast.error(`Type a custom ${payloadKey} first`);
      return;
    }
    setValidating(true);
    setValidation(null);
    try {
      const res = await axios.post(validatePath, { [payloadKey]: text });
      setValidation(res.data);
      if (res.data?.accepted) {
        toast.success(`${label} accepted`);
      } else {
        toast.error(res.data?.reason || `${label} not accepted`);
      }
    } catch (error) {
      const msg = error.response?.data?.message || `Failed to validate ${payloadKey}`;
      toast.error(msg);
      setValidation({ accepted: false, reason: msg });
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <div className="form-control w-full mb-3">
        <label className="label py-1">
          <span className="label-text font-semibold">{label}</span>
          {labelAlt && <span className="label-text-alt">{labelAlt}</span>}
        </label>
        <select
          className="select select-bordered select-primary w-full text-base"
          value={selectedKey}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select {payloadKey === "activity" ? "an activity" : "a location"}...</option>
          {groups
            ? groups.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.activities.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </optgroup>
              ))
            : (options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
          <option value={CUSTOM_SENTINEL}>{customOptionLabel}</option>
        </select>
      </div>

      {isCustom && (
        <div className="form-control w-full mb-3">
          <label className="label py-1">
            <span className="label-text font-semibold">Custom {payloadKey}</span>
            {customHint && <span className="label-text-alt">{customHint}</span>}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className={`input input-bordered w-full sm:flex-1 text-base ${
                customAccepted ? "input-success" : ""
              } ${customRejected ? "input-error" : ""}`}
              placeholder={customPlaceholder}
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setValidation(null);
              }}
              disabled={disabled || validating}
              maxLength={120}
              autoComplete="off"
              autoCapitalize="sentences"
            />
            <button
              type="button"
              className="btn btn-secondary gap-2 w-full sm:w-auto"
              onClick={handleValidate}
              disabled={!customText.trim() || validating || disabled}
            >
              {validating ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Checking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Validate
                </>
              )}
            </button>
          </div>
          {validation && (
            <div
              className={`mt-2 text-sm flex items-start gap-2 ${
                validation.accepted ? "text-success" : "text-error"
              }`}
            >
              {validation.accepted ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span>
                {validation.reason}
                {validation.accepted && validation.normalized && (
                  <>
                    {" "}
                    <em>(saved as “{validation.normalized}”)</em>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

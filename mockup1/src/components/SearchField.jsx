import { Search } from "lucide-react";

/**
 * Shared search control: icon + input in one bordered flex row so the
 * icon stays vertically centered with the text at all viewport widths.
 */
export default function SearchField({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  inputSize = "input-sm",
  id,
  "aria-label": ariaLabel,
}) {
  const sizeClass = inputSize || "";
  const labelClass = [
    "input",
    "input-bordered",
    sizeClass,
    "flex",
    "items-center",
    "gap-2",
    "w-full",
    "sm:max-w-md",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={labelClass}>
      <Search
        className="w-4 h-4 shrink-0 text-base-content/50"
        aria-hidden="true"
      />
      <input
        type="search"
        id={id}
        className="grow min-w-0"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel || placeholder}
      />
    </label>
  );
}

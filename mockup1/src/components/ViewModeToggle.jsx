import { useRef } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { VIEW_MODE_TILES, VIEW_MODE_TABLE } from "../hooks/useViewMode.js";

/**
 * Two-segment "Tiles | Table" pill toggle, used at the top of every list
 * that supports both layouts (Children on /data, Teachers on /teachers).
 *
 * - Built on a daisyUI `btn-group` so styles match the rest of the
 *   product (forest theme primary highlight on the active segment).
 * - Exposes `role="tablist"` with `aria-selected` on each segment so
 *   screen readers announce the active layout.
 * - Reacts to ← / → arrow keys: pressing the alternate arrow always
 *   activates the other segment (the toggle is binary, so wrap-around
 *   logic collapses to "go to the other one").
 *
 * @param {{ value: string, onChange: (mode: string) => void, ariaLabel?: string }} props
 */
export default function ViewModeToggle({ value, onChange, ariaLabel = "View mode" }) {
    const tilesRef = useRef(null);
    const tableRef = useRef(null);

    const focusOther = (current) => {
        const next = current === VIEW_MODE_TILES ? tableRef.current : tilesRef.current;
        if (next) next.focus();
    };

    const handleKeyDown = (e, segment) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            const other = segment === VIEW_MODE_TILES ? VIEW_MODE_TABLE : VIEW_MODE_TILES;
            onChange(other);
            focusOther(segment);
            return;
        }
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(segment);
        }
    };

    const segmentClass = (segment) =>
        `btn btn-sm gap-1 ${
            value === segment ? "btn-primary" : "btn-ghost"
        }`;

    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className="btn-group shadow-sm rounded-lg overflow-hidden"
        >
            <button
                ref={tilesRef}
                type="button"
                role="tab"
                aria-selected={value === VIEW_MODE_TILES}
                tabIndex={value === VIEW_MODE_TILES ? 0 : -1}
                className={segmentClass(VIEW_MODE_TILES)}
                onClick={() => onChange(VIEW_MODE_TILES)}
                onKeyDown={(e) => handleKeyDown(e, VIEW_MODE_TILES)}
            >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                Tiles
            </button>
            <button
                ref={tableRef}
                type="button"
                role="tab"
                aria-selected={value === VIEW_MODE_TABLE}
                tabIndex={value === VIEW_MODE_TABLE ? 0 : -1}
                className={segmentClass(VIEW_MODE_TABLE)}
                onClick={() => onChange(VIEW_MODE_TABLE)}
                onKeyDown={(e) => handleKeyDown(e, VIEW_MODE_TABLE)}
            >
                <Table2 className="w-4 h-4" aria-hidden="true" />
                Table
            </button>
        </div>
    );
}

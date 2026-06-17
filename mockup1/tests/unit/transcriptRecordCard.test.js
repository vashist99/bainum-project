import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Test harness: render the component to static markup via
// `react-dom/server`, then assert against the resulting HTML string.
// Same pattern used by `classroomExcel.test.js` and the view-mode
// hook tests — no jsdom required.
const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const TranscriptRecordCard = (
    await import("../../src/components/TranscriptRecordCard.jsx")
).default;

function render(props) {
    return renderToStaticMarkup(
        React.createElement(TranscriptRecordCard, props)
    );
}

const BASE_PROPS = {
    id: "rec-1",
    date: "2026-04-12T14:32:00.000Z",
    transcript: "Hello world, let us look at the dinosaur fossil.",
};

describe("TranscriptRecordCard — required fields", () => {
    test("renders the date with month-day-year and hour-minute parts", () => {
        const html = render(BASE_PROPS);
        // Locale-formatted: "April 12, 2026" + a time component. We don't
        // pin the exact time string to avoid timezone fragility — the
        // year + month label uniquely identifies the date format applied.
        assert.match(html, /April/);
        assert.match(html, /2026/);
        assert.match(html, /12,/);
    });

    test("renders the transcript text inside the bounded scroll container", () => {
        const html = render(BASE_PROPS);
        assert.match(html, /dinosaur fossil/);
        // Existing scroll-clamp recipe.
        assert.match(html, /max-h-64/);
        assert.match(html, /overflow-y-auto/);
    });

    test("falls back to em-dash when date is missing or unparsable", () => {
        const html = render({ ...BASE_PROPS, date: "not-a-date" });
        assert.match(html, /—/);
    });
});

describe("TranscriptRecordCard — Delete button visibility", () => {
    test("does NOT render Delete when onDelete is undefined", () => {
        const html = render(BASE_PROPS);
        assert.doesNotMatch(html, /aria-label="Delete transcript"/);
        assert.doesNotMatch(html, /Delete transcript/);
    });

    test("does NOT render Delete when onDelete is null", () => {
        const html = render({ ...BASE_PROPS, onDelete: null });
        assert.doesNotMatch(html, /aria-label="Delete transcript"/);
    });

    test("renders Delete when onDelete is a function", () => {
        const html = render({ ...BASE_PROPS, onDelete: () => {} });
        assert.match(html, /aria-label="Delete transcript"/);
        // The lucide Trash2 icon is rendered as an inline SVG.
        assert.match(html, /<svg/);
    });
});

describe("TranscriptRecordCard — activity badge", () => {
    test("renders the activity name when provided", () => {
        const html = render({ ...BASE_PROPS, activity: "Circle time" });
        assert.match(html, /Circle time/);
        assert.match(html, /badge-primary/);
    });

    test("uses the home tooltip when activityContext is 'home'", () => {
        const html = render({
            ...BASE_PROPS,
            activity: "Reading",
            activityContext: "home",
        });
        assert.match(html, /Activity recorded at home/);
    });

    test("uses the school tooltip when activityContext is 'school' (default)", () => {
        const html = render({
            ...BASE_PROPS,
            activity: "Reading",
            activityContext: "school",
        });
        assert.match(html, /Activity recorded at school/);
    });

    test("does not render an activity badge when activity is missing", () => {
        const html = render(BASE_PROPS);
        assert.doesNotMatch(html, /badge-primary/);
    });
});

describe("TranscriptRecordCard — attribution badge (classroom use-case)", () => {
    test("renders the attribution string when provided", () => {
        const html = render({
            ...BASE_PROPS,
            attribution: "Recorded for: Alice",
        });
        assert.match(html, /Recorded for: Alice/);
        assert.match(html, /badge-ghost/);
    });

    test("omits the attribution badge when not provided", () => {
        const html = render(BASE_PROPS);
        assert.doesNotMatch(html, /Recorded for/);
    });
});

describe("TranscriptRecordCard — duration + WPM line", () => {
    test("renders duration in min/sec when durationSeconds is provided", () => {
        const html = render({ ...BASE_PROPS, durationSeconds: 125 });
        assert.match(html, /2 min/);
        assert.match(html, /5 sec/);
    });

    test("renders total word count when wordCount is provided", () => {
        const html = render({ ...BASE_PROPS, wordCount: 120 });
        assert.match(html, /120 words/);
    });

    test("renders total WPM when wordsPerMinute is provided", () => {
        const html = render({ ...BASE_PROPS, wordsPerMinute: 57.6 });
        assert.match(html, /57\.6 WPM/);
        assert.match(html, /badge-primary/);
    });

    test("renders WPM: N/A fallback when wordsPerMinute is missing", () => {
        const html = render(BASE_PROPS);
        assert.match(html, /WPM: N\/A/);
    });

    test("renders the compact per-category WPM line when categoryWPM is provided", () => {
        const html = render({
            ...BASE_PROPS,
            categoryWPM: { science: 12, social: 8, literature: 4, language: 30 },
        });
        assert.match(html, /Sci 12/);
        assert.match(html, /Soc 8/);
        assert.match(html, /Lit 4/);
        assert.match(html, /Lang 30/);
    });
});

describe("TranscriptRecordCard — per-category word-count badges", () => {
    const fullCount = {
        science: 26,
        social: 17,
        literature: 9,
        language: 68,
    };

    test("renders all four colored badges when categoryWordCount is fully populated", () => {
        const html = render({
            ...BASE_PROPS,
            categoryWordCount: fullCount,
            categoryWPM: { science: 12, social: 8, literature: 4, language: 30 },
        });
        assert.match(html, /data-testid="category-badge-science"/);
        assert.match(html, /data-testid="category-badge-social"/);
        assert.match(html, /data-testid="category-badge-literature"/);
        assert.match(html, /data-testid="category-badge-language"/);
        assert.match(html, /Science: 26 words/);
        assert.match(html, /Social: 17 words/);
        assert.match(html, /Literature: 9 words/);
        assert.match(html, /Language: 68 words/);
        // WPM annotation appears next to each category.
        assert.match(html, /Science: 26 words \(12 WPM\)/);
    });

    test("renders only the populated categories when partial", () => {
        const html = render({
            ...BASE_PROPS,
            categoryWordCount: { science: 26, language: 68 },
        });
        assert.match(html, /Science: 26 words/);
        assert.match(html, /Language: 68 words/);
        assert.doesNotMatch(html, /Social: /);
        assert.doesNotMatch(html, /Literature: /);
    });

    test("uses singular 'word' when the count is exactly 1", () => {
        const html = render({
            ...BASE_PROPS,
            categoryWordCount: { science: 1 },
        });
        assert.match(html, /Science: 1 word\b/);
        assert.doesNotMatch(html, /Science: 1 words/);
    });

    test("omits the badge row entirely when categoryWordCount is missing", () => {
        const html = render(BASE_PROPS);
        assert.doesNotMatch(html, /data-testid="category-badge-/);
    });
});

describe("TranscriptRecordCard — mobile-friendly layout", () => {
    test("uses responsive header stack and break-words on transcript body", () => {
        const html = render({
            ...BASE_PROPS,
            activity: "Very long circle time activity label",
            onDelete: () => {},
            categoryWordCount: { science: 26, social: 17, literature: 9, language: 68 },
        });
        assert.match(html, /flex-col/);
        assert.match(html, /sm:flex-row/);
        assert.match(html, /break-words/);
        assert.match(html, /min-h-11/);
        assert.match(html, /min-w-11/);
        assert.doesNotMatch(html, /w-\[320px\]/);
    });

    test("card root does not force a fixed viewport width", () => {
        const html = render(BASE_PROPS);
        assert.doesNotMatch(html, /min-w-\[|w-screen/);
    });
});

describe("TranscriptRecordCard — RAG highlighting", () => {
    test("renders the RAG legend and highlighted spans when ragSegments is non-empty", () => {
        const ragSegments = [
            {
                text: "dinosaur",
                category: "science",
                startIndex: BASE_PROPS.transcript.indexOf("dinosaur"),
                endIndex:
                    BASE_PROPS.transcript.indexOf("dinosaur") + "dinosaur".length,
            },
        ];
        const html = render({ ...BASE_PROPS, ragSegments });
        // Legend labels (from RAGColorLegend.jsx):
        assert.match(html, /Science skills/);
        assert.match(html, /Social emotional skills/);
        assert.match(html, /Literature skills/);
        assert.match(html, /Language development skills/);
        // The highlighted span carries the science color class.
        assert.match(html, /bg-blue-100/);
    });

    test("falls back to plain transcript when ragSegments is undefined and the keyword fallback finds nothing", () => {
        const html = render({
            ...BASE_PROPS,
            transcript: "qqqqqqqqqqqq", // no keyword match
        });
        // No legend.
        assert.doesNotMatch(html, /Science skills/);
        // Plain text body.
        assert.match(html, /qqqqqqqqqqqq/);
    });

    test("falls back to plain transcript when ragSegments is an empty array AND no keywords match", () => {
        const html = render({
            ...BASE_PROPS,
            transcript: "zzzzzz",
            ragSegments: [],
        });
        assert.doesNotMatch(html, /Science skills/);
        assert.match(html, /zzzzzz/);
    });
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const SearchField = (await import("../../src/components/SearchField.jsx")).default;

function render(props = {}) {
  return renderToStaticMarkup(
    React.createElement(SearchField, {
      value: "",
      onChange: () => {},
      placeholder: "Search teachers...",
      ...props,
    })
  );
}

describe("SearchField", () => {
  test("renders icon and input in a flex row with items-center on the label", () => {
    const html = render();
    assert.match(html, /<label[^>]*class="[^"]*flex[^"]*items-center[^"]*"/);
    assert.match(html, /<input[^>]*type="search"/);
    assert.match(html, /grow/);
    assert.match(html, /min-w-0/);
    assert.match(html, /<svg/);
  });

  test("applies input-sm by default", () => {
    const html = render();
    assert.match(html, /input-sm/);
  });

  test("omits size class when inputSize is empty", () => {
    const html = render({ inputSize: "" });
    assert.doesNotMatch(html, /input-sm/);
  });
});

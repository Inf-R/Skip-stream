const test = require("node:test");
const assert = require("node:assert");
const { findSkipButton, createSkipper, isElementReady } = require("../src/skipper");

test("isElementReady allows dimmed button (opacity 0.5)", () => {
  const baseElement = {
    offsetWidth: 100,
    offsetHeight: 40,
    disabled: false,
    getAttribute: () => null,
    style: { opacity: "0.5" },
  };
  assert.strictEqual(isElementReady(baseElement), true);
});

test("isElementReady returns false when button is hidden or has opacity 0", () => {
  const baseElement = {
    offsetWidth: 100,
    offsetHeight: 40,
    disabled: false,
    getAttribute: () => null,
    style: { opacity: "0" },
  };
  assert.strictEqual(isElementReady(baseElement), false);

  baseElement.style = { visibility: "hidden" };
  assert.strictEqual(isElementReady(baseElement), false);
});
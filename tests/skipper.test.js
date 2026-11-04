const test = require("node:test");
const assert = require("node:assert");
const {
  findSkipButton,
  createSkipper,
  isElementReady,
  isAdVideoReady,
  findAdVideo,
  createPlaytimeSkipper,
} = require("../src/skipper");

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

test("isAdVideoReady returns true only when duration is finite and currentTime is not at the end", () => {
  assert.strictEqual(isAdVideoReady({ duration: NaN, currentTime: 0 }), false);
  assert.strictEqual(isAdVideoReady({ duration: 0, currentTime: 0 }), false);
  assert.strictEqual(isAdVideoReady({ duration: 15, currentTime: 14.8 }), false);
  assert.strictEqual(isAdVideoReady({ duration: 15, currentTime: 0.5 }), true);
});

test("createPlaytimeSkipper fast-forwards ad video to duration when ad player is active", () => {
  const video = { duration: 15, currentTime: 1.2 };
  const player = { querySelector: (sel) => (sel === "video.html5-main-video" ? video : null) };
  let adActive = true;
  const timers = [];
  let skippedCount = 0;

  const skipper = createPlaytimeSkipper({
    root: {
      querySelectorAll: (sel) => (adActive && sel === ".ad-showing" ? [player] : []),
    },
    playerSelectors: [".ad-showing"],
    delayMs: 50,
    schedule: (fn, ms) => timers.push({ fn, ms }),
    onSkip: () => {
      skippedCount += 1;
    },
  });

  skipper.trySkip();
  assert.strictEqual(timers.length, 1);
  assert.strictEqual(video.currentTime, 1.2, "must wait until delay elapses");

  timers[0].fn();
  assert.strictEqual(video.currentTime, 15, "must jump to the end of the ad");
  assert.strictEqual(skippedCount, 1);
});

test("createPlaytimeSkipper does not fast-forward if ad ended before delay elapsed", () => {
  const video = { duration: 200, currentTime: 0.1 };
  const player = { querySelector: () => video };
  let adActive = true;
  const timers = [];

  const skipper = createPlaytimeSkipper({
    root: {
      querySelectorAll: () => (adActive ? [player] : []),
    },
    playerSelectors: [".ad-showing"],
    delayMs: 50,
    schedule: (fn) => timers.push(fn),
  });

  skipper.trySkip();
  adActive = false; // Ad ended, main song started
  timers[0]();

  assert.strictEqual(video.currentTime, 0.1, "must not touch main song playtime");
});

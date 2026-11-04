// Glue code: wires the pure skipper to the page (DOM observer + stored settings).
(() => {
  const SKIP_DELAY_MS = 300; // small pause so the click looks like a normal user action
  const POLL_INTERVAL_MS = 1000; // safety net for changes the observer may miss
  const DEFAULT_SETTINGS = { enabled: true };

  let enabled = DEFAULT_SETTINGS.enabled;
  let frameRequested = false;

  const skipper = createSkipper({
    root: document,
    selectors: SKIP_BUTTON_SELECTORS,
    delayMs: SKIP_DELAY_MS,
    click: clickLikeUser,
    onSkip: () => console.info("[auto-skip] ad skipped"),
    onFail: (button) =>
      console.warn("[auto-skip] clicked but the button is still there:", button.outerHTML),
  });

  // Delegates the click to the MAIN world hook so YouTube sees isTrusted = true
  // with valid button center coordinates.
  function clickLikeUser(element) {
    element.setAttribute("data-auto-skip-target", "true");
    document.dispatchEvent(new CustomEvent("yt-auto-skip:click"));
  }

  // YouTube mutates the DOM constantly; check at most once per animation frame.
  function requestCheck() {
    if (!enabled || frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(() => {
      frameRequested = false;
      skipper.trySkip();
    });
  }

  async function loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      enabled = settings.enabled;
    } catch (error) {
      console.warn("[auto-skip] could not read settings, using defaults", error);
    }
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) enabled = changes.enabled.newValue;
  });

  loadSettings().then(() => {
    new MutationObserver(requestCheck).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });
    setInterval(requestCheck, POLL_INTERVAL_MS);
    console.info("[auto-skip] content script loaded, enabled =", enabled);
  });
})();

// Glue code: wires the pure skipper to the page (DOM observer + stored settings).
(() => {
  const SKIP_DELAY_MS = 300;
  const YTM_SKIP_DELAY_MS = 50;
  const POLL_INTERVAL_MS = 1000;
  const DEFAULT_SETTINGS = { enabled: true };

  let enabled = DEFAULT_SETTINGS.enabled;
  let frameRequested = false;

  const isYouTubeMusic = window.location.hostname === "music.youtube.com";

  // Regular YouTube: click the skip button via MAIN world hook
  const buttonSkipper = createSkipper({
    root: document,
    selectors: SKIP_BUTTON_SELECTORS,
    delayMs: SKIP_DELAY_MS,
    click: clickLikeUser,
    onSkip: () => console.info("[auto-skip] ad skipped via button"),
    onFail: (button) =>
      console.warn("[auto-skip] clicked but the button is still there:", button.outerHTML),
  });

  // YouTube Music: manipulate ad playtime to the end
  const playtimeSkipper = createPlaytimeSkipper({
    root: document,
    playerSelectors: AD_PLAYER_SELECTORS,
    videoSelector: AD_VIDEO_SELECTOR,
    delayMs: YTM_SKIP_DELAY_MS,
    onSkip: () => console.info("[auto-skip] YouTube Music ad fast-forwarded to end"),
  });

  function clickLikeUser(element) {
    element.setAttribute("data-auto-skip-target", "true");
    document.dispatchEvent(new CustomEvent("yt-auto-skip:click"));
  }

  // Fallback to setTimeout when tab is in the background so frameRequested never locks up.
  function scheduleFrame(callback) {
    if (document.hidden) {
      setTimeout(callback, 50);
    } else {
      requestAnimationFrame(callback);
    }
  }

  function requestCheck() {
    if (!enabled || frameRequested) return;
    frameRequested = true;
    scheduleFrame(() => {
      frameRequested = false;
      if (isYouTubeMusic) {
        playtimeSkipper.trySkip();
      }
      buttonSkipper.trySkip();
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

    // Trigger check immediately when ad video stream metadata/duration loads in YTM
    if (isYouTubeMusic) {
      document.addEventListener("loadedmetadata", requestCheck, true);
      document.addEventListener("durationchange", requestCheck, true);
    }

    setInterval(requestCheck, POLL_INTERVAL_MS);
    console.info(
      `[auto-skip] content script loaded (${isYouTubeMusic ? "YouTube Music" : "YouTube"}), enabled =`,
      enabled
    );
  });
})();
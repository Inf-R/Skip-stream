// Pure skip logic. It knows nothing about chrome.* APIs or MutationObserver,
// so it can be unit-tested in Node with a fake DOM.

function isElementVisible(element) {
  return Boolean(
    element &&
      (element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  );
}

function isElementReady(element) {
  if (!isElementVisible(element) || element.disabled) return false;
  if (element.getAttribute?.("aria-disabled") === "true") return false;
  if (element.style?.visibility === "hidden" || element.style?.opacity === "0") {
    return false;
  }
  return true;
}

// Returns the first ready element matching any selector, or null.
function findSkipButton(root, selectors, isReady = isElementReady) {
  for (const selector of selectors) {
    for (const element of root.querySelectorAll(selector)) {
      if (isReady(element)) return element;
    }
  }
  return null;
}

// Button-based skipper for regular YouTube (www.youtube.com).
function createSkipper({
  root,
  selectors,
  delayMs = 0,
  verifyDelayMs = 1000,
  isReady = isElementReady,
  click = (element) => element.click(),
  schedule = setTimeout,
  onSkip = () => {},
  onFail = () => {},
}) {
  let pending = false;

  function trySkip() {
    if (pending) return;
    const button = findSkipButton(root, selectors, isReady);
    if (!button) return;

    pending = true;
    schedule(() => {
      if (!isReady(button)) {
        pending = false;
        return;
      }
      click(button);
      schedule(() => {
        pending = false;
        if (isReady(button)) onFail(button);
        else onSkip();
      }, verifyDelayMs);
    }, delayMs);
  }

  return { trySkip };
}

// Checks if the ad video has loaded its duration and hasn't reached the end yet.
function isAdVideoReady(video) {
  return Boolean(
    video &&
      Number.isFinite(video.duration) &&
      video.duration > 0 &&
      video.currentTime < video.duration - 0.5
  );
}

// Finds the active ad video inside an ad-showing player container.
function findAdVideo(
  root,
  playerSelectors,
  videoSelector = "video.html5-main-video",
  isVideoReady = isAdVideoReady
) {
  for (const selector of playerSelectors) {
    for (const player of root.querySelectorAll(selector)) {
      const video = player.querySelector(videoSelector);
      if (isVideoReady(video)) return video;
    }
  }
  return null;
}

// Playtime-manipulation skipper for YouTube Music (music.youtube.com)
// where ads are mostly unskippable.
function createPlaytimeSkipper({
  root,
  playerSelectors,
  videoSelector = "video.html5-main-video",
  delayMs = 50,
  isVideoReady = isAdVideoReady,
  fastForward = (video) => {
    video.currentTime = video.duration;
  },
  schedule = setTimeout,
  onSkip = () => {},
}) {
  let pending = false;

  function trySkip() {
    if (pending) return;
    const video = findAdVideo(root, playerSelectors, videoSelector, isVideoReady);
    if (!video) return;

    pending = true;
    schedule(() => {
      pending = false;
      // Re-query to ensure the player is STILL in .ad-showing state
      // so we never fast-forward the actual music track.
      const activeAdVideo = findAdVideo(
        root,
        playerSelectors,
        videoSelector,
        isVideoReady
      );
      if (!activeAdVideo) return;

      fastForward(activeAdVideo);
      onSkip(activeAdVideo);
    }, delayMs);
  }

  return { trySkip };
}

if (typeof module !== "undefined") {
  module.exports = {
    findSkipButton,
    createSkipper,
    isElementVisible,
    isElementReady,
    isAdVideoReady,
    findAdVideo,
    createPlaytimeSkipper,
  };
}
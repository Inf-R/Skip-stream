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

if (typeof module !== "undefined") {
  module.exports = { findSkipButton, createSkipper, isElementVisible, isElementReady };
}
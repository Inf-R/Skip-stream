// CSS selectors that match YouTube's "Skip" button.
// Kept in its own file because YouTube changes its markup from time to time:
// when skipping stops working, this is usually the only file that needs an update.
const SKIP_BUTTON_SELECTORS = [
  ".ytp-skip-ad-button",
  ".ytp-ad-skip-button-modern",
  ".ytp-ad-skip-button",
  ".ytp-ad-skip-button-container button",
];

if (typeof module !== "undefined") {
  module.exports = { SKIP_BUTTON_SELECTORS };
}

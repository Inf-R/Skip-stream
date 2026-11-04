// CSS selectors that match YouTube's "Skip" button and ad player states.
const SKIP_BUTTON_SELECTORS = [
  ".ytp-skip-ad-button",
  ".ytp-ad-skip-button-modern",
  ".ytp-ad-skip-button",
  ".ytp-ad-skip-button-slot button",
  ".ytp-ad-skip-button-container button",
];

const AD_PLAYER_SELECTORS = [
  ".html5-video-player.ad-showing",
  ".html5-video-player.ad-interrupting",
];

const AD_VIDEO_SELECTOR = "video.html5-main-video";

if (typeof module !== "undefined") {
  module.exports = {
    SKIP_BUTTON_SELECTORS,
    AD_PLAYER_SELECTORS,
    AD_VIDEO_SELECTOR,
  };
}
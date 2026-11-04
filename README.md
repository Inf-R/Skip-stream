# Auto Skip for YouTube

A small Manifest V3 browser extension that clicks the **Skip** button on skippable
YouTube ads, so you can keep watching hands-free (eating, lying down, etc.).

> **Disclaimer:** educational / portfolio project. It only clicks the Skip button that
> YouTube already shows; it does not block ads. Automating interactions may conflict
> with YouTube's Terms of Service. Use at your own discretion.

## How it works

1. A `MutationObserver` watches the page for DOM changes (throttled to once per animation frame).
2. `skipper.js` looks for a visible element matching `SKIP_BUTTON_SELECTORS`.
3. If found, it clicks it after a short delay (re-checking visibility first).

## Project structure

```
src/selectors.js   CSS selectors for the Skip button (update here when YouTube changes)
src/skipper.js     Pure logic: find the button, schedule one click (unit-tested)
src/content.js     Glue: observer + settings
popup/             Toggle on/off (stored with chrome.storage.sync)
tests/             Node built-in test runner, fake DOM, no dependencies
```

## Install (development)

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Open YouTube. Toggle the extension from its popup.

## Tests

```
npm test
```

## Roadmap

- [ ] Adapters for other video sites
- [ ] Configurable delay and per-site toggle
- [ ] Skip counter in the popup
- [ ] Firefox build
- [ ] Android version (AccessibilityService)

## License

MIT

# SkipStream ⚡

> Lightweight, zero-click ad skipper for YouTube and YouTube Music built with Vanilla JavaScript and Manifest V3.

SkipStream automatically detects and triggers the "Skip Ad" sequence without disrupting playback state, bypassing synthetic event protections (`event.isTrusted`), and preventing post-roll promotional sponsor cards.

---

## 💡 The Problem

Modern web video players (such as YouTube's `base.js`) implement layered protections against automated interactions:

1. **Synthetic Click Rejection:** Direct DOM `.click()` calls dispatch an untrusted event (`event.isTrusted === false`) with `(0, 0)` pointer coordinates, which internal player listeners intentionally drop.
2. **Ad-Pod Inconsistencies:** Artificially fast-forwarding the `<video>` tag (`currentTime = duration`) triggers an `ended` event rather than a `skip` state. This causes YouTube to display interactive sponsor end-cards and can fail to cancel multi-ad queues (e.g., 2 consecutive ads).
3. **Aggressive DOM Mutations:** Polling the DOM constantly causes CPU throttling and layout thrashing.

---

## 🛠️ Architecture & Solution

SkipStream is built with a modular, test-driven architecture:

```text
├── manifest.json         # Extension configuration (MV3)
├── src/
│   ├── selectors.js      # Isolated CSS selector definitions
│   ├── skipper.js        # Pure skipping engine (framework & browser agnostic)
│   ├── content.js        # DOM MutationObserver & Chrome storage bridge
│   └── main-world.js     # MAIN world script providing trusted event proxies
└── tests/
    └── skipper.test.js   # Unit tests using Node.js native test runner
```

### Key Technical Highlights

- **MAIN World Event Proxy:** Injected via Manifest V3 `world: "MAIN"` at `document_start`, wrapping `EventTarget.prototype.addEventListener` with a transparent `Proxy`. Events dispatched by the extension present `isTrusted: true` and calculated center coordinates directly to YouTube's player listeners.
- **Pure Functional Logic:** `src/skipper.js` has zero dependencies on browser globals (`window`, `chrome.*`, or `document`), allowing it to be unit-tested in plain Node.js.
- **Batched DOM Tracking:** Employs a scoped `MutationObserver` debounced via `requestAnimationFrame` to ensure checks run at most once per display refresh cycle.
- **State Validation:** Validates element readiness (including countdown opacity transitions) before queuing clicks to prevent race conditions.

---

## 🚀 Getting Started

### Prerequisites

- Google Chrome, Chromium, or any Chromium-based browser (Brave, Edge, etc.)
- [Node.js](https://nodejs.org/) (v18+ recommended for running unit tests)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/skip-stream.git
   cd skip-stream
   ```
2. Open your browser and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle switch in the top-right corner).
4. Click **Load unpacked** and select the root directory of this repository.

---

## 🧪 Running Tests

The test suite validates queue states, delayed triggers, and readiness checks using Node.js's native test runner:

```bash
npm test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
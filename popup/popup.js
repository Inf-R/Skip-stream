const DEFAULT_SETTINGS = { enabled: true };
const checkbox = document.getElementById("enabled");

chrome.storage.sync.get(DEFAULT_SETTINGS).then(({ enabled }) => {
  checkbox.checked = enabled;
});

checkbox.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: checkbox.checked });
});

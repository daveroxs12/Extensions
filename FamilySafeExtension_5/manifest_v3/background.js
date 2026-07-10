// Minimal service worker for Manifest V3.
// Ensures default settings exist on install.

const DEFAULT_SETTINGS = {
  blockDomains: true,
  blockUrlPatterns: true,
  scanSearchResults: true,
  blurImages: true,
  sensitivity: 'medium',
  whitelist: []
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['familySafeSettings'], (result) => {
    if (!result.familySafeSettings) {
      chrome.storage.sync.set({ familySafeSettings: DEFAULT_SETTINGS });
    }
  });
});

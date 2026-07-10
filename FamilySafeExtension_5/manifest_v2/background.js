// Background script for Manifest V2 (Firefox).
// Uses blocking webRequest to stop adult sites from loading at all,
// instead of waiting for the page to load and then blanking it.
// Relies on BLOCKED_DOMAINS / BLOCKED_URL_PATTERNS from blocklist.js,
// loaded before this file.

const DEFAULT_SETTINGS = {
  blockDomains: true,
  blockUrlPatterns: true,
  scanSearchResults: true,
  blurImages: true,
  sensitivity: 'medium',
  whitelist: []
};

let currentSettings = { ...DEFAULT_SETTINGS };

function refreshSettings() {
  chrome.storage.sync.get(['familySafeSettings'], (result) => {
    currentSettings = { ...DEFAULT_SETTINGS, ...(result.familySafeSettings || {}) };
  });
}

refreshSettings();

chrome.storage.onChanged.addListener((changes) => {
  if (changes.familySafeSettings) {
    refreshSettings();
  }
});

function isWhitelisted(hostname) {
  return currentSettings.whitelist.includes(hostname);
}

function isBlockedHost(hostname) {
  for (const domain of BLOCKED_DOMAINS) {
    if (hostname === domain || hostname.endsWith('.' + domain)) {
      return true;
    }
  }
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (hostname.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function enforceSafeSearch(url) {
  const engine = SAFE_SEARCH_ENGINES.find((e) => url.hostname.includes(e.hostIncludes));
  if (!engine) return null;

  let changed = false;
  for (const [key, value] of Object.entries(engine.params)) {
    if (url.searchParams.get(key) !== value) {
      url.searchParams.set(key, value);
      changed = true;
    }
  }
  return changed ? url.toString() : null;
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Only inspect top-level page navigations, not every sub-resource
    // (avoids blocking things like ad/analytics requests embedded in
    // otherwise-safe pages, and keeps this fast).
    if (details.type !== 'main_frame') return {};

    let url;
    try {
      url = new URL(details.url);
    } catch {
      return {};
    }
    const hostname = url.hostname.toLowerCase();

    if (isWhitelisted(hostname)) return {};

    if (isBlockedHost(hostname)) {
      const blockedPageUrl = chrome.runtime.getURL('blocked.html') +
        '?site=' + encodeURIComponent(hostname);
      return { redirectUrl: blockedPageUrl };
    }

    const safeSearchUrl = enforceSafeSearch(url);
    if (safeSearchUrl) {
      return { redirectUrl: safeSearchUrl };
    }

    return {};
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

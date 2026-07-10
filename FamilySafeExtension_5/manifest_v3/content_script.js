// Content script for Family Safe Browser Extension
// Filters adult content by domain, URL pattern, search results, and images.
// BLOCKED_DOMAINS / BLOCKED_URL_PATTERNS / SEARCH_BLOCKWORDS come from blocklist.js,
// loaded before this file.

// These four are locked on and are re-asserted every time settings are
// loaded, so filtering can't be switched off via the popup or by editing
// extension storage directly.
const LOCKED_SETTINGS = {
  blockDomains: true,
  blockUrlPatterns: true,
  scanSearchResults: true,
  blurImages: true
};

let blocklistLoaded = false;
let currentSettings = {
  ...LOCKED_SETTINGS,
  sensitivity: 'medium',
  whitelist: []
};

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['familySafeSettings'], (result) => {
      if (result.familySafeSettings) {
        currentSettings = { ...currentSettings, ...result.familySafeSettings };
      }
      currentSettings = { ...currentSettings, ...LOCKED_SETTINGS };
      blocklistLoaded = true;
      resolve(currentSettings);
    });
  });
}

function isWhitelisted(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return currentSettings.whitelist.includes(hostname);
  } catch {
    return false;
  }
}

function shouldBlockUrl(url) {
  if (!blocklistLoaded) return false;
  if (isWhitelisted(url)) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();

    if (currentSettings.blockDomains) {
      for (const domain of BLOCKED_DOMAINS) {
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          return { type: 'domain', reason: `Blocked domain: ${domain}` };
        }
      }
    }

    if (currentSettings.blockUrlPatterns) {
      for (const pattern of BLOCKED_URL_PATTERNS) {
        if (pathname.includes(pattern) || hostname.includes(pattern) || search.includes(pattern)) {
          return { type: 'url_pattern', reason: `Blocked URL pattern: ${pattern}` };
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking URL block status:', error);
    return false;
  }
}

function scanSearchResults() {
  if (!currentSettings.scanSearchResults) return;

  const searchEngines = ['google.', 'bing.', 'duckduckgo.', 'yahoo.'];
  const isSearchPage = searchEngines.some((engine) => document.location.hostname.includes(engine));
  if (!isSearchPage) return;

  const resultElements = document.querySelectorAll('.g, .rc, .b_algo, .result, .web-result');

  resultElements.forEach((result) => {
    const titleEl = result.querySelector('h3, .title, .headline');
    const snippetEl = result.querySelector('.snippet, .content, .description, .b_caption');
    const linkEl = result.querySelector('a');
    if (!linkEl) return;

    const combinedText = ((titleEl?.textContent || '') + ' ' + (snippetEl?.textContent || '')).toLowerCase();
    const hasAdultContent = SEARCH_BLOCKWORDS.some((word) => combinedText.includes(word));

    if (hasAdultContent) {
      result.style.display = 'none';
      const warning = document.createElement('div');
      warning.style.cssText = `
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        padding: 10px;
        margin: 10px 0;
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: #856404;
        text-align: center;
      `;
      warning.textContent = 'Adult content filtered';
      result.parentNode?.insertBefore(warning, result);
    }
  });
}

function blurSuspiciousImages() {
  if (!currentSettings.blurImages) return;

  const images = document.querySelectorAll('img:not([data-fs-checked])');

  images.forEach((img) => {
    img.setAttribute('data-fs-checked', '1');
    const src = (img.src || '').toLowerCase();
    const alt = (img.alt || '').toLowerCase();

    const isAdultImage = SEARCH_BLOCKWORDS.some((word) => src.includes(word) || alt.includes(word));

    if (isAdultImage) {
      img.style.filter = 'blur(20px)';
      img.title = 'Adult content blurred';
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        img.style.filter = '';
      }, { once: true });
    }
  });
}

function showBlockedPage(reason) {
  document.documentElement.innerHTML = '';
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f8f9fa;
    font-family: Arial, sans-serif;
  `;
  container.innerHTML = `
    <div style="background:white;padding:30px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);max-width:400px;text-align:center;">
      <h2 style="color:#856404;margin-bottom:20px;">Family Safe Filter Active</h2>
      <p style="color:#856404;margin-bottom:15px;">${reason}</p>
      <p style="color:#6c757d;font-size:14px;">This page was blocked by Family Safe filtering.</p>
    </div>
  `;
  document.body.appendChild(container);
  document.title = 'Content Blocked - Family Safe';
}

async function initializeExtension() {
  await loadSettings();

  const blocked = shouldBlockUrl(window.location.href);
  if (blocked) {
    showBlockedPage(blocked.reason);
    return;
  }

  scanSearchResults();
  blurSuspiciousImages();

  const observer = new MutationObserver(() => {
    scanSearchResults();
    blurSuspiciousImages();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.familySafeSettings) {
    loadSettings();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

// Shared blocklist data, loaded before content_script.js and background.js.
// This list is not exhaustive — add more domains as needed. For broader
// coverage, consider merging in a maintained public blocklist such as
// StevenBlack's "unified hosts + porn" list or Ultimate Hosts Blacklist.

const BLOCKED_DOMAINS = [
  "xhamster.com",
  "xhamster2.com",
  "xhamster3.com",
  "xhamster42.com",
  "xhamster42.desi",
  "xhamster.desi",
  "xhamsterlive.com",
  "xhday.com",
  "xhwebsite.com",
  "pornhub.com",
  "pornhubpremium.com",
  "xvideos.com",
  "xnxx.com",
  "redtube.com",
  "youporn.com",
  "youjizz.com",
  "tube8.com",
  "spankbang.com",
  "brazzers.com",
  "chaturbate.com",
  "stripchat.com",
  "livejasmin.com",
  "onlyfans.com",
  "fansly.com",
  "motherless.com",
  "thumbzilla.com",
  "beeg.com",
  "txxx.com",
  "hqporner.com",
  "porn.com",
  "eporner.com",
  "xxxvideos.com",
  "sex.com",
  "rule34.xxx",
  "e-hentai.org",
  "nhentai.net",
  "hentaihaven.xxx",
  "erome.com",
  "fapello.com",
  "coomer.party",
  "kemono.party",
];

// Substrings matched against hostname/path/query for anything not caught
// by the exact domain list above.
const BLOCKED_URL_PATTERNS = [
  "xhamster",
  "pornhub",
  "xvideos",
  "xnxx",
  "redtube",
  "youporn",
];

// Search engines to force into strict SafeSearch mode. Each entry maps a
// hostname match to the query parameter(s) that engine uses to force safe
// results. Applied at the network level so it can't be bypassed by simply
// disabling anything in-page.
const SAFE_SEARCH_ENGINES = [
  { hostIncludes: "google.", params: { safe: "active" } },
  { hostIncludes: "bing.com", params: { adlt: "strict" } },
  { hostIncludes: "duckduckgo.com", params: { kp: "1" } },
  { hostIncludes: "search.yahoo.com", params: { vm: "r" } },
  { hostIncludes: "yandex.", params: { family: "yes" } },
];

const SEARCH_BLOCKWORDS = [
  "porn",
  "xxx",
  "xhamster",
  "pornhub",
  "xvideos",
  "nsfw",
];

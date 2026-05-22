(function () {
  "use strict";

  const DEFAULT_ENABLED = true;
  const DEFAULT_DOMAINS = ["www.xiaohongshu.com"];
  const STORAGE_KEYS = {
    enabled: "touchFishEnabled",
    domains: "touchFishDomains"
  };

  function normalizeHostname(hostname) {
    return String(hostname || "").trim().toLowerCase();
  }

  function normalizeDomains(domains) {
    if (!Array.isArray(domains)) {
      return [...DEFAULT_DOMAINS];
    }

    return [...new Set(domains.map(normalizeHostname).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function domainMatches(hostname, domain) {
    const normalizedHostname = normalizeHostname(hostname);
    const normalizedDomain = normalizeHostname(domain);

    return (
      Boolean(normalizedHostname && normalizedDomain) &&
      (normalizedHostname === normalizedDomain || normalizedHostname.endsWith(`.${normalizedDomain}`))
    );
  }

  function domainListMatches(hostname, domains) {
    return normalizeDomains(domains).some((domain) => domainMatches(hostname, domain));
  }

  function parsePageHostname(url) {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol) ? normalizeHostname(parsed.hostname) : "";
    } catch (_error) {
      return "";
    }
  }

  function getStorageDefaults() {
    return {
      [STORAGE_KEYS.enabled]: DEFAULT_ENABLED,
      [STORAGE_KEYS.domains]: DEFAULT_DOMAINS
    };
  }

  function readSettings() {
    return chrome.storage.local.get(getStorageDefaults()).then((values) => ({
      enabled: values[STORAGE_KEYS.enabled] !== false,
      domains: normalizeDomains(values[STORAGE_KEYS.domains])
    }));
  }

  function writeSettings(values) {
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(values, "enabled")) {
      updates[STORAGE_KEYS.enabled] = values.enabled !== false;
    }

    if (Object.prototype.hasOwnProperty.call(values, "domains")) {
      updates[STORAGE_KEYS.domains] = normalizeDomains(values.domains);
    }

    return chrome.storage.local.set(updates);
  }

  window.TOUCH_FISH_SHARED = {
    DEFAULT_ENABLED,
    DEFAULT_DOMAINS,
    STORAGE_KEYS,
    domainListMatches,
    domainMatches,
    normalizeDomains,
    normalizeHostname,
    parsePageHostname,
    readSettings,
    writeSettings
  };
})();

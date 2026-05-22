export type TouchFishSettings = {
  enabled: boolean;
  domains: string[];
};

export type TouchFishSettingsUpdate = {
  enabled?: boolean;
  domains?: string[];
};

export const DEFAULT_ENABLED = true;
export const DEFAULT_DOMAINS = ["www.xiaohongshu.com"];
export const STORAGE_KEYS = {
  enabled: "touchFishEnabled",
  domains: "touchFishDomains"
} as const;
type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const normalizeHostname = (hostname: unknown): string => {
  return String(hostname || "").trim().toLowerCase();
};

export const normalizeDomains = (domains: unknown): string[] => {
  if (!Array.isArray(domains)) {
    return [...DEFAULT_DOMAINS];
  }

  return [...new Set(domains.map(normalizeHostname).filter(Boolean))].sort((a, b) => a.localeCompare(b));
};

export const domainMatches = (hostname: string, domain: string): boolean => {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedDomain = normalizeHostname(domain);

  return (
    Boolean(normalizedHostname && normalizedDomain) &&
    (normalizedHostname === normalizedDomain || normalizedHostname.endsWith(`.${normalizedDomain}`))
  );
};

export const domainListMatches = (hostname: string, domains: unknown): boolean => {
  return normalizeDomains(domains).some((domain) => domainMatches(hostname, domain));
};

export const parsePageHostname = (url: string): string => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? normalizeHostname(parsed.hostname) : "";
  } catch (_error) {
    return "";
  }
};

const getStorageDefaults = () => {
  return {
    [STORAGE_KEYS.enabled]: DEFAULT_ENABLED,
    [STORAGE_KEYS.domains]: DEFAULT_DOMAINS
  };
};

export const readSettings = async (): Promise<TouchFishSettings> => {
  const values = await chrome.storage.local.get(getStorageDefaults());

  return {
    enabled: values[STORAGE_KEYS.enabled] !== false,
    domains: normalizeDomains(values[STORAGE_KEYS.domains])
  };
};

export const writeSettings = (values: TouchFishSettingsUpdate): Promise<void> => {
  const updates: Partial<Record<StorageKey, boolean | string[]>> = {};

  if ("enabled" in values) {
    updates[STORAGE_KEYS.enabled] = values.enabled !== false;
  }

  if ("domains" in values) {
    updates[STORAGE_KEYS.domains] = normalizeDomains(values.domains);
  }

  return chrome.storage.local.set(updates);
};

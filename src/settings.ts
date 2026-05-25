export type DomainFeatureKey = "blockMedia" | "dimPage";

export type DomainRule = {
  domain: string;
  includeSubdomains: boolean;
  blockMedia: boolean;
  dimPage: boolean;
};

export type TouchFishSettings = {
  enabled: boolean;
  domains: DomainRule[];
};

export type TouchFishSettingsUpdate = {
  enabled?: boolean;
  domains?: DomainRule[];
};

export const DEFAULT_ENABLED = true;
export const DEFAULT_DOMAINS: DomainRule[] = [
  {
    domain: "www.xiaohongshu.com",
    includeSubdomains: false,
    blockMedia: true,
    dimPage: true
  }
];
export const STORAGE_KEYS = {
  enabled: "touchFishEnabled",
  domains: "touchFishDomains"
} as const;
type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const normalizeHostname = (hostname: unknown): string => {
  return String(hostname || "").trim().toLowerCase();
};

export const parsePageHostname = (url: string): string => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? normalizeHostname(parsed.hostname) : "";
  } catch (_error) {
    return "";
  }
};

export const normalizeDomainInput = (domain: string): Pick<DomainRule, "domain" | "includeSubdomains"> => {
  const value = domain.trim().toLowerCase();
  const hostname = value.includes("://") ? parsePageHostname(value) : value.split("/")[0].split(":")[0];
  const includeSubdomains = hostname.startsWith("*.");

  return {
    domain: normalizeHostname(includeSubdomains ? hostname.slice(2) : hostname),
    includeSubdomains
  };
};

export const getDomainRuleKey = (rule: Pick<DomainRule, "domain" | "includeSubdomains">): string => {
  return `${rule.includeSubdomains ? "*." : ""}${rule.domain}`;
};

export const createDomainRule = (domain: string): DomainRule => {
  const normalized = normalizeDomainInput(domain);

  return {
    domain: normalized.domain,
    includeSubdomains: normalized.includeSubdomains,
    blockMedia: true,
    dimPage: true
  };
};

export const normalizeDomainRules = (domains: DomainRule[] = DEFAULT_DOMAINS): DomainRule[] => {
  const rules = new Map<string, DomainRule>();

  domains.forEach((rule) => {
    const normalized = normalizeDomainInput(rule.domain);
    if (normalized.domain) {
      rules.set(getDomainRuleKey({ ...normalized, includeSubdomains: rule.includeSubdomains }), {
        domain: normalized.domain,
        includeSubdomains: rule.includeSubdomains,
        blockMedia: rule.blockMedia,
        dimPage: rule.dimPage
      });
    }
  });

  return [...rules.values()].sort((a, b) => getDomainRuleKey(a).localeCompare(getDomainRuleKey(b)));
};

export const domainMatches = (hostname: string, rule: Pick<DomainRule, "domain" | "includeSubdomains">): boolean => {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedDomain = normalizeHostname(rule.domain);

  return (
    Boolean(normalizedHostname && normalizedDomain) &&
    (normalizedHostname === normalizedDomain ||
      (rule.includeSubdomains && normalizedHostname.endsWith(`.${normalizedDomain}`)))
  );
};

export const findDomainRule = (hostname: string, domains: DomainRule[]): DomainRule | null => {
  const normalizedHostname = normalizeHostname(hostname);
  const matches = domains.filter((rule) => domainMatches(normalizedHostname, rule));

  return (
    matches.sort((a, b) => {
      const exactScore = Number(b.domain === normalizedHostname) - Number(a.domain === normalizedHostname);
      return exactScore || b.domain.length - a.domain.length;
    })[0] || null
  );
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
    domains: normalizeDomainRules(values[STORAGE_KEYS.domains] as DomainRule[])
  };
};

export const writeSettings = (values: TouchFishSettingsUpdate): Promise<void> => {
  const updates: Partial<Record<StorageKey, boolean | DomainRule[]>> = {};

  if ("enabled" in values) {
    updates[STORAGE_KEYS.enabled] = values.enabled !== false;
  }

  if ("domains" in values) {
    updates[STORAGE_KEYS.domains] = normalizeDomainRules(values.domains);
  }

  return chrome.storage.local.set(updates);
};

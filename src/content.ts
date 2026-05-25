import { contentConfig, type CustomCssRule, type TouchFishConfig } from "./config";
import { findDomainRule, normalizeHostname, readSettings, type DomainRule } from "./settings";

const DEFAULT_CONFIG: TouchFishConfig = {
  faviconSvg: [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    '<rect width="64" height="64" rx="14" fill="#111"/>',
    '<path d="M16 24h32v16H16z" fill="#fff"/>',
    '<path d="M20 28h24v8H20z" fill="#111"/>',
    "</svg>"
  ].join(""),
  blockClass: "tf-image-blocker-block",
  pageDimmerClass: "tf-page-dimmer",
  replacedAttr: "data-tf-image-blocker-replaced",
  styleId: "tf-image-blocker-style",
  customStyleId: "tf-image-blocker-custom-style",
  colorSchemeQuery: "(prefers-color-scheme: dark)",
  blockColors: {
    dark: "#000",
    light: "#fff"
  },
  observedAttributes: ["src", "srcset", "style", "class", "poster"],
  mediaSelector: "img, picture, video",
  backgroundCandidateSelector: "[style], div, a, span, section, article, header, footer, main, li, button",
  pageBrightness: 0.72,
  customCssRules: []
};

const CONFIG: TouchFishConfig = {
  ...DEFAULT_CONFIG,
  ...contentConfig,
  blockColors: {
    ...DEFAULT_CONFIG.blockColors,
    ...contentConfig.blockColors
  },
  observedAttributes: Array.isArray(contentConfig.observedAttributes)
    ? contentConfig.observedAttributes
    : DEFAULT_CONFIG.observedAttributes,
  customCssRules: Array.isArray(contentConfig.customCssRules) ? contentConfig.customCssRules : [],
  mediaSelector: contentConfig.mediaSelector || DEFAULT_CONFIG.mediaSelector,
  backgroundCandidateSelector: contentConfig.backgroundCandidateSelector || DEFAULT_CONFIG.backgroundCandidateSelector,
  pageBrightness:
    typeof contentConfig.pageBrightness === "number" && Number.isFinite(contentConfig.pageBrightness)
      ? Math.min(Math.max(contentConfig.pageBrightness, 0.1), 1)
      : DEFAULT_CONFIG.pageBrightness
};

const darkModeQuery = window.matchMedia(CONFIG.colorSchemeQuery);
const FAVICON_SELECTOR = [
  'link[rel~="icon"]',
  'link[rel="shortcut icon"]',
  'link[rel="apple-touch-icon"]',
  'link[rel="mask-icon"]'
].join(", ");
const FAVICON_ATTRIBUTES = ["href", "rel", "type", "sizes"];
const BOX_STYLE_PROPERTIES = [
  "position",
  "float",
  "clear",
  "vertical-align",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-radius",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "max-width",
  "min-width",
  "max-height",
  "min-height"
];
let faviconUrl = "";

const getHostname = () => {
  return normalizeHostname(window.location.hostname);
};

type EnabledFeatures = Pick<DomainRule, "blockMedia" | "dimPage">;

const getEnabledFeatures = async (): Promise<EnabledFeatures | null> => {
  const hostname = getHostname();
  if (!hostname || typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  const settings = await readSettings();
  if (!settings.enabled) {
    return null;
  }

  const rule = findDomainRule(hostname, settings.domains);
  if (!rule || (!rule.blockMedia && !rule.dimPage)) {
    return null;
  }

  return {
    blockMedia: rule.blockMedia,
    dimPage: rule.dimPage
  };
};

const getBlockColor = () => {
  return darkModeQuery.matches ? CONFIG.blockColors.dark : CONFIG.blockColors.light;
};

const serializeCSS = (rules: CustomCssRule[]) => {
  return rules
    .map((rule) => {
      const props = Object.entries(rule.properties || {})
        .map(([key, value]) => `${key}: ${value} !important;`)
        .join(" ");
      return `${rule.selector} { ${props} }`;
    })
    .join("\n");
};

const appendToDocumentHead = (element: HTMLElement) => {
  const target = document.head || document.documentElement;
  target.appendChild(element);
};

const installStyle = (features: EnabledFeatures) => {
  if (document.getElementById(CONFIG.styleId)) {
    return;
  }

  const dimmerStyle = features.dimPage
    ? `
    .${CONFIG.pageDimmerClass} {
      background: rgba(0, 0, 0, ${1 - CONFIG.pageBrightness}) !important;
      inset: 0 !important;
      pointer-events: none !important;
      position: fixed !important;
      z-index: 2147483647 !important;
    }
`
    : "";
  const blockStyle = features.blockMedia
    ? `
    .${CONFIG.blockClass} {
      background: var(--tf-image-blocker-color, #000) !important;
      background-image: none !important;
      box-sizing: border-box !important;
      color: transparent !important;
      overflow: hidden !important;
    }
`
    : "";

  const style = document.createElement("style");
  style.id = CONFIG.styleId;
  style.textContent = `${dimmerStyle}${blockStyle}`;

  appendToDocumentHead(style);
};

const installPageDimmer = () => {
  if (document.querySelector(`.${CSS.escape(CONFIG.pageDimmerClass)}`)) {
    return;
  }

  const dimmer = document.createElement("div");
  dimmer.className = CONFIG.pageDimmerClass;
  dimmer.setAttribute("aria-hidden", "true");
  document.documentElement.appendChild(dimmer);
};

const injectCSS = (rules: CustomCssRule[]) => {
  if (!rules.length) {
    return;
  }

  let styleEl = document.getElementById(CONFIG.customStyleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = CONFIG.customStyleId;
    appendToDocumentHead(styleEl);
  }
  styleEl.textContent = serializeCSS(rules);
};

const getFaviconUrl = () => {
  if (!faviconUrl) {
    faviconUrl = `data:image/svg+xml,${encodeURIComponent(CONFIG.faviconSvg)}`;
  }

  return faviconUrl;
};

const setIconAttribute = (icon: HTMLLinkElement, attribute: string, value: string) => {
  if (icon.getAttribute(attribute) !== value) {
    icon.setAttribute(attribute, value);
  }
};

const replaceFavicon = () => {
  const href = getFaviconUrl();
  const existingIcons = document.querySelectorAll<HTMLLinkElement>(FAVICON_SELECTOR);

  existingIcons.forEach((icon) => {
    setIconAttribute(icon, "href", href);
    setIconAttribute(icon, "type", "image/svg+xml");
    setIconAttribute(icon, "sizes", "any");
  });

  if (!document.querySelector('link[rel~="icon"]')) {
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.sizes = "any";
    icon.href = href;
    appendToDocumentHead(icon);
  }
};

const observeFavicon = () => {
  const target = document.head || document.documentElement;
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) {
      return;
    }

    pending = true;
    queueMicrotask(() => {
      pending = false;
      replaceFavicon();
    });
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: FAVICON_ATTRIBUTES
  });
};

const getElementBox = (element: Element, computed: CSSStyleDeclaration) => {
  const rect = element.getBoundingClientRect();
  const mediaWidth = element instanceof HTMLImageElement ? element.naturalWidth : 0;
  const mediaHeight = element instanceof HTMLImageElement ? element.naturalHeight : 0;
  const videoWidth = element instanceof HTMLVideoElement ? element.videoWidth : 0;
  const videoHeight = element instanceof HTMLVideoElement ? element.videoHeight : 0;
  const htmlElement = element instanceof HTMLElement ? element : null;
  const width = rect.width || parseFloat(computed.width) || mediaWidth || videoWidth || htmlElement?.clientWidth || 0;
  const height = rect.height || parseFloat(computed.height) || mediaHeight || videoHeight || htmlElement?.clientHeight || 0;

  return {
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) ? height : 0
  };
};

const copyBoxStyles = (source: Element, target: HTMLElement, computed: CSSStyleDeclaration) => {
  const box = getElementBox(source, computed);
  const display = computed.display === "inline" ? "inline-block" : computed.display;

  target.style.display = display === "none" ? "none" : display;
  target.style.width = box.width > 0 ? `${box.width}px` : computed.width;
  target.style.height = box.height > 0 ? `${box.height}px` : computed.height;

  BOX_STYLE_PROPERTIES.forEach((property) => {
    const value = computed.getPropertyValue(property);
    if (value) {
      target.style.setProperty(property, value);
    }
  });
};

const replaceWithBlock = (element: Element) => {
  if (element.getAttribute(CONFIG.replacedAttr) === "true" || !element.parentNode) {
    return;
  }

  const computed = window.getComputedStyle(element);
  const block = document.createElement("div");

  block.className = CONFIG.blockClass;
  block.setAttribute("aria-hidden", "true");
  block.setAttribute(CONFIG.replacedAttr, "true");
  block.style.setProperty("--tf-image-blocker-color", getBlockColor());
  copyBoxStyles(element, block, computed);

  element.setAttribute(CONFIG.replacedAttr, "true");
  element.replaceWith(block);
};

const blockBackgroundImage = (element: Element) => {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const computed = window.getComputedStyle(element);
  if (computed.backgroundImage && computed.backgroundImage !== "none") {
    element.style.backgroundImage = "none";
    element.style.backgroundColor = getBlockColor();
    element.style.setProperty("--tf-image-blocker-color", getBlockColor());
    element.classList.add(CONFIG.blockClass);
  }
};

const syncBlockColors = () => {
  const color = getBlockColor();
  const selector = `.${CSS.escape(CONFIG.blockClass)}`;
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.style.setProperty("--tf-image-blocker-color", color);
    element.style.backgroundColor = color;
  });
};

const blockElement = (element: Element) => {
  if (element.matches(CONFIG.mediaSelector)) {
    replaceWithBlock(element);
    return;
  }

  blockBackgroundImage(element);
};

const blockTree = (root: Element | Document) => {
  if (root instanceof Element) {
    blockElement(root);
  }

  root.querySelectorAll(`${CONFIG.mediaSelector}, ${CONFIG.backgroundCandidateSelector}`).forEach(blockElement);
};

const observePage = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            blockTree(node);
          }
        });
      }

      if (mutation.type === "attributes" && mutation.target instanceof Element) {
        blockElement(mutation.target);
      }
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: CONFIG.observedAttributes
  });
};

const run = (features: EnabledFeatures) => {
  if (features.blockMedia && window.top === window) {
    replaceFavicon();
    observeFavicon();
  }
  installStyle(features);
  if (features.dimPage) {
    installPageDimmer();
  }
  injectCSS(CONFIG.customCssRules);
  if (features.blockMedia) {
    blockTree(document);
    observePage();
    darkModeQuery.addEventListener("change", syncBlockColors);
  }
};

getEnabledFeatures().then((features) => {
  if (!features) {
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => run(features), { once: true });
  } else {
    run(features);
  }
});

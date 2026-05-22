(function () {
  "use strict";

  const DEFAULT_CONFIG = {
    blockClass: "tf-image-blocker-block",
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
    customCssRules: []
  };
  const CONFIG = Object.assign({}, DEFAULT_CONFIG, window.TOUCH_FISH_CONFIG || {});
  CONFIG.blockColors = Object.assign({}, DEFAULT_CONFIG.blockColors, CONFIG.blockColors || {});
  CONFIG.observedAttributes = Array.isArray(CONFIG.observedAttributes)
    ? CONFIG.observedAttributes
    : DEFAULT_CONFIG.observedAttributes;
  CONFIG.customCssRules = Array.isArray(CONFIG.customCssRules) ? CONFIG.customCssRules : [];
  CONFIG.mediaSelector = CONFIG.mediaSelector || DEFAULT_CONFIG.mediaSelector;
  CONFIG.backgroundCandidateSelector = CONFIG.backgroundCandidateSelector || DEFAULT_CONFIG.backgroundCandidateSelector;
  const darkModeQuery = window.matchMedia(CONFIG.colorSchemeQuery);

  function getBlockColor() {
    return darkModeQuery.matches ? CONFIG.blockColors.dark : CONFIG.blockColors.light;
  }

  function serializeCSS(rules) {
    return rules
      .map((rule) => {
        const props = Object.entries(rule.properties || {})
          .map(([key, value]) => `${key}: ${value} !important;`)
          .join(" ");
        return `${rule.selector} { ${props} }`;
      })
      .join("\n");
  }

  function installStyle() {
    if (document.getElementById(CONFIG.styleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = CONFIG.styleId;
    style.textContent = `
      .${CONFIG.blockClass} {
        background: var(--tf-image-blocker-color, #000) !important;
        background-image: none !important;
        box-sizing: border-box !important;
        color: transparent !important;
        overflow: hidden !important;
      }
    `;

    const target = document.head || document.documentElement;
    target.appendChild(style);
  }

  function injectCSS(rules) {
    if (!rules.length) {
      return;
    }

    let styleEl = document.getElementById(CONFIG.customStyleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = CONFIG.customStyleId;
      const target = document.head || document.documentElement;
      target.appendChild(styleEl);
    }
    styleEl.textContent = serializeCSS(rules);
  }

  function getElementBox(element, computed) {
    const rect = element.getBoundingClientRect();
    const width = rect.width || parseFloat(computed.width) || element.naturalWidth || element.width;
    const height = rect.height || parseFloat(computed.height) || element.naturalHeight || element.height;

    return {
      width: Number.isFinite(width) ? width : 0,
      height: Number.isFinite(height) ? height : 0
    };
  }

  function copyBoxStyles(source, target, computed) {
    const box = getElementBox(source, computed);
    const display = computed.display === "inline" ? "inline-block" : computed.display;
    const cssProperties = [
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

    target.style.display = display === "none" ? "none" : display;
    target.style.width = box.width > 0 ? `${box.width}px` : computed.width;
    target.style.height = box.height > 0 ? `${box.height}px` : computed.height;

    cssProperties.forEach((property) => {
      const value = computed.getPropertyValue(property);
      if (value) {
        target.style.setProperty(property, value);
      }
    });
  }

  function replaceWithBlock(element) {
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
  }

  function blockBackgroundImage(element) {
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
  }

  function syncBlockColors() {
    const color = getBlockColor();
    const selector = `.${CSS.escape(CONFIG.blockClass)}`;
    document.querySelectorAll(selector).forEach((element) => {
      element.style.setProperty("--tf-image-blocker-color", color);
      element.style.backgroundColor = color;
    });
  }

  function blockElement(element) {
    if (!(element instanceof Element)) {
      return;
    }

    if (element.matches(CONFIG.mediaSelector)) {
      replaceWithBlock(element);
      return;
    }

    blockBackgroundImage(element);
  }

  function blockTree(root) {
    if (!(root instanceof Element) && root !== document) {
      return;
    }

    installStyle();

    if (root instanceof Element) {
      blockElement(root);
    }

    root.querySelectorAll(`${CONFIG.mediaSelector}, ${CONFIG.backgroundCandidateSelector}`).forEach(blockElement);
  }

  function observePage() {
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
  }

  function run() {
    installStyle();
    injectCSS(CONFIG.customCssRules);
    blockTree(document);
    observePage();
    darkModeQuery.addEventListener("change", syncBlockColors);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();

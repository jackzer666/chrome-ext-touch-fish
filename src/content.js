(function () {
  "use strict";

  const BLOCK_CLASS = "tf-image-blocker-block";
  const REPLACED_ATTR = "data-tf-image-blocker-replaced";
  const STYLE_ID = "tf-image-blocker-style";
  const OBSERVED_ATTRS = ["src", "srcset", "style", "class", "poster"];
  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function getBlockColor() {
    return darkModeQuery.matches ? "#000" : "#fff";
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${BLOCK_CLASS} {
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
    if (element.getAttribute(REPLACED_ATTR) === "true" || !element.parentNode) {
      return;
    }

    const computed = window.getComputedStyle(element);
    const block = document.createElement("div");

    block.className = BLOCK_CLASS;
    block.setAttribute("aria-hidden", "true");
    block.setAttribute(REPLACED_ATTR, "true");
    block.style.setProperty("--tf-image-blocker-color", getBlockColor());
    copyBoxStyles(element, block, computed);

    element.setAttribute(REPLACED_ATTR, "true");
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
      element.classList.add(BLOCK_CLASS);
    }
  }

  function syncBlockColors() {
    const color = getBlockColor();
    document.querySelectorAll(`.${BLOCK_CLASS}`).forEach((element) => {
      element.style.setProperty("--tf-image-blocker-color", color);
      element.style.backgroundColor = color;
    });
  }

  function blockElement(element) {
    if (!(element instanceof Element)) {
      return;
    }

    if (element.matches("img, picture, video")) {
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

    root.querySelectorAll("picture, img, video, [style], div, a, span, section, article, header, footer, main, li, button").forEach(blockElement);
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
      attributeFilter: OBSERVED_ATTRS
    });
  }

  function run() {
    installStyle();
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

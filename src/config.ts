import type { CSSProperties } from "./content-types";

export type CustomCssRule = {
  selector: string;
  properties: CSSProperties;
};

export type TouchFishConfig = {
  faviconSvg: string;
  blockClass: string;
  replacedAttr: string;
  styleId: string;
  customStyleId: string;
  colorSchemeQuery: string;
  blockColors: {
    dark: string;
    light: string;
  };
  observedAttributes: string[];
  mediaSelector: string;
  backgroundCandidateSelector: string;
  customCssRules: CustomCssRule[];
};

export const contentConfig: Partial<TouchFishConfig> = {
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
  backgroundCandidateSelector: [
    "[style]",
    "div",
    "a",
    "span",
    "section",
    "article",
    "header",
    "footer",
    "main",
    "li",
    "button"
  ].join(", "),
  customCssRules: [
    {
      selector: ".note-detail-follow-btn",
      properties: { display: "none" }
    }
  ]
};

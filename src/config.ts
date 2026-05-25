import type { CSSProperties } from "./content-types";

export type CustomCssRule = {
  selector: string;
  properties: CSSProperties;
};

export type TouchFishConfig = {
  faviconSvg: string;
  blockClass: string;
  pageDimmerClass: string;
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
  pageBrightness: number;
  customCssRules: CustomCssRule[];
};

export const contentConfig: Partial<TouchFishConfig> = {
  pageBrightness: 0.5,
  customCssRules: [
    {
      selector: ".note-detail-follow-btn",
      properties: { display: "none" }
    }
  ]
};

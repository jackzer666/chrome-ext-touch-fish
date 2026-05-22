(function () {
  "use strict";

  window.TOUCH_FISH_CONFIG = {
    // 遮罩元素使用的 class 名。一般不需要修改，除非和目标页面样式冲突。
    blockClass: "tf-image-blocker-block",

    // 标记元素已被处理的属性名，避免重复替换。
    replacedAttr: "data-tf-image-blocker-replaced",

    // 插件基础遮罩样式的 style 标签 id。
    styleId: "tf-image-blocker-style",

    // 站点定制 CSS 对应的 style 标签 id。
    customStyleId: "tf-image-blocker-custom-style",

    // 用于判断深浅色模式的媒体查询。
    colorSchemeQuery: "(prefers-color-scheme: dark)",

    // 深浅色模式下遮罩块的颜色。
    blockColors: {
      dark: "#000",
      light: "#fff"
    },

    // MutationObserver 需要监听的属性变化。
    observedAttributes: ["src", "srcset", "style", "class", "poster"],

    // 会被直接替换成纯色块的媒体元素选择器。
    mediaSelector: "img, picture, video",

    // 会检查 background-image 并清除背景图的候选元素选择器。
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

    // 站点定制 CSS 规则，适合隐藏关注按钮、推荐区、侧栏等非核心元素。
    customCssRules: [
      {
        // 小红书笔记详情页关注按钮。
        selector: ".note-detail-follow-btn",
        properties: { display: "none" }
      }
    ]
  };
})();

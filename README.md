# 摸鱼图片视频遮罩

Chrome 浏览器插件。访问指定域名下的任意页面时，将页面图片和视频替换成纯色块，并尽量保持原图片外框宽高。颜色会跟随浏览器/系统深浅色模式：深色模式为黑色，浅色模式为白色。

## 文件结构

```text
.
├── manifest.json
└── src
    ├── config.js
    └── content.js
```

## 修改目标域名

目标域名仍需编辑 `manifest.json` 中的 `content_scripts[0].matches`。这是 Chrome 扩展加载规则，浏览器会在运行 `content.js` 之前读取它，因此不能只放到运行时配置文件里。

```json
[
  "https://example.com/*",
  "https://*.example.com/*"
]
```

把 `example.com` 改成你的目标域名即可。例如：

```json
[
  "https://target.com/*",
  "https://*.target.com/*"
]
```

如需同时支持 HTTP：

```json
[
  "http://target.com/*",
  "http://*.target.com/*",
  "https://target.com/*",
  "https://*.target.com/*"
]
```

## 修改运行时配置

编辑 `src/config.js` 中的 `window.TOUCH_FISH_CONFIG`。适合放在这里的是功能之外的定制项：

- `blockColors`：深浅色模式下的遮罩颜色
- `observedAttributes`：动态监听页面变化时需要关注的属性
- `mediaSelector`：需要直接替换成色块的媒体元素选择器
- `backgroundCandidateSelector`：需要检查 `background-image` 的元素选择器
- `customCssRules`：站点定制 CSS，例如隐藏按钮、侧栏、推荐区等

例如隐藏某个站点元素：

```js
customCssRules: [
  {
    selector: ".note-detail-follow-btn",
    properties: { display: "none" }
  }
]
```

不建议把业务逻辑函数、DOM 替换流程、MutationObserver 行为写进 `config.js`；这些仍保留在 `src/content.js`。

## 本地安装

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目目录

## 实现范围

- 根据 `prefers-color-scheme` 自动切换黑色/白色遮盖块
- 处理普通 `<img>`
- 处理 `<picture><source>`
- 处理 `<video>`
- 处理部分 CSS `background-image`
- 使用 `MutationObserver` 处理动态插入的图片

对于复杂站点中的 canvas 绘制图片、跨域 iframe 内部内容或 Shadow DOM 内部图片，可能需要额外适配。

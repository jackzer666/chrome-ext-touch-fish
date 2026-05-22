# 摸鱼图片视频遮罩

Chrome 浏览器插件。访问指定域名下的任意页面时，将页面图片和视频替换成纯色块，并尽量保持原图片外框宽高。颜色会跟随浏览器/系统深浅色模式：深色模式为黑色，浅色模式为白色。

## 文件结构

```text
.
├── manifest.json
└── src
    └── content.js
```

## 修改目标域名

编辑 `manifest.json` 中的 `content_scripts[0].matches`：

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

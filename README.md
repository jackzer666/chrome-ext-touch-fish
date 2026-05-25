# 摸鱼图片视频遮罩

Chrome 浏览器插件。访问指定域名下的任意页面时，降低页面整体亮度，并将页面图片和视频替换成纯色块，尽量保持原图片外框宽高。遮罩颜色会跟随浏览器/系统深浅色模式：深色模式为黑色，浅色模式为白色。

## 文件结构

```text
.
├── manifest.json
├── package.json
├── popup.html
├── tsconfig.json
├── vite.config.ts
└── src
    ├── config.ts
    ├── content-types.ts
    ├── content.ts
    ├── popup
    │   ├── App.vue
    │   ├── main.ts
    │   ├── vite-env.d.ts
    │   └── style.css
    └── settings.ts
```

## 管理启用域名和功能

弹窗页面使用 Vue 3、Vite 和 TypeScript 开发。点击 Chrome 右上角插件图标，会打开管理弹窗：

- 添加域名时可以选择「完整域名」或「二级域名」，也可以直接编辑输入框。
- 完整域名规则只匹配当前 hostname，例如 `www.example.com`。
- 二级域名规则会保存为 `*.example.com`，匹配 `example.com` 及其子域名。
- 新增规则默认同时启用图片替换和降低亮度，并刷新当前页面。
- 每个域名可以单独开启或关闭「图片替换」和「降低亮度」。
- 启用名单中的「移除」会删除域名；如果删除的是当前页面命中的域名，会刷新当前页面。
- 右上角开关可启用或停用插件，切换后会刷新当前页面。

启用名单和功能开关保存在 `chrome.storage.local` 中。首次安装默认启用，并默认包含 `www.xiaohongshu.com`。

## 修改运行时配置

编辑 `src/config.ts` 中的 `contentConfig`。适合放在这里的是功能之外的定制项：

- `blockColors`：深浅色模式下的遮罩颜色
- `observedAttributes`：动态监听页面变化时需要关注的属性
- `mediaSelector`：需要直接替换成色块的媒体元素选择器
- `backgroundCandidateSelector`：需要检查 `background-image` 的元素选择器
- `pageBrightness`：启用域名下的页面整体亮度，范围为 `0.1` 到 `1`
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

不建议把业务逻辑函数、DOM 替换流程、MutationObserver 行为写进 `config.ts`；这些仍保留在 `src/content.ts`。

## 本地安装

1. 执行 `pnpm install`
2. 执行 `pnpm build`
3. 打开 Chrome，进入 `chrome://extensions/`
4. 开启右上角「开发者模式」
5. 点击「加载已解压的扩展程序」
6. 选择本项目的 `dist` 目录

## 实现范围

- 根据 `prefers-color-scheme` 自动切换黑色/白色遮盖块
- 命中启用域名时降低页面整体亮度
- 处理普通 `<img>`
- 处理 `<picture><source>`
- 处理 `<video>`
- 处理部分 CSS `background-image`
- 使用 `MutationObserver` 处理动态插入的图片

对于复杂站点中的 canvas 绘制图片、跨域 iframe 内部内容或 Shadow DOM 内部图片，可能需要额外适配。

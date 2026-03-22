# 开发日志

记录网站构建、同步脚本、渲染管线等关键变更，方便回溯和回退。

---

## 2026-03-23 — Emoji→SVG 渲染管线重构 + 泛型转义修复

**问题**：代码块内的 Emoji（如 `// ❌ 废弃`）和 C# 泛型（如 `GetFeature<T>()`）渲染异常。

**根因**（2 个 bug）：

1. **`transformEmoji()` 全局替换**：sync 脚本在预处理阶段对整个 markdown 文本执行 Emoji→SVG 替换，没有区分正文和代码块，导致代码块注释中的 Emoji 也被替换成 `<img>` 标签，然后被 Shiki 高亮后裸露显示。
2. **`fixLinks()` 泛型转义正则 bug**：正则 `<([a-zA-Z][a-zA-Z0-9_, ]+)>` 使用 `+`（至少 1 个额外字符），加上首字母共需 2+ 字符，导致单字母泛型 `<T>` 完全不被转义，被 Vue 解析成 HTML 标签报错。

**修复**：

| 文件 | 变更 |
|------|------|
| `.vitepress/theme/markdown-emoji-svg.ts` | **新建** markdown-it 插件，在 token 流层面做 Emoji→SVG 转换，自动跳过 `code_fence`、`code_inline`、`html_inline` |
| `.vitepress/config.mts` | 注册 markdown-it 插件 |
| `scripts/sync-content.mjs` | ① 删除 `transformEmoji()` 调用（Emoji 替换移至 VitePress 渲染层）② `fixLinks()` 泛型转义改为先提取代码块再处理正文，正则 `+` → `*` 支持单字母泛型 |

**验证**：build 通过，107 条记录同步成功，代码块内 Emoji 和泛型不再被错误处理。

**回退方法**：`git revert` 对应 commit 即可。sync 脚本回退后需重新执行 `node scripts/sync-content.mjs` 重建 content。

---
title: '全站 Emoji 替换为 SVG 图标的完整流程 {#emoji-to-svg}'
tags:
  - tools
  - web
  - experience
  - vitepress
status: ✅ 已验证
description: '全站 Emoji 替换为 SVG 图标的完整流程 {#emoji-to-svg}'
source: KTSAMA 实践经验
recordDate: '2026-02-07'
credibility: ⭐⭐⭐⭐ (实践验证)
---
# 全站 Emoji 替换为 SVG 图标的完整流程 {#emoji-to-svg}


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=web" class="meta-tag">Web 开发</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=vitepress" class="meta-tag">VitePress</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
</div>


**问题/场景**：

站点多处使用 emoji 作为图标（例如 🎮Unity 开发、📝经验、📚知识等），在不同平台/浏览器上 emoji 渲染不一致，且无法用 CSS 精确控制颜色和尺寸，不符合工业风设计语言。

**解决方案/结论**：

### 涉及改动位置清单

| 文件 | 改动内容 |
|------|----------|
| `public/icons/*.svg` | 新增 10 个 SVG 图标文件 |
| `index.md` | features icon 改为 `{ src: /icons/xxx.svg, width: 48, height: 48 }` |
| `Dashboard.vue` | 文本插值 stat.icon → img 标签 :src 绑定 |
| `CategoryGrid.vue` | span 文本插值 item.icon → img 标签 :src 绑定 |
| `sync-content.mjs` | SECTION_CONFIG/stats 的 icon 从 emoji 改为 SVG 路径 |
| `sidebar.ts` | SPECIAL_LABELS 中 emoji 前缀（📝经验→经验）移除 |
| `custom.css` | 新增 `.VPFeature .VPImage` 的 filter 着色规则 |

### SVG 图标设计规范

最终采用 Lucide 图标库的设计标准：
- **画布**：24×24 viewBox
- **笔触**：`stroke-width="2"`、`stroke-linecap="round"`、`stroke-linejoin="round"`
- **填充**：`fill="none"`、`stroke="currentColor"`
- **风格**：简洁几何线条，不使用 fill 填充块

初版（1.5px square-cap）在小尺寸下显得粗糙，按 Lucide 规范重绘后明显提升。

**验证记录**：

- 2026-02-07 10 个 SVG 图标全部替换，三处组件渲染正常，构建通过

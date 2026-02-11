---
title: Safari SVG Favicon 兼容性
tags:
  - tools
  - web
  - experience
  - vitepress
status: ⚠️ 待验证
description: Safari SVG Favicon 兼容性
source: KTSAMA 实践经验
recordDate: '2026-02-07'
credibility: ⭐⭐⭐ (待验证)
---
# Safari SVG Favicon 兼容性


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=web" class="meta-tag">Web 开发</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=vitepress" class="meta-tag">VitePress</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--warning"><img class="inline-icon inline-icon--status" src="/icons/status-pending.svg" alt="待验证" /> 待验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">待验证</span></span></div>
</div>


**问题/场景**：

自定义 SVG favicon 在 Chrome 正常显示，但 Safari（尤其 HTTP 站点）不显示 SVG favicon，仍用默认图标。

**解决方案/结论**：

Safari 对 SVG favicon 支持不佳，特别是 HTTP（非 HTTPS）站点。需要提供 PNG 回退：

1. 使用 rsvg-convert（macOS 通过 homebrew 安装 librsvg）转换 SVG 为 PNG：
   - rsvg-convert -w 32 -h 32 favicon.svg -o favicon-32.png
   - rsvg-convert -w 180 -h 180 favicon.svg -o apple-touch-icon.png

2. HTML head 中同时提供 SVG + PNG + Apple Touch Icon

3. VitePress 的 public/ 目录下的文件需要清除 .vitepress/cache 和 .vitepress/dist 后重新构建才会生效

**验证记录**：

- 2026-02-07 SVG favicon 部署后 Chrome 正常显示，Safari 待验证

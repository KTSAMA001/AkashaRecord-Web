---
title: 'VitePress SPA 路由中 position:fixed 伪元素泄漏'
tags:
  - tools
  - web
  - experience
  - vitepress
status: ⚠️ 待验证
description: 'VitePress SPA 路由中 position:fixed 伪元素泄漏'
source: KTSAMA 实践经验
recordDate: '2026-02-07'
credibility: ⭐⭐⭐ (待验证)
---
# VitePress SPA 路由中 position:fixed 伪元素泄漏


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=web" class="meta-tag">Web 开发</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=vitepress" class="meta-tag">VitePress</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--warning"><img class="inline-icon inline-icon--status" src="/icons/status-pending.svg" alt="待验证" /> 待验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">待验证</span></span></div>
</div>


**问题/场景**：

在 .VPHome::after 上使用 position:fixed 实现全屏暗角（vignette）效果。VitePress 的 SPA 路由切换后，用户从首页导航到其他页面时，固定定位的遮罩残留在页面上方覆盖内容。

**解决方案/结论**：

将 position:fixed 改为 position:absolute。absolute 定位相对于 .VPHome 元素本身，当 VitePress SPA 路由卸载首页内容时，伪元素随之消失，不会残留。

规则：VitePress 页面级装饰伪元素不要用 position:fixed，只用 absolute。全局级效果（如 body::before 噪点）可以用 fixed，因为 body 始终存在。

**验证记录**：

- 2026-02-07 修改后推送，待验证非首页是否还有残留

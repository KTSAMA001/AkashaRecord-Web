---
title: '侧边栏自定义高亮竖条与文字间距 {#sidebar-padding-left}'
tags:
  - tools
  - web
  - experience
  - vitepress
status: ✅ 已验证
description: '侧边栏自定义高亮竖条与文字间距 {#sidebar-padding-left}'
source: KTSAMA 实践经验
recordDate: '2026-02-07'
---
# 侧边栏自定义高亮竖条与文字间距 {#sidebar-padding-left}


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=web" class="meta-tag">Web 开发</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=vitepress" class="meta-tag">VitePress</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
</div>


**问题/场景**：

为侧边栏 `.item::before` 添加了 3px 宽的橙色高亮竖条（`left: 0`），但竖条与右侧文字之间几乎没有间距，视觉上挤在一起。

**解决方案/结论**：

给 `.VPSidebar .VPSidebarItem .item` 添加 `padding-left: 12px !important`，让文字与竖条之间保持 12px 的呼吸空间。

需要 `!important` 是因为 VitePress 默认样式对 `.item` 有自己的 padding 定义。

**验证记录**：

- 2026-02-07 间距修复后侧边栏视觉明显改善

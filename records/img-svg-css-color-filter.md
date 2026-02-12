---
title: img 标签的 SVG 无法继承 CSS color，需用 filter 着色
tags:
  - tools
  - web
  - experience
  - vitepress
status: ✅ 已验证
description: img 标签的 SVG 无法继承 CSS color，需用 filter 着色
source: KTSAMA 实践经验
recordDate: '2026-02-07'
---
# img 标签的 SVG 无法继承 CSS color，需用 filter 着色 {#img-svg-color-filter}


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=web" class="meta-tag">Web 开发</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=vitepress" class="meta-tag">VitePress</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
</div>


**问题/场景**：

SVG 内部使用 `stroke="currentColor"` 期望继承父元素的 CSS `color` 属性。但当 SVG 通过 img 标签加载时，`currentColor` 解析为默认黑色（`#000`），因为 img 标签创建了独立的文档上下文，**不继承**外部 CSS 属性。

**解决方案/结论**：

### 方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **CSS filter（采用）** | 不改 HTML 结构，兼容 img 标签 | 颜色是近似值，非精确 |
| 内联 SVG | 完全支持 currentColor | 需改为 Vue 组件，增加复杂度 |
| SVG 中硬编码颜色 | 最简单 | 无法响应主题切换 |

### CSS filter 近似 #FF6B2B 橙色的参数

```css
filter: invert(48%) sepia(89%) saturate(1600%) hue-rotate(3deg) brightness(101%) contrast(103%);
```

该 filter 链将黑色 SVG 笔触转换为近似 `#FF6B2B` 的橙色。原理：
1. `invert` 将黑色翻转为白色
2. `sepia` 添加棕色调
3. `saturate` + `hue-rotate` 调整到目标色相
4. `brightness` + `contrast` 微调明度

**验证记录**：

- 2026-02-07 Dashboard、CategoryGrid、VPFeature 三处图标均正常显示橙色

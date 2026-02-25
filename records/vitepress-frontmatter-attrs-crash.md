---
title: 解决 markdown-it-attrs 插件因 Frontmatter 中包含自定义 ID 导致构建失败的问题
tags:
  - vitepress
  - bug
  - experience
  - web
status: ✅ 已验证
description: 解决 markdown-it-attrs 插件因 Frontmatter 中包含自定义 ID 导致构建失败的问题
source: 实践总结
recordDate: '2026-02-13'
credibility: ⭐⭐⭐⭐⭐
version: VitePress 1.x
---
# VitePress 构建失败：markdown-it-attrs 与 Frontmatter 冲突


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=vitepress" class="meta-tag">VitePress</a> <a href="/records/?tags=bug" class="meta-tag">Bug</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=web" class="meta-tag">Web 开发</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-13</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">VitePress 1.x</span></div>
</div>


### 概要

在 VitePress 构建过程中（`npm run docs:build`），如果文档包含自定义 ID 语法（如 `{#id}`）且该语法被意外写入 Frontmatter（如 title 字段），会导致 `markdown-it-attrs` 插件抛出 `Error in pattern 'end of block'` 错误，造成构建失败。

### 内容

#### 问题现象
在项目中添加包含 LaTeX 公式和自定义 ID Header 的文档后，运行构建指令失败：
```
Error: markdown-it-attrs: Error in pattern 'end of block' at ...
```
最初误判为 LaTeX 公式（`$$`）导致，实际上是由于同步脚本错误处理了 Markdown 内容。

#### 根因分析
1.  **同步脚本逻辑**：项目使用自定义脚本从外部仓库同步 Markdown 文件。脚本会提取正文的第一个 H1 标题作为 Frontmatter 的 `title` 字段。
    - 原文标题：`# Title {#custom-id}`
    - 提取后 Frontmatter：`title: Title {#custom-id}`
2.  **插件冲突**：`markdown-it-attrs` 插件用于解析 `{}` 形式的属性。当它在 Frontmatter 的元数据字段（如 title）中遇到这种语法时，与 VitePress 的内部解析流程发生冲突，导致正则表达式匹配失败并抛出异常。
3.  **合法性对比**：
    - <img class="inline-icon inline-icon--check" src="/icons/mark-check.svg" alt="✅" /> **正文中**：`# My Header {#my-id}` 是合法的，插件能正确转换。
    - <img class="inline-icon inline-icon--cross" src="/icons/mark-cross.svg" alt="❌" /> **Frontmatter 中**：`title: My Header {#my-id}` 是危险的，应仅包含纯文本。

#### 解决方案
修改同步脚本（`scripts/sync-content.mjs`），在写入 Frontmatter 前，使用正则表达式清洗标题文本，移除 Markdown 扩展语法。

### 关键代码

修复前的逻辑（导致 Crash）：
```javascript
// 假设 contentTitle = "# My Title {#my-id}"
frontmatter.title = contentTitle;
```

修复后的逻辑（清洗数据）：
```javascript
// 移除结尾的 {#...} 锚点语法
const cleanHeading = (text) => text.replace(/\s*\{#[^}]+\}$/g, '').trim();

frontmatter.title = cleanHeading(contentTitle); 
// 结果: "My Title" (安全)
```

### 相关记录
无

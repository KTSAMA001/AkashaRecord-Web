---
title: VitePress 动态侧边栏标签 + 分类索引页自动生成
tags:
  - tools
  - web
  - experience
  - vitepress
status: ✅ 已验证
description: VitePress 动态侧边栏标签 + 分类索引页自动生成
source: KTSAMA 实践经验
recordDate: '2026-02-07'
credibility: ⭐⭐⭐⭐ (实践验证)
---
# VitePress 动态侧边栏标签 + 分类索引页自动生成


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=web" class="meta-tag">Web 开发</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=vitepress" class="meta-tag">VitePress</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
</div>


**问题/场景**：

VitePress 站点的侧边栏类目名称和各 section（经验/知识/灵感）的 index.md 首页都是手写硬编码的，每次新增分类都要手动改多处代码。

**解决方案/结论**：

### 1. 动态侧边栏标签

sidebar.ts 中原本用 CATEGORY_LABELS 映射表（20+ 条）将目录名翻译为中文。重构为：

- SPECIAL_LABELS：仅保留 7 条特殊映射（3 个顶级带 emoji + 4 个缩写如 ai->AI, csharp->C#）
- getCategoryLabel(dirName, dirPath?)：优先级为 SPECIAL_LABELS -> index.md frontmatter title -> h1 标题 -> 目录名美化

自动从 index.md 的 frontmatter title 或 h1 读取标签，新增分类只需创建含标题的 index.md 即可。

### 2. 分类索引页从 INDEX.md 元数据自动生成

sync-content.mjs 中新增：

- parseIndexMd()：解析阿卡西记录仓库的 references/INDEX.md 表格（格式：| 目录 | 中文名 | 描述 | 文件 |）
- generateCategoryIndexes()：为 experiences/knowledge/ideas 各自动生成 index.md，包含标题、描述、分类表格
- INDEX.md 是唯一的元数据来源，新增分类只需修改这一个文件

**验证记录**：

- 2026-02-07 动态侧边栏标签生效，所有分类名称正确显示
- 2026-02-07 三个 section 的 index.md 均从 INDEX.md 自动生成，表格内容一致

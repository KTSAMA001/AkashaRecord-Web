---
title: 阿卡西记录可视化网站：VitePress + Schema-Driven 架构，统一搜索与工业风 UI
tags:
  - tools
  - web
  - reference
  - akasha
status: "\U0001F4D8 有效"
description: 阿卡西记录可视化网站：VitePress + Schema-Driven 架构，统一搜索与工业风 UI
source: 用户 KTSAMA 提供
recordDate: '2026-02-07'
sourceDate: '2026-02-07'
updateDate: '2026-02-16'
credibility: ⭐⭐⭐⭐⭐（官方）
version: v2.2.0
---
# 阿卡西记录可视化网站


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=web" class="meta-tag">Web 开发</a> <a href="/records/?tags=reference" class="meta-tag">参考</a> <a href="/records/?tags=akasha" class="meta-tag">阿卡西记录</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">用户 KTSAMA 提供</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item"><span class="meta-label">更新日期</span><span class="meta-value">2026-02-16</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /></span> <span class="star-desc">官方</span></span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--info"><img class="inline-icon inline-icon--status" src="/icons/status-valid.svg" alt="有效" /> 有效</span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">v2.2.0</span></div>
</div>


### 定义/概念

这是阿卡西记录（Akasha-KT）技能的可视化网站，用于浏览和查询已记录的经验与知识。

### 关键点

- **网站地址**：https://akasha.ktsama.top
- **当前版本**：v2.2.0，收录 76 条记录
- **架构设计**：基于 VitePress SSG，采用 Schema 驱动的数据架构，彻底消除硬编码业务逻辑
- **视觉风格**：明日方舟（Arknights）工业风 UI，包含网点/网格背景、切角设计、SVG 图标系统
- **主要功能**：
    - **统一搜索**：合并标签搜索和内容搜索，支持标题/标签/正文联合匹配，显示匹配原因指示器
    - **标签筛选**：多标签交集筛选，支持 URL 参数分享
    - **可视化浏览**：卡片式记录展示，工业风切角设计，hover 微光动效
    - **骨架屏加载**：优化加载体验，减少布局抖动
    - **自动化部署**：通过 Webhook 实现根据 Git 变更智能触发构建（内容更新 vs 全量构建）
    - **双向同步**：前端展示与后端 Agent 技能仓库（AgentSkill-Akasha-KT）保持结构与数据的一致性
- **关联技能**：该网站是 `skill_akasha-kt` 技能的配套可视化工具

### 架构演进记录

#### 2026-02-16 搜索体验优化
- **统一搜索框**：合并原标签搜索和内容搜索为单一搜索框，简化交互
- **匹配指示器**：搜索结果卡片显示匹配原因（标题匹配/标签匹配/内容匹配）
- **智能标签匹配**：搜索时同时匹配标签名和标签别名（如中文描述）
- **性能优化**：使用 memoize 缓存标签匹配结果，减少重复计算

#### 2026-02-08 UI 重构与体验优化
- **Schema 驱动**：建立 `record-template.md` 为单一信源（SSOT），驱动前端的状态颜色、图标映射和元数据解析
- **UI 规范化**：标签栏改为多行折叠式，卡片高度统一，标题/路径文字截断优化
- **视觉升级**：全面移除 Emoji，改用工业风 SVG 图标；优化全局网点背景，去除重复叠加层
- **路由修复**：Nginx 配置 `try_files` 支持 cleanUrls 模式下的页面刷新（404 修复）

### 相关知识与经验

- [Agent Skills 规范](./agent-skills-spec) - 阿卡西记录技能基于 Agent Skills 标准构建
- [Git 仓库管理经验](./git-commit-conventions) - 记录技能的版本控制与同步流程
- [持续集成/持续部署相关经验](./cicd-vitepress-deploy) - 网站的自动化构建与部署踩坑记录
- [明日方舟工业风 UI 分析](./arknights-ui-industrial-style) - 视觉设计的灵感来源与规范



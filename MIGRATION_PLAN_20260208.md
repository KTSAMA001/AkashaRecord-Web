# AkashaRecord-Web 标签化迁移计划 (2026-02-08)

## 1. 目标 (Objectives)

将网站从旧的三级目录结构（`/experiences/ai/xxx`）迁移到扁平化标签体系（`/records/xxx`），与已完成重构的 `.akasha-repo` 数据源对齐。
- **导航升级**：从固定分类改为**标签云驱动的浏览与筛选**。
- **结构对齐**：前端路由与后端数据存储结构保持一致（扁平化）。
- **视觉保持**：保持明日方舟工业风一致性，参考塞壬唱片 (Monster Siren) 的"终端系统"美学进行增强。

## 2. 新版信息架构 (New Information Architecture)

| 路径 | 说明 | 备注 |
|---|---|---|
| `/` | 首页 | Hero + Dashboard + 标签云入口 |
| `/records/` | 记录总览页 | 核心入口，包含标签筛选器 + 卡片列表 |
| `/records/{slug}` | 具体记录详情页 | 例如 `/records/astrbot-mcp-integration` |
| `/tags/` | 标签索引页 | 全量标签云，支持按热度/字母查看 |

* **导航栏**: `首页` | `记录终端` (/records/) | `标签索引` (/tags/)
* **侧边栏**: 自动按 domain 标签分组（如 `Unity`、`图形学`、`AI`），组内按字母排序。

## 3. 核心变更点 (Key Changes)

| 组件/模块 | 变更方向 |
|---|---|
| **URL 结构** | `/experiences/ai/xxx` → `/records/xxx` (扁平化) |
| **数据源** | 正则扫描文件 → 解析 `INDEX.md` 结构化数据 |
| **分类逻辑** | 物理目录 (experiences/knowledge) → 逻辑标签 (#domain) |
| **同步脚本** | 重写 `scripts/sync-content.mjs` 核心逻辑 |
| **组件** | 新增 `RecordsBrowser`，改造 `TagCloud` 支持交互 |

## 4. 详细执行步骤 (Execution Steps)

### 阶段一：数据管线重写 (sync-content.mjs)

1.  **重写 `copyContent()`**
    *   不再遍历 `experiences/knowledge/ideas` 树。
    *   遍历 `.akasha-repo/data/*.md` (扁平)，直接复制到 `content/records/`。
    *   **链接修复**：将 `../../knowledge/xx.md` 替换为 `./xx.md`。
    *   **元数据注入**：从文件内容提取 `**标签**` 并注入 frontmatter `tags` 字段。

2.  **重写 `parseIndexForRecords()`**
    *   替代原有的 `parseIndexMd`。
    *   解析 `.akasha-repo/references/INDEX.md` 中的「文件清单表」。
    *   输出结构化数据：`{ filename, tags[], status, description, link }[]`。

3.  **重写 `generateStats()` & `generateTags()`**
    *   统计维度从「三大分类」改为「Domain 标签」。
    *   `tags.json` 输出完整映射：`{ name, count, files: [...] }`。

### 阶段二：组件开发与改造

4.  **新增 `RecordsBrowser.vue`**
    *   **功能**：记录总览页的核心组件。
    *   **UI**：顶部标签筛选条（类塞壬唱片风格）+ 中部卡片列表。
    *   **逻辑**：客户端实时过滤，支持多标签组合筛选。

5.  **改造 `TagCloud.vue`**
    *   增加交互能力：点击标签跳转至 `/records/?tag=xxx`。
    *   增强视觉：增加计数显示，优化 Hover 态。

6.  **改造 `Dashboard.vue`**
    *   更新统计卡片逻辑（显示总记录数 + Top Tags）。
    *   修复最近更新列表的链接路径。

### 阶段三：VitePress 配置更新

7.  **重构 `.vitepress/utils/sidebar.ts`**
    *   删除硬编码的 `topDirs`。
    *   实现**按标签自动分组**逻辑：扫描 `/records/` 下文件，读取 tags，按首个 domain 标签建立侧边栏分组。

8.  **更新 `.vitepress/config.mts`**
    *   更新 Nav 配置。

### 阶段四：页面内容更新

9.  **更新 `index.md` (首页)**
    *   更新 Action 按钮链接。
    *   更新 Features 描述，强调标签化特性。

10. **创建新页面**
    *   `content/records/index.md`：嵌入 `<RecordsBrowser />`，禁用侧边栏 (`sidebar: false`)。
    *   `content/tags/index.md`：嵌入增强版 `<TagCloud />`。

11. **清理旧数据**
    *   删除 `content/experiences/`, `content/knowledge/`, `content/ideas/`。
    *   删除根目录生成的旧分类文件夹。

### 阶段五：视觉风格微调

12. **更新 `custom.css`**
    *   新增 **标签胶囊 (.ak-tag)** 样式：单色/描边/Monospace 字体。
    *   新增 **筛选条 (.ak-filter-bar)** 样式：水平滚动、高亮选中态。
    *   优化卡片样式以适配标签展示。

### 阶段六：部署与收尾

13. **Webhook 适配**
    *   检查 `server/webhook.mjs` 对 `data/` 目录的监听逻辑（预计无需大改）。

14. **Git 提交**
    *   清理所有旧分类的硬编码引用。
    *   提交代码。

## 5. 设计决策 (Design Decisions)

*   **URL 扁平化**：选择 `/records/` 路径是为了彻底解耦物理存储与逻辑分类，未来修改标签分类不需要变更 URL，有利于 SEO 和外链稳定性。
*   **客户端筛选**：鉴于目前记录数量（<100条），前端实时筛选体验最优，无需生成静态的分页或独立标签页。
*   **INDEX.md 作为单一真实源 (SSOT)**：利用已结构化的 INDEX.md 作为 Web 端数据源，确保 Web 展示与知识库索引完全一致。

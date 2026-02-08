# AkashaRecord-Web 全站工业风统一与数据驱动改造计划

## 现状分析 (Current State)

### 架构现况
本项目是阿卡西记录（AgentSkill-Akasha-KT）的 VitePress 静态前端。数据管线为：**后端 Markdown → sync 脚本解析转换 → JSON API + VitePress 页面 → 静态站点**。

### 存在的问题

**1. 业务规则硬编码散落在 Web 项目中**
- `sync-content.mjs` 中 `META_KEYS` 手动列举了 9 个中文字段名（标签、来源、日期等），与后端 `record-template.md` 的定义手动同步，容易漂移。
- `ensureFrontmatter()` 硬编码了 7 对中文字段→英文 key 的映射（如 `'来源' → source`）。
- `transformMetaBlocks()` 用 `if (key === '标签')` / `if (key === '来源')` 判断渲染方式，新增字段类型时须改代码。
- `StatusBadge.vue` 维护了一份 emoji→中文标签的映射表，其中 4/7 条与后端定义不一致（如 ⚠️ 后端定义"待验证"，前端写成"需注意"），且缺少 💡 状态。
- `RecordsBrowser.vue` 的 `getStatusColor()` 用中文关键词匹配颜色（"验证"→绿色），导致 ✅已验证 和 ⚠️待验证 都显示绿色。
- `Dashboard.vue` 的 `:href` 使用中文 label 构造 URL（如 `/records/?tag=经验`），实际应为 tag key（如 `experience`），链接全部失效。

**2. Emoji 直接渲染为 Unicode 字符**
- 文档中的状态标记（✅⚠️📘🔄📕❌🔬💡）、可信度星级（⭐）、正文表格标记（🟢🟡🟠🔴）全部以原生 Emoji 显示，在不同平台/浏览器上渲染效果不一致，与工业风视觉体系脱节。

**3. 交互视效不统一**
- 主页 VPFeature 卡片拥有完整的工业风交互（clip-path 切角 + 左侧高亮条 + 微光扫过 + hover 右移），Dashboard 的 `.ak-card` 也已对齐。
- 但记录终端的 `.record-card`（无切角、hover 上移而非右移）、`.filter-tag`（无切角）、标签云 `.tag-item`（无切角、hover 上移）、文档内 `.meta-tag`（无切角、hover 对比度不足）四处风格各异，与主页标准割裂。

**4. 记录卡片缺乏信息**
- 卡片标题显示的是文件名（如 `agent-skills-spec.md`），而非文档内的中文标题。
- 卡片图标使用硬编码的 📄 emoji，而非根据标签动态匹配 SVG 图标。
- 侧边栏 hover 颜色被 VitePress 默认样式覆盖（缺少 `!important`），未显示为品牌橙色。

### 要达成的目标

**1. 单一数据源 (SSOT)**
后端仓库的 `record-template.md` 成为字段定义、状态枚举、Emoji 映射的唯一权威源。Web 项目的 sync 脚本在构建时自动解析该文件，生成 `meta-schema.json` API。前端组件从此 API 消费，代码中不再出现任何业务常量。**新增或修改字段/状态时，只需编辑 `record-template.md`，Web 自动适配。**

**2. 全站 Emoji → SVG**
所有面向用户的 Emoji 渲染替换为风格统一的 SVG 图标。源 Markdown 文件保留 Emoji 保持人类可读性，转换仅发生在 sync 渲染管线中。状态用对应状态 SVG，可信度用星级 SVG 组件，正文标记用内联 SVG。

**3. 视效完全统一**
全站所有可交互元素（卡片、标签 pill、筛选按钮）共享同一套工业风交互基因：clip-path 切角 + 左侧高亮条 + 微光扫过 + hover 右移 + 辉光边框。通过 CSS 类 `.ak-interactive` 及尺寸变体 (`--sm`/`--md`/`--lg`) 实现一处定义、全站复用。

**4. 信息准确完整**
记录卡片显示中文标题（副标题为路径）、动态 SVG 图标、正确的状态颜色。Dashboard 链接正确跳转。所有 8 种状态完整支持。

## 原则与边界 (Principles & Boundaries)

### 🎯 目的
构建一个**完全数据驱动**的知识库前端。Web 项目仅负责"渲染"和"交互"，所有业务逻辑定义（如字段结构、状态枚举、标签分类）、内容资产（如文档、图标映射）均应由阿卡西记录仓库（后端）定义。此分离确保了知识体系的独立性和可移植性。

### ✅ 能做什么 (What to do in Web Project)
- **渲染逻辑**：编写 Vue 组件来展示数据（如 `RecordsBrowser.vue` 展示卡片）。
- **交互动效**：定义 CSS 动画、Hover 效果、工业风视觉样式（`.ak-interactive`）。
- **数据同步**：编写脚本 (`sync-content.mjs`) 将后端的 Markdown/Schema 转换为前端可用的 JSON API。
- **路由结构**：定义 VitePress 的页面布局、侧边栏逻辑和导航结构。

### ❌ 不能做什么 (What NOT to do in Web Project)
- **绝对禁止硬编码业务规则**：不要在 JS/TS 代码中写死 "如果状态包含'已验证'则显示绿色"（应读取 Schema 中的 color 定义）。
- **禁止定义数据结构**：不要在前端代码中定义 "记录包含哪些元数据字段"（应读取 `record-template.md`）。
- **禁止维护内容映射**：不要在前端维护 "Emoji 到中文" 或 "状态到图标" 的映射表（应读取 Schema）。
- **禁止硬编码分类**：不要写死 "Unity"、"C#" 等具体的领域或标签名称（应完全动态读取 `tag-registry.md` 和 `INDEX.md`）。

---

## 核心目标
1. **数据驱动 (Schema-Driven)**：消除 Web 项目中所有硬编码的数据识别规则，改为从后端仓库 `record-template.md` 自动解析 Schema。
2. **全站工业风 (Industrial Style)**：将主页 VPFeature 的交互视效（切角 + 高亮条 + 微光扫过 + 位移）统一应用到全站所有交互元素。
3. **Emoji SVG 化**：源文件保留 Emoji 以保持可读性，渲染管线强制将所有 Emoji 转换为 SVG 图标。

---

## Phase 0: 新增 SVG 图标资产 (Web 仓库)

在 `public/icons/` 目录下补全以下 SVG 图标（24x24，currentColor 填色，工业线条风格）：

1. **状态图标 (8个)**：
   - `status-verified.svg` (✅)
   - `status-pending.svg` (⚠️)
   - `status-valid.svg` (📘)
   - `status-update.svg` (🔄)
   - `status-obsolete.svg` (📕)
   - `status-deprecated.svg` (❌)
   - `status-experimental.svg` (🔬)
   - `status-concept.svg` (💡)

2. **评级图标 (2个)**：
   - `star-filled.svg` (★)
   - `star-empty.svg` (☆)

3. **内容标记图标 (6个)**：
   - `indicator-green.svg` (🟢)
   - `indicator-yellow.svg` (🟡)
   - `indicator-orange.svg` (🟠)
   - `indicator-red.svg` (🔴)
   - `mark-check.svg` (正文✅)
   - `mark-cross.svg` (正文❌)

---

## Phase 1: 扩展 record-template.md 为完整 Schema (后端仓库)

在 `references/templates/record-template.md` 末尾追加三张结构化表格，作为 SSOT (Single Source of Truth)：

1. **`## 元数据字段 Schema`**
   - 定义 9 个字段：标签、来源、收录日期、来源日期、更新日期、状态、可信度、适用版本。
   - 定义属性：`key` (frontmatter key), `renderType` (tag-pills/link/text/status-icon/star-rating), `alias` (别名)。

2. **`## 状态定义`**
   - 定义 8 种状态：✅, ⚠️, 📘, 🔄, 📕, ❌, 🔬, 💡。
   - 定义属性：`label` (中文名), `color` (success/warning/info/danger), `svg` (对应文件名), `scene` (适用场景).

3. **`## Emoji 渲染映射`**
   - 定义 Unicode Emoji 到 SVG 的映射规则。
   - 包含：正文中的装饰性 Emoji (🟢🟡🟠🔴) 和标记 Emoji (✅❌⚠️)。
   - 说明：源文件保留 Emoji，Sync 阶段自动转换。

---

## Phase 2: Sync 脚本 Schema 解析 + Emoji 转换引擎 (Web 仓库)

修改 `scripts/sync-content.mjs`：

1. **解析 Schema**：新增 `parseRecordTemplate()` 函数，从 `record-template.md` 解析上述三张表，生成 `{ fields, statuses, emojiMap }` 对象。
2. **生成 API**：在 `main()` 中生成 `public/api/meta-schema.json` 供前端消费。
3. **消除硬编码**：
   - 用解析出的 Schema 替换 `META_KEYS` 常量。
   - 用 Schema 的字段定义替换 `ensureFrontmatter()` 中的硬编码映射。
   - 用 `renderType` 驱动 `transformMetaBlocks()` 的渲染逻辑（不再写死 `if (key === '标签')`）。
4. **Emoji 转换引擎**：新增 `transformEmoji(content, schema)`：
   - 遍历 `emojiMap` 替换文本中的 Emoji 为 `<img class="inline-icon" ...>`。
   - 特殊处理连续星级 `⭐⭐⭐⭐` → `<span class="star-rating">` + SVG 组件。
   - 处理顺序：先处理元数据块的状态/可信度，再处理正文。

---

## Phase 3: 前端 Schema 消费 (Web 仓库)

1. **重写 StatusBadge.vue**：
   - 移除硬编码的状态字典。
   - Fetch `/api/meta-schema.json`，根据 `statuses` 列表渲染 SVG 图标 + 中文标签。
2. **更新 RecordsBrowser.vue**：
   - `getStatusColor()` 改为基于 Schema 匹配 Emoji 对应的颜色分类。
   - 记录卡片图标改为动态获取：tag → tagMeta → SVG icon。
3. **更新 TagCloud.vue**：
   - 移除标题中的 Emoji `🏷️`，改为纯文本 `// TAGS` 风格。

---

## Phase 4: 全站工业风统一 (Web 仓库)

1. **建立 CSS 交互基类 (`.ak-interactive`)**：
   - 在 `custom.css` 定义通用类，包含：切角 (`clip-path`)、无圆角、品牌边框、左侧高亮条、微光动画、Hover 位移。
   - 支持尺寸变体：`--sm` (4px切角), `--md` (8px切角), `--lg` (12px切角)。
2. **应用样式**：
   - `.record-card` (RecordsBrowser): 继承 `--md`。
   - `.filter-tag` (RecordsBrowser): 继承 `--sm`。
   - `.tag-item` (TagCloud): 继承 `--sm`。
   - `.meta-tag` (文档内): 继承 `--sm`，修正 Hover 对比度。
3. **补充内联样式**：
   - 新增 `.inline-icon` (Svg 尺寸控制) 和 `.star-rating` (星级排列) 样式。

---

## Phase 5: 记录卡片内容修正 + Bug 修复 (Web 仓库)

1. **记录标题修正**：
   - Sync 脚本 `generateTags()` 读取 Markdown H1/H2 标题，而非文件名。
   - RecordsBrowser 卡片主标题显示中文名，副标题显示文件路径。
2. **Dashboard 链接修复**：
   - 修复 `href` 生成逻辑，使用 Tag Key 而非 Tag Label。
3. **其他 Bug**：
   - 侧边栏 Hover 颜色添加 `!important`。
   - 修正 index.md 中 C# 的错误链接。
   - 修正 INDEX.md 中非标准的 Emoji (`📚` -> `📘`)。

---

## 验证标准

1. **无 Emoji 渲染**：全站页面（除 `<noscript>` 外）无原生 Emoji 字符渲染，全部替换为 SVG。
2. **视觉一致性**：Dashboard、Web 终端、标签云、文档内标签均具备切角、高亮条、微光、位移交互。
3. **数据准确性**：状态显示正确（含"构想中"等新增状态），颜色符合定义，链接跳转正常。
4. **构建无误**：`node scripts/sync-content.mjs && npx vitepress build` 流程通畅。

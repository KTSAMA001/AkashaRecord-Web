# AkashaRecord-Web 标签系统分析报告

> 分析日期: 2026-03-16
> 目标: 为"单一数据源"重构做准备

---

## 1. 当前数据源

### 1.1 INDEX.md (`references/INDEX.md`)

#### 标签相关内容位置

| 位置 | 行号 | 内容类型 | 用途 |
|------|------|----------|------|
| 标签概览 | 16-20 | 标签列表字符串 | 展示所有可用标签（人类阅读） |
| 文件清单表格-标签列 | 24+ | 每条记录的标签分配 | 记录与标签的关联关系 |

#### 标签概览部分结构

```markdown
## 标签概览

> 完整元数据（显示名、图标）见 [tag-registry.md](./tag-registry.md)。新增标签时需同时注册。

`#agent-skills` `#ai` `#ai-navigation` `#akasha` ...（共约 120 个标签）
```

**特点**:
- 以反引号包裹的标签列表
- 仅用于展示，不包含元数据
- 必须与 tag-registry.md 同步维护

#### 文件清单表格结构

```markdown
## 文件清单

| 文件 | 标签 | 状态 | 简述 |
|------|------|------|------|
| [filename.md](../data/filename.md) | #tag1 #tag2 #tag3 | ✅ 已验证 | 描述文字 |
```

**解析依赖**:
- 表头必须是 `| 文件 | 标签 | 状态 | 简述 |`
- 列位置固定：标签在第 2 列（cols[2]）

---

### 1.2 tag-registry.md (`references/tag-registry.md`)

#### 完整结构

```markdown
# 标签注册表

| 标签 | 显示名 | 图标 |
|------|--------|------|
| #agent-skills | Agent Skills | chip |
| #ai | AI | chip |
| #unity | Unity 引擎 | unity |
...
```

**数据项**:
| 字段 | 格式 | 说明 |
|------|------|------|
| 标签 | `#tag-name` | 唯一标识（带 # 前缀） |
| 显示名 | 中文/英文 | 前端展示用 |
| 图标 | 字符串 | 对应 `public/icons/{icon}.svg` |

**SSOT 声明**: 文件头注释明确声明为"单一数据源"

---

### 1.3 record-template.md (`references/templates/record-template.md`)

#### 标签相关内容汇总

| 章节 | 行号 | 内容类型 | 与标签系统的关系 |
|------|------|----------|------------------|
| 模板正文示例 | 8 | `**标签**：#领域标签 #专项标签...` | 示例，非数据源 |
| 标签维度参考 | 62-78 | 标签分类规则 | 定义领域/类型/专项/自定义维度 |
| 预定义标签列表 | 68-70 | 领域/类型标签枚举 | **潜在重复**：与 tag-registry.md 部分重叠 |
| 状态标记速查 | 81-92 | 状态定义 | 状态 Emoji 定义（非标签） |
| 元数据字段 Schema | 104-117 | 字段渲染定义 | 定义"标签"字段的 `tag-pills` 渲染类型 |
| 状态定义 | 119-133 | Emoji→SVG 映射 | 驱动状态图标渲染 |
| Emoji 渲染映射 | 135-149 | Emoji→SVG 映射 | 驱动正文 Emoji 渲染 |

#### 预定义标签重复问题

```markdown
| 维度 | 必选 | 说明 | 预定义标签 |
|------|------|------|-----------|
| **领域** | ✅ ≥1 | 技术/学科大类 | `#unity` `#shader` `#graphics` `#csharp` `#python` `#git` `#ai` `#web` `#design` `#tools` `#vscode` `#social` |
| **类型** | ✅ 1个 | 记录的性质 | `#experience` `#knowledge` `#idea` `#reference` `#architecture` |
```

**重复数据**: 这里的预定义标签列表与 tag-registry.md 中的数据存在重复。

---

## 2. 构建脚本解析逻辑

### 2.1 parseIndexMd() 逐行分析

**位置**: `sync-content.mjs` 行 201-261

```javascript
function parseIndexMd() {
  const indexPath = path.join(AKASHA_LOCAL, 'references', 'INDEX.md')
  if (!fs.existsSync(indexPath)) return []

  const content = fs.readFileSync(indexPath, 'utf-8')
  const lines = content.split('\n')

  const records = []
  let inTable = false

  for (const line of lines) {
    // 硬编码依赖 1: 标题匹配
    if (line.includes('## 文件清单')) {
      inTable = true
      continue
    }

    // 硬编码依赖 2: 遇到新标题结束
    if (inTable && line.startsWith('## ')) {
      inTable = false
      break
    }

    // 过滤非表格行
    if (inTable && line.startsWith('|') && !line.includes('---') && !line.includes('| 文件 |')) {
      const cols = line.split('|').map(c => c.trim())
      if (cols.length < 5) continue

      // 硬编码依赖 3: 列位置
      const fileCol = cols[1]    // 文件链接列
      const tagCol = cols[2]     // 标签列 ← 关键！
      const statusCol = cols[3]  // 状态列
      const descCol = cols[4]    // 简述列

      // 解析文件名和标题: [title](../data/filename.md)
      const fileMatch = fileCol.match(/\[(.*?)\]\((?:..\/)?data\/(.*?)\)/)
      if (!fileMatch) continue

      const title = fileMatch[1]
      const filename = fileMatch[2]

      // 解析标签: ：#tag1 #tag2 -> ['tag1', 'tag2']
      const tags = tagCol
        .replace(/[:：]/g, '')    // 移除可能的全角/半角冒号
        .split(' ')
        .filter(t => t.startsWith('#'))
        .map(t => t.slice(1))     // 去掉 #

      // 解析状态: ：✅ 已验证 -> ✅ 已验证
      const status = statusCol.replace(/[:：]/g, '').trim()

      records.push({
        filename,
        title,
        tags,        // 标签数组
        status,
        desc: descCol
      })
    }
  }

  console.log(`📋 解析到 ${records.length} 条记录元数据`)
  return records
}
```

**硬编码依赖汇总**:

| 依赖类型 | 值 | 风险 |
|----------|-----|------|
| 标题匹配 | `"## 文件清单"` | 修改标题将导致解析失败 |
| 表头检测 | `"| 文件 |"` | 表头格式变化会失败 |
| 列位置 | cols[2] 为标签列 | 调整列顺序会解析错误 |
| 标签格式 | `#` 前缀 | 非 `#` 开头的不被识别 |

---

### 2.2 parseTagRegistry() 逐行分析

**位置**: `sync-content.mjs` 行 559-587

```javascript
function parseTagRegistry() {
  const registryPath = path.join(AKASHA_LOCAL, 'references', 'tag-registry.md')
  const meta = new Map()

  if (!fs.existsSync(registryPath)) {
    console.warn('⚠️ 未找到 tag-registry.md，跳过标签元数据')
    return meta
  }

  const content = fs.readFileSync(registryPath, 'utf-8')
  const lines = content.split('\n')

  for (const line of lines) {
    // 过滤非数据行
    if (!line.startsWith('|') || line.includes('---') || line.includes('| 标签')) continue
    const cols = line.split('|').map(c => c.trim())
    if (cols.length < 4) continue

    // 硬编码依赖: 列位置
    const tagCol = cols[1]  // #tag-name
    const label = cols[2]   // 中文名
    const icon = cols[3]    // 图标名

    // 验证格式
    if (!tagCol.startsWith('#')) continue
    const tag = tagCol.slice(1) // 去掉 #

    meta.set(tag, { label, icon })
  }

  console.log(`🏷️  解析到 ${meta.size} 个标签元数据`)
  return meta
}
```

**硬编码依赖汇总**:

| 依赖类型 | 值 | 风险 |
|----------|-----|------|
| 表头检测 | `"| 标签"` | 表头格式变化会失败 |
| 列位置 | cols[1]=标签, cols[2]=显示名, cols[3]=图标 | 调整列顺序会解析错误 |
| 标签格式 | `#` 前缀验证 | 非 `#` 开头的行被跳过 |

**特点**:
- 无标题依赖，直接解析整个文件
- 如果文件不存在仅警告，不中断流程

---

### 2.3 parseRecordTemplate() 逐行分析

**位置**: `sync-content.mjs` 行 148-196

```javascript
function parseRecordTemplate() {
  const templatePath = path.join(AKASHA_LOCAL, 'references', 'templates', 'record-template.md')
  const schema = { fields: [], statuses: [], emojiMap: [], metaKeys: new Set() }

  if (!fs.existsSync(templatePath)) {
    throw new Error(`❌ 致命错误: 未找到 record-template.md`)  // 致命错误！
  }

  const content = fs.readFileSync(templatePath, 'utf-8')
  const lines = content.split('\n')

  let currentSection = null

  for (const line of lines) {
    // 硬编码依赖 1: 章节标题匹配
    if (line.startsWith('## 元数据字段 Schema')) { currentSection = 'fields'; continue }
    if (line.startsWith('## 状态定义')) { currentSection = 'statuses'; continue }
    if (line.startsWith('## Emoji 渲染映射')) { currentSection = 'emoji'; continue }
    if (line.startsWith('## ') && currentSection) { currentSection = null; continue }

    // 跳过非表格行
    if (!line.startsWith('|') || line.includes('---')) continue

    const cols = line.split('|').map(c => c.trim()).filter(Boolean)

    // 解析元数据字段 Schema
    if (currentSection === 'fields' && cols.length >= 4) {
      const [fieldName, key, renderType, alias] = cols
      if (fieldName === '字段名') continue // 跳过表头
      schema.fields.push({ fieldName, key, renderType, alias: alias === '—' ? null : alias })
      schema.metaKeys.add(fieldName)
      if (alias && alias !== '—') schema.metaKeys.add(alias)
    }

    // 解析状态定义
    if (currentSection === 'statuses' && cols.length >= 5) {
      const [emoji, label, color, svg, scene] = cols
      if (emoji === 'Emoji') continue // 跳过表头
      schema.statuses.push({ emoji: emoji.trim(), label, color, svg, scene })
    }

    // 解析 Emoji 渲染映射
    if (currentSection === 'emoji' && cols.length >= 4) {
      const [emoji, svg, cssClass, desc] = cols
      if (emoji === 'Emoji') continue // 跳过表头
      schema.emojiMap.push({ emoji: emoji.trim(), svg, cssClass: cssClass === '—' ? null : cssClass, desc })
    }
  }

  console.log(`📐 Schema 解析完成: ${schema.fields.length} 字段, ${schema.statuses.length} 状态, ${schema.emojiMap.length} Emoji 映射`)
  return schema
}
```

**硬编码依赖汇总**:

| 依赖类型 | 值 | 风险 |
|----------|-----|------|
| 章节标题 | `"## 元数据字段 Schema"` | 修改标题将导致解析失败 |
| 章节标题 | `"## 状态定义"` | 修改标题将导致解析失败 |
| 章节标题 | `"## Emoji 渲染映射"` | 修改标题将导致解析失败 |
| 表头检测 | `"字段名"`, `"Emoji"` | 表头格式变化会失败 |
| 列位置 | 各表不同 | 调整列顺序会解析错误 |

**与标签系统的关系**:
- 解析 `fields` 表中的 `tag-pills` 渲染类型
- 此表定义了"标签"字段的渲染方式
- **不直接解析标签列表**，仅定义渲染规则

---

### 2.4 generateStats() 分析

**位置**: `sync-content.mjs` 行 525-553

```javascript
function generateStats(records) {
  const stats = {
    total: records.length,
    byDomain: {},
    recent: []
  }

  // 硬编码假设: 第一个标签是 Domain
  for (const r of records) {
    if (r.tags.length > 0) {
      const domain = r.tags[0]  // ← 假设第一个标签是领域标签
      stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1
    }
  }

  // 统计所有标签分布（用于首页可视化）
  const tagCounts = {}
  for (const r of records) {
    for (const tag of r.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  stats.tagDistribution = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  fs.mkdirSync(API_DIR, { recursive: true })
  fs.writeFileSync(path.join(API_DIR, 'stats.json'), JSON.stringify(stats, null, 2))
}
```

**输入**: `records` 数组（来自 `parseIndexMd()`）

**输出**: `public/api/stats.json`

**与标签系统的关系**:
- 假设**第一个标签是领域标签**
- 统计 `byDomain`（按领域分组）
- 统计 `tagDistribution`（所有标签的分布）

---

### 2.5 generateTags() 分析

**位置**: `sync-content.mjs` 行 589-618

```javascript
function generateTags(records, tagMeta) {
  const tagMap = new Map() // tag -> { count, files: [] }

  // 遍历所有记录的标签
  for (const r of records) {
    for (const tag of r.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { name: tag, count: 0, files: [] })
      }
      const info = tagMap.get(tag)
      info.count++
      info.files.push({
        title: r.title,
        link: `/records/${r.filename.replace('.md', '')}`,
        status: r.status,
        tags: r.tags
      })
    }
  }

  // 按数量排序
  const sortedTags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count)
  fs.writeFileSync(path.join(API_DIR, 'tags.json'), JSON.stringify(sortedTags, null, 2))

  // 生成 tag-meta.json（从 tag-registry.md 解析的数据）
  const metaObj = {}
  for (const [tag, info] of tagMeta) {  // tagMeta 来自 parseTagRegistry()
    metaObj[tag] = info
  }
  fs.writeFileSync(path.join(API_DIR, 'tag-meta.json'), JSON.stringify(metaObj, null, 2))
  console.log(`💾 已生成 tag-meta.json (${tagMeta.size} 条)`)
}
```

**输入**:
- `records`: 来自 `parseIndexMd()`
- `tagMeta`: 来自 `parseTagRegistry()` 的 Map

**输出**:
- `public/api/tags.json`: 标签使用统计
- `public/api/tag-meta.json`: 标签元数据

---

## 3. 数据重复分析

### 3.1 标签定义的重复

| 数据项 | 出现位置 | 重复程度 | 一致性风险 |
|--------|----------|----------|------------|
| 标签列表 | INDEX.md 标签概览 | 完整重复 | 高 |
| 标签列表 | tag-registry.md 表格 | 完整重复（权威源） | 基准 |
| 领域标签枚举 | record-template.md | 部分重复 | 中 |
| 类型标签枚举 | record-template.md | 部分重复 | 中 |

**具体重复**:

```
tag-registry.md 包含: #unity, #shader, #graphics, #csharp, #python, #git, #ai, #web, #design, #tools, #vscode, #social
record-template.md 领域标签: #unity #shader #graphics #csharp #python #git #ai #web #design #tools #vscode #social
→ 完全重复！

tag-registry.md 包含: #experience, #knowledge, #idea, #reference, #architecture
record-template.md 类型标签: #experience #knowledge #idea #reference #architecture
→ 完全重复！
```

### 3.2 标签元数据的重复

| 元数据 | tag-registry.md | INDEX.md | record-template.md |
|--------|-----------------|----------|-------------------|
| 标签名称 | ✅ | ✅ | ✅ (部分) |
| 显示名 | ✅ | ❌ | ❌ |
| 图标 | ✅ | ❌ | ❌ |
| 维度分类 | ❌ | ❌ | ✅ |

### 3.3 数据一致性风险点

1. **新增标签时**:
   - 必须更新 tag-registry.md（添加行）
   - 必须更新 INDEX.md 标签概览（追加到列表）
   - 可能需要更新 record-template.md（如果是新的领域/类型标签）

2. **修改标签时**:
   - 修改显示名/图标 → 只需改 tag-registry.md
   - 修改标签名 → 需改 tag-registry.md + INDEX.md 标签概览 + 所有记录的标签列

3. **删除标签时**:
   - 需检查所有记录是否还在使用
   - 需同步删除三处定义

---

## 4. 依赖关系图

### 4.1 数据流图 (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           源文件 (Markdown)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  INDEX.md                          tag-registry.md                       │
│  ├─ "## 文件清单" ─────────────┐   ├─ 表格: 标签|显示名|图标 ────────┐   │
│  │  └─ 表格: 文件|标签|状态    │   │                                   │   │
│  │                            │   │                                   │   │
│  └─ "## 标签概览" ────────────┼───┼─→ 仅人类阅读，脚本不解析          │   │
│     └─ 标签列表（展示用）      │   │                                   │   │
│                                │   │                                   │   │
│  record-template.md            │   │                                   │   │
│  ├─ "## 元数据字段 Schema" ────┼───┼─→ 定义渲染规则（不解析标签列表）   │   │
│  ├─ "## 状态定义" ─────────────┼───┼─→ 状态 Emoji → SVG 映射           │   │
│  ├─ "## Emoji 渲染映射" ───────┼───┼─→ 装饰性 Emoji → SVG 映射         │   │
│  └─ 标签维度参考 ──────────────┼───┼─→ 预定义标签列表（重复！）        │   │
│                                │   │                                   │   │
└────────────────────────────────┼───┼───────────────────────────────────┘
                                 │   │
                                 ▼   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           解析函数 (sync-content.mjs)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  parseIndexMd()                   parseTagRegistry()                     │
│  ├─ 硬编码: "## 文件清单"         ├─ 无标题依赖                          │
│  ├─ 列位置: cols[2]=标签          ├─ 列位置: cols[1]=标签                │
│  └─ 输出: records[]               └─ 输出: Map<tag,{label,icon}>         │
│       │                                   │                              │
│       │                                   │                              │
│       │    parseRecordTemplate()          │                              │
│       │    ├─ 硬编码: "## 元数据字段 Schema"│                             │
│       │    ├─ 硬编码: "## 状态定义"        │                              │
│       │    ├─ 硬编码: "## Emoji 渲染映射"  │                              │
│       │    └─ 输出: schema { fields,       │                              │
│       │                statuses, emojiMap, │                              │
│       │                metaKeys }          │                              │
│       │           │                        │                              │
│       ▼           ▼                        ▼                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                        main() 数据流                           │     │
│  │  records ──────┬───────────────────────────┬─────────────┐     │     │
│  │                │                           │             │     │     │
│  │                ▼                           ▼             ▼     │     │
│  │         generateStats()           generateTags()   transformMetaBlocks()
│  │                │                           │             │     │     │
│  │                │                           │             │     │     │
│  │                │  tagMeta ─────────────────┼─────────────┘     │     │
│  │                │                           │                   │     │
│  └────────────────┼───────────────────────────┼───────────────────┘     │
│                   ▼                           ▼                          │
└─────────────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           输出文件 (JSON)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  public/api/stats.json          public/api/tags.json                    │
│  ├─ total                       ├─ name                                 │
│  ├─ byDomain (第一个标签)        ├─ count                                │
│  └─ tagDistribution             └─ files[]                              │
│                                                                          │
│                                 public/api/tag-meta.json                 │
│                                 ├─ tag: { label, icon }                  │
│                                 └─ ...                                   │
│                                                                          │
│                                 public/api/meta-schema.json              │
│                                 ├─ fields[] (渲染类型定义)               │
│                                 ├─ statuses[] (状态映射)                 │
│                                 └─ emojiMap[] (正文 Emoji 映射)          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Mermaid 格式数据流图

```mermaid
flowchart TB
    subgraph Sources["源文件 (Markdown)"]
        INDEX["INDEX.md<br/>'## 文件清单' 表格"]
        TAGREG["tag-registry.md<br/>标签|显示名|图标 表格"]
        TEMPLATE["record-template.md<br/>Schema 定义"]
    end

    subgraph Parsers["解析函数"]
        P1["parseIndexMd()<br/>硬编码: '## 文件清单'<br/>列位置: cols[2]"]
        P2["parseTagRegistry()<br/>无标题依赖<br/>列位置: cols[1-3]"]
        P3["parseRecordTemplate()<br/>硬编码: 三个章节标题"]
    end

    subgraph Processors["处理函数"]
        G1["generateStats()<br/>假设: 第一个标签是领域"]
        G2["generateTags()<br/>合并 records + tagMeta"]
        TM["transformMetaBlocks()<br/>使用 schema + tagMeta"]
    end

    subgraph Outputs["输出文件"]
        O1["stats.json<br/>byDomain + tagDistribution"]
        O2["tags.json<br/>标签使用统计"]
        O3["tag-meta.json<br/>标签元数据"]
        O4["meta-schema.json<br/>渲染规则"]
    end

    INDEX --> P1
    TAGREG --> P2
    TEMPLATE --> P3

    P1 -->|records[]| G1
    P1 -->|records[]| G2
    P1 -->|records[]| TM
    P2 -->|Map&lt;tag,meta&gt;| G2
    P2 -->|Map&lt;tag,meta&gt;| TM
    P3 -->|schema| TM
    P3 -->|schema| O4

    G1 --> O1
    G2 --> O2
    G2 --> O3
```

### 4.3 硬编码依赖清单

| 依赖位置 | 硬编码值 | 影响的函数 | 风险等级 |
|----------|----------|------------|----------|
| INDEX.md | `"## 文件清单"` 标题 | parseIndexMd() | 🔴 高 |
| INDEX.md | 表格第2列为标签 | parseIndexMd() | 🔴 高 |
| INDEX.md | 表格第3列为状态 | parseIndexMd() | 🟡 中 |
| tag-registry.md | 表格第1列为标签名 | parseTagRegistry() | 🟡 中 |
| tag-registry.md | 表格第2列为显示名 | parseTagRegistry() | 🟡 中 |
| tag-registry.md | 表格第3列为图标 | parseTagRegistry() | 🟡 中 |
| record-template.md | `"## 元数据字段 Schema"` | parseRecordTemplate() | 🔴 高 |
| record-template.md | `"## 状态定义"` | parseRecordTemplate() | 🔴 高 |
| record-template.md | `"## Emoji 渲染映射"` | parseRecordTemplate() | 🔴 高 |
| generateStats() | 第一个标签是领域 | generateStats() | 🟡 中 |

---

## 5. 重构建议

### 5.1 推荐的单一数据源设计

#### 方案 A: 扩展 tag-registry.md（推荐）

**核心思路**: 将 tag-registry.md 升级为完整的标签 SSOT

```markdown
# 标签注册表

> SSOT：所有标签的元数据定义，脚本自动解析生成前端所需数据。

| 标签 | 显示名 | 图标 | 维度 | 说明 |
|------|--------|------|------|------|
| #unity | Unity 引擎 | unity | domain | Unity 游戏引擎 |
| #shader | 着色器 | shader | domain | 着色器开发 |
| #experience | 经验 | book | type | 实践经验类记录 |
| #knowledge | 知识 | book | type | 知识原理类记录 |
| #urp | URP | shader | specialty | URP 渲染管线 |
| ... | ... | ... | ... | ... |
```

**新增字段**:
- `维度`: domain(领域) / type(类型) / specialty(专项) / custom(自定义)
- `说明`: 简短描述

**优点**:
- 最小改动，只需扩展现有文件
- 向后兼容（新增列不影响现有解析）
- 保持 Markdown 人类可读

#### 方案 B: JSON Schema 文件

**核心思路**: 用 JSON 文件作为数据源，Markdown 仅用于人类阅读

```
references/
  tag-registry.json    # SSOT 数据源
  tag-registry.md      # 自动生成的人类可读版本（可选）
```

**优点**:
- 解析更可靠（结构化数据）
- 支持更复杂的嵌套结构

**缺点**:
- 失去 Markdown 的直接可编辑性
- 需要更多工具支持

### 5.2 需要修改的代码位置

#### 修改 1: parseTagRegistry() 增加维度解析

```javascript
// 修改前
const tagCol = cols[1]
const label = cols[2]
const icon = cols[3]

// 修改后
const tagCol = cols[1]
const label = cols[2]
const icon = cols[3]
const dimension = cols[4] || 'custom'  // 新增：维度
const desc = cols[5] || ''             // 新增：说明
```

#### 修改 2: 移除 generateStats() 的硬编码假设

```javascript
// 修改前
const domain = r.tags[0]  // 假设第一个标签是领域

// 修改后：使用 tagMeta 获取维度信息
const domain = r.tags.find(t => tagMeta.get(t)?.dimension === 'domain') || r.tags[0]
```

#### 修改 3: 删除 INDEX.md 标签概览部分

```markdown
<!-- 删除此部分，由脚本自动生成或直接依赖 tag-registry.md -->
## 标签概览
`#tag1` `#tag2` ...
```

#### 修改 4: 删除 record-template.md 中的预定义标签列表

```markdown
<!-- 删除"预定义标签"列，改为引用 tag-registry.md -->
| 维度 | 必选 | 说明 | 参见 |
|------|------|------|------|
| **领域** | ✅ ≥1 | 技术/学科大类 | [tag-registry.md](../tag-registry.md)（维度=domain） |
| **类型** | ✅ 1个 | 记录的性质 | [tag-registry.md](../tag-registry.md)（维度=type） |
```

### 5.3 向后兼容方案

#### 阶段 1: 扩展 tag-registry.md（不破坏现有功能）

1. 在 tag-registry.md 添加新列（维度、说明）
2. 修改 parseTagRegistry() 支持新列（使用默认值兼容旧行）
3. 不删除任何现有文件/章节

#### 阶段 2: 迁移数据

1. 将 record-template.md 的预定义标签信息迁移到 tag-registry.md
2. 更新 generateStats() 使用维度信息
3. 验证所有功能正常

#### 阶段 3: 清理冗余

1. 删除 INDEX.md 标签概览部分（或改为自动生成）
2. 删除 record-template.md 中的预定义标签列表
3. 更新相关文档

### 5.4 新增标签的工作流改进

**当前流程**（需手动同步 3 处）:
1. 编辑 tag-registry.md → 添加行
2. 编辑 INDEX.md → 添加到标签概览
3. （如果是领域/类型标签）编辑 record-template.md

**改进后流程**（只需 1 处）:
1. 编辑 tag-registry.md → 添加行（包含维度信息）
2. 脚本自动同步所有依赖

---

## 6. 附录：完整数据流追踪

### 6.1 单条记录的标签数据流

```
data/xxx.md (源文件)
  ↓ 不解析标签（标签信息在 INDEX.md）

INDEX.md 文件清单表格
  | [xxx.md](../data/xxx.md) | #tag1 #tag2 #tag3 | ✅ 已验证 | 描述 |
  ↓ parseIndexMd() 解析
  {
    filename: "xxx.md",
    title: "xxx",
    tags: ["tag1", "tag2", "tag3"],  ← 从 cols[2] 提取
    status: "✅ 已验证",
    desc: "描述"
  }
  ↓ 传递给多个函数
  ├─→ generateStats() → stats.json
  │     └─ tagDistribution: [{name: "tag1", count: N}, ...]
  │
  ├─→ generateTags() → tags.json
  │     └─ {name: "tag1", count: N, files: [...]}
  │
  └─→ ensureFrontmatter() → content/records/xxx.md
        └─ frontmatter: { tags: ["tag1", "tag2", "tag3"], ... }
```

### 6.2 标签元数据的数据流

```
tag-registry.md
  | #tag1 | 显示名1 | icon1 |
  | #tag2 | 显示名2 | icon2 |
  ↓ parseTagRegistry() 解析
  Map {
    "tag1" => {label: "显示名1", icon: "icon1"},
    "tag2" => {label: "显示名2", icon: "icon2"}
  }
  ↓ 传递给多个函数
  ├─→ generateTags() → tag-meta.json
  │     └─ {"tag1": {label, icon}, "tag2": {label, icon}}
  │
  └─→ transformMetaBlocks() → HTML 渲染
        └─ 标签 pill 显示为 label 而非 tag 名
```

---

## 7. 总结

### 当前问题

1. **数据重复**: 标签定义分散在 3 个文件中
2. **手动同步**: 新增标签需要修改多处
3. **硬编码依赖**: 标题匹配、列位置都是硬编码
4. **隐含假设**: "第一个标签是领域" 的假设没有数据支撑

### 推荐行动

| 优先级 | 行动 | 工作量 | 风险 |
|--------|------|--------|------|
| P0 | 扩展 tag-registry.md 添加维度列 | 低 | 低 |
| P1 | 修改 parseTagRegistry() 支持新列 | 低 | 低 |
| P2 | 修改 generateStats() 使用维度信息 | 中 | 中 |
| P3 | 删除 INDEX.md 标签概览 | 低 | 低 |
| P3 | 删除 record-template.md 预定义标签列表 | 低 | 中 |

### 预期收益

1. **单一数据源**: 所有标签信息集中在 tag-registry.md
2. **自动化同步**: 新增标签只需修改一处
3. **类型安全**: 维度信息使标签分类有据可依
4. **向后兼容**: 分阶段迁移，不破坏现有功能

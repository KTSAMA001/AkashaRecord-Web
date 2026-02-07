/**
 * 内容同步脚本 (Refactored 2026-02-08)
 * 适配阿卡西记录扁平化标签体系
 * 
 * 流程：
 * 1. 拉取 .akasha-repo
 * 2. 解析 references/INDEX.md 获取权威元数据 (文件清单 + 标签)
 * 3. 复制 data/*.md 到 content/records/，同时注入 Frontmatter 和修正链接
 * 4. 生成 content/records/index.md 和 content/tags/index.md
 * 5. 生成 public/api/stats.json、tags.json 和 tag-meta.json
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content')
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')
const API_DIR = path.join(PUBLIC_DIR, 'api')

// 阿卡西记录配置
const GITHUB_MIRROR = process.env.GITHUB_MIRROR || ''
// 优先使用本地已存在的 AgentSkill 路径作为源（开发环境）
const LOCAL_SOURCE = '/Users/ktsama/.claude/skills/AgentSkill-Akasha-KT'
const AKASHA_REPO_ORIGIN = fs.existsSync(LOCAL_SOURCE) 
  ? LOCAL_SOURCE 
  : 'https://github.com/KTSAMA001/AgentSkill-Akasha-KT.git'

const AKASHA_REPO = GITHUB_MIRROR && !fs.existsSync(LOCAL_SOURCE)
  ? AKASHA_REPO_ORIGIN.replace('https://github.com/', GITHUB_MIRROR)
  : AKASHA_REPO_ORIGIN
const AKASHA_LOCAL = path.join(PROJECT_ROOT, '.akasha-repo')

function syncRepo() {
  try {
    execSync(`git config --global --add safe.directory "${AKASHA_LOCAL}"`, { stdio: 'pipe' })
  } catch {}

  if (fs.existsSync(path.join(AKASHA_LOCAL, '.git'))) {
    try {
      execSync(`git remote set-url origin "${AKASHA_REPO}"`, { cwd: AKASHA_LOCAL, stdio: 'pipe' })
    } catch {}

    console.log(`📥 拉取 .akasha-repo... ${GITHUB_MIRROR ? '(Mirror)' : ''}`)
    try {
      execSync('git checkout . && git clean -fd', { cwd: AKASHA_LOCAL, stdio: 'pipe' })
      execSync('git pull --ff-only', { cwd: AKASHA_LOCAL, stdio: 'pipe', timeout: 60000 })
    } catch (e) {
      console.warn('⚠️ Pull failed, trying fetch+reset...')
      try {
        execSync('git fetch origin && git reset --hard origin/main', { cwd: AKASHA_LOCAL, stdio: 'pipe' })
      } catch (e2) {
        console.warn('⚠️ Sync failed, using local cache.')
      }
    }
  } else {
    console.log(`📦 Cloning .akasha-repo...`)
    execSync(`git clone --depth 1 ${AKASHA_REPO} "${AKASHA_LOCAL}"`, { stdio: 'pipe' })
  }
}

/**
 * 解析 INDEX.md 中的「文件清单」表格
 * 返回: Array<{ filename, title, tags: [], status, desc }>
 */
function parseIndexMd() {
  const indexPath = path.join(AKASHA_LOCAL, 'references', 'INDEX.md')
  if (!fs.existsSync(indexPath)) return []

  const content = fs.readFileSync(indexPath, 'utf-8')
  const lines = content.split('\n')
  
  const records = []
  let inTable = false

  for (const line of lines) {
    if (line.includes('## 文件清单')) {
      inTable = true
      continue
    }
    if (inTable && line.startsWith('## ')) {
      inTable = false
      break
    }
    
    if (inTable && line.startsWith('|') && !line.includes('---') && !line.includes('| 文件 |')) {
      // | [title](../data/filename.md) | ：#tag1 #tag2 | ：✅ 状态 | 描述 |
      const cols = line.split('|').map(c => c.trim())
      if (cols.length < 5) continue

      const fileCol = cols[1]
      const tagCol = cols[2]
      const statusCol = cols[3]
      const descCol = cols[4]

      // 解析文件名和标题: [title](../data/filename.md)
      const fileMatch = fileCol.match(/\[(.*?)\]\((?:..\/)?data\/(.*?)\)/)
      if (!fileMatch) continue
      
      const title = fileMatch[1]
      const filename = fileMatch[2]

      // 解析标签: ：#tag1 #tag2 -> ['tag1', 'tag2']
      const tags = tagCol
        .replace(/[:：]/g, '')
        .split(' ')
        .filter(t => t.startsWith('#'))
        .map(t => t.slice(1))

      // 解析状态: ：✅ 已验证 -> ✅ 已验证
      const status = statusCol.replace(/[:：]/g, '').trim()

      records.push({
        filename,
        title,
        tags,
        status,
        desc: descCol
      })
    }
  }
  
  console.log(`📋 解析到 ${records.length} 条记录元数据`)
  return records
}

/**
 * 修正内容中的链接
 * ../../knowledge/xxx.md -> ./xxx.md
 */
function fixLinks(content) {
  // 移除旧的分类目录层级 references
  // 匹配 ](../../knowledge/xxx.md) 或 ](../graphics/xxx.md) 等
  // 统一替换为 ](./xxx)
  
  // 1. 处理以 ../data/ 开头的 (已经是扁平的了，但可能在旧文件中还有残留)
  content = content.replace(/\]\(\.\.\/data\//g, '](./')
  
  // 2. 处理旧的分类路径 ../../knowledge/graphics/xxx.md -> ./xxx.md
  content = content.replace(/\]\(\.\.\/.*?\/([^\/]+?)\.md\)/g, '](./$1.md)')
  
  // 3. 移除 .md 后缀 (VitePress cleanUrls)
  content = content.replace(/\]\(\.\/([^\)]+)\.md\)/g, '](./$1)')

  // 4. 转义 C# 泛型防止 Vue 解析错误 <T>
  content = content.replace(/<([a-zA-Z0-9_, ]+)>/g, (match, p1) => {
    // 简单 heuristic: 如果是纯字母数字组合，可能是泛型，转义
    // 排除 HTML 标签将在 Markdown 渲染层处理，这里只处理明显的代码泛型
    return `&lt;${p1}&gt;`
  })

  return content
}

/* =============================================
 * 元数据块识别与转换
 * ============================================= */

/** 已识别的元数据字段 key，非此列表的 **Key**：Value 不会被识别 */
const META_KEYS = new Set([
  '标签', '来源', '来源日期', '收录日期', '更新日期',
  '日期', '可信度', '状态', '适用版本',
])

/**
 * 识别正文中的元数据块并转换为结构化 HTML
 *
 * 规则：连续 2+ 行匹配 **KEY**：VALUE（KEY ∈ META_KEYS）视为一个元数据块。
 * 返回 { content, firstMeta }，firstMeta 为首个块的字段数组（用于丰富 frontmatter）。
 */
function transformMetaBlocks(content, tagMeta = new Map()) {
  const lines = content.split('\n')
  const result = []
  let firstMeta = null
  let i = 0

  while (i < lines.length) {
    // 尝试收集连续元数据行
    const blockFields = []
    const blockStartIdx = i

    while (i < lines.length) {
      const raw = lines[i]
      const trimmed = raw.trim()
      if (!trimmed) break // 空行终止

      const m = trimmed.match(/^\*\*(.+?)\*\*[：:]\s*(.*)$/)
      if (m && META_KEYS.has(m[1])) {
        blockFields.push({ key: m[1], value: m[2].replace(/\s{2,}$/, '').trim() })
        i++
      } else {
        break
      }
    }

    if (blockFields.length >= 2) {
      // —— 有效元数据块：转为 HTML ——
      if (!firstMeta) firstMeta = blockFields

      const htmlParts = ['', '<div class="record-meta-block">']

      for (const f of blockFields) {
        // 跳过值为空的字段（如多行来源只有 key 无 value）
        if (!f.value) continue

        if (f.key === '标签') {
          // 标签 → 可点击 pill
          const pills = f.value
            .split(/\s+/)
            .filter(t => t.startsWith('#'))
            .map(t => {
              const k = t.slice(1)
              const label = tagMeta.get(k)?.label || k
              return `<a href="/records/?tag=${encodeURIComponent(k)}" class="meta-tag">${label}</a>`
            })
            .join(' ')
          htmlParts.push(`<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value">${pills}</span></div>`)
        } else if (f.key === '来源') {
          // 来源中可能有 markdown 链接，转为 <a>
          const val = f.value.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener">$1</a>'
          )
          htmlParts.push(`<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">${val}</span></div>`)
        } else {
          htmlParts.push(`<div class="meta-item"><span class="meta-label">${f.key}</span><span class="meta-value">${f.value}</span></div>`)
        }
      }

      htmlParts.push('</div>', '')
      result.push(htmlParts.join('\n'))
    } else {
      // 不构成元数据块，原样保留
      for (let j = blockStartIdx; j < blockStartIdx + blockFields.length; j++) {
        result.push(lines[j])
      }
      if (blockFields.length === 0) {
        result.push(lines[i])
        i++
      }
    }
  }

  return { content: result.join('\n'), firstMeta }
}

/**
 * 注入 Frontmatter
 * @param {string} content  - markdown 正文（已经过 transformMetaBlocks）
 * @param {object} record   - INDEX.md 中的权威元数据
 * @param {object[]|null} extractedMeta - 正文首个元数据块的字段数组
 */
function ensureFrontmatter(content, record, extractedMeta) {
  let fileMatter;
  try {
    fileMatter = matter(content);
  } catch(e) {
    // Fallback for files with broken frontmatter or none
    fileMatter = { data: {}, content: content };
  }
  
  const data = fileMatter.data || {}

  // 强制覆盖/补全关键元数据（INDEX.md 权威源）
  // 标题优先级：frontmatter > 正文 h1 > 正文 h2 > INDEX.md desc > 文件名
  if (!data.title || data.title.endsWith('.md')) {
    const h1Match = fileMatter.content.match(/^#\s+(.+)$/m)
    const h2Match = fileMatter.content.match(/^##\s+(.+)$/m)
    data.title = h1Match ? h1Match[1].trim()
      : h2Match ? h2Match[1].trim()
      : record.desc || record.title.replace(/\.md$/, '')
  }
  data.tags = record.tags
  data.status = record.status
  data.description = data.description || record.desc

  // 从正文首个元数据块补充丰富字段
  if (extractedMeta) {
    const metaMap = new Map(extractedMeta.map(f => [f.key, f.value]))
    if (metaMap.has('来源'))       data.source       = data.source       || metaMap.get('来源')
    if (metaMap.has('来源日期'))   data.sourceDate    = data.sourceDate    || metaMap.get('来源日期')
    if (metaMap.has('收录日期'))   data.recordDate    = data.recordDate    || metaMap.get('收录日期')
    if (metaMap.has('更新日期'))   data.updateDate    = data.updateDate    || metaMap.get('更新日期')
    if (metaMap.has('日期'))       data.recordDate    = data.recordDate    || metaMap.get('日期')
    if (metaMap.has('可信度'))     data.credibility   = data.credibility   || metaMap.get('可信度')
    if (metaMap.has('适用版本'))   data.version       = data.version       || metaMap.get('适用版本')
  }
  
  // 生成新的 frontmatter
  return matter.stringify(fileMatter.content, data)
}

function generateStats(records) {
  const stats = {
    total: records.length,
    byDomain: {},
    recent: [] // TODO: Git log logic could be re-added here if needed
  }

  // 统计 Domain 标签 (首个标签作为 Domain)
  for (const r of records) {
    if (r.tags.length > 0) {
      const domain = r.tags[0]
      stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1
    }
  }

  fs.mkdirSync(API_DIR, { recursive: true })
  fs.writeFileSync(path.join(API_DIR, 'stats.json'), JSON.stringify(stats, null, 2))
}

/**
 * 解析 tag-registry.md 标签注册表
 * 返回: Map<string, { label: string, icon: string }>
 */
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
    if (!line.startsWith('|') || line.includes('---') || line.includes('| 标签')) continue
    const cols = line.split('|').map(c => c.trim())
    if (cols.length < 4) continue

    const tagCol = cols[1]  // #tag-name
    const label = cols[2]   // 中文名
    const icon = cols[3]    // 图标名

    if (!tagCol.startsWith('#')) continue
    const tag = tagCol.slice(1) // 去掉 #
    meta.set(tag, { label, icon })
  }

  console.log(`🏷️  解析到 ${meta.size} 个标签元数据`)
  return meta
}

function generateTags(records, tagMeta) {
  const tagMap = new Map() // tag -> { count, files: [] }

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

  const sortedTags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count)
  fs.writeFileSync(path.join(API_DIR, 'tags.json'), JSON.stringify(sortedTags, null, 2))

  // 生成 tag-meta.json
  const metaObj = {}
  for (const [tag, info] of tagMeta) {
    metaObj[tag] = info
  }
  fs.writeFileSync(path.join(API_DIR, 'tag-meta.json'), JSON.stringify(metaObj, null, 2))
  console.log(`💾 已生成 tag-meta.json (${tagMeta.size} 条)`)
}

function generatePages(records) {
  // 1. records/index.md
  const recordsIndexContent = `---
layout: page
title: 记录终端
sidebar: false
---

<RecordsBrowser />
`
  fs.writeFileSync(path.join(CONTENT_DIR, 'records', 'index.md'), recordsIndexContent)

  // 2. tags/index.md
  const tagsIndexContent = `---
layout: page
title: 标签索引
sidebar: false
---

# 标签索引

<TagCloud :interactive="true" />
`
  fs.writeFileSync(path.join(CONTENT_DIR, 'tags', 'index.md'), tagsIndexContent)
}

// 主流程
async function main() {
  console.log('🚀 开始执行标签化内容同步...')
  
  syncRepo()
  const records = parseIndexMd()
  
  if (records.length === 0) {
    console.error('❌ 未解析到任何记录，请检查 INDEX.md 格式')
    process.exit(1)
  }

  // 先解析标签注册表（transformMetaBlocks 需要用到）
  const tagMeta = parseTagRegistry()

  // 清理并重建 content 目录
  if (fs.existsSync(CONTENT_DIR)) fs.rmSync(CONTENT_DIR, { recursive: true })
  fs.mkdirSync(path.join(CONTENT_DIR, 'records'), { recursive: true })
  fs.mkdirSync(path.join(CONTENT_DIR, 'tags'), { recursive: true })

  // 复制文件
  let copyCount = 0
  for (const r of records) {
    const src = path.join(AKASHA_LOCAL, 'data', r.filename)
    if (fs.existsSync(src)) {
      let content = fs.readFileSync(src, 'utf-8')
      content = fixLinks(content)
      const { content: transformed, firstMeta } = transformMetaBlocks(content, tagMeta)
      content = ensureFrontmatter(transformed, r, firstMeta)
      fs.writeFileSync(path.join(CONTENT_DIR, 'records', r.filename), content)
      copyCount++
    }
  }
  console.log(`✅ 已处理 ${copyCount} 个记录文件`)

  // 生成数据和页面
  generateStats(records)
  generateTags(records, tagMeta)
  generatePages(records)

  // 同步到项目根目录 (VitePress Root)
  const rootRecords = path.join(PROJECT_ROOT, 'records')
  const rootTags = path.join(PROJECT_ROOT, 'tags')
  
  // 清理旧目录 (experiences, knowledge, ideas)
  const oldDirs = ['experiences', 'knowledge', 'ideas']
  for (const d of oldDirs) {
    const p = path.join(PROJECT_ROOT, d)
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true })
  }

  // 部署新目录
  if (fs.existsSync(rootRecords)) fs.rmSync(rootRecords, { recursive: true })
  if (fs.existsSync(rootTags)) fs.rmSync(rootTags, { recursive: true })
  
  fs.cpSync(path.join(CONTENT_DIR, 'records'), rootRecords, { recursive: true })
  fs.cpSync(path.join(CONTENT_DIR, 'tags'), rootTags, { recursive: true })

  console.log('✨ 同步完成！')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

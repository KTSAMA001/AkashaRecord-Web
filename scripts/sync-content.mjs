/**
 * 内容同步脚本 (Refactored 2026-02-08)
 * 适配阿卡西记录扁平化标签体系 + Schema-Driven 渲染管线
 * 
 * 流程：
 * 1. 拉取 .akasha-repo
 * 2. 解析 record-template.md 获取 Schema (字段定义/状态定义/Emoji映射)
 * 3. 解析 references/INDEX.md 获取文件清单与回退元数据
 * 4. 复制 data/*.md 到 content/records/，以文档自身为准注入 Frontmatter、修正链接、Emoji→SVG
 * 4b. 复制 data/ 和 assets/ 下的图片等静态资源到 content/records/
 * 5. 生成 content/records/index.md
 * 6. 生成 public/api/stats.json、tags.json、tag-meta.json 和 meta-schema.json
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

// 支持同步的图片/静态资源扩展名
const ASSET_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico', '.avif',
])

// 生成用于正则匹配的图片扩展名模式（从 ASSET_EXTENSIONS 动态生成，保持单一来源）
const ASSET_EXT_PATTERN = [...ASSET_EXTENSIONS].map(e => e.slice(1)).join('|')
const META_KEY_ALIASES = new Map([
  ['创建时间', '收录日期'],
])

/**
 * 递归复制图片等静态资源文件，保持相对目录结构
 * @param {string} srcDir - 源目录（如 .akasha-repo/data）
 * @param {string} destDir - 目标目录（如 content/records）
 * @returns {number} 复制的文件数量
 */
function copyAssetFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0

  let count = 0
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      count += copyAssetFiles(srcPath, destPath)
    } else if (ASSET_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      fs.copyFileSync(srcPath, destPath)
      count++
    }
  }

  return count
}

/**
 * 递归复制图片文件，将子目录结构扁平化到目标目录
 * 用于将 assets/{record-name}/image.png 复制到 records/image.png
 * （因为 fixLinks 会把 ../assets/subdir/file.png 转为 ./file.png）
 * @param {string} srcDir - 源目录（如 .akasha-repo/assets）
 * @param {string} destDir - 目标目录（如 content/records）
 * @param {Set<string>} [seen] - 已复制的文件名（检测冲突用）
 * @returns {number} 复制的文件数量
 */
function copyAssetFilesFlat(srcDir, destDir, seen = new Set()) {
  if (!fs.existsSync(srcDir)) return 0

  let count = 0
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)

    if (entry.isDirectory()) {
      count += copyAssetFilesFlat(srcPath, destDir, seen)
    } else if (ASSET_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      if (seen.has(entry.name)) {
        console.warn(`  ⚠️ 资源文件名冲突: ${entry.name}（来自 ${srcPath}），已被覆盖`)
      }
      seen.add(entry.name)
      fs.copyFileSync(srcPath, path.join(destDir, entry.name))
      count++
    }
  }

  return count
}

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

/* =============================================
 * record-template.md Schema 解析引擎
 * ============================================= */

/**
 * 从 record-template.md 解析三张 Schema 表格:
 *   1. 元数据字段 Schema → fields[]
 *   2. 状态定义 → statuses[]
 *   3. Emoji 渲染映射 → emojiMap[]
 * 返回: { fields, statuses, emojiMap, metaKeys }
 */
function parseRecordTemplate() {
  const templatePath = path.join(AKASHA_LOCAL, 'references', 'templates', 'record-template.md')
  const schema = { fields: [], statuses: [], emojiMap: [], metaKeys: new Set() }

  if (!fs.existsSync(templatePath)) {
    throw new Error(`❌ 致命错误: 未找到 record-template.md (${templatePath})\n   → 请确认后端仓库路径 AKASHA_LOCAL 正确且文件存在`)
  }

  const content = fs.readFileSync(templatePath, 'utf-8')
  const lines = content.split('\n')

  let currentSection = null

  for (const line of lines) {
    // 识别章节标题
    if (line.startsWith('## 元数据字段 Schema')) { currentSection = 'fields'; continue }
    if (line.startsWith('## 状态定义')) { currentSection = 'statuses'; continue }
    if (line.startsWith('## Emoji 渲染映射')) { currentSection = 'emoji'; continue }
    if (line.startsWith('## ') && currentSection) { currentSection = null; continue }

    // 跳过非表格行
    if (!line.startsWith('|') || line.includes('---')) continue

    const cols = line.split('|').map(c => c.trim()).filter(Boolean)

    if (currentSection === 'fields' && cols.length >= 4) {
      const [fieldName, key, renderType, alias] = cols
      if (fieldName === '字段名') continue // 表头
      schema.fields.push({ fieldName, key, renderType, alias: alias === '—' ? null : alias })
      schema.metaKeys.add(fieldName)
      if (alias && alias !== '—') schema.metaKeys.add(alias)
    }

    if (currentSection === 'statuses' && cols.length >= 5) {
      const [emoji, label, color, svg, scene] = cols
      if (emoji === 'Emoji') continue // 表头
      schema.statuses.push({ emoji: emoji.trim(), label, color, svg, scene })
    }

    if (currentSection === 'emoji' && cols.length >= 4) {
      const [emoji, svg, cssClass, desc] = cols
      if (emoji === 'Emoji') continue // 表头
      schema.emojiMap.push({ emoji: emoji.trim(), svg, cssClass: cssClass === '—' ? null : cssClass, desc })
    }
  }

  console.log(`📐 Schema 解析完成: ${schema.fields.length} 字段, ${schema.statuses.length} 状态, ${schema.emojiMap.length} Emoji 映射`)
  return schema
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

  // 2b. 处理旧的分类路径中的图片引用 ../../knowledge/graphics/image.png -> ./image.png
  content = content.replace(
    new RegExp(`\\]\\(\\.\\.\\/.*?\\/([^\\/]+?\\.(${ASSET_EXT_PATTERN}))\\)`, 'gi'),
    '](./$1)'
  )

  // 3. 移除 .md 后缀 (VitePress cleanUrls)
  content = content.replace(/\]\(\.\/([^\)]+)\.md\)/g, '](./$1)')

  // 4. C# 泛型 <T> 的处理已移至 markdown-it 插件（markdown-generic-escape.ts）
  //    在 token 流层面将非 HTML 的 html_inline 标签转为转义文本，
  //    自动跳过代码块和行内代码，无需在此修改源文件内容。

  return content
}

function normalizeTagList(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map(tag => String(tag).trim().replace(/^#/, ''))
      .filter(Boolean)
  }

  if (typeof tags === 'string') {
    return tags
      .split(/[\s,，]+/)
      .map(tag => tag.trim().replace(/^#/, ''))
      .filter(Boolean)
  }

  return []
}

function normalizeMetaKey(key, schema = null) {
  const rawKey = key.trim()
  const aliasKey = META_KEY_ALIASES.get(rawKey) || rawKey

  if (!schema?.fields) return aliasKey

  const matched = schema.fields.find(field =>
    field.fieldName === aliasKey
    || field.alias === aliasKey
    || field.fieldName === rawKey
    || field.alias === rawKey
  )

  return matched?.fieldName || aliasKey
}

/**
 * 清理 heading 文本中的 VitePress 锚点后缀（如 {#anchor}），避免写入 frontmatter。
 */
function cleanHeadingText(text) {
  return text?.replace(/\s*\{#[^}]+\}$/g, '').trim() || null
}

function parseMetaLine(line, schema = null) {
  const trimmed = line.trim()
  if (!trimmed) return null

  let match = trimmed.match(/^\*\*(.+?)\*\*[：:]\s*(.*)$/)
  if (!match) {
    match = trimmed.match(/^>\s*([^：:]+)[：:]\s*(.*)$/)
  }
  if (!match) return null

  return {
    key: normalizeMetaKey(match[1], schema),
    value: match[2].replace(/\s{2,}$/, '').trim(),
  }
}

function extractDocumentMeta(content, schema = null) {
  let fileMatter
  try {
    fileMatter = matter(content)
  } catch {
    // 文档自身 frontmatter 损坏时仍需继续回退到正文元数据，避免同步中断
    fileMatter = { data: {}, content }
  }

  const body = fileMatter.content || content
  const metaMap = new Map()
  let inMetaBlock = false
  let inFence = false
  let nearestHeadingBeforeMeta = null
  let firstHeading = null
  let firstSubHeading = null

  for (const line of body.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      inFence = !inFence
    }

    if (!inFence) {
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const heading = {
          level: headingMatch[1].length,
          text: cleanHeadingText(headingMatch[2]),
        }
        if (heading.level === 1 && !firstHeading) firstHeading = heading
        if (heading.level === 2 && !firstSubHeading) firstSubHeading = heading
        nearestHeadingBeforeMeta = heading
      }
    }

    const meta = parseMetaLine(line, schema)
    if (meta && (!schema?.metaKeys || schema.metaKeys.has(meta.key))) {
      metaMap.set(meta.key, meta.value)
      inMetaBlock = true
      continue
    }
    if (inMetaBlock) break
  }

  const frontmatterTags = normalizeTagList(fileMatter.data?.tags)

  return {
    title: cleanHeadingText(fileMatter.data?.title)
      || nearestHeadingBeforeMeta?.text
      || firstHeading?.text
      || firstSubHeading?.text
      || null,
    tags: frontmatterTags.length ? frontmatterTags : normalizeTagList(metaMap.get('标签')),
  }
}

function areArraysEqual(a = [], b = []) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

/* =============================================
 * Emoji → SVG 转换引擎
 * ============================================= */

/**
 * 将正文中的 Emoji 替换为 SVG <img> 标签
 * 处理顺序：元数据块的状态/可信度已由 transformMetaBlocks 处理，
 *           此函数处理正文中的装饰性和标记 Emoji
 * @param {string} content - 已经过 transformMetaBlocks 处理的内容
 * @param {object} schema - parseRecordTemplate() 返回的 schema
 */
function transformEmoji(content, schema) {
  if (!schema?.emojiMap?.length) return content

  for (const mapping of schema.emojiMap) {
    const { emoji, svg, cssClass } = mapping
    if (!emoji || !svg) continue

    // 跳过星级 emoji（已由 star-rating 渲染器处理）
    if (emoji === '⭐') continue

    const cls = cssClass ? `inline-icon ${cssClass}` : 'inline-icon'
    const replacement = `<img class="${cls}" src="/icons/${svg}.svg" alt="${emoji}" />`

    // 替换正文中的 emoji（排除已在 HTML 标签内的 emoji，如 alt="" 属性中的）
    // 使用全局替换，但避免替换 HTML 属性内的内容
    content = content.replace(new RegExp(`(?<!alt=")(?<!src="[^"]*?)${escapeRegExp(emoji)}`, 'g'), replacement)
  }

  return content
}

/** 转义正则特殊字符 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/* =============================================
 * 元数据块识别与转换
 * ============================================= */

/**
 * 识别正文中的元数据块并转换为结构化 HTML
 * Schema-Driven: 使用 schema.metaKeys 识别, schema.fields 的 renderType 驱动渲染
 *
 * 规则：连续 2+ 行匹配 **KEY**：VALUE 或 > KEY：VALUE（KEY ∈ metaKeys）视为一个元数据块。
 * 返回 { content, firstMeta }，firstMeta 为首个块的字段数组（用于丰富 frontmatter）。
 */
function transformMetaBlocks(content, tagMeta = new Map(), schema = null) {
  if (!schema?.metaKeys) {
    throw new Error('❌ 致命错误: transformMetaBlocks 缺少 schema 参数\n   → parseRecordTemplate() 必须在调用前成功执行')
  }
  const metaKeys = schema.metaKeys

  // 构建 fieldName → renderType 映射
  const renderTypeMap = new Map()
  if (schema?.fields) {
    for (const f of schema.fields) {
      renderTypeMap.set(f.fieldName, f.renderType)
      if (f.alias) renderTypeMap.set(f.alias, f.renderType)
    }
  }

  // 构建 emoji → { label, color, svg } 映射（状态渲染用）
  // 映射完全由 Schema 模板的状态定义表驱动，近似 emoji 在表中直接添加行
  const statusMap = new Map()
  if (schema?.statuses) {
    for (const s of schema.statuses) {
      statusMap.set(s.emoji, s)
    }
  }
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

      const meta = parseMetaLine(trimmed, schema)
      if (meta && metaKeys.has(meta.key)) {
        blockFields.push(meta)
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

        const rType = renderTypeMap.get(f.key) || 'text'

        if (rType === 'tag-pills') {
          // 标签 → 可点击 pill
          const pills = f.value
            .split(/\s+/)
            .filter(t => t.startsWith('#'))
            .map(t => {
              const k = t.slice(1)
              const label = tagMeta.get(k)?.label || k
              return `<a href="/records/?tags=${encodeURIComponent(k)}" class="meta-tag">${label}</a>`
            })
            .join(' ')
          htmlParts.push(`<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value">${pills}</span></div>`)
        } else if (rType === 'link') {
          // 来源中可能有 markdown 链接，转为 <a>
          const val = f.value.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener">$1</a>'
          )
          htmlParts.push(`<div class="meta-item"><span class="meta-label">${f.key}</span><span class="meta-value">${val}</span></div>`)
        } else if (rType === 'status-icon') {
          // 状态 → SVG 图标 + 中文标签
          const statusEmoji = f.value.match(/^([\p{Emoji}\u200d\uFE0F]+)/u)?.[1]?.trim()
          const statusInfo = statusEmoji ? statusMap.get(statusEmoji) : null
          if (statusInfo) {
            const svgHtml = `<img class="inline-icon inline-icon--status" src="/icons/${statusInfo.svg}.svg" alt="${statusInfo.label}" />`
            htmlParts.push(`<div class="meta-item"><span class="meta-label">${f.key}</span><span class="meta-value meta-value--status meta-value--${statusInfo.color}">${svgHtml} ${statusInfo.label}</span></div>`)
          } else {
            htmlParts.push(`<div class="meta-item"><span class="meta-label">${f.key}</span><span class="meta-value">${f.value}</span></div>`)
          }
        } else if (rType === 'star-rating') {
          // 可信度 → 星级 SVG 组件
          const starCount = (f.value.match(/⭐/g) || []).length
          if (starCount > 0) {
            const starsHtml = Array.from({ length: 5 }, (_, i) =>
              `<img class="inline-icon inline-icon--star" src="/icons/${i < starCount ? 'star-filled' : 'star-empty'}.svg" alt="${i < starCount ? '★' : '☆'}" />`
            ).join('')
            // 提取括号中的说明文字
            const descMatch = f.value.match(/[（(](.+?)[）)]/)
            const desc = descMatch ? ` <span class="star-desc">${descMatch[1]}</span>` : ''
            htmlParts.push(`<div class="meta-item"><span class="meta-label">${f.key}</span><span class="meta-value"><span class="star-rating">${starsHtml}</span>${desc}</span></div>`)
          } else {
            htmlParts.push(`<div class="meta-item"><span class="meta-label">${f.key}</span><span class="meta-value">${f.value}</span></div>`)
          }
        } else {
          // text 和其他类型 → 纯文本
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
 * @param {object} record   - INDEX.md 中的预览/回退元数据
 * @param {object[]|null} extractedMeta - 正文首个元数据块的字段数组
 */
function ensureFrontmatter(content, record, extractedMeta, schema = null, documentMeta = null) {
  let fileMatter;
  try {
    fileMatter = matter(content);
  } catch(e) {
    // Fallback for files with broken frontmatter or none
    fileMatter = { data: {}, content: content };
  }
  
  const data = fileMatter.data || {}
  const cleanHeading = cleanHeadingText
  const documentTitle = cleanHeading(documentMeta?.title)
  const documentTags = normalizeTagList(documentMeta?.tags)
  const existingTags = normalizeTagList(data.tags)

  // 补全关键元数据：优先使用文档自身，INDEX.md 仅作文件清单/非标题字段回退
  if (!data.title || data.title.endsWith('.md')) {
    data.title = documentTitle || record.title.replace(/\.md$/, '')
  }
  data.tags = documentTags.length ? documentTags : existingTags
  data.status = data.status || record.status
  data.description = cleanHeading(data.description || record.desc)

  // 从正文首个元数据块补充丰富字段（Schema-Driven）
  if (extractedMeta && schema?.fields) {
    const metaMap = new Map(extractedMeta.map(f => [f.key, f.value]))
    for (const field of schema.fields) {
      // 跳过 tag-pills 类型（标签已由文档自身元数据统一处理）
      if (field.renderType === 'tag-pills') continue
      const val = metaMap.get(field.fieldName) || (field.alias ? metaMap.get(field.alias) : null)
      if (val && !data[field.key]) {
        data[field.key] = val
      }
    }
  } else if (extractedMeta && !schema?.fields) {
    throw new Error(`❌ 致命错误: ensureFrontmatter 缺少 schema.fields (文件: ${record.title})\n   → parseRecordTemplate() 必须在调用前成功执行`)
  }
  
  // 生成新的 frontmatter
  return matter.stringify(fileMatter.content, data)
}

function generateStats(records, tagMeta) {
  const stats = {
    total: records.length,
    byDomain: {},
    byDimension: { domain: {}, type: {}, specialty: {}, custom: {} },
    recent: [] // TODO: Git log logic could be re-added here if needed
  }

  // 使用维度信息统计（Phase 3 重构）
  for (const r of records) {
    for (const tag of r.tags) {
      const meta = tagMeta.get(tag)
      const dimension = meta?.dimension || 'custom'

      // 按维度分类统计
      stats.byDimension[dimension][tag] = (stats.byDimension[dimension][tag] || 0) + 1

      // byDomain 保留为第一个 domain 标签（向后兼容）
      if (dimension === 'domain' && !r._domainTagged) {
        stats.byDomain[tag] = (stats.byDomain[tag] || 0) + 1
        r._domainTagged = true
      }
    }
  }

  // 统计所有标签的分布（用于首页标签分布可视化）
  const tagCounts = {}
  for (const r of records) {
    for (const tag of r.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  stats.tagDistribution = Object.entries(tagCounts)
    .map(([name, count]) => {
      const meta = tagMeta.get(name)
      return {
        name,
        count,
        label: meta?.label || name,
        dimension: meta?.dimension || 'custom'
      }
    })
    .sort((a, b) => b.count - a.count)

  fs.mkdirSync(API_DIR, { recursive: true })
  fs.writeFileSync(path.join(API_DIR, 'stats.json'), JSON.stringify(stats, null, 2))
}

/**
 * 解析 tag-registry.md 标签注册表
 * 返回: Map<string, { label: string, icon: string, dimension: string, desc: string }>
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
    // 跳过表头行（精确匹配）
    if (line.includes("| 标签 | 显示名 | 图标 | 维度 | 说明 |")) continue
    if (!line.startsWith('|') || line.includes('---')) continue

    const cols = line.split('|').map(c => c.trim())
    // 新格式: | 标签 | 显示名 | 图标 | 维度 | 说明 |
    if (cols.length < 6) continue

    const tagCol = cols[1]     // #tag-name
    const label = cols[2]      // 中文名
    const icon = cols[3]       // 图标名
    const dimension = cols[4]  // 维度: domain/type/specialty/custom
    const desc = cols[5]       // 说明

    if (!tagCol.startsWith('#')) continue
    const tag = tagCol.slice(1) // 去掉 #
    meta.set(tag, { label, icon, dimension: dimension || 'custom', desc: desc || '' })
  }

  console.log(`🏷️  解析到 ${meta.size} 个标签元数据（含维度信息）`)
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

  // 生成 tag-meta.json（Phase 3: 包含维度和说明）
  const metaObj = {}
  for (const [tag, info] of tagMeta) {
    metaObj[tag] = info
  }
  fs.writeFileSync(path.join(API_DIR, 'tag-meta.json'), JSON.stringify(metaObj, null, 2))
  console.log(`💾 已生成 tag-meta.json (${tagMeta.size} 条，含维度信息)`)
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

  // 标签索引页已移除——记录终端内置多选标签筛选，标签索引页不再需要
}

// 主流程
async function main() {
  console.log('🚀 开始执行标签化内容同步...')
  
  syncRepo()

  // 解析 Schema（Phase 2 核心）
  const schema = parseRecordTemplate()

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
  const metadataAudit = { tagOverrides: 0, missingDocumentTags: 0, titleOverrides: 0, missingDocumentTitles: 0 }
  for (const r of records) {
    const src = path.join(AKASHA_LOCAL, 'data', r.filename)
    if (fs.existsSync(src)) {
      let content = fs.readFileSync(src, 'utf-8')
      const documentMeta = extractDocumentMeta(content, schema)
      const indexTags = normalizeTagList(r.tags)
      const documentTags = normalizeTagList(documentMeta.tags)
      const indexTitle = cleanHeadingText(r.desc) || cleanHeadingText(r.title.replace(/\.md$/, ''))
      const documentTitle = cleanHeadingText(documentMeta.title)

      if (documentTags.length) {
        if (!areArraysEqual(documentTags, indexTags)) {
          metadataAudit.tagOverrides++
        }
      } else {
        metadataAudit.missingDocumentTags++
      }

      if (documentTitle) {
        if (indexTitle && documentTitle !== indexTitle) {
          metadataAudit.titleOverrides++
        }
      } else {
        metadataAudit.missingDocumentTitles++
      }

      content = fixLinks(content)
      const { content: transformed, firstMeta } = transformMetaBlocks(content, tagMeta, schema)
      // Emoji → SVG 转换已移至 VitePress markdown-it 插件（token 流层面，自动跳过代码块）
      content = ensureFrontmatter(transformed, r, firstMeta, schema, documentMeta)
      // 回填真实标题到 record 对象（供 generateTags 使用）
      try {
        const fm = matter(content)
        if (fm.data?.title && !fm.data.title.endsWith('.md')) {
          r.title = fm.data.title
        }
        const resolvedTags = normalizeTagList(fm.data?.tags)
        if (resolvedTags.length) {
          r.tags = resolvedTags
        }
      } catch {}
      fs.writeFileSync(path.join(CONTENT_DIR, 'records', r.filename), content)
      copyCount++
    }
  }
  console.log(`✅ 已处理 ${copyCount} 个记录文件`)
  console.log(`🧪 元数据审计: ${metadataAudit.tagOverrides} 个标签以文档为准，${metadataAudit.titleOverrides} 个标题以文档为准`)
  console.log(`🧪 文档缺失: ${metadataAudit.missingDocumentTags} 个缺少文档标签，${metadataAudit.missingDocumentTitles} 个缺少文档标题`)

  // 复制图片等静态资源文件（保持 data/ 下的相对目录结构）
  const dataDir = path.join(AKASHA_LOCAL, 'data')
  const recordsDestDir = path.join(CONTENT_DIR, 'records')
  let assetCount = copyAssetFiles(dataDir, recordsDestDir)

  // 复制 assets/ 目录下的图片（扁平化子目录结构到 records/）
  // 源 markdown 引用 ../assets/subdir/file.png，fixLinks 转为 ./file.png
  const assetsDir = path.join(AKASHA_LOCAL, 'assets')
  assetCount += copyAssetFilesFlat(assetsDir, recordsDestDir)

  if (assetCount > 0) {
    console.log(`🖼️  已复制 ${assetCount} 个图片/资源文件`)
  }

  // 生成数据和页面
  generateStats(records, tagMeta)
  generateTags(records, tagMeta)
  generatePages(records)

  // 生成 version.json（从 package.json 读取，避免硬编码）
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'))
  fs.writeFileSync(
    path.join(API_DIR, 'version.json'),
    JSON.stringify({ version: packageJson.version }, null, 2)
  )
  console.log(`📌 已生成 version.json (v${packageJson.version})`)

  // 生成 meta-schema.json（Phase 2 新增）
  fs.mkdirSync(API_DIR, { recursive: true })
  fs.writeFileSync(
    path.join(API_DIR, 'meta-schema.json'),
    JSON.stringify({
      fields: schema.fields,
      statuses: schema.statuses,
      emojiMap: schema.emojiMap,
    }, null, 2)
  )
  console.log(`📐 已生成 meta-schema.json`)

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

/**
 * 内容同步脚本
 * 从阿卡西记录 Git 仓库拉取内容到 content/ 目录
 * 并生成统计数据（stats.json、tags.json）供前端组件使用
 * 
 * 用法：node scripts/sync-content.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content')
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')
const API_DIR = path.join(PUBLIC_DIR, 'api')

// 阿卡西记录数据仓库
// 支持通过环境变量 GITHUB_MIRROR 配置镜像前缀（如 https://ghfast.top/）
const GITHUB_MIRROR = process.env.GITHUB_MIRROR || ''
const AKASHA_REPO_ORIGIN = 'https://github.com/KTSAMA001/AgentSkill-Akasha-KT.git'
const AKASHA_REPO = GITHUB_MIRROR
  ? AKASHA_REPO_ORIGIN.replace('https://github.com/', GITHUB_MIRROR)
  : AKASHA_REPO_ORIGIN
const AKASHA_LOCAL = path.join(PROJECT_ROOT, '.akasha-repo')

// ====== 1. 克隆 / 拉取阿卡西记录仓库 ======
function syncRepo() {
  // 自动添加 safe.directory，避免 dubious ownership 错误（服务器 root 用户 + www 目录常见）
  try {
    execSync(`git config --global --add safe.directory "${AKASHA_LOCAL}"`, { stdio: 'pipe' })
  } catch {}

  if (fs.existsSync(path.join(AKASHA_LOCAL, '.git'))) {
    // 每次同步前更新 remote URL（兼容镜像切换）
    try {
      execSync(`git remote set-url origin "${AKASHA_REPO}"`, { cwd: AKASHA_LOCAL, stdio: 'pipe' })
    } catch {}

    console.log(`📥 正在拉取阿卡西记录最新内容...${GITHUB_MIRROR ? '（镜像: ' + GITHUB_MIRROR + '）' : ''}`)
    try {
      // 丢弃本地修改，避免 pull 时冲突
      execSync('git checkout . && git clean -fd', { cwd: AKASHA_LOCAL, stdio: 'pipe' })
      execSync('git pull --ff-only', { cwd: AKASHA_LOCAL, stdio: 'pipe', timeout: 60000 })
      console.log('✅ 拉取完成')
    } catch (e) {
      console.warn(`⚠️ 拉取失败: ${e.stderr?.toString().trim() || e.message}`)
      console.warn('⚠️ 尝试 fetch + reset...')
      try {
        execSync('git fetch origin && git reset --hard origin/main', {
          cwd: AKASHA_LOCAL,
          stdio: 'pipe',
          timeout: 60000,
        })
        console.log('✅ reset 成功')
      } catch (e2) {
        console.warn(`⚠️ 网络同步完全失败: ${e2.stderr?.toString().trim() || e2.message}`)
        console.warn('⚠️ 将使用本地缓存继续...')
      }
    }
  } else {
    console.log(`📦 首次克隆阿卡西记录仓库...${GITHUB_MIRROR ? '（镜像: ' + GITHUB_MIRROR + '）' : ''}`)
    execSync(`git clone --depth 1 ${AKASHA_REPO} "${AKASHA_LOCAL}"`, {
      stdio: 'pipe',
      timeout: 60000,
    })
    console.log('✅ 克隆完成')
  }
}

// ====== 2. 复制数据文件到 content/ ======
function copyContent() {
  const sourceData = path.join(AKASHA_LOCAL, 'data')

  if (!fs.existsSync(sourceData)) {
    console.error('❌ 找不到阿卡西记录 data/ 目录')
    process.exit(1)
  }

  // 清理旧内容
  if (fs.existsSync(CONTENT_DIR)) {
    fs.rmSync(CONTENT_DIR, { recursive: true })
  }

  // 复制三个数据目录
  const dirs = ['experiences', 'knowledge', 'ideas']
  for (const dir of dirs) {
    const src = path.join(sourceData, dir)
    const dest = path.join(CONTENT_DIR, dir)
    if (fs.existsSync(src)) {
      copyDirRecursive(src, dest)
      console.log(`📁 已同步 ${dir}/`)
    }
  }

  // 将 content/ 下的文件同步到项目根目录对应位置（VitePress 需要）
  for (const dir of dirs) {
    const src = path.join(CONTENT_DIR, dir)
    const dest = path.join(PROJECT_ROOT, dir)
    if (fs.existsSync(src)) {
      // 保留 index.md（手写的分类首页）
      const indexFile = path.join(dest, 'index.md')
      let indexContent = null
      if (fs.existsSync(indexFile)) {
        indexContent = fs.readFileSync(indexFile, 'utf-8')
      }

      // 清除旧文件（但保留根目录）
      if (fs.existsSync(dest)) {
        for (const entry of fs.readdirSync(dest, { withFileTypes: true })) {
          if (entry.name === 'index.md') continue
          const p = path.join(dest, entry.name)
          fs.rmSync(p, { recursive: true })
        }
      } else {
        fs.mkdirSync(dest, { recursive: true })
      }

      // 复制内容文件
      copyDirRecursive(src, dest, true)

      // 恢复 index.md
      if (indexContent) {
        fs.writeFileSync(indexFile, indexContent)
      }

      // 递归为没有 index.md 的子目录生成默认索引页，解决 Nginx 403 问题
      generateMissingIndexesRecursive(dest)
    }
  }

  console.log('✅ 内容同步完成')
}

/**
 * 递归复制目录
 */
function copyDirRecursive(src, dest, skipIndex = false) {
  fs.mkdirSync(dest, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    // 跳过隐藏文件和 .DS_Store
    if (entry.name.startsWith('.')) continue
    if (skipIndex && entry.name === 'index.md') continue

    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, skipIndex)
    } else {
      // 复制文件，修正内部链接路径
      let content = fs.readFileSync(srcPath, 'utf-8')
      content = fixMarkdownLinks(content)
      content = ensureFrontmatter(content, entry.name)
      fs.writeFileSync(destPath, content)
    }
  }
}

/**
 * 递归检查目录，如果缺少 index.md 则自动生成
 * 为了解决 Nginx 无法访问无 index.html 目录的问题
 */
function generateMissingIndexesRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const hasIndex = entries.some(e => e.name === 'index.md')

  if (!hasIndex) {
    const dirName = path.basename(dirPath)
    // 首字母大写
    const title = dirName.charAt(0).toUpperCase() + dirName.slice(1)
    
    const links = entries
      .filter(e => e.isFile() && e.name.endsWith('.md') && e.name !== 'index.md')
      .map(e => {
         const name = e.name.replace(/\.md$/, '')
         return `- [${name}](./${name})` 
      })
      .join('\n')

    const content = `---\ntitle: ${title}\n---\n\n# ${title}\n\n> 🤖 自动生成的目录页\n\n${links || '*暂无文档*'}\n`
    
    const indexFile = path.join(dirPath, 'index.md')
    fs.writeFileSync(indexFile, content)
    console.log(`P  +Auto-Index: ${path.relative(CONTENT_DIR, indexFile)}`)
  }

  // 递归处理子目录
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      generateMissingIndexesRecursive(path.join(dirPath, entry.name))
    }
  }
}


/**
 * 确保 Markdown 文件有合法的 frontmatter
 * 阿卡西记录中部分文件以 --- 开头但内容不是合法 YAML，会导致 VitePress 解析失败
 */
function ensureFrontmatter(content, fileName) {
  const trimmed = content.trimStart()

  if (trimmed.startsWith('---')) {
    // 检查是否是合法的 frontmatter（第二个 --- 之前应该是纯 YAML）
    const secondDash = trimmed.indexOf('---', 3)
    if (secondDash === -1) {
      // 只有一个 ---，不是 frontmatter，是分隔线
      // 在文件开头添加空 frontmatter 避免解析器混淆
      const title = fileName.replace(/\.md$/, '').replace(/[-_]/g, ' ')
      return `---\ntitle: "${title}"\n---\n\n${content}`
    }

    // 提取 frontmatter 内容检测是否合法
    const fmContent = trimmed.substring(3, secondDash).trim()
    if (fmContent.includes('**') || fmContent.includes('##') || fmContent.includes('|')) {
      // 内容不是 YAML（包含 Markdown 语法），添加正确的 frontmatter
      const title = fileName.replace(/\.md$/, '').replace(/[-_]/g, ' ')
      return `---\ntitle: "${title}"\n---\n\n${content}`
    }
  }

  return content
}

/**
 * 修正 Markdown 中的相对链接
 * 阿卡西记录中使用 ../../knowledge/ 等路径，需要修正为网站路径
 */
function fixMarkdownLinks(content) {
  // 修正 knowledge/experiences/ideas 的交叉引用路径
  // 例如 ../../knowledge/unity/physics.md → /knowledge/unity/physics
  content = content.replace(
    /\]\((?:\.\.\/)*(?:\.\.\/)(experiences|knowledge|ideas)\//g,
    '](/$1/'
  )

  // 移除 .md 扩展名（VitePress cleanUrls）
  content = content.replace(
    /\]\(([^)]+)\.md(#[^)]*)??\)/g,
    (match, p, hash) => `](${p}${hash || ''})`
  )

  // 转义代码块外的尖括号（泛型如 <T> 会被 Vue 当作 HTML 标签）
  content = escapeAngleBrackets(content)

  return content
}

/**
 * 转义 Markdown 正文中的尖括号，避免 Vue 将 C# 泛型语法当作 HTML 标签
 * 仅处理代码块（```...```）和行内代码（`...`）外的内容
 */
function escapeAngleBrackets(content) {
  const lines = content.split('\n')
  let inCodeBlock = false
  const result = []

  for (const line of lines) {
    // 检测代码块边界
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      result.push(line)
      continue
    }

    if (inCodeBlock) {
      result.push(line)
      continue
    }

    // 在非代码块行中，转义行内代码外的 <> 
    // 保留已有的 HTML 标签（如 <br>、<details> 等常见标签）
    let processed = ''
    let inInlineCode = false
    let i = 0

    while (i < line.length) {
      if (line[i] === '`') {
        inInlineCode = !inInlineCode
        processed += line[i]
        i++
        continue
      }

      if (!inInlineCode && line[i] === '<') {
        // 检查是否为常见 HTML 标签 或已知安全标签
        const rest = line.slice(i)
        const htmlTagMatch = rest.match(/^<\/?(br|hr|details|summary|sup|sub|kbd|mark|abbr|img|a |div|span|p|table|thead|tbody|tr|th|td|ul|ol|li|em|strong|code|pre|blockquote|h[1-6]|!--)[\s>/]/)
        if (htmlTagMatch) {
          // 保留合法 HTML 标签
          const closeIdx = rest.indexOf('>')
          if (closeIdx !== -1) {
            processed += rest.slice(0, closeIdx + 1)
            i += closeIdx + 1
            continue
          }
        }
        // 非 HTML 标签的 < 转义
        processed += '&lt;'
        i++
        continue
      }

      if (!inInlineCode && line[i] === '>' && i > 0 && processed.endsWith(';')) {
        // 在 &lt; 之后的 > 也需要转义
        // 但要注意如果前面是 &lt; 才转义
      }

      processed += line[i]
      i++
    }

    result.push(processed)
  }

  return result.join('\n')
}

// ====== 3. 生成统计数据 ======
function generateStats() {
  fs.mkdirSync(API_DIR, { recursive: true })

  const stats = {
    stats: [],
    recent: [],
  }

  // 统计各分类文件数
  const sections = [
    { dir: 'experiences', label: '经验记录', icon: '📝', color: '#7c3aed' },
    { dir: 'knowledge', label: '知识文档', icon: '📚', color: '#2563eb' },
    { dir: 'ideas', label: '灵感火花', icon: '💡', color: '#f59e0b' },
  ]

  for (const section of sections) {
    const dirPath = path.join(CONTENT_DIR, section.dir)
    const count = countMdFiles(dirPath)
    stats.stats.push({
      label: section.label,
      count,
      icon: section.icon,
      link: `/${section.dir}/`,
      color: section.color,
    })
  }

  // 获取最近更新的文件（通过 git log）
  try {
    const gitLog = execSync(
      'git log --format="%H|%ai|%s" --name-only -50',
      { cwd: AKASHA_LOCAL, encoding: 'utf-8' }
    )

    const recentFiles = new Map()
    let currentCommit = null

    for (const line of gitLog.split('\n')) {
      if (line.includes('|')) {
        const parts = line.split('|')
        currentCommit = {
          date: parts[1]?.trim().slice(0, 10) || '',
          message: parts[2]?.trim() || '',
        }
      } else if (line.startsWith('data/') && line.endsWith('.md') && currentCommit) {
        if (!recentFiles.has(line)) {
          recentFiles.set(line, currentCommit)
        }
      }
    }

    // 取前 10 个最近更新
    let count = 0
    for (const [filePath, commit] of recentFiles) {
      if (count >= 10) break

      // data/experiences/unity/csharp.md → /experiences/unity/csharp
      const webPath = filePath
        .replace(/^data\//, '/')
        .replace(/\.md$/, '')

      // 提取分类
      const parts = webPath.split('/')
      const category = parts[1] || ''

      // 提取标题
      const fullPath = path.join(AKASHA_LOCAL, filePath)
      let title = path.basename(filePath, '.md')
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const match = content.match(/^##?\s+(.+)$/m)
        if (match) title = match[1].trim()
      } catch { /* ignore */ }

      stats.recent.push({
        title,
        link: webPath,
        category: sections.find(s => s.dir === category)?.label || category,
        date: commit.date,
      })

      count++
    }
  } catch (e) {
    console.warn('⚠️ 无法获取 git 历史:', e.message)
  }

  fs.writeFileSync(
    path.join(API_DIR, 'stats.json'),
    JSON.stringify(stats, null, 2)
  )
  console.log('📊 统计数据已生成')
}

// ====== 4. 生成标签数据 ======
function generateTags() {
  const tagMap = new Map()

  function scanTags(dirPath) {
    if (!fs.existsSync(dirPath)) return

    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        scanTags(fullPath)
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          // 匹配各种标签格式
          // 格式1: `标签` 在表格中
          // 格式2: **标签**：xxx, xxx
          // 格式3: tags: [xxx, xxx]
          const tagPatterns = [
            /\*\*标签\*\*[：:]\s*(.+)/g,
            /\|\s*标签\s*\|\s*(.+?)\s*\|/g,
            /tags?[：:]\s*\[?([^\]\n]+)/gi,
          ]

          for (const pattern of tagPatterns) {
            let match
            while ((match = pattern.exec(content)) !== null) {
              const tagStr = match[1]
              // 按逗号/空格/中文逗号分割
              const tags = tagStr.split(/[,，、\s|]+/)
                .map(t => t.replace(/[`\[\]#*]/g, '').trim())
                .filter(t => t.length > 0 && t.length < 20)

              for (const tag of tags) {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
              }
            }
          }
        } catch { /* ignore */ }
      }
    }
  }

  scanTags(CONTENT_DIR)

  // 按数量排序
  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50) // 最多 50 个标签

  fs.writeFileSync(
    path.join(API_DIR, 'tags.json'),
    JSON.stringify(tags, null, 2)
  )
  console.log(`🏷️ 标签数据已生成（${tags.length} 个标签）`)
}

/**
 * 递归统计 .md 文件数量
 */
function countMdFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return 0
  let count = 0
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) count += countMdFiles(fullPath)
    else if (entry.name.endsWith('.md')) count++
  }
  return count
}

// ====== 主流程 ======
console.log('🌀 阿卡西记录内容同步开始...\n')

try {
  syncRepo()
  copyContent()
  generateStats()
  generateTags()
  console.log('\n✨ 全部完成！')
} catch (error) {
  console.error('❌ 同步失败:', error.message)
  process.exit(1)
}

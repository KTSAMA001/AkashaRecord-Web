/**
 * 自动从 content/ 目录结构生成 VitePress 侧边栏配置
 * 支持经验(experiences)、知识(knowledge)、灵感(ideas) 三大分类
 * 
 * 分类名自动从目录下 index.md 的 frontmatter title 或 h1 标题推断，
 * 仅对无法自动推断的特殊名称（缩写、顶级分类 emoji）保留硬编码映射。
 */

import fs from 'node:fs'
import path from 'node:path'

// 仅保留无法从 index.md 自动推断的特殊映射
// - 顶级分类带 emoji 前缀
// - 技术缩写（全大写 / 特殊符号）目录名无法通过首字母大写还原
const SPECIAL_LABELS: Record<string, string> = {
  experiences: '📝 经验',
  knowledge: '📚 知识',
  ideas: '💡 灵感',
  ai: 'AI',
  csharp: 'C#',
  hlsl: 'HLSL',
  vscode: 'VS Code',
}

/**
 * 获取分类的显示名称
 * 优先级：特殊映射 → index.md 标题 → 目录名美化
 */
function getCategoryLabel(dirName: string, dirPath?: string): string {
  // 1. 特殊映射（顶级分类、缩写等）
  if (SPECIAL_LABELS[dirName]) return SPECIAL_LABELS[dirName]

  // 2. 从目录下的 index.md 读取标题
  if (dirPath) {
    const indexFile = path.join(dirPath, 'index.md')
    if (fs.existsSync(indexFile)) {
      try {
        const content = fs.readFileSync(indexFile, 'utf-8')
        // frontmatter title
        const fmMatch = content.match(/^---[\s\S]*?title:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/m)
        if (fmMatch) {
          const title = fmMatch[1].trim()
          // 排除自动生成的首字母大写目录名（和 fallback 一样），优先用有意义的中文标题
          if (title !== dirName.charAt(0).toUpperCase() + dirName.slice(1)) {
            return title
          }
        }
        // h1 标题
        const h1Match = content.match(/^#\s+(.+)$/m)
        if (h1Match) return h1Match[1].trim()
      } catch { /* ignore */ }
    }
  }

  // 3. 回退：目录名美化（连字符/下划线 → 空格，首字母大写）
  return dirName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * 从 Markdown 文件提取标题（取第一个 # 标题，回退到文件名）
 */
function getFileTitle(filePath: string, fileName: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    // 优先匹配 # 一级标题
    const h1Match = content.match(/^#\s+(.+)$/m)
    if (h1Match) return h1Match[1].trim()
    // 其次匹配 ## 二级标题
    const h2Match = content.match(/^##\s+(.+)$/m)
    if (h2Match) return h2Match[1].trim()
  } catch { /* 读取失败时用文件名 */ }

  // 回退：文件名去扩展名，美化
  return fileName
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

/**
 * 扫描目录生成侧边栏项
 */
function scanDirectory(dirPath: string, basePath: string): SidebarItem[] {
  if (!fs.existsSync(dirPath)) return []

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.') && !e.name.startsWith('_'))
    .sort((a, b) => {
      // 目录排前面
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

  const items: SidebarItem[] = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      const children = scanDirectory(fullPath, `${basePath}/${entry.name}`)
      if (children.length > 0) {
        items.push({
          text: getCategoryLabel(entry.name, fullPath),
          collapsed: true,
          items: children,
        })
      }
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      const linkPath = `${basePath}/${entry.name.replace(/\.md$/, '')}`
      items.push({
        text: getFileTitle(fullPath, entry.name),
        link: linkPath,
      })
    }
  }

  return items
}

/**
 * 生成完整的侧边栏配置
 */
export function generateSidebar(contentDir: string): Record<string, SidebarItem[]> {
  const sidebar: Record<string, SidebarItem[]> = {}

  const topDirs = ['experiences', 'knowledge', 'ideas']

  for (const dir of topDirs) {
    const dirPath = path.join(contentDir, dir)
    if (!fs.existsSync(dirPath)) continue

    const items = scanDirectory(dirPath, `/${dir}`)
    if (items.length > 0) {
      sidebar[`/${dir}/`] = [
        {
          text: getCategoryLabel(dir, dirPath),
          items,
        },
      ]
    }
  }

  return sidebar
}

/**
 * 生成导航栏配置
 */
export function generateNav(contentDir: string) {
  const nav = [{ text: '首页', link: '/' }]

  const sections = [
    { dir: 'experiences', label: '📝 经验' },
    { dir: 'knowledge', label: '📚 知识' },
    { dir: 'ideas', label: '💡 灵感' },
  ]

  for (const { dir, label } of sections) {
    const dirPath = path.join(contentDir, dir)
    if (fs.existsSync(dirPath)) {
      nav.push({ text: label, link: `/${dir}/` })
    }
  }

  return nav
}

/**
 * 统计内容文件数量
 */
export function countFiles(contentDir: string): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const dir of ['experiences', 'knowledge', 'ideas']) {
    const dirPath = path.join(contentDir, dir)
    if (!fs.existsSync(dirPath)) {
      counts[dir] = 0
      continue
    }
    let count = 0
    const walk = (p: string) => {
      for (const e of fs.readdirSync(p, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(p, e.name))
        else if (e.name.endsWith('.md')) count++
      }
    }
    walk(dirPath)
    counts[dir] = count
  }

  return counts
}

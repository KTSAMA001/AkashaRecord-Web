/**
 * 自动从 content/ 目录结构生成 VitePress 侧边栏配置
 * 支持经验(experiences)、知识(knowledge)、灵感(ideas) 三大分类
 */

import fs from 'node:fs'
import path from 'node:path'

// 分类中文映射
const CATEGORY_LABELS: Record<string, string> = {
  // 顶级分类
  experiences: '📝 经验',
  knowledge: '📚 知识',
  ideas: '💡 灵感',
  // 子分类
  ai: 'AI',
  anthropic: 'Anthropic',
  csharp: 'C#',
  general: '通用',
  git: 'Git',
  python: 'Python',
  shader: 'Shader',
  tools: '工具',
  unity: 'Unity',
  vscode: 'VS Code',
  graphics: '图形学',
  hlsl: 'HLSL',
  programming: '编程',
  social: '社交',
  'warm-daily': '温暖日常',
  smart_furniture: '智能家居',
}

/**
 * 获取分类的显示名称
 */
function getCategoryLabel(dirName: string): string {
  return CATEGORY_LABELS[dirName] || dirName.charAt(0).toUpperCase() + dirName.slice(1)
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
          text: getCategoryLabel(entry.name),
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
          text: getCategoryLabel(dir),
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

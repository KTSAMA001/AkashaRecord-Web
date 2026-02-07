/**
 * 自动从 records/ 目录 + frontmatter tags 生成 VitePress 侧边栏
 * 按首个 domain 标签分组，组内按字母排序
 * 标签名称完全动态读取，无硬编码映射
 */

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

/**
 * 从 Markdown 文件提取标题（取 frontmatter title 或第一个 # 标题，回退到文件名）
 */
function getFileTitle(filePath: string, fileName: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed = matter(content)
    if (parsed.data.title) return parsed.data.title
    const h1Match = parsed.content.match(/^#\s+(.+)$/m)
    if (h1Match) return h1Match[1].trim()
  } catch { /* ignore */ }

  return fileName
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * 生成完整的侧边栏配置
 * 扫描 records/ 目录，读取每个文件的 tags，按首个标签分组
 * 使用 tag-meta.json 将标签 key 转为中文显示名
 */
export function generateSidebar(contentDir: string): Record<string, SidebarItem[]> {
  const recordsDir = path.join(contentDir, 'records')
  if (!fs.existsSync(recordsDir)) return {}

  // 读取标签元数据（构建时从 public/api/tag-meta.json 获取）
  let tagMeta: Record<string, { label: string; icon: string }> = {}
  const metaPath = path.resolve(contentDir, '..', 'public', 'api', 'tag-meta.json')
  try {
    if (fs.existsSync(metaPath)) {
      tagMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    }
  } catch { /* 回退到原始 key */ }

  // 按 domain tag 分组
  const groups = new Map<string, SidebarItem[]>()

  const files = fs.readdirSync(recordsDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort()

  for (const file of files) {
    const filePath = path.join(recordsDir, file)
    let domain = 'Other'
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const parsed = matter(content)
      const tags: string[] = parsed.data.tags || []
      if (tags.length > 0) {
        domain = tags[0]
      }
    } catch { /* ignore */ }

    if (!groups.has(domain)) {
      groups.set(domain, [])
    }

    groups.get(domain)!.push({
      text: getFileTitle(filePath, file),
      link: `/records/${file.replace(/\.md$/, '')}`,
    })
  }

  // 转为侧边栏结构，按组排序
  const sidebarItems: SidebarItem[] = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domain, items]) => ({
      text: tagMeta[domain]?.label || domain,
      collapsed: true,
      items: items.sort((a, b) => a.text.localeCompare(b.text)),
    }))

  return {
    '/records/': sidebarItems,
  }
}

/**
 * 生成导航栏配置
 */
export function generateNav(_contentDir: string) {
  return [
    { text: '首页', link: '/' },
    { text: '记录终端', link: '/records/' },
    { text: '标签索引', link: '/tags/' },
  ]
}

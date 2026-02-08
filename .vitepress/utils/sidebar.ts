/**
 * 侧边栏配置
 * 记录页面已有完整的 RecordsBrowser（标签筛选 + 搜索），
 * 不再需要侧边栏导航，返回空配置以隐藏侧边栏。
 * 单篇文章页保留右侧目录大纲（outline）即可。
 */

/**
 * 生成侧边栏配置（当前为空——记录页由 RecordsBrowser 承载导航）
 */
export function generateSidebar(_contentDir: string): Record<string, never[]> {
  return {}
}

/**
 * 生成导航栏配置
 */
export function generateNav() {
  return [
    { text: '首页', link: '/' },
    { text: '记录终端', link: '/records/' },
  ]
}

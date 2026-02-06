import { defineConfig } from 'vitepress'
import { generateSidebar, generateNav } from './utils/sidebar'
import path from 'node:path'

const contentDir = path.resolve(__dirname, '../content')

export default defineConfig({
  // 站点基础信息
  title: '阿卡西记录',
  description: 'KT 的知识与经验记忆中枢',
  lang: 'zh-CN',

  // 内容目录（相对于项目根目录）
  srcDir: '.',
  
  // 主题配置
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: '阿卡西记录',

    // 导航栏
    nav: generateNav(contentDir),

    // 侧边栏（自动生成）
    sidebar: generateSidebar(contentDir),

    // 本地搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索',
          },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除',
            backButtonTitle: '返回',
            noResultsText: '没有找到相关结果',
            footer: {
              selectText: '选择',
              navigateText: '导航',
              closeText: '关闭',
            },
          },
        },
      },
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/KTSAMA001/AgentSkill-Akasha-KT' },
    ],

    // 页面底部导航
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    // 大纲
    outline: {
      label: '目录',
      level: [2, 3],
    },

    // 最后更新
    lastUpdated: {
      text: '最后更新',
    },

    // 页脚
    footer: {
      message: '阿卡西记录 - 知识与经验的智能记忆中枢',
      copyright: '© 2024-2026 KT',
    },

    // 返回顶部
    returnToTopLabel: '返回顶部',

    // 浅色/深色模式
    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换到深色模式',
    lightModeSwitchTitle: '切换到浅色模式',
  },

  // Markdown 配置
  markdown: {
    lineNumbers: true,
    // 支持数学公式
    math: true,
  },

  // Head
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#7c3aed' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
  ],

  // 最后更新时间
  lastUpdated: true,

  // 忽略死链（阿卡西记录内部交叉引用可能指向未同步的路径）
  ignoreDeadLinks: true,

  // 清理 URL
  cleanUrls: true,
})

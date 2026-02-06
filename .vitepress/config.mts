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
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.659-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" fill="currentColor"/></svg>'
        },
        link: 'https://space.bilibili.com/12822357'
      },
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
    // Mermaid 图表支持：将 ```mermaid 代码块转为 <MermaidRenderer> 组件
    config: (md) => {
      const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules)
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          const encoded = Buffer.from(token.content.trim()).toString('base64')
          return `<MermaidRenderer encoded="${encoded}" />\n`
        }
        return defaultFence(tokens, idx, options, env, self)
      }
    },
  },

  // Head
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['meta', { name: 'theme-color', content: '#FF6B2B' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
  ],

  // 最后更新时间
  lastUpdated: true,

  // 忽略死链（阿卡西记录内部交叉引用可能指向未同步的路径）
  ignoreDeadLinks: true,

  // 清理 URL
  cleanUrls: true,
})


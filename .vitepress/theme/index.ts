/**
 * 自定义主题入口
 * 扩展默认 VitePress 主题，注入自定义组件
 */
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import Dashboard from './components/Dashboard.vue'
import RecordsBrowser from './components/RecordsBrowser.vue'
import StatusBadge from './components/StatusBadge.vue'
import Mermaid from './components/Mermaid.vue'
import MermaidRenderer from './components/MermaidRenderer.vue'
import CategoryGrid from './components/CategoryGrid.vue'
import ThemePicker from './components/ThemePicker.vue'
import HeroEnhance from './components/HeroEnhance.vue'
import NProgress from 'nprogress'
import './styles/custom.css'
import './styles/nprogress.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(ThemePicker),
      'home-hero-info-after': () => h(HeroEnhance),
    })
  },
  enhanceApp({ app, router }) {
    // 注册全局组件，可在 Markdown 中直接使用
    app.component('Dashboard', Dashboard)
    app.component('RecordsBrowser', RecordsBrowser)
    app.component('StatusBadge', StatusBadge)
    app.component('Mermaid', Mermaid)
    app.component('MermaidRenderer', MermaidRenderer)
    app.component('CategoryGrid', CategoryGrid)

    // NProgress 路由进度条
    if (typeof window !== 'undefined') {
      NProgress.configure({ showSpinner: false, trickleSpeed: 100 })

      router.onBeforeRouteChange = () => { NProgress.start() }
      router.onAfterRouteChanged = () => {
        NProgress.done()
      }
    }
  },
} satisfies Theme

/**
 * 自定义主题入口
 * 扩展默认 VitePress 主题，注入自定义组件
 */
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Dashboard from './components/Dashboard.vue'
import TagCloud from './components/TagCloud.vue'
import StatusBadge from './components/StatusBadge.vue'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 注册全局组件，可在 Markdown 中直接使用
    app.component('Dashboard', Dashboard)
    app.component('TagCloud', TagCloud)
    app.component('StatusBadge', StatusBadge)
  },
} satisfies Theme

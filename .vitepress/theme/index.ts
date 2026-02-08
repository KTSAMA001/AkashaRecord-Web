/**
 * 自定义主题入口
 * 扩展默认 VitePress 主题，注入自定义组件
 */
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import Dashboard from './components/Dashboard.vue'
import RecordsBrowser from './components/RecordsBrowser.vue'
import TagCloud from './components/TagCloud.vue'
import StatusBadge from './components/StatusBadge.vue'
import Mermaid from './components/Mermaid.vue'
import MermaidRenderer from './components/MermaidRenderer.vue'
import CategoryGrid from './components/CategoryGrid.vue'
import ThemePicker from './components/ThemePicker.vue'
import NProgress from 'nprogress'
import './styles/custom.css'
import './styles/nprogress.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 在导航栏右侧（暗色模式开关之前）注入主题色选择器
      'nav-bar-content-after': () => h(ThemePicker),
    })
  },
  enhanceApp({ app, router }) {
    // 注册全局组件，可在 Markdown 中直接使用
    app.component('Dashboard', Dashboard)
    app.component('RecordsBrowser', RecordsBrowser)
    app.component('TagCloud', TagCloud)
    app.component('StatusBadge', StatusBadge)
    app.component('Mermaid', Mermaid)
    app.component('MermaidRenderer', MermaidRenderer)
    app.component('CategoryGrid', CategoryGrid)

    // NProgress 路由进度条 + VPFeature 图标着色
    if (typeof window !== 'undefined') {
      NProgress.configure({ showSpinner: false, trickleSpeed: 100 })

      // VPFeature 的 <img> 无法通过模板修改，用 mask-image 实现主题色着色
      const maskFeatureIcons = () => {
        requestAnimationFrame(() => {
          document.querySelectorAll<HTMLImageElement>('.VPFeature .VPImage').forEach(img => {
            const src = img.getAttribute('src')
            if (src && !img.dataset.masked) {
              img.style.setProperty('-webkit-mask-image', `url(${src})`)
              img.style.setProperty('mask-image', `url(${src})`)
              img.dataset.masked = '1'
            }
          })
        })
      }

      router.onBeforeRouteChange = () => { NProgress.start() }
      router.onAfterRouteChanged = () => {
        NProgress.done()
        maskFeatureIcons()
      }

      // 首次加载也需要处理
      if (document.readyState === 'complete') {
        maskFeatureIcons()
      } else {
        window.addEventListener('load', maskFeatureIcons)
      }
    }
  },
} satisfies Theme

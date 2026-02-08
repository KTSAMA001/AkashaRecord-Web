<script setup lang="ts">
/**
 * 主题色选择器
 * 预设工业风配色方案，通过 CSS 变量动态切换全站主题色
 * 持久化到 localStorage
 */
import { ref, onMounted, watch } from 'vue'

interface ThemePreset {
  name: string
  /** 亮色模式主色 */
  light: string
  /** 暗色模式主色（通常稍亮） */
  dark: string
  /** 亮色模式辅色（用于渐变） */
  lightAux: string
  /** 暗色模式辅色 */
  darkAux: string
}

const STORAGE_KEY = 'ak-theme-color'

const presets: ThemePreset[] = [
  { name: '琥珀', light: '#FF6B2B', dark: '#FF8A50', lightAux: '#F49F0A', darkAux: '#FBBF24' },
  { name: '青蓝', light: '#0EA5E9', dark: '#38BDF8', lightAux: '#06B6D4', darkAux: '#67E8F9' },
  { name: '翡翠', light: '#10B981', dark: '#34D399', lightAux: '#14B8A6', darkAux: '#5EEAD4' },
  { name: '紫晶', light: '#8B5CF6', dark: '#A78BFA', lightAux: '#7C3AED', darkAux: '#C4B5FD' },
  { name: '赤红', light: '#EF4444', dark: '#F87171', lightAux: '#F59E0B', darkAux: '#FCD34D' },
  { name: '钴蓝', light: '#3B82F6', dark: '#60A5FA', lightAux: '#6366F1', darkAux: '#818CF8' },
]

const activeIndex = ref(0)
const open = ref(false)

/**
 * 从 HEX 颜色生成派生变量（dim / soft / brand 系列 / grid-color）
 */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const f = 1 - amount
  const dr = Math.round(r * f)
  const dg = Math.round(g * f)
  const db = Math.round(b * f)
  return `#${((1 << 24) + (dr << 16) + (dg << 8) + db).toString(16).slice(1)}`
}

function applyTheme(index: number) {
  if (typeof document === 'undefined') return
  const preset = presets[index]
  const root = document.documentElement
  const isDark = root.classList.contains('dark')
  const main = isDark ? preset.dark : preset.light
  const aux = isDark ? preset.darkAux : preset.lightAux
  const [r, g, b] = hexToRgb(main)

  // 核心主题变量
  root.style.setProperty('--ak-accent', main)
  root.style.setProperty('--ak-accent-dim', `rgba(${r}, ${g}, ${b}, ${isDark ? 0.2 : 0.25})`)
  root.style.setProperty('--ak-grid-color', `rgba(${r}, ${g}, ${b}, 0.06)`)

  // VitePress 品牌变量
  root.style.setProperty('--vp-c-brand-1', main)
  root.style.setProperty('--vp-c-brand-2', darken(main, 0.1))
  root.style.setProperty('--vp-c-brand-3', darken(main, 0.2))
  root.style.setProperty('--vp-c-brand-soft', `rgba(${r}, ${g}, ${b}, 0.12)`)

  // 按钮品牌色
  root.style.setProperty('--vp-button-brand-bg', main)
  root.style.setProperty('--vp-button-brand-hover-bg', darken(main, 0.1))
  root.style.setProperty('--vp-button-brand-active-bg', darken(main, 0.2))

  // Hero 渐变
  root.style.setProperty('--vp-home-hero-name-background',
    `-webkit-linear-gradient(120deg, ${main} 30%, ${aux} 70%)`)
  root.style.setProperty('--vp-home-hero-image-background-image',
    `linear-gradient(-45deg, ${main} 50%, ${aux} 50%)`)

  // h1 标题渐变
  root.style.setProperty('--ak-h1-gradient', `linear-gradient(120deg, ${main}, ${aux})`)

}

function selectTheme(index: number) {
  activeIndex.value = index
  localStorage.setItem(STORAGE_KEY, String(index))
  applyTheme(index)
  open.value = false
}

onMounted(() => {
  // 恢复持久化选择
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) {
    const idx = parseInt(saved, 10)
    if (idx >= 0 && idx < presets.length) {
      activeIndex.value = idx
    }
  }
  applyTheme(activeIndex.value)

  // 监听暗色模式切换，重新应用当前主题色
  const observer = new MutationObserver(() => {
    applyTheme(activeIndex.value)
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

// 点击外部关闭面板
function onClickOutside(e: Event) {
  const target = e.target as HTMLElement
  if (!target.closest('.theme-picker')) {
    open.value = false
  }
}

watch(open, (val) => {
  if (val) {
    document.addEventListener('click', onClickOutside, true)
  } else {
    document.removeEventListener('click', onClickOutside, true)
  }
})
</script>

<template>
  <div class="theme-picker">
    <button
      class="theme-trigger"
      :title="`主题色: ${presets[activeIndex].name}`"
      @click.stop="open = !open"
    >
      <span class="trigger-dot" :style="{ background: presets[activeIndex].light }"></span>
    </button>
    <Transition name="picker-fade">
      <div v-if="open" class="theme-panel">
        <span class="panel-label">// THEME_COLOR</span>
        <div class="preset-grid">
          <button
            v-for="(preset, i) in presets"
            :key="preset.name"
            class="preset-btn"
            :class="{ active: activeIndex === i }"
            :title="preset.name"
            @click="selectTheme(i)"
          >
            <span class="preset-swatch" :style="{ background: preset.light }"></span>
            <span class="preset-name">{{ preset.name }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-picker {
  position: relative;
  display: flex;
  align-items: center;
}

.theme-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  border-radius: 0;
}

.trigger-dot {
  width: 14px;
  height: 14px;
  clip-path: polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px));
  transition: background 0.3s, box-shadow 0.3s;
  box-shadow: 0 0 6px var(--ak-accent-dim);
}

.theme-trigger:hover .trigger-dot {
  box-shadow: 0 0 12px var(--ak-accent);
}

.theme-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  z-index: 100;
  min-width: 180px;
}

.panel-label {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  color: var(--ak-accent);
  letter-spacing: 0.12em;
  opacity: 0.6;
  margin-bottom: 0.5rem;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  transition: all 0.2s;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
}

.preset-btn:hover {
  background: var(--vp-c-bg-mute);
  border-color: var(--vp-c-border);
}

.preset-btn.active {
  border-color: var(--ak-accent);
  background: var(--vp-c-bg-mute);
}

.preset-swatch {
  width: 20px;
  height: 20px;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
  transition: transform 0.2s, box-shadow 0.2s;
}

.preset-btn:hover .preset-swatch {
  transform: scale(1.15);
}

.preset-btn.active .preset-swatch {
  box-shadow: 0 0 8px currentColor;
}

.preset-name {
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  letter-spacing: 0.05em;
}

.preset-btn.active .preset-name {
  color: var(--ak-accent);
}

/* 过渡动画 */
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

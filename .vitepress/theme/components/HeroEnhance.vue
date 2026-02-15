<script setup lang="ts">
/**
 * Hero 区增强组件
 * 注入到 home-hero-info-after slot，添加终端风格装饰行与滚动指示器
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 版本号（动态获取）
const version = ref('...')

// 装饰性终端行（逐行 fade-in）
const terminalLines = computed(() => [
  '> CLASSIFICATION: OPEN_ACCESS',
  `> SYSTEM: AKASHA_RECORD ${version.value}`,
  '> STATUS: OPERATIONAL',
])

// 控制入场动画
const visible = ref(false)

// SCROLL 指示器可见性（滚动后隐藏）
const showScroll = ref(true)
let scrollHandler: (() => void) | null = null

onMounted(async () => {
  // 获取版本号
  try {
    const res = await fetch('/api/version.json')
    if (res.ok) {
      const json = await res.json()
      version.value = `v${json.version}`
    }
  } catch {
    version.value = 'v?'
  }

  // 延迟触发入场动画
  requestAnimationFrame(() => {
    visible.value = true
  })

  // 滚动后隐藏 SCROLL 指示器
  scrollHandler = () => {
    showScroll.value = window.scrollY < 100
  }
  window.addEventListener('scroll', scrollHandler, { passive: true })
})

onUnmounted(() => {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<template>
  <div class="hero-enhance" :class="{ 'is-visible': visible }">
    <!-- 终端装饰行 -->
    <div class="terminal-lines">
      <div
        v-for="(line, i) in terminalLines"
        :key="i"
        class="terminal-line"
        :style="{ '--line-delay': `${0.8 + i * 0.25}s` }"
      >
        {{ line }}
      </div>
    </div>

    <!-- SCROLL 指示器 -->
    <Transition name="scroll-fade">
      <div v-if="showScroll" class="scroll-indicator">
        <span class="scroll-text">SCROLL</span>
        <span class="scroll-arrow">▼</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hero-enhance {
  width: 100%;
  position: relative;
}

/* ======= 终端装饰行 ======= */
.terminal-lines {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.terminal-line {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: var(--ak-accent);
  opacity: 0;
  transform: translateY(8px);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.is-visible .terminal-line {
  animation: terminalFadeIn 0.5s ease forwards;
  animation-delay: var(--line-delay);
}

@keyframes terminalFadeIn {
  to {
    opacity: 0.5;
    transform: translateY(0);
  }
}

/* ======= SCROLL 指示器 ======= */
.scroll-indicator {
  position: absolute;
  bottom: -4rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
  pointer-events: none;
}

.scroll-text {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.35em;
  color: var(--ak-accent);
  opacity: 0.4;
}

.scroll-arrow {
  font-size: 0.7rem;
  color: var(--ak-accent);
  opacity: 0.4;
  animation: scrollBounce 2s ease-in-out infinite;
}

@keyframes scrollBounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(6px); opacity: 0.7; }
}

/* SCROLL 淡出过渡 */
.scroll-fade-enter-active,
.scroll-fade-leave-active {
  transition: opacity 0.4s ease;
}
.scroll-fade-enter-from,
.scroll-fade-leave-to {
  opacity: 0;
}

/* ======= 响应式 ======= */
@media (max-width: 640px) {
  .terminal-lines {
    margin-top: 1rem;
  }
  .terminal-line {
    font-size: 0.65rem;
  }
  .scroll-indicator {
    display: none;
  }
}
</style>

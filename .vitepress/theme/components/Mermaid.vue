<script setup lang="ts">
/**
 * Mermaid 客户端渲染组件
 * 在浏览器端将 mermaid 代码块渲染为 SVG 图表
 */
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{ code: string }>()
const container = ref<HTMLElement>()
const svg = ref('')

onMounted(async () => {
  const mermaid = (await import('mermaid')).default
  mermaid.initialize({
    startOnLoad: false,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
  })
  await render(mermaid)

  // 监听主题切换
  const observer = new MutationObserver(async () => {
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
    })
    await render(mermaid)
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

async function render(mermaid: any) {
  if (!props.code) return
  try {
    const id = `mermaid-${Date.now()}`
    const { svg: rendered } = await mermaid.render(id, props.code)
    svg.value = rendered
  } catch (e) {
    svg.value = `<pre style="color:red">Mermaid 渲染失败: ${e}</pre>`
  }
}

watch(() => props.code, async () => {
  const mermaid = (await import('mermaid')).default
  await render(mermaid)
})
</script>

<template>
  <div ref="container" class="mermaid-wrapper" v-html="svg" />
</template>

<style scoped>
.mermaid-wrapper {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
  overflow-x: auto;
}
.mermaid-wrapper :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>

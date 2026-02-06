<script setup lang="ts">
/**
 * Mermaid 渲染器组件（由 markdown-it 插件自动注入）
 * 接收 Base64 编码的 mermaid 代码并渲染为 SVG
 */
import { ref, onMounted } from 'vue'

const props = defineProps<{ encoded: string }>()
const svg = ref('')
const error = ref('')

onMounted(async () => {
  try {
    // 解码 Base64（支持 UTF-8 中文字符）
    const binary = atob(props.encoded)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const code = new TextDecoder('utf-8').decode(bytes)
    
    const mermaid = (await import('mermaid')).default
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
      securityLevel: 'loose',
    })

    const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
    const { svg: rendered } = await mermaid.render(id, code)
    svg.value = rendered

    // 监听主题切换，重新渲染
    const observer = new MutationObserver(async () => {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'loose',
      })
      try {
        const reId = `mermaid-${Math.random().toString(36).slice(2, 10)}`
        const { svg: re } = await mermaid.render(reId, code)
        svg.value = re
      } catch {}
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  } catch (e: any) {
    error.value = e?.message || String(e)
  }
})
</script>

<template>
  <ClientOnly>
    <div v-if="svg" class="mermaid-wrapper" v-html="svg" />
    <div v-else-if="error" class="mermaid-error">
      <p>⚠️ Mermaid 渲染失败</p>
      <pre>{{ error }}</pre>
    </div>
    <div v-else class="mermaid-loading">加载图表中...</div>
  </ClientOnly>
</template>

<style scoped>
.mermaid-wrapper {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
  padding: 1rem;
  overflow-x: auto;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}
.mermaid-wrapper :deep(svg) {
  max-width: 100%;
  height: auto;
}
.mermaid-error {
  margin: 1rem 0;
  padding: 1rem;
  background: #fff0f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #cf1322;
}
.mermaid-error pre {
  margin-top: 0.5rem;
  font-size: 0.85em;
  white-space: pre-wrap;
}
.mermaid-loading {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-3);
}
</style>

<script setup lang="ts">
/**
 * 标签云组件
 * 支持交互模式：点击标签跳转至 /records/?tag=xxx
 */
import { ref, onMounted } from 'vue'

interface TagItem {
  name: string
  count: number
}

const props = defineProps<{
  interactive?: boolean
}>()

const tags = ref<TagItem[]>([])
const tagMeta = ref<Record<string, { label: string; icon: string }>>({})

onMounted(async () => {
  try {
    const [tagsRes, metaRes] = await Promise.all([
      fetch('/api/tags.json'),
      fetch('/api/tag-meta.json'),
    ])
    if (tagsRes.ok) tags.value = await tagsRes.json()
    if (metaRes.ok) tagMeta.value = await metaRes.json()
  } catch {
    // 静态模式下无标签数据
  }
})

/** 获取标签的中文显示名（回退到原始 key） */
function displayName(tag: string): string {
  return tagMeta.value[tag]?.label || tag
}

function getTagSize(count: number): string {
  if (count >= 10) return '1.4rem'
  if (count >= 5) return '1.2rem'
  if (count >= 3) return '1.05rem'
  return '0.9rem'
}

function getTagOpacity(count: number): number {
  return Math.min(0.5 + count * 0.1, 1)
}

function handleClick(tagName: string) {
  if (props.interactive) {
    window.location.href = `/records/?tag=${encodeURIComponent(tagName)}`
  }
}
</script>

<template>
  <div v-if="tags.length" class="tag-cloud">
    <h3 v-if="!interactive">标签</h3>
    <div class="tags-container">
      <span
        v-for="tag in tags"
        :key="tag.name"
        class="tag-item"
        :class="{ clickable: interactive }"
        :style="{
          fontSize: getTagSize(tag.count),
          opacity: getTagOpacity(tag.count),
        }"
        @click="handleClick(tag.name)"
      >
        #{{ displayName(tag.name) }}
        <sup>{{ tag.count }}</sup>
      </span>
    </div>
  </div>
</template>

<style scoped>
.tag-cloud {
  margin: 2rem 0;
}

.tag-cloud h3 {
  margin-bottom: 1rem;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  padding: 1.25rem;
  border-radius: 0;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background-image: radial-gradient(circle, var(--ak-bg-dot, rgba(0,0,0,0.04)) 1px, transparent 1px);
  background-size: 10px 10px;
  position: relative;
}

.tags-container::before {
  content: '// TAGS';
  position: absolute;
  top: 0.35rem;
  right: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  color: var(--ak-accent, #FF6B2B);
  opacity: 0.4;
  letter-spacing: 0.1em;
}

.tag-item {
  color: var(--vp-c-brand-1);
  cursor: default;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.2rem 0.6rem;
  border-radius: 0;
  border: 1px solid transparent;
  font-family: 'Courier New', monospace;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
  position: relative;
}

.tag-item.clickable {
  cursor: pointer;
}

.tag-item:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--ak-accent, #FF6B2B);
  box-shadow: 0 0 8px rgba(255,107,43,0.15);
}

.tag-item.clickable:hover {
  transform: translateX(4px);
}

.tag-item sup {
  font-size: 0.65em;
  color: var(--vp-c-text-3);
  margin-left: 2px;
}
</style>

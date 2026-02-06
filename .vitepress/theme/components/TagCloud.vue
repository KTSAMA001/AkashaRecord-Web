<script setup lang="ts">
/**
 * 标签云组件
 * 从内容文件中提取标签并以云状形式展示
 */
import { ref, onMounted } from 'vue'

interface TagItem {
  name: string
  count: number
}

const tags = ref<TagItem[]>([])

onMounted(async () => {
  try {
    const data = await fetch('/api/tags.json')
    if (data.ok) {
      tags.value = await data.json()
    }
  } catch {
    // 静态模式下无标签数据
  }
})

function getTagSize(count: number): string {
  if (count >= 10) return '1.4rem'
  if (count >= 5) return '1.2rem'
  if (count >= 3) return '1.05rem'
  return '0.9rem'
}

function getTagOpacity(count: number): number {
  return Math.min(0.5 + count * 0.1, 1)
}
</script>

<template>
  <div v-if="tags.length" class="tag-cloud">
    <h3>🏷️ 标签</h3>
    <div class="tags-container">
      <span
        v-for="tag in tags"
        :key="tag.name"
        class="tag-item"
        :style="{
          fontSize: getTagSize(tag.count),
          opacity: getTagOpacity(tag.count),
        }"
      >
        {{ tag.name }}
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
  gap: 0.5rem 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.tag-item {
  color: var(--vp-c-brand-1);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.tag-item:hover {
  background: var(--vp-c-brand-soft);
}

.tag-item sup {
  font-size: 0.65em;
  color: var(--vp-c-text-3);
}
</style>

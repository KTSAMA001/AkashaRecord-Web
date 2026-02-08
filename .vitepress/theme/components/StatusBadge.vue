<script setup lang="ts">
/**
 * 状态徽章组件 (Schema-Driven)
 * 从 meta-schema.json 获取状态定义，渲染 SVG 图标 + 中文标签
 */
import { ref, onMounted, computed } from 'vue'

const props = defineProps<{
  status: string
}>()

interface StatusDef {
  emoji: string
  label: string
  color: string
  svg: string
  scene: string
}

const statuses = ref<StatusDef[]>([])

onMounted(async () => {
  try {
    const res = await fetch('/api/meta-schema.json')
    if (res.ok) {
      const schema = await res.json()
      statuses.value = schema.statuses || []
    }
  } catch {
    // 静态模式回退
  }
})

/** 从 Schema 匹配当前状态 */
const statusInfo = computed(() => {
  if (!props.status) return null
  for (const s of statuses.value) {
    if (props.status.includes(s.emoji)) return s
  }
  for (const s of statuses.value) {
    if (props.status.includes(s.label)) return s
  }
  return null
})
</script>

<template>
  <span
    class="status-badge"
    :class="statusInfo?.color || ''"
    :title="statusInfo?.label || status"
  >
    <img
      v-if="statusInfo"
      class="status-badge__icon"
      :src="`/icons/${statusInfo.svg}.svg`"
      :alt="statusInfo.label"
    />
    <span v-else class="status-badge__fallback">{{ status }}</span>
    <span v-if="statusInfo" class="status-badge__label">{{ statusInfo.label }}</span>
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85em;
  margin-left: 0.25rem;
  cursor: help;
  font-family: 'Courier New', monospace;
}

.status-badge__icon {
  width: 1em;
  height: 1em;
  object-fit: contain;
}

.status-badge__label {
  font-size: 0.85em;
  letter-spacing: 0.02em;
}

.status-badge.success { color: #10b981; }
.status-badge.success .status-badge__icon { filter: brightness(0) saturate(100%) invert(62%) sepia(62%) saturate(459%) hue-rotate(105deg) brightness(96%) contrast(89%); }

.status-badge.warning { color: #f59e0b; }
.status-badge.warning .status-badge__icon { filter: brightness(0) saturate(100%) invert(67%) sepia(63%) saturate(588%) hue-rotate(5deg) brightness(104%) contrast(96%); }

.status-badge.info { color: #6366f1; }
.status-badge.info .status-badge__icon { filter: brightness(0) saturate(100%) invert(40%) sepia(85%) saturate(3000%) hue-rotate(230deg) brightness(98%) contrast(93%); }

.status-badge.danger { color: #ef4444; }
.status-badge.danger .status-badge__icon { filter: brightness(0) saturate(100%) invert(36%) sepia(89%) saturate(5000%) hue-rotate(342deg) brightness(97%) contrast(96%); }
</style>

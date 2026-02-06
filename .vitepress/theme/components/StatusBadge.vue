<script setup lang="ts">
/**
 * 状态徽章组件
 * 用于在标题旁显示状态 emoji
 */
defineProps<{
  status: '✅' | '⚠️' | '🔄' | '❌' | '🔬' | '📘' | '📕' | string
}>()

const statusLabels: Record<string, string> = {
  '✅': '已验证',
  '⚠️': '需注意',
  '🔄': '更新中',
  '❌': '已废弃',
  '🔬': '实验性',
  '📘': '当前有效',
  '📕': '已归档',
}
</script>

<template>
  <span class="status-badge" :title="statusLabels[status] || status">
    {{ status }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.9em;
  margin-left: 0.25rem;
  cursor: help;
}
</style>

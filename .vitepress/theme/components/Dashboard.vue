<script setup lang="ts">
/**
 * 首页仪表盘组件
 * 显示阿卡西记录的总量统计
 */
import { ref, onMounted } from 'vue'

const totalRecords = ref(0)

onMounted(async () => {
  try {
    const res = await fetch('/api/stats.json')
    if (res.ok) {
      const json = await res.json()
      totalRecords.value = json.total || 0
    }
  } catch {
    // 静态模式回退
  }
})
</script>

<template>
  <div class="dashboard">
    <div class="section-divider">
      <span class="divider-label">// SYSTEM_STATUS</span>
    </div>

    <div class="total-card">
      <span class="total-number">{{ totalRecords }}</span>
      <span class="total-label">RECORDS INDEXED</span>
      <a href="/records/" class="total-link">ACCESS_TERMINAL →</a>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* ======= 分隔线 ======= */
.section-divider {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--ak-accent), transparent);
}

.divider-label {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--ak-accent);
  letter-spacing: 0.1em;
  white-space: nowrap;
  font-weight: 600;
}

/* ======= 总量卡片 ======= */
.total-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  margin-bottom: 2rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  position: relative;
  overflow: hidden;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.total-number {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--ak-accent);
  font-family: 'Courier New', monospace;
  line-height: 1;
}

.total-label {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.2em;
  margin-top: 0.5rem;
}

.total-link {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
  background-image: linear-gradient(to right, var(--ak-accent), var(--ak-accent));
  background-position: 0% 100%;
  background-repeat: no-repeat;
  background-size: 0% 2px;
  transition: background-size 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.2s;
}

.total-link:hover {
  background-size: 100% 2px;
  transform: translateX(4px);
}
</style>

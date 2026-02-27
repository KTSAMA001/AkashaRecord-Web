<script setup lang="ts">
/**
 * 标签分布组件 - 终端风格水平条形图
 * 显示 Top N 标签的记录数分布，与首页仪表盘风格统一
 */
import { ref, computed, onMounted } from 'vue'

interface TagItem {
  name: string
  count: number
}

const distribution = ref<TagItem[]>([])
const tagMeta = ref<Record<string, { label: string; icon: string }>>({})
const isVisible = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const maxDisplay = 10

const topTags = computed(() => distribution.value.slice(0, maxDisplay))
const maxCount = computed(() => topTags.value[0]?.count || 1)
const totalCount = computed(() => distribution.value.reduce((s, t) => s + t.count, 0))

function displayName(tag: string): string {
  return tagMeta.value[tag]?.label || tag
}

function barWidth(count: number): string {
  return `${(count / maxCount.value) * 100}%`
}

function percentage(count: number): string {
  if (totalCount.value === 0) return '0'
  return ((count / totalCount.value) * 100).toFixed(1)
}

onMounted(async () => {
  try {
    const [statsRes, metaRes] = await Promise.all([
      fetch('/api/stats.json'),
      fetch('/api/tag-meta.json'),
    ])
    if (statsRes.ok) {
      const json = await statsRes.json()
      distribution.value = json.tagDistribution || []
    }
    if (metaRes.ok) {
      const meta = await metaRes.json()
      // 兼容新旧格式
      tagMeta.value = meta.tags || meta
    }
  } catch {
    // 静默处理
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      isVisible.value = true
      observer.disconnect()
    }
  }, { threshold: 0.1 })

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
})
</script>

<template>
  <div ref="containerRef" class="tag-dist" :class="{ 'is-active': isVisible }">
    <!-- 标题栏 -->
    <div class="dist-header">
      <div class="header-left">
        <span class="header-dot"></span>
        <span class="header-title">TAG_DISTRIBUTION</span>
      </div>
      <div class="header-line"></div>
      <div class="header-right">TOP {{ topTags.length }}</div>
    </div>

    <!-- 条形图区域 -->
    <div class="dist-body">
      <div
        v-for="(tag, idx) in topTags"
        :key="tag.name"
        class="bar-row"
        :style="{ '--row-delay': `${0.15 + idx * 0.06}s` }"
      >
        <div class="bar-label">
          <span class="bar-rank">{{ String(idx + 1).padStart(2, '0') }}</span>
          <a :href="`/records/?tags=${tag.name}`" class="bar-name">{{ displayName(tag.name) }}</a>
        </div>
        <div class="bar-track" role="meter" :aria-valuenow="tag.count" :aria-valuemin="0" :aria-valuemax="maxCount" :aria-label="`${displayName(tag.name)}: ${tag.count} 条记录, ${percentage(tag.count)}%`">
          <div
            class="bar-fill"
            :style="{ '--target-width': barWidth(tag.count) }"
          ></div>
        </div>
        <div class="bar-stats">
          <span class="bar-count">{{ tag.count }}</span>
          <span class="bar-pct">{{ percentage(tag.count) }}%</span>
        </div>
      </div>
    </div>

    <!-- 底栏 -->
    <div class="dist-footer">
      <span class="footer-code">TOTAL_TAGS: {{ distribution.length }}</span>
      <span class="footer-msg">INDEXED_REFS: {{ totalCount }}</span>
    </div>
  </div>
</template>

<style scoped>
.tag-dist {
  font-family: 'Courier New', monospace;
  max-width: 960px;
  margin: 0 auto 2rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--ak-border);
  position: relative;
  clip-path: polygon(
    0 20px,
    20px 0,
    100% 0,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    0 100%
  );
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.tag-dist.is-active {
  opacity: 1;
  transform: translateY(0);
}

.tag-dist::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--ak-accent);
  opacity: 0.5;
}

/* ======= Header ======= */
.dist-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.75rem;
  color: var(--ak-accent);
  opacity: 0.8;
}

.header-left {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.header-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--ak-accent);
  margin-right: 8px;
  box-shadow: 0 0 5px var(--ak-accent);
  animation: dist-pulse 2s infinite;
}

@keyframes dist-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.header-line {
  flex: 1;
  height: 1px;
  background: var(--ak-border);
  position: relative;
}

.header-line::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  background: var(--ak-accent);
  transition: width 1.5s ease-out;
}

.is-active .header-line::after {
  width: 100%;
}

.header-right {
  white-space: nowrap;
}

/* ======= Body ======= */
.dist-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-row {
  display: grid;
  grid-template-columns: 140px 1fr 80px;
  align-items: center;
  gap: 0.75rem;
  opacity: 0;
  transform: translateX(-10px);
}

.is-active .bar-row {
  animation: barRowIn 0.4s ease forwards;
  animation-delay: var(--row-delay);
}

@keyframes barRowIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Label */
.bar-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
}

.bar-rank {
  font-size: 0.65rem;
  color: var(--ak-accent);
  opacity: 0.5;
  flex-shrink: 0;
}

.bar-name {
  font-size: 0.8rem;
  color: var(--vp-c-text-1);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.25s;
}

.bar-name:hover {
  color: var(--ak-accent);
}

/* Track & Fill */
.bar-track {
  height: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--ak-accent), color-mix(in srgb, var(--ak-accent) 60%, transparent));
  position: relative;
  transition: width 0s;
}

.is-active .bar-fill {
  animation: barGrow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: var(--row-delay);
}

@keyframes barGrow {
  to {
    width: var(--target-width);
  }
}

/* 扫描线效果 */
.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
  background: #fff;
  opacity: 0.6;
  animation: barScan 1.5s ease-in-out infinite;
}

@keyframes barScan {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.2; }
}

/* Stats */
.bar-stats {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: flex-end;
  font-size: 0.75rem;
}

.bar-count {
  font-family: 'Orbitron', 'Courier New', monospace;
  color: var(--ak-accent);
  font-weight: 700;
  min-width: 1.5em;
  text-align: right;
}

.bar-pct {
  color: var(--vp-c-text-3);
  font-size: 0.65rem;
  min-width: 3em;
  text-align: right;
}

/* ======= Footer ======= */
.dist-footer {
  margin-top: 1.2rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  opacity: 0.6;
}

/* ======= Mobile ======= */
@media (max-width: 768px) {
  .bar-row {
    grid-template-columns: 100px 1fr 65px;
    gap: 0.5rem;
  }

  .bar-name {
    font-size: 0.72rem;
  }

  .bar-stats {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .bar-row {
    grid-template-columns: 80px 1fr 55px;
    gap: 0.35rem;
  }

  .bar-pct {
    display: none;
  }
}
</style>

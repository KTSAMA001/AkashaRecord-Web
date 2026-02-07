<script setup lang="ts">
/**
 * 首页仪表盘组件
 * 显示阿卡西记录的统计信息（标签化体系，全部动态读取）
 */
import { ref, onMounted } from 'vue'

interface DomainStat {
  label: string
  count: number
  color: string
}

interface TagInfo {
  name: string
  count: number
}

const totalRecords = ref(0)
const domainStats = ref<DomainStat[]>([])
const topTags = ref<TagInfo[]>([])
const tagMeta = ref<Record<string, { label: string; icon: string }>>({})

/**
 * 从标签名哈希生成确定性颜色，保证同一标签颜色始终一致
 */
function tagToColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = ((hash % 360) + 360) % 360
  return `hsl(${h}, 65%, 55%)`
}

onMounted(async () => {
  try {
    const [statsRes, tagsRes, metaRes] = await Promise.all([
      fetch('/api/stats.json'),
      fetch('/api/tags.json'),
      fetch('/api/tag-meta.json'),
    ])

    if (metaRes.ok) tagMeta.value = await metaRes.json()

    if (statsRes.ok) {
      const json = await statsRes.json()
      totalRecords.value = json.total || 0
      
      // byDomain 完全动态转为展示数组，使用中文显示名
      const byDomain = json.byDomain || {}
      domainStats.value = Object.entries(byDomain)
        .map(([key, count]) => ({
          label: tagMeta.value[key]?.label || key,
          count: count as number,
          color: tagToColor(key),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    }

    if (tagsRes.ok) {
      const allTags = await tagsRes.json()
      topTags.value = allTags.slice(0, 8)
    }
  } catch {
    // 静态模式回退
  }
})
</script>

<template>
  <div class="dashboard">
    <!-- 总量卡片 -->
    <div class="section-divider">
      <span class="divider-label">// SYSTEM_STATUS</span>
    </div>

    <div class="total-card">
      <span class="total-number">{{ totalRecords }}</span>
      <span class="total-label">RECORDS INDEXED</span>
      <a href="/records/" class="total-link">ACCESS_TERMINAL →</a>
    </div>

    <!-- Domain 统计 -->
    <div class="card-grid card-grid--3">
      <a
        v-for="(stat, index) in domainStats"
        :key="stat.label"
        :href="`/records/?tag=${stat.label}`"
        class="ak-card"
        :style="{ '--card-accent': stat.color }"
      >
        <span class="ak-card__index">{{ String(index + 1).padStart(2, '0') }}</span>
        <div class="ak-card__body">
          <span class="ak-card__count">{{ stat.count }}</span>
          <span class="ak-card__label">{{ stat.label }}</span>
        </div>
        <span class="ak-card__shine"></span>
      </a>
    </div>

    <!-- Top Tags -->
    <div v-if="topTags.length" class="recent-section">
      <div class="section-divider">
        <span class="divider-label">// TOP_TAGS</span>
        <span class="divider-count">{{ topTags.length }} ENTRIES</span>
      </div>
      <div class="card-grid card-grid--1">
        <a
          v-for="(tag, index) in topTags"
          :key="tag.name"
          :href="`/records/?tag=${tag.name}`"
          class="ak-card ak-card--row"
        >
          <span class="ak-card__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="ak-card__tag">#{{ tagMeta[tag.name]?.label || tag.name }}</span>
          <span class="ak-card__title">{{ tag.count }} 条记录</span>
          <span class="ak-card__arrow">→</span>
          <span class="ak-card__shine"></span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
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
  color: var(--ak-accent, #FF6B2B);
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
  transition: transform 0.2s;
}

.total-link:hover {
  transform: translateX(4px);
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
  background: linear-gradient(to right, var(--ak-accent, #FF6B2B), transparent);
}

.divider-label {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--ak-accent, #FF6B2B);
  letter-spacing: 0.1em;
  white-space: nowrap;
  font-weight: 600;
}

.divider-count {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  letter-spacing: 0.1em;
  flex-shrink: 0;
}

/* ======= 统一卡片网格 ======= */
.card-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 3rem;
}

.card-grid--3 {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.card-grid--1 {
  grid-template-columns: 1fr;
}

/* ======= 统一卡片基础样式 ======= */
.ak-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  text-decoration: none;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  clip-path: polygon(
    0 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
  /* 网点底纹 */
  background-image: radial-gradient(circle, var(--ak-bg-dot, rgba(0,0,0,0.04)) 1px, transparent 1px);
  background-size: 10px 10px;
}

.ak-card:hover {
  border-color: var(--card-accent, var(--ak-accent, #FF6B2B));
  box-shadow:
    0 0 20px rgba(255, 107, 43, 0.12),
    inset 0 0 20px rgba(255, 107, 43, 0.04);
  transform: translateX(4px);
}

/* 左侧高亮条 */
.ak-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: var(--card-accent, var(--ak-accent, #FF6B2B));
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 0.3s ease;
}

.ak-card:hover::before {
  transform: scaleY(1);
}

/* 微光扫过层 */
.ak-card__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 0%,
    transparent 40%,
    rgba(255, 107, 43, 0.06) 50%,
    transparent 60%,
    transparent 100%
  );
  transform: translateX(-100%);
  pointer-events: none;
}

.ak-card:hover .ak-card__shine {
  transform: translateX(100%);
  transition: transform 0.6s ease;
}

/* ======= 卡片内部元素 ======= */
.ak-card__index {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: var(--card-accent, var(--ak-accent, #FF6B2B));
  opacity: 0.35;
  min-width: 1.6rem;
  flex-shrink: 0;
}

.ak-card__icon {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
  flex-shrink: 0;
  filter: invert(48%) sepia(89%) saturate(1600%) hue-rotate(3deg) brightness(101%) contrast(103%);
}

.ak-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ak-card__count {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--card-accent, var(--ak-accent, #FF6B2B));
  line-height: 1.2;
  font-family: 'Courier New', monospace;
}

.ak-card__label {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
}

/* ======= 行式卡片（RECENT_UPDATES） ======= */
.ak-card--row {
  padding: 0.9rem 1.25rem;
}

.ak-card__tag {
  font-size: 0.7rem;
  padding: 0.1rem 0.5rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
}

.ak-card__title {
  flex: 1;
  color: var(--vp-c-text-1);
  font-weight: 500;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ak-card:hover .ak-card__title {
  color: var(--ak-accent, #FF6B2B);
}

.ak-card__meta {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.ak-card__arrow {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.25s;
  flex-shrink: 0;
}

.ak-card:hover .ak-card__arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--ak-accent, #FF6B2B);
}

/* ======= 响应式 ======= */
@media (max-width: 640px) {
  .card-grid--3 {
    grid-template-columns: 1fr;
  }
  .ak-card--row {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .ak-card__meta {
    width: 100%;
    text-align: right;
  }
  .ak-card__arrow {
    display: none;
  }
}
</style>

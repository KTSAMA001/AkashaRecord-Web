<script setup lang="ts">
/**
 * 首页仪表盘组件
 * 显示阿卡西记录的统计信息和最近更新
 */
import { ref, onMounted } from 'vue'

interface StatItem {
  label: string
  count: number
  icon: string
  link: string
  color: string
}

interface RecentItem {
  title: string
  link: string
  category: string
  date: string
}

const stats = ref<StatItem[]>([])
const recentItems = ref<RecentItem[]>([])

// 统计数据从构建时注入
// 通过 VitePress 的 data loader 机制
onMounted(async () => {
  try {
    const data = await fetch('/api/stats.json')
    if (data.ok) {
      const json = await data.json()
      stats.value = json.stats || []
      recentItems.value = json.recent || []
    }
  } catch {
    // 静态模式：使用默认数据
    stats.value = [
      { label: '经验记录', count: 0, icon: '📝', link: '/experiences/', color: '#FF6B2B' },
      { label: '知识文档', count: 0, icon: '📚', link: '/knowledge/', color: '#F49F0A' },
      { label: '灵感火花', count: 0, icon: '💡', link: '/ideas/', color: '#E85D1A' },
    ]
  }
})
</script>

<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="section-divider">
      <span class="divider-label">// SYSTEM_STATUS</span>
    </div>

    <div class="card-grid card-grid--3">
      <a
        v-for="(stat, index) in stats"
        :key="stat.label"
        :href="stat.link"
        class="ak-card"
        :style="{ '--card-accent': stat.color }"
      >
        <span class="ak-card__index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="ak-card__icon">{{ stat.icon }}</span>
        <div class="ak-card__body">
          <span class="ak-card__count">{{ stat.count }}</span>
          <span class="ak-card__label">{{ stat.label }}</span>
        </div>
        <span class="ak-card__shine"></span>
      </a>
    </div>

    <!-- 最近更新 -->
    <div v-if="recentItems.length" class="recent-section">
      <div class="section-divider">
        <span class="divider-label">// RECENT_UPDATES</span>
        <span class="divider-count">{{ recentItems.length }} ENTRIES</span>
      </div>
      <div class="card-grid card-grid--1">
        <a
          v-for="(item, index) in recentItems"
          :key="item.link"
          :href="item.link"
          class="ak-card ak-card--row"
        >
          <span class="ak-card__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="ak-card__tag">{{ item.category }}</span>
          <span class="ak-card__title">{{ item.title }}</span>
          <span class="ak-card__meta">{{ item.date }}</span>
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
  font-size: 2rem;
  flex-shrink: 0;
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

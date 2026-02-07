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
    <!-- 分隔线装饰 -->
    <div class="section-divider">
      <span class="divider-label">// SYSTEM_STATUS</span>
    </div>

    <div class="stats-grid">
      <a
        v-for="stat in stats"
        :key="stat.label"
        :href="stat.link"
        class="stat-card"
        :style="{ '--accent-color': stat.color }"
      >
        <span class="stat-icon">{{ stat.icon }}</span>
        <div class="stat-info">
          <span class="stat-count">{{ stat.count }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </a>
    </div>

    <div v-if="recentItems.length" class="recent-section">
      <div class="section-divider">
        <span class="divider-label">// RECENT_UPDATES</span>
      </div>
      <ul class="recent-list">
        <li v-for="(item, index) in recentItems" :key="item.link">
          <a :href="item.link">
            <span class="recent-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="recent-category">{{ item.category }}</span>
            <span class="recent-title">{{ item.title }}</span>
            <span class="recent-date">{{ item.date }}</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0;
  background: var(--vp-c-bg-soft);
  background-image: radial-gradient(var(--ak-bg-dot) 1px, transparent 1px);
  background-size: 8px 8px;
  border: 1px solid var(--vp-c-border);
  text-decoration: none;
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--accent-color);
  opacity: 0;
  transition: opacity 0.25s;
}

.stat-card:hover {
  border-color: var(--accent-color);
  box-shadow: 0 0 20px rgba(255, 107, 43, 0.15),
              inset 0 0 20px rgba(255, 107, 43, 0.05);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-count {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-color);
  line-height: 1.2;
  font-family: 'Courier New', monospace;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.recent-section h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.recent-list {
  list-style: none;
  padding: 0;
}

.recent-list li {
  border-bottom: 1px solid var(--vp-c-border);
}

.recent-list li:last-child {
  borderindex {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  font-weight: 700;
  opacity: 0.5;
  margin-right: 0.5rem;
}

.recent--bottom: none;
}

.recent-list a {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.5rem;
  text-decoration: none;
  transition: background 0.2s;
  border-radius: 0;
  border-left: 2px solid transparent;
}

.recent-list a:hover {
  background: var(--vp-c-bg-soft);
  border-left-color: var(--ak-accent, #FF6B2B);
}

.recent-category {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 0;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}

.recent-title {
  flex: 1;
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.recent-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  font-family: 'Courier New', monospace;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .recent-list a {
    flex-wrap: wrap;
  }
  .recent-date {
    width: 100%;
    text-align: right;
  }
}
</style>

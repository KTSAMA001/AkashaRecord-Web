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
      { label: '经验记录', count: 0, icon: '📝', link: '/experiences/', color: '#7c3aed' },
      { label: '知识文档', count: 0, icon: '📚', link: '/knowledge/', color: '#2563eb' },
      { label: '灵感火花', count: 0, icon: '💡', link: '/ideas/', color: '#f59e0b' },
    ]
  }
})
</script>

<template>
  <div class="dashboard">
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
      <h3>🕐 最近更新</h3>
      <ul class="recent-list">
        <li v-for="item in recentItems" :key="item.link">
          <a :href="item.link">
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
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
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
}

.stat-label {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
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
  border-bottom: none;
}

.recent-list a {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.5rem;
  text-decoration: none;
  transition: background 0.2s;
  border-radius: 6px;
}

.recent-list a:hover {
  background: var(--vp-c-bg-soft);
}

.recent-category {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  white-space: nowrap;
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

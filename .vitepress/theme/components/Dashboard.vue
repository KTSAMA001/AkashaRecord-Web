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

/* Industrial card styling */
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-border);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  clip-path: polygon(
    0 8px, 8px 0, 
    100% 0, 100% calc(100% - 8px), 
    calc(100% - 8px) 100%, 0 100%
  );
}

/* Angular corner accent */
.stat-card::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  background: var(--accent-color);
  clip-path: polygon(100% 0, 100% 100%, 0 0);
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--accent-color);
  box-shadow: 
    0 0 20px rgba(255, 152, 0, 0.2),
    inset 0 0 40px rgba(255, 152, 0, 0.05);
  transform: translateY(-2px);
}

.stat-card:hover::after {
  width: 32px;
  height: 32px;
}

/* Tech border accent on left */
.stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: var(--accent-color);
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-count {
  font-size: 2rem;
  font-weight: 900;
  color: var(--accent-color);
  line-height: 1.2;
  letter-spacing: 1px;
  font-family: 'Courier New', monospace;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.recent-section h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  position: relative;
  padding-left: 1rem;
}

.recent-section h3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 100%;
  background: var(--vp-c-brand-1);
}

.recent-list {
  list-style: none;
  padding: 0;
  border: 2px solid var(--vp-c-border);
}

.recent-list li {
  border-bottom: 1px solid var(--vp-c-border);
  position: relative;
}

.recent-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.recent-list li:hover::before {
  opacity: 1;
}

.recent-list li:last-child {
  border-bottom: none;
}

.recent-list a {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  transition: all 0.2s;
}

.recent-list a:hover {
  background: var(--vp-c-bg-soft);
  padding-left: 1.25rem;
}

.recent-category {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-brand-1);
  color: #000;
  white-space: nowrap;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 100%, 0 100%);
}

.recent-title {
  flex: 1;
  color: var(--vp-c-text-1);
  font-weight: 600;
  letter-spacing: 0.3px;
}

.recent-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  font-weight: 600;
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

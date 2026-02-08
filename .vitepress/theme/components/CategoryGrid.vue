<script setup lang="ts">
/**
 * 分类网格组件 - 工业风卡片布局
 * 替代分类首页的纯 Markdown 表格，统一视觉语言
 * 
 * 用法（Markdown 内）：
 * <CategoryGrid :items="[{label:'Unity',link:'./unity/',desc:'引擎开发'}]" />
 */
interface CategoryItem {
  label: string
  link: string
  desc: string
  icon?: string
}

defineProps<{
  items: CategoryItem[]
}>()
</script>

<template>
  <div class="category-grid">
    <div class="grid-header">
      <span class="grid-label">// SUBSYSTEMS</span>
      <span class="grid-count">{{ items.length }} MODULES</span>
    </div>
    <div class="grid-container">
      <a
        v-for="(item, index) in items"
        :key="item.link"
        :href="item.link"
        class="category-card"
      >
        <!-- 序号 -->
        <span class="card-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <!-- 图标（可选） -->
        <img v-if="item.icon" :src="item.icon" :alt="item.label" class="card-icon" />
        <!-- 内容 -->
        <div class="card-body">
          <span class="card-label">{{ item.label }}</span>
          <span class="card-desc">{{ item.desc }}</span>
        </div>
        <!-- 箭头指示器 -->
        <span class="card-arrow">→</span>
        <!-- 微光扫过层 -->
        <span class="card-shine"></span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.category-grid {
  margin: 1.5rem 0 2rem;
}

.grid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
}

.grid-label {
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  color: var(--ak-accent, #FF6B2B);
  letter-spacing: 0.15em;
  opacity: 0.6;
}

.grid-count {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  letter-spacing: 0.1em;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.category-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
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
  /* 网点底纹由全局 VPContent 提供，不重复设置 */
}

.category-card:hover {
  border-color: var(--ak-accent, #FF6B2B);
  box-shadow:
    0 0 20px var(--ak-accent-dim, rgba(255, 107, 43, 0.25)),
    inset 0 0 20px color-mix(in srgb, var(--ak-accent, #FF6B2B) 8%, transparent);
  transform: translateX(4px);
}

/* 左侧高亮条 */
.category-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: var(--ak-accent, #FF6B2B);
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform 0.3s ease;
}

.category-card:hover::before {
  transform: scaleY(1);
}

/* 微光扫过 */
.card-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 0%,
    transparent 40%,
    color-mix(in srgb, var(--ak-accent, #FF6B2B) 10%, transparent) 50%,
    transparent 60%,
    transparent 100%
  );
  transform: translateX(-100%);
  pointer-events: none;
}

.category-card:hover .card-shine {
  transform: translateX(100%);
  transition: transform 0.6s ease;
}

.card-index {
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ak-accent, #FF6B2B);
  opacity: 0.35;
  min-width: 1.6rem;
  flex-shrink: 0;
}

.card-icon {
  width: 1.4rem;
  height: 1.4rem;
  object-fit: contain;
  flex-shrink: 0;
  filter: invert(48%) sepia(89%) saturate(1600%) hue-rotate(3deg) brightness(101%) contrast(103%);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.card-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: 0.02em;
}

.category-card:hover .card-label {
  color: var(--ak-accent, #FF6B2B);
}

.card-desc {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-arrow {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.25s;
  flex-shrink: 0;
}

.category-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--ak-accent, #FF6B2B);
}

@media (max-width: 640px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>

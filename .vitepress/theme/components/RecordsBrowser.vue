<script setup lang="ts">
/**
 * RecordsBrowser Component
 * 记录总览浏览器：支持标签筛选、搜索和卡片展示
 * 状态颜色完全由 meta-schema.json 驱动，无硬编码
 */
import { ref, computed, onMounted } from 'vue'

interface FileInfo {
  title: string
  link: string
  status?: string
  tags?: string[]
}

interface TagData {
  name: string
  count: number
  files: FileInfo[]
}

interface StatusDef {
  emoji: string
  label: string
  color: string
  svg: string
}

const tags = ref<TagData[]>([])
const tagMeta = ref<Record<string, { label: string; icon: string }>>({})
const statusDefs = ref<StatusDef[]>([])
const selectedTag = ref<string>('All')
const searchQuery = ref('')
const loading = ref(true)
const tagsExpanded = ref(false)

// 获取所有去重的记录
const allRecords = computed(() => {
  const map = new Map<string, FileInfo>()
  for (const tag of tags.value) {
    for (const file of tag.files) {
      if (!map.has(file.link)) {
        map.set(file.link, file)
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title))
})

// 根据当前筛选条件过滤记录
const filteredRecords = computed(() => {
  let records: FileInfo[] = []
  
  if (selectedTag.value === 'All') {
    records = allRecords.value
  } else {
    const tagData = tags.value.find(t => t.name === selectedTag.value)
    records = tagData ? tagData.files : []
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    records = records.filter(r => r.title.toLowerCase().includes(q))
  }

  return records
})

onMounted(async () => {
  try {
    const [tagsRes, metaRes, schemaRes] = await Promise.all([
      fetch('/api/tags.json'),
      fetch('/api/tag-meta.json'),
      fetch('/api/meta-schema.json'),
    ])
    if (tagsRes.ok) tags.value = await tagsRes.json()
    if (metaRes.ok) tagMeta.value = await metaRes.json()
    if (schemaRes.ok) {
      const schema = await schemaRes.json()
      statusDefs.value = schema.statuses || []
    }
    
    // 从 URL 参数初始化选中标签
    const params = new URLSearchParams(window.location.search)
    const urlTag = params.get('tag')
    if (urlTag && tags.value.some(t => t.name === urlTag)) {
      selectedTag.value = urlTag
    }
  } finally {
    loading.value = false
  }
})

function selectTag(tagName: string) {
  selectedTag.value = tagName
  
  // 更新 URL (但不刷新页面)
  const url = new URL(window.location.href)
  if (tagName === 'All') {
    url.searchParams.delete('tag')
  } else {
    url.searchParams.set('tag', tagName)
  }
  window.history.replaceState({}, '', url)
}

/**
 * Schema 驱动的状态颜色匹配：
 * 用 status 字符串前缀的 emoji 匹配 statusDefs，返回 color class
 */
function getStatusColor(status?: string): string {
  if (!status) return 'default'
  for (const def of statusDefs.value) {
    if (status.startsWith(def.emoji)) return def.color
  }
  return 'default'
}

/** 获取记录的 SVG 图标（取第一个有图标的标签，回退到 doc.svg） */
function getRecordIcon(record: FileInfo): string {
  if (record.tags) {
    for (const t of record.tags) {
      const meta = tagMeta.value[t]
      if (meta?.icon) return `/icons/${meta.icon}.svg`
    }
  }
  return '/icons/doc.svg'
}

/** 获取标签的中文显示名（回退到原始 key） */
function displayName(tag: string): string {
  return tagMeta.value[tag]?.label || tag
}
</script>

<template>
  <div class="records-browser">
    <!-- 筛选工具栏 -->
    <div class="filter-bar">
      <div class="tag-cloud" :class="{ expanded: tagsExpanded }">
        <button 
          class="filter-tag" 
          :class="{ active: selectedTag === 'All' }"
          @click="selectTag('All')"
        >
          ALL
        </button>
        <button 
          v-for="tag in tags" 
          :key="tag.name"
          class="filter-tag"
          :class="{ active: selectedTag === tag.name }"
          @click="selectTag(tag.name)"
        >
          {{ displayName(tag.name) }}
          <span class="count">{{ tag.count }}</span>
        </button>
      </div>
      <div class="filter-actions">
        <button class="expand-btn" @click="tagsExpanded = !tagsExpanded">
          {{ tagsExpanded ? '▲ COLLAPSE' : '▼ MORE_TAGS' }}
        </button>
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索记录..."
          />
        </div>
      </div>
    </div>

    <!-- 结果统计 -->
    <div class="status-bar">
      <span>// FOUND {{ filteredRecords.length }} RECORDS</span>
      <span v-if="selectedTag !== 'All'">FILTER: [{{ displayName(selectedTag) }}]</span>
    </div>

    <!-- 骨架屏加载中 -->
    <div v-if="loading" class="grid-container">
      <div v-for="i in 6" :key="i" class="record-card skeleton"></div>
    </div>

    <!-- 记录列表 -->
    <div v-else class="grid-container">
      <a 
        v-for="record in filteredRecords" 
        :key="record.link" 
        :href="record.link"
        class="record-card"
      >
        <div class="card-header">
          <img class="card-icon" :src="getRecordIcon(record)" alt="" />
          <span 
            v-if="record.status" 
            class="status-dot" 
            :class="getStatusColor(record.status)"
            :title="record.status"
          ></span>
        </div>
        <div class="card-body">
          <h4 class="title">{{ record.title }}</h4>
          <div class="code-path" :title="record.link">{{ record.link }}</div>
        </div>
        <div class="card-footer">
          <span class="view-btn">VIEW_LOG</span>
        </div>
        <span class="card-shine"></span>
      </a>
    </div>
    
    <div v-if="!loading && filteredRecords.length === 0" class="empty-state">
      No records found.
    </div>
  </div>
</template>

<style scoped>
.records-browser {
  margin-top: 2rem;
}

.filter-bar {
  margin-bottom: 1.5rem;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  max-height: 2.8rem;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-cloud.expanded {
  max-height: 600px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.6rem;
}

.expand-btn {
  padding: 0.2rem 0.6rem;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  background: none;
  border: 1px dashed var(--vp-c-divider);
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}

.expand-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

/* ======= 筛选标签（工业风切角） ======= */
.filter-tag {
  white-space: nowrap;
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  position: relative;
  overflow: hidden;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
}

.filter-tag::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--ak-accent, #FF6B2B);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 0.3s ease;
}

.filter-tag:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  transform: translateX(2px);
}

.filter-tag:hover::before {
  transform: scaleY(1);
}

.filter-tag.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.filter-tag .count {
  font-size: 0.7rem;
  opacity: 0.7;
}

.search-box input {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  width: 200px;
  font-size: 0.9rem;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
}

.search-box input:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}

.status-bar {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* ======= 记录卡片（工业风：切角 + 高亮条 + 微光 + hover 位移） ======= */
.record-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  padding: 1.25rem;
  min-height: 160px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

/* 左侧高亮条 */
.record-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: var(--ak-accent, #FF6B2B);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 0.3s ease;
  z-index: 2;
}

.record-card:hover {
  transform: translateX(4px);
  border-color: var(--ak-accent, #FF6B2B);
  box-shadow: 0 0 20px rgba(255, 107, 43, 0.12),
              inset 0 0 20px rgba(255, 107, 43, 0.04);
}

.record-card:hover::before {
  transform: scaleY(1);
}

/* 微光扫过层 */
.card-shine {
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

.record-card:hover .card-shine {
  transform: translateX(100%);
  transition: transform 0.6s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.card-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: invert(48%) sepia(89%) saturate(1600%) hue-rotate(3deg) brightness(101%) contrast(103%);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  flex-shrink: 0;
}
.status-dot.success { background: #10b981; box-shadow: 0 0 5px #10b981; }
.status-dot.info { background: #3b82f6; box-shadow: 0 0 5px rgba(59,130,246,0.5); }
.status-dot.warning { background: #f59e0b; box-shadow: 0 0 5px rgba(245,158,11,0.5); }
.status-dot.danger { background: #ef4444; box-shadow: 0 0 5px rgba(239,68,68,0.5); }

.card-body {
  flex: 1;
}

.title {
  margin: 0 0 0.5rem 0;
  font-size: 1.05rem;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  transition: color 0.25s;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.record-card:hover .title {
  color: var(--ak-accent, #FF6B2B);
}

.code-path {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  margin-top: auto;
  padding-top: 0.8rem;
  border-top: 1px dashed var(--vp-c-divider);
  display: flex;
  justify-content: flex-end;
}

.view-btn {
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  color: var(--vp-c-brand-1);
  letter-spacing: 1px;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.25s;
}

.record-card:hover .view-btn {
  opacity: 1;
  transform: translateX(0);
}

.skeleton {
  height: 140px;
  background: var(--vp-c-bg-mute);
  animation: pulse 2s infinite;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--vp-c-text-3);
  border: 1px dashed var(--vp-c-divider);
  font-family: 'Courier New', monospace;
}
</style>

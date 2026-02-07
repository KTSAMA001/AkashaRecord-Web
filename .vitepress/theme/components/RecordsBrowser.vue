<script setup lang="ts">
/**
 * RecordsBrowser Component
 * 记录总览浏览器：支持标签筛选、搜索和卡片展示
 */
import { ref, computed, onMounted } from 'vue'

interface FileInfo {
  title: string
  link: string
  status?: string
}

interface TagData {
  name: string
  count: number
  files: FileInfo[]
}

const tags = ref<TagData[]>([])
const selectedTag = ref<string>('All')
const searchQuery = ref('')
const loading = ref(true)

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
    const res = await fetch('/api/tags.json')
    if (res.ok) {
      tags.value = await res.json()
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

function getStatusColor(status?: string) {
  if (status?.includes('验证')) return 'success'
  if (status?.includes('废弃') || status?.includes('过时')) return 'danger'
  if (status?.includes('草稿') || status?.includes('WIP')) return 'warning'
  return 'default'
}
</script>

<template>
  <div class="records-browser">
    <!-- 筛选工具栏 -->
    <div class="filter-bar">
      <div class="tag-scroller">
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
          {{ tag.name }}
          <span class="count">{{ tag.count }}</span>
        </button>
      </div>
      
      <!-- 搜索框 -->
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索记录..."
        />
      </div>
    </div>

    <!-- 结果统计 -->
    <div class="status-bar">
      <span>// FOUND {{ filteredRecords.length }} RECORDS</span>
      <span v-if="selectedTag !== 'All'">FILTER: [{{ selectedTag }}]</span>
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
          <span class="icon">📄</span>
          <span 
            v-if="record.status" 
            class="status-dot" 
            :class="getStatusColor(record.status)"
            :title="record.status"
          ></span>
        </div>
        <div class="card-body">
          <h4 class="title">{{ record.title }}</h4>
          <div class="code-path">{{ record.link }}</div>
        </div>
        <div class="card-footer">
          <span class="view-btn">VIEW_LOG</span>
        </div>
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
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.tag-scroller {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
}

/* 工业风滚动条 */
.tag-scroller::-webkit-scrollbar {
  height: 4px;
}
.tag-scroller::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
}

.filter-tag {
  white-space: nowrap;
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
}

.filter-tag:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
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

.record-card {
  display: block;
  text-decoration: none;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  padding: 1.25rem;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.record-card:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
}
.status-dot.success { background: #10b981; box-shadow: 0 0 5px #10b981; }
.status-dot.danger { background: #ef4444; }
.status-dot.warning { background: #f59e0b; }

.title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.code-path {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  word-break: break-all;
}

.card-footer {
  margin-top: 1rem;
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
}

.skeleton {
  height: 140px;
  background: var(--vp-c-bg-mute);
  animation: pulse 2s infinite;
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
}
</style>

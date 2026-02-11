<script setup lang="ts">
/**
 * RecordsBrowser Component
 * 记录总览浏览器：支持标签筛选、搜索和卡片展示
 * 状态颜色完全由 meta-schema.json 驱动，无硬编码
 */
import { ref, computed, onMounted, watch, nextTick } from 'vue'

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

type ViewMode = 'grid' | 'list'

const tags = ref<TagData[]>([])
const tagMeta = ref<Record<string, { label: string; icon: string }>>({})
const statusDefs = ref<StatusDef[]>([])
const selectedTags = ref<Set<string>>(new Set())
const searchQuery = ref('')
const loading = ref(true)
const tagsExpanded = ref(false)
const cardVisible = ref(false)

function loadViewMode(): ViewMode {
  if (typeof localStorage === 'undefined') return 'grid'
  const stored = localStorage.getItem('ak-view-mode')
  return stored === 'list' ? 'list' : 'grid'
}
const viewMode = ref<ViewMode>(loadViewMode())

function setViewMode(mode: ViewMode) {
  viewMode.value = mode
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ak-view-mode', mode)
  }
}

// 卡片入场动画控制：筛选变化时重置动画
watch([selectedTags, searchQuery], async () => {
  cardVisible.value = false
  await nextTick()
  requestAnimationFrame(() => { cardVisible.value = true })
})

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

// 根据当前筛选条件过滤记录（多标签交集）
const filteredRecords = computed(() => {
  let records: FileInfo[] = []
  const sel = selectedTags.value

  if (sel.size === 0) {
    records = allRecords.value
  } else {
    // 交集：记录必须同时属于所有选中标签
    const tagArrays = [...sel]
      .map(name => tags.value.find(t => t.name === name))
      .filter(Boolean) as TagData[]
    if (tagArrays.length === 0) return []

    // 以最小的标签文件列表为基准，做交集
    tagArrays.sort((a, b) => a.files.length - b.files.length)
    const baseFiles = tagArrays[0].files
    const otherSets = tagArrays.slice(1).map(t => new Set(t.files.map(f => f.link)))
    records = baseFiles.filter(f => otherSets.every(s => s.has(f.link)))
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
    
    // 从 URL 参数初始化选中标签（支持逗号分隔多选）
    const params = new URLSearchParams(window.location.search)
    const urlTags = params.get('tags')
    if (urlTags) {
      const names = urlTags.split(',').filter(n => tags.value.some(t => t.name === n))
      if (names.length) selectedTags.value = new Set(names)
    } else {
      // 兼容旧版单选参数
      const urlTag = params.get('tag')
      if (urlTag && tags.value.some(t => t.name === urlTag)) {
        selectedTags.value = new Set([urlTag])
      }
    }
  } finally {
    loading.value = false
    await nextTick()
    cardVisible.value = true
  }
})

function toggleTag(tagName: string) {
  const next = new Set(selectedTags.value)
  if (next.has(tagName)) {
    next.delete(tagName)
  } else {
    next.add(tagName)
  }
  selectedTags.value = next
  syncUrl()
}

function clearTags() {
  selectedTags.value = new Set()
  syncUrl()
}

function syncUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete('tag') // 清理旧参数
  if (selectedTags.value.size > 0) {
    url.searchParams.set('tags', [...selectedTags.value].join(','))
  } else {
    url.searchParams.delete('tags')
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
          :class="{ active: selectedTags.size === 0 }"
          @click="clearTags()"
        >
          ALL
        </button>
        <button 
          v-for="tag in tags" 
          :key="tag.name"
          class="filter-tag"
          :class="{ active: selectedTags.has(tag.name) }"
          @click="toggleTag(tag.name)"
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
        <!-- 视图切换 -->
        <div class="view-toggle">
          <button 
            class="view-btn-toggle" 
            :class="{ active: viewMode === 'grid' }"
            @click="setViewMode('grid')"
            title="网格视图"
            aria-label="网格视图"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0.5" y="0.5" width="5" height="5" rx="0.5" stroke="currentColor"/><rect x="8.5" y="0.5" width="5" height="5" rx="0.5" stroke="currentColor"/><rect x="0.5" y="8.5" width="5" height="5" rx="0.5" stroke="currentColor"/><rect x="8.5" y="8.5" width="5" height="5" rx="0.5" stroke="currentColor"/></svg>
          </button>
          <button 
            class="view-btn-toggle" 
            :class="{ active: viewMode === 'list' }"
            @click="setViewMode('list')"
            title="列表视图"
            aria-label="列表视图"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0.5" y="1" width="13" height="2.5" rx="0.5" stroke="currentColor"/><rect x="0.5" y="5.75" width="13" height="2.5" rx="0.5" stroke="currentColor"/><rect x="0.5" y="10.5" width="13" height="2.5" rx="0.5" stroke="currentColor"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 结果统计 -->
    <div class="status-bar">
      <span>// FOUND {{ filteredRecords.length }} RECORDS</span>
      <span v-if="selectedTags.size > 0">FILTER: [{{ [...selectedTags].map(t => displayName(t)).join(' + ') }}]</span>
      <!-- 状态图例 -->
      <div class="status-legend">
        <span class="legend-item" v-for="def in statusDefs.filter((v, i, a) => a.findIndex(d => d.color === v.color) === i)" :key="def.color">
          <span class="status-dot legend-dot" :class="def.color"></span>
          <span class="legend-label">{{ { success: '已验证', info: '有效', warning: '待验证', danger: '已过时' }[def.color] || def.label }}</span>
        </span>
      </div>
    </div>

    <!-- 骨架屏加载中 -->
    <div v-if="loading" class="grid-container">
      <div v-for="i in 6" :key="i" class="record-card skeleton">
        <div class="skeleton-header">
          <div class="skeleton-icon"></div>
          <div class="skeleton-dot"></div>
        </div>
        <div class="skeleton-body">
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
        <div class="skeleton-footer">
          <div class="skeleton-line skeleton-line--btn"></div>
        </div>
      </div>
    </div>

    <!-- 记录列表（交错淡入） -->
    <!-- 网格视图 -->
    <div v-if="!loading && viewMode === 'grid'" class="grid-container" :class="{ 'cards-visible': cardVisible }">
      <a 
        v-for="(record, idx) in filteredRecords" 
        :key="record.link" 
        :href="record.link"
        class="record-card card-enter"
        :style="{ '--enter-delay': `${Math.min(idx * 50, 600)}ms` }"
      >
        <div class="card-header">
          <span class="card-icon" :style="{ '-webkit-mask-image': `url(${getRecordIcon(record)})`, 'mask-image': `url(${getRecordIcon(record)})` }" />
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

    <!-- 列表视图 -->
    <div v-if="!loading && viewMode === 'list'" class="list-container" :class="{ 'cards-visible': cardVisible }">
      <a 
        v-for="(record, idx) in filteredRecords" 
        :key="record.link" 
        :href="record.link"
        class="list-row card-enter"
        :style="{ '--enter-delay': `${Math.min(idx * 30, 400)}ms`, '--list-icon-url': `url(${getRecordIcon(record)})` }"
      >
        <span class="list-icon" />
        <span 
          v-if="record.status" 
          class="status-dot" 
          :class="getStatusColor(record.status)"
          :title="record.status"
        ></span>
        <span class="list-title">{{ record.title }}</span>
        <span class="list-tags" v-if="record.tags">
          <span class="list-tag" v-for="(t, ti) in record.tags.slice(0, 3)" :key="`${t}-${ti}`">{{ displayName(t) }}</span>
        </span>
        <span class="list-path">{{ record.link }}</span>
        <span class="list-arrow">→</span>
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
  max-height: none;
  overflow: visible;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-cloud:not(.expanded) {
  max-height: 12rem;
  overflow: hidden;
}

.tag-cloud.expanded {
  max-height: none;
  overflow: visible;
}

@media (max-width: 640px) {
  .tag-cloud:not(.expanded) {
    max-height: 10rem;
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.6rem;
  flex-wrap: wrap;
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
  background: var(--ak-accent);
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

.search-box {
  flex: 1;
  min-width: 120px;
  max-width: 240px;
}

.search-box input {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  width: 100%;
  font-size: 0.9rem;
  box-sizing: border-box;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
}

.search-box input:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}

/* ======= 视图切换按钮 ======= */
.view-toggle {
  display: flex;
  gap: 2px;
  border: 1px solid var(--vp-c-divider);
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
}

.view-btn-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  background: var(--vp-c-bg-soft);
  border: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: all 0.25s;
}

.view-btn-toggle:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-mute);
}

.view-btn-toggle.active {
  color: var(--ak-accent);
  background: color-mix(in srgb, var(--ak-accent) 12%, var(--vp-c-bg-soft));
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
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-legend {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  opacity: 0.7;
  transition: opacity 0.3s;
}

.status-legend:hover {
  opacity: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.legend-dot {
  width: 6px !important;
  height: 6px !important;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* ======= 列表视图 ======= */
.list-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--vp-c-divider);
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  overflow: hidden;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  text-decoration: none;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.list-row:last-child {
  border-bottom: none;
}

.list-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--ak-accent);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 0.25s ease;
}

.list-row:hover {
  background: color-mix(in srgb, var(--ak-accent) 6%, var(--vp-c-bg-soft));
  padding-left: calc(1rem + 4px);
}

.list-row:hover::before {
  transform: scaleY(1);
}

.list-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  -webkit-mask-image: var(--list-icon-url);
  mask-image: var(--list-icon-url);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: var(--ak-accent);
  opacity: 0.7;
}

.list-row:hover .list-icon {
  opacity: 1;
}

.list-title {
  flex: 1;
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.25s;
  min-width: 0;
}

.list-row:hover .list-title {
  color: var(--ak-accent);
}

.list-tags {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.list-tag {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  white-space: nowrap;
  clip-path: polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px));
}

.list-path {
  font-family: monospace;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  flex-shrink: 0;
}

.list-arrow {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s;
  flex-shrink: 0;
}

.list-row:hover .list-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--ak-accent);
}

@media (max-width: 768px) {
  .list-tags, .list-path {
    display: none;
  }
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
  background: var(--ak-accent);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 0.3s ease;
  z-index: 2;
}

.record-card:hover {
  transform: translateX(4px);
  border-color: var(--ak-accent);
  box-shadow: 0 0 20px var(--ak-accent-dim),
              inset 0 0 20px color-mix(in srgb, var(--ak-accent) 8%, transparent);
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
    color-mix(in srgb, var(--ak-accent) 10%, transparent) 50%,
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
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: var(--ak-accent);
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
  color: var(--ak-accent);
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
  min-height: 160px;
  background: var(--vp-c-bg-mute);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.skeleton-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--vp-c-divider);
  animation: shimmer 1.5s infinite;
}

.skeleton-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  animation: shimmer 1.5s infinite 0.2s;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 0.8rem;
  border-radius: 3px;
  background: var(--vp-c-divider);
  animation: shimmer 1.5s infinite;
}

.skeleton-line--title { width: 75%; animation-delay: 0.1s; }
.skeleton-line--short { width: 50%; animation-delay: 0.3s; }
.skeleton-line--btn   { width: 30%; margin-left: auto; animation-delay: 0.5s; }

.skeleton-footer {
  margin-top: auto;
  padding-top: 0.8rem;
  border-top: 1px dashed var(--vp-c-divider);
}

@keyframes shimmer {
  0%   { opacity: 0.3; }
  50%  { opacity: 0.6; }
  100% { opacity: 0.3; }
}

/* 卡片入场交错动画 */
.card-enter {
  opacity: 0;
  transform: translateY(16px);
}

.cards-visible .card-enter {
  animation: cardFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: var(--enter-delay, 0ms);
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--vp-c-text-3);
  border: 1px dashed var(--vp-c-divider);
  font-family: 'Courier New', monospace;
}
</style>

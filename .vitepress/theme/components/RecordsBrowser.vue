<script setup lang="ts">
/**
 * RecordsBrowser Component
 * 记录总览浏览器：支持标签筛选、搜索和卡片展示
 * 状态颜色完全由 meta-schema.json 驱动，无硬编码
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

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

type SelectionMode = 'single' | 'multi'

const CARD_MIN_WIDTH = 280
const DEFAULT_CARD_HEIGHT = 180
const DEFAULT_GRID_GAP = 24
const OVERSCAN_ROWS = 3

const tags = ref<TagData[]>([])
const tagMeta = ref<Record<string, { label: string; icon: string }>>({})
const statusDefs = ref<StatusDef[]>([])
const selectedTags = ref<Set<string>>(new Set())
const selectionMode = ref<SelectionMode>('single')
const searchQuery = ref('')
const loading = ref(true)
const tagsExpanded = ref(false)
const cardVisible = ref(false)
const gridRef = ref<HTMLElement | null>(null)
const viewportTop = ref(0)
const viewportHeight = ref(0)
const gridTop = ref(0)
const gridWidth = ref(0)
const gridGap = ref(DEFAULT_GRID_GAP)
const cardHeight = ref(DEFAULT_CARD_HEIGHT)
const columnCount = ref(1)

let resizeObserver: ResizeObserver | null = null
let viewportFrame = 0

/** 判断标签是否匹配搜索词（匹配中文标签名或英文 key） */
function isTagMatch(tagName: string, query: string): boolean {
  const label = (tagMeta.value[tagName]?.label || '').toLowerCase()
  return tagName.toLowerCase().includes(query) || label.includes(query)
}

/** 根据搜索词过滤标签按钮 */
const filteredTags = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return tags.value
  return tags.value.filter(tag => isTagMatch(tag.name, q))
})

/** 搜索词匹配的标签名集合（用于记录匹配判定） */
const matchedTagNames = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return new Set<string>()
  const matched = new Set<string>()
  for (const tag of tags.value) {
    if (isTagMatch(tag.name, q)) matched.add(tag.name)
  }
  return matched
})

/** 每条记录的匹配原因（预计算，避免模板中重复调用） */
const matchReasonsMap = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const map = new Map<string, string[]>()
  if (!q) return map
  const mTags = matchedTagNames.value
  for (const record of filteredRecords.value) {
    const reasons: string[] = []
    if (record.title.toLowerCase().includes(q)) {
      reasons.push('标题匹配')
    }
    if (record.tags && record.tags.some(t => mTags.has(t))) {
      const matched = record.tags
        .filter(t => mTags.has(t))
        .map(t => tagMeta.value[t]?.label || t)
      reasons.push(`标签匹配: ${matched.join(', ')}`)
    }
    if (reasons.length) map.set(record.link, reasons)
  }
  return map
})

// 卡片入场动画控制：筛选变化时重置动画
watch([selectedTags, searchQuery], async () => {
  cardVisible.value = false
  await nextTick()
  refreshGridMetrics()
  requestAnimationFrame(() => { cardVisible.value = true })
})

watch(tagsExpanded, async () => {
  await nextTick()
  refreshGridMetrics()
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
    const mTags = matchedTagNames.value
    records = records.filter(r => {
      // 标题匹配
      if (r.title.toLowerCase().includes(q)) return true
      // 标签匹配：记录拥有的标签与搜索词匹配
      if (r.tags && r.tags.some(t => mTags.has(t))) return true
      return false
    })
  }

  return records
})

const rowStride = computed(() => cardHeight.value + gridGap.value)

const totalRows = computed(() => {
  return Math.ceil(filteredRecords.value.length / columnCount.value)
})

const virtualGridHeight = computed(() => {
  if (totalRows.value === 0) return 0
  return totalRows.value * cardHeight.value + Math.max(0, totalRows.value - 1) * gridGap.value
})

const startRow = computed(() => {
  if (!gridTop.value) return 0

  const raw = Math.floor((viewportTop.value - gridTop.value) / rowStride.value)
  return Math.max(0, raw - OVERSCAN_ROWS)
})

const endRow = computed(() => {
  if (!gridTop.value) return Math.min(totalRows.value, OVERSCAN_ROWS * 2 + 1)

  const raw = Math.ceil((viewportTop.value + viewportHeight.value - gridTop.value) / rowStride.value)
  return Math.min(totalRows.value, raw + OVERSCAN_ROWS)
})

const visibleRecords = computed(() => {
  const startIndex = startRow.value * columnCount.value
  const endIndex = Math.min(filteredRecords.value.length, endRow.value * columnCount.value)

  return filteredRecords.value.slice(startIndex, endIndex).map((record, offset) => {
    const index = startIndex + offset
    const row = Math.floor(index / columnCount.value)
    const column = index % columnCount.value
    const columnWidth = getColumnWidth()

    return {
      record,
      index,
      style: {
        top: `${row * rowStride.value}px`,
        left: `${column * (columnWidth + gridGap.value)}px`,
        width: `${columnWidth}px`,
        '--enter-delay': `${Math.min(offset * 50, 600)}ms`,
      },
    }
  })
})

const virtualGridStyle = computed(() => ({
  height: `${virtualGridHeight.value}px`,
}))

function getColumnWidth() {
  const columns = Math.max(1, columnCount.value)
  if (!gridWidth.value) return CARD_MIN_WIDTH
  return (gridWidth.value - gridGap.value * (columns - 1)) / columns
}

function readViewport() {
  if (typeof window === 'undefined') return

  viewportTop.value = window.scrollY
  viewportHeight.value = window.innerHeight
}

function updateViewport() {
  if (typeof window === 'undefined' || viewportFrame) return

  viewportFrame = window.requestAnimationFrame(() => {
    viewportFrame = 0
    readViewport()
  })
}

function updateGridMetrics() {
  if (typeof window === 'undefined' || !gridRef.value) return

  const rect = gridRef.value.getBoundingClientRect()
  const styles = window.getComputedStyle(gridRef.value)
  const gap = Number.parseFloat(styles.columnGap || styles.gap)
  const width = gridRef.value.clientWidth
  const measuredCard = gridRef.value.querySelector('.record-card') as HTMLElement | null
  const measuredHeight = measuredCard?.getBoundingClientRect().height

  gridTop.value = rect.top + window.scrollY
  gridWidth.value = width
  gridGap.value = Number.isFinite(gap) ? gap : DEFAULT_GRID_GAP
  cardHeight.value = measuredHeight && measuredHeight > 0 ? measuredHeight : DEFAULT_CARD_HEIGHT
  columnCount.value = Math.max(1, Math.floor((width + gridGap.value) / (CARD_MIN_WIDTH + gridGap.value)))
}

function refreshGridMetrics() {
  readViewport()
  updateGridMetrics()
}

function setupVirtualGrid() {
  if (typeof window === 'undefined') return

  refreshGridMetrics()

  window.addEventListener('scroll', updateViewport, { passive: true })
  window.addEventListener('resize', refreshGridMetrics)

  if ('ResizeObserver' in window && gridRef.value) {
    resizeObserver = new ResizeObserver(refreshGridMetrics)
    resizeObserver.observe(gridRef.value)
  }
}

onMounted(async () => {
  if (typeof document !== 'undefined') {
    document.body.classList.add('records-terminal-page')
  }

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
    
    // 从 URL 参数初始化选中标签（支持单选/多选和旧版 tag 参数）
    const params = new URLSearchParams(window.location.search)
    const requestedMode = params.get('mode')
    const urlTags = params.get('tags')
    if (urlTags) {
      const names = urlTags.split(',').filter(n => tags.value.some(t => t.name === n))
      if (requestedMode === 'multi' || names.length > 1) {
        selectionMode.value = 'multi'
        selectedTags.value = new Set(names)
      } else if (names.length) {
        selectionMode.value = 'single'
        selectedTags.value = new Set([names[0]])
      }
    } else {
      // 兼容旧版单选参数
      const urlTag = params.get('tag')
      if (urlTag && tags.value.some(t => t.name === urlTag)) {
        selectionMode.value = 'single'
        selectedTags.value = new Set([urlTag])
      }
    }
  } finally {
    loading.value = false
    await nextTick()
    setupVirtualGrid()
    cardVisible.value = true
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', updateViewport)
    window.removeEventListener('resize', refreshGridMetrics)
    if (viewportFrame) {
      window.cancelAnimationFrame(viewportFrame)
      viewportFrame = 0
    }
  }

  if (typeof document !== 'undefined') {
    document.body.classList.remove('records-terminal-page')
  }

  resizeObserver?.disconnect()
  resizeObserver = null
})

function toggleTag(tagName: string) {
  if (selectionMode.value === 'single') {
    selectedTags.value = selectedTags.value.has(tagName) ? new Set() : new Set([tagName])
    syncUrl()
    return
  }

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

function setSelectionMode(mode: SelectionMode) {
  if (selectionMode.value === mode) return

  selectionMode.value = mode

  if (mode === 'single' && selectedTags.value.size > 1) {
    const selected = [...selectedTags.value]
    const keep = selected[selected.length - 1]
    selectedTags.value = keep ? new Set([keep]) : new Set()
  }

  syncUrl()
}

function syncUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete('tag') // 清理旧参数
  if (selectionMode.value === 'multi') {
    url.searchParams.set('mode', 'multi')
  } else {
    url.searchParams.delete('mode')
  }

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
      <!-- 标签搜索 + 操作栏 -->
      <div class="filter-actions">
        <button class="expand-btn" @click="tagsExpanded = !tagsExpanded">
          {{ tagsExpanded ? '▲ COLLAPSE' : '▼ MORE_TAGS' }}
        </button>
        <div class="selection-mode" role="group" aria-label="标签选择模式">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: selectionMode === 'single' }"
            :aria-pressed="selectionMode === 'single'"
            @click="setSelectionMode('single')"
          >
            SINGLE
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: selectionMode === 'multi' }"
            :aria-pressed="selectionMode === 'multi'"
            @click="setSelectionMode('multi')"
          >
            MULTI
          </button>
        </div>
      <!-- 统一搜索框（同时搜索标签和记录） -->
        <div class="search-box unified-search">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索标签或记录..."
          />
        </div>
      </div>
      <div class="tag-cloud" :class="{ expanded: tagsExpanded }">
        <button 
          class="filter-tag" 
          :class="{ active: selectedTags.size === 0 }"
          @click="clearTags()"
        >
          ALL
        </button>
        <button 
          v-for="tag in filteredTags" 
          :key="tag.name"
          class="filter-tag"
          :class="{ active: selectedTags.has(tag.name) }"
          @click="toggleTag(tag.name)"
        >
          {{ displayName(tag.name) }}
          <span class="count">{{ tag.count }}</span>
        </button>
      </div>
      <span v-if="searchQuery && filteredTags.length === 0" class="tag-no-match">
        未找到匹配的标签
      </span>
    </div>

    <!-- 结果统计 -->
    <div class="status-bar">
      <span>// FOUND {{ filteredRecords.length }} RECORDS</span>
      <span v-if="searchQuery.trim()" class="match-info">
        SEARCH: "{{ searchQuery.trim() }}"
        <template v-if="matchedTagNames.size > 0">
          | 匹配标签: {{ [...matchedTagNames].map(t => displayName(t)).join(', ') }}
        </template>
      </span>
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
    <div
      v-else
      ref="gridRef"
      class="grid-container virtual-grid"
      :class="{ 'cards-visible': cardVisible }"
      :style="virtualGridStyle"
    >
      <a
        v-for="item in visibleRecords"
        :key="item.record.link"
        :href="item.record.link"
        class="record-card card-enter"
        :style="item.style"
      >
        <div class="card-header">
          <span class="card-icon" :style="{ '-webkit-mask-image': `url(${getRecordIcon(item.record)})`, 'mask-image': `url(${getRecordIcon(item.record)})` }" />
          <span 
            v-if="item.record.status" 
            class="status-dot" 
            :class="getStatusColor(item.record.status)"
            :title="item.record.status"
          ></span>
        </div>
        <div class="card-body">
          <h4 class="title">{{ item.record.title }}</h4>
          <div class="code-path" :title="item.record.link">{{ item.record.link }}</div>
          <div v-if="searchQuery.trim() && matchReasonsMap.get(item.record.link)?.length" class="match-reasons">
            <span v-for="reason in matchReasonsMap.get(item.record.link)" :key="reason" class="match-badge">{{ reason }}</span>
          </div>
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

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
  flex-wrap: wrap;
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

.selection-mode {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px));
}

.mode-btn {
  min-width: 64px;
  padding: 0.25rem 0.6rem;
  border: 0;
  border-right: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  line-height: 1.2;
  transition: color 0.25s, background 0.25s;
}

.mode-btn:last-child {
  border-right: 0;
}

.mode-btn:hover {
  color: var(--vp-c-brand-1);
}

.mode-btn.active {
  background: var(--vp-c-brand-1);
  color: white;
}

/* ======= 统一搜索框 ======= */
.unified-search {
  flex: 1;
  min-width: 160px;
  max-width: 320px;
}

.tag-no-match {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  padding: 0.3rem 0.8rem;
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
  transform: translateX(4px);
}

.filter-tag:hover::before {
  transform: scaleY(1);
}

.filter-tag.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
  transform: translateX(4px);
}

.filter-tag .count {
  font-size: 0.7rem;
  opacity: 0.7;
}

.search-box {
  min-width: 120px;
}

.search-box input {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  width: 100%;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  box-sizing: border-box;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
}

.search-box input:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}

/* ======= 匹配信息 ======= */
.match-info {
  font-size: 0.75rem;
  color: var(--ak-accent);
}

.match-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 0.4rem;
}

.match-badge {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  padding: 1px 6px;
  border: 1px solid var(--ak-accent-dim);
  color: var(--ak-accent);
  background: color-mix(in srgb, var(--ak-accent) 8%, transparent);
  clip-path: polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px));
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

.virtual-grid {
  display: block;
  position: relative;
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
  content-visibility: auto;
  contain-intrinsic-size: 180px;
}

.virtual-grid .record-card {
  position: absolute;
  height: 180px;
  box-sizing: border-box;
  will-change: transform, opacity;
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
  margin-top: 16px;
}

.cards-visible .card-enter {
  animation: cardFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: var(--enter-delay, 0ms);
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
    margin-top: 0;
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

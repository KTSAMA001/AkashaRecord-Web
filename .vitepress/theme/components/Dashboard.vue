<script setup lang="ts">
/**
 * 首页仪表盘组件 - 终端风格重写版
 * 显示系统状态、收录总量与快速入口
 */
import { ref, onMounted, computed } from 'vue'

const totalRecords = ref(0)
const isVisible = ref(false)
const dashboardRef = ref<HTMLElement | null>(null)

// 补零格式化 (0000)
const formattedTotal = computed(() => {
  return totalRecords.value.toString().padStart(3, '0')
})

onMounted(async () => {
  // 获取统计数据
  try {
    const res = await fetch('/api/stats.json')
    if (res.ok) {
      const json = await res.json()
      // 简单的数字动画效果
      const target = json.total || 0
      let start = 0
      const duration = 1000
      const step = (timestamp: number) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        totalRecords.value = Math.floor(progress * target)
        if (progress < 1) {
          window.requestAnimationFrame(step)
        } else {
          totalRecords.value = target
        }
      }
      window.requestAnimationFrame(step)
    }
  } catch {
    // 失败静默处理
  }

  // 视口检测触发入场动画
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      isVisible.value = true
      observer.disconnect()
    }
  }, { threshold: 0.15 })
  
  if (dashboardRef.value) {
    observer.observe(dashboardRef.value)
  }
})
</script>

<template>
  <div ref="dashboardRef" class="dashboard-terminal" :class="{ 'is-active': isVisible }">
    <!-- 顶部装饰栏 -->
    <div class="terminal-header">
      <div class="header-left">
        <span class="status-dot"></span>
        <span class="header-title">SYSTEM_MONITOR</span>
      </div>
      <div class="header-line"></div>
      <div class="header-right">V.2.1.0</div>
    </div>

    <div class="terminal-content">
      <!-- 左侧：状态模块 -->
      <div class="module status-module">
        <div class="module-label">// STATUS</div>
        <div class="status-list">
          <div class="status-item">
            <span class="item-label">CORE:</span>
            <span class="item-val success">ONLINE</span>
          </div>
          <div class="status-item">
            <span class="item-label">SYNC:</span>
            <span class="item-val">READY</span>
          </div>
          <div class="status-item">
            <span class="item-label">SECURE:</span>
            <span class="item-val warning">TRUE</span>
          </div>
        </div>
        <!-- 装饰性十六进制网格 -->
        <div class="hex-grid"></div>
      </div>

      <!-- 中间：核心数据模块 -->
      <div class="module data-module">
        <div class="module-label">// RECORDS_INDEXED</div>
        <div class="digit-display">
          <span class="digit-value">{{ formattedTotal }}</span>
          <span class="digit-unit">UNIT</span>
        </div>
        <div class="data-bar-container">
          <div class="data-bar"></div>
        </div>
      </div>

      <!-- 右侧：入口模块 -->
      <div class="module action-module">
        <div class="module-label">// NAVIGATION</div>
        <a href="/records/" class="access-btn">
          <div class="btn-content">
            <span class="btn-text">INITIATE_ACCESS</span>
            <span class="btn-icon">➜</span>
          </div>
          <div class="btn-bg"></div>
        </a>
        <div class="sub-link-container">
             <a href="https://space.bilibili.com/12822357" target="_blank" class="sub-link">EXT_LINK: BILIBILI</a>
        </div>
      </div>
    </div>

    <!-- 底部装饰栏 -->
    <div class="terminal-footer">
      <span class="footer-code">Op.NO: 75-32-9</span>
      <span class="footer-msg">NO THREATS DETECTED</span>
    </div>
  </div>
</template>

<style scoped>
/* 字体统一 */
.dashboard-terminal {
  font-family: 'Courier New', monospace;
  max-width: 960px;
  margin: 0 auto 2rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--ak-border);
  position: relative;
  /* 切角效果 */
  clip-path: polygon(
    0 20px, 
    20px 0, 
    100% 0, 
    100% calc(100% - 20px), 
    calc(100% - 20px) 100%, 
    0 100%
  );
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.dashboard-terminal.is-active {
  opacity: 1;
  transform: translateY(0);
}

.dashboard-terminal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--ak-accent);
  opacity: 0.5;
}

/* ======= Header ======= */
.terminal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  font-size: 0.75rem;
  color: var(--ak-accent);
  opacity: 0.8;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--ak-accent);
  margin-right: 8px;
  box-shadow: 0 0 5px var(--ak-accent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.header-line {
  flex: 1;
  height: 1px;
  background: var(--ak-border);
  position: relative;
}

/* 进度条装饰 */
.header-line::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  background: var(--ak-accent);
  transition: width 1.5s ease-out;
}
.is-active .header-line::after {
  width: 100%;
}

/* ======= Grid Content ======= */
.terminal-content {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 1.5rem;
}

.module {
  position: relative;
}

.module-label {
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  margin-bottom: 0.8rem;
  letter-spacing: 0.1em;
}

/* Status Module */
.status-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 0.2rem;
}

.item-val.success { color: var(--ak-accent); }
.item-val.warning { color: #eab308; }

/* Data Module */
.data-module {
  text-align: center;
  border-left: 1px solid var(--vp-c-divider);
  border-right: 1px solid var(--vp-c-divider);
}

.digit-display {
  font-family: 'Orbitron', 'Courier New', monospace;
  font-size: 3.5rem;
  font-weight: 400;
  line-height: 1;
  color: var(--ak-accent);
  text-shadow: 0 0 10px var(--ak-accent-dim);
  margin: 1rem 0;
}

.digit-unit {
  font-size: 0.7rem;
  vertical-align: super;
  margin-left: 0.5rem;
  opacity: 0.6;
}

.data-bar-container {
  width: 60%;
  height: 4px;
  background: var(--vp-c-divider);
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.data-bar {
  height: 100%;
  width: 100%;
  background: var(--ak-accent);
  transform: translateX(-100%);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Action Module */
.access-btn {
  display: block;
  position: relative;
  text-decoration: none;
  height: 3rem;
  border: 1px solid var(--ak-accent);
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  color: var(--ak-accent);
}

.btn-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--ak-accent);
  transform: translateX(-101%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.access-btn:hover {
  box-shadow: 0 0 15px var(--ak-accent-dim);
}

.access-btn:hover .btn-bg {
  transform: translateX(0);
}

.access-btn:hover .btn-content {
  color: var(--vp-c-bg);
}

.sub-link-container {
    margin-top: 0.8rem;
    text-align: right;
}

.sub-link {
    font-size: 0.7rem;
    color: var(--vp-c-text-3);
    text-decoration: none;
    transition: color 0.3s;
}

.sub-link:hover {
    color: var(--ak-accent);
    text-decoration: underline;
}

/* ======= Footer ======= */
.terminal-footer {
  margin-top: 2rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  opacity: 0.6;
}

/* ======= Mobile ======= */
@media (max-width: 768px) {
  .terminal-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .data-module {
    border-left: none;
    border-right: none;
    border-top: 1px solid var(--vp-c-divider);
    border-bottom: 1px solid var(--vp-c-divider);
    padding: 1.5rem 0;
  }
}
</style>

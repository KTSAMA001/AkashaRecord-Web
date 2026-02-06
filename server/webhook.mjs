/**
 * GitHub Webhook 接收服务
 * 监听阿卡西记录仓库的 push 事件，自动拉取并重新构建网站
 * 
 * 启动方式：pm2 start server/webhook.mjs --name akasha-webhook
 * 
 * 环境变量：
 *   WEBHOOK_SECRET  - GitHub Webhook Secret（可选，推荐设置）
 *   WEBHOOK_PORT    - 监听端口（默认 3721）
 *   PROJECT_DIR     - 项目根目录（默认自动检测）
 */

import express from 'express'
import crypto from 'node:crypto'
import { execSync, exec } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_DIR = process.env.PROJECT_DIR || path.resolve(__dirname, '..')
const PORT = parseInt(process.env.WEBHOOK_PORT || '3721', 10)
const SECRET = process.env.WEBHOOK_SECRET || ''

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ====== 构建锁 ======
let isBuilding = false
let pendingBuild = false

/**
 * 验证 GitHub Webhook 签名
 */
function verifySignature(req) {
  if (!SECRET) return true // 未设置 secret 则跳过验证

  const signature = req.headers['x-hub-signature-256']
  if (!signature) return false

  const hmac = crypto.createHmac('sha256', SECRET)
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

/**
 * 执行构建流程
 */
async function runBuild() {
  if (isBuilding) {
    pendingBuild = true
    console.log('⏳ 构建进行中，已排队等待...')
    return
  }

  isBuilding = true
  const startTime = Date.now()
  console.log(`\n${'='.repeat(50)}`)
  console.log(`🔄 开始构建 - ${new Date().toLocaleString('zh-CN')}`)
  console.log('='.repeat(50))

  try {
    // Step 1: 同步内容
    console.log('📥 Step 1/2: 同步阿卡西记录内容...')
    execSync('node scripts/sync-content.mjs', {
      cwd: PROJECT_DIR,
      stdio: 'inherit',
      timeout: 60000, // 60 秒超时
    })

    // Step 2: 构建 VitePress
    console.log('🔨 Step 2/2: 构建 VitePress 站点...')
    execSync('./node_modules/.bin/vitepress build', {
      cwd: PROJECT_DIR,
      stdio: 'inherit',
      timeout: 120000, // 120 秒超时
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1024' },
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✅ 构建完成！耗时 ${elapsed}s`)

  } catch (error) {
    console.error('❌ 构建失败:', error.message)
  } finally {
    isBuilding = false

    // 如果有排队的构建任务
    if (pendingBuild) {
      pendingBuild = false
      console.log('🔄 执行排队的构建任务...')
      setTimeout(runBuild, 2000)
    }
  }
}

// ====== 路由 ======

// GitHub Webhook 端点
app.post('/webhook', (req, res) => {
  // 验证签名
  if (!verifySignature(req)) {
    console.warn('⚠️ Webhook 签名验证失败')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = req.headers['x-github-event']
  const payload = req.body

  console.log(`📨 收到 GitHub 事件: ${event}`)

  // 只处理 push 事件
  if (event === 'push') {
    const branch = payload.ref?.replace('refs/heads/', '') || ''
    console.log(`  分支: ${branch}`)
    console.log(`  提交: ${payload.head_commit?.message || 'unknown'}`)

    // 只处理主分支
    if (branch === 'master' || branch === 'main') {
      res.status(200).json({ message: 'Build triggered' })
      // 异步执行构建
      runBuild()
    } else {
      res.status(200).json({ message: `Ignored branch: ${branch}` })
    }
  } else if (event === 'ping') {
    console.log('  🏓 Ping received')
    res.status(200).json({ message: 'pong' })
  } else {
    res.status(200).json({ message: `Ignored event: ${event}` })
  }
})

// 健康检查端点
app.get('/webhook/health', (req, res) => {
  res.json({
    status: 'ok',
    building: isBuilding,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// 手动触发构建（需要在服务器上 curl 触发）
app.post('/webhook/rebuild', (req, res) => {
  // 仅允许本地访问
  const ip = req.ip || req.connection.remoteAddress
  if (ip !== '127.0.0.1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
    return res.status(403).json({ error: 'Local access only' })
  }

  console.log('🔧 手动触发构建')
  res.json({ message: 'Build triggered manually' })
  runBuild()
})

// ====== 启动服务器 ======
app.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔══════════════════════════════════════════╗
║   阿卡西记录 Webhook 服务已启动          ║
║   端口: ${PORT}                            ║
║   状态: 运行中                            ║
║   健康检查: http://127.0.0.1:${PORT}/webhook/health  ║
╚══════════════════════════════════════════╝
  `)

  // 启动时执行一次构建
  console.log('🚀 启动时执行初始构建...')
  runBuild()
})

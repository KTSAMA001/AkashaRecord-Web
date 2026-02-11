/**
 * GitHub Webhook 接收服务
 * 监听两个仓库的 push 事件，智能判断构建策略：
 *   - Web 仓库 push → 完整构建（git pull + npm install + sync + build）
 *   - 阿卡西记录 push + data/ 变更 → 轻量构建（sync + build，跳过 web git pull/npm install）
 *   - 阿卡西记录 push + 仅改 SKILL.md/references 等 → 跳过构建
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
let pendingBuild = null // { mode: 'full' | 'content' }

// 阿卡西记录仓库名（用于区分 webhook 来源）
const AKASHA_REPO_NAME = 'KTSAMA001/AgentSkill-Akasha-KT'

/**
 * 分析阿卡西记录 push 的变更文件，决定构建策略
 * @param {object} payload - GitHub webhook payload
 * @returns {'content'|'skip'} content=需要sync+build, skip=无需构建
 */
function analyzeAkashaChanges(payload) {
  const commits = payload.commits || []
  const allFiles = new Set()

  for (const commit of commits) {
    ;(commit.added || []).forEach(f => allFiles.add(f))
    ;(commit.removed || []).forEach(f => allFiles.add(f))
    ;(commit.modified || []).forEach(f => allFiles.add(f))
  }

  if (allFiles.size === 0) {
    console.log('  📋 无变更文件，跳过构建')
    return 'skip'
  }

  // 检查是否有 data/ 目录下的文件变更（这些才会发布到网站）
  // 也包括 references/INDEX.md（影响分类索引生成）
  // 以及 record-template.md（Schema 定义）和 tag-registry.md（标签元数据）
  const publishedFiles = [...allFiles].filter(f =>
    f.startsWith('data/') ||
    f === 'references/INDEX.md' ||
    f === 'references/templates/record-template.md' ||
    f === 'references/tag-registry.md'
  )

  console.log(`  📋 变更文件 ${allFiles.size} 个，其中影响网站的 ${publishedFiles.length} 个`)

  if (publishedFiles.length > 0) {
    console.log(`  📂 影响网站的文件:`)
    publishedFiles.slice(0, 10).forEach(f => console.log(`     - ${f}`))
    if (publishedFiles.length > 10) console.log(`     ... 及其他 ${publishedFiles.length - 10} 个`)
    return 'content'
  }

  // 只改了 SKILL.md / references/workflows/ 等非发布文件
  console.log('  📋 变更仅涉及非发布文件（SKILL.md/workflows等），跳过构建')
  return 'skip'
}

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
 * @param {'full'|'content'} mode
 *   - full: 完整构建（Web 仓库 push 触发）
 *   - content: 轻量构建（阿卡西记录 data/ 变更触发，跳过 web git pull + npm install）
 */
async function runBuild(mode = 'full') {
  if (isBuilding) {
    // 排队时优先级提升：如果新请求是 full 则覆盖排队中的 content
    if (!pendingBuild || mode === 'full') {
      pendingBuild = { mode }
    }
    console.log(`⏳ 构建进行中，已排队等待（模式: ${pendingBuild.mode}）...`)
    return
  }

  isBuilding = true
  const startTime = Date.now()
  const modeLabel = mode === 'full' ? '完整构建' : '轻量构建（仅内容同步）'
  console.log(`\n${'='.repeat(50)}`)
  console.log(`🔄 开始${modeLabel} - ${new Date().toLocaleString('zh-CN')}`)
  console.log('='.repeat(50))

  try {
    let step = 0
    const totalSteps = mode === 'full' ? 4 : 2

    if (mode === 'full') {
      // Step 0: 拉取网站仓库最新代码（favicon、脚本、配置等变更）
      step++
      console.log(`📥 Step ${step}/${totalSteps}: 拉取网站仓库最新代码...`)
      try {
        execSync('git checkout . && git clean -fd && git pull --ff-only', {
          cwd: PROJECT_DIR,
          stdio: 'inherit',
          timeout: 60000,
        })
      } catch (pullErr) {
        console.warn('⚠️ git pull 失败，尝试 fetch + reset...')
        execSync('git fetch origin && git reset --hard origin/main', {
          cwd: PROJECT_DIR,
          stdio: 'inherit',
          timeout: 60000,
        })
      }

      // Step 1: 安装/更新依赖（package.json 可能变更）
      step++
      console.log(`📦 Step ${step}/${totalSteps}: 检查依赖...`)
      execSync('npm install --production=false', {
        cwd: PROJECT_DIR,
        stdio: 'inherit',
        timeout: 120000,
      })
    }

    // 同步阿卡西记录内容
    step++
    console.log(`📥 Step ${step}/${totalSteps}: 同步阿卡西记录内容...`)
    execSync('node scripts/sync-content.mjs', {
      cwd: PROJECT_DIR,
      stdio: 'inherit',
      timeout: 120000,
      env: { ...process.env, GITHUB_MIRROR: process.env.GITHUB_MIRROR || '' },
    })

    // 构建 VitePress
    step++
    console.log(`🔨 Step ${step}/${totalSteps}: 构建 VitePress 站点...`)
    execSync('./node_modules/.bin/vitepress build', {
      cwd: PROJECT_DIR,
      stdio: 'inherit',
      timeout: 120000,
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1024' },
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✅ ${modeLabel}完成！耗时 ${elapsed}s`)

  } catch (error) {
    console.error('❌ 构建失败:', error.message)
  } finally {
    isBuilding = false

    // 如果有排队的构建任务
    if (pendingBuild) {
      const nextMode = pendingBuild.mode
      pendingBuild = null
      console.log(`🔄 执行排队的构建任务（模式: ${nextMode}）...`)
      setTimeout(() => runBuild(nextMode), 2000)
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
    const repoName = payload.repository?.full_name || 'unknown'
    const commitMsg = payload.head_commit?.message || 'unknown'
    console.log(`  仓库: ${repoName}`)
    console.log(`  分支: ${branch}`)
    console.log(`  提交: ${commitMsg}`)

    // 只处理主分支
    if (branch === 'master' || branch === 'main') {
      // 判断来源仓库，决定构建策略
      if (repoName === AKASHA_REPO_NAME) {
        // 阿卡西记录仓库 → 分析变更文件决定是否需要构建
        const action = analyzeAkashaChanges(payload)
        if (action === 'skip') {
          console.log('  ⏭️ 无需构建，跳过')
          return res.status(200).json({ message: 'Skipped: no publishable changes' })
        }
        res.status(200).json({ message: 'Content build triggered' })
        runBuild('content')
      } else {
        // Web 仓库或其他 → 完整构建
        res.status(200).json({ message: 'Full build triggered' })
        runBuild('full')
      }
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

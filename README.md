# AkashaRecord-Web

阿卡西记录的可交互网站，基于 [VitePress](https://vitepress.dev/) 构建。

自动从 [AgentSkill-Akasha-KT](https://github.com/KTSAMA001/AgentSkill-Akasha-KT) 仓库同步内容，渲染为美观的文档站点。

## 特性

- 📝 自动分类导航（经验 / 知识 / 创意）
- 🔍 全文搜索（内置本地搜索，支持中文）
- 🔗 交叉引用跳转
- 📊 首页仪表盘（统计 + 最近更新）
- 🏷️ 标签云（多标签筛选）
- 🌙 暗色模式
- 🎨 工业风 UI 设计
- 🔄 GitHub Webhook 自动更新

## 本地开发

```bash
# 安装依赖
npm install

# 同步内容 + 启动开发服务
npm run dev
```

## 构建

```bash
# 同步内容 + 构建静态站点
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
AkashaRecord-Web/
├── .vitepress/              # VitePress 配置与主题
│   ├── config.mts          # 站点配置
│   ├── theme/             # 自定义主题（工业风）
│   │   ├── index.ts       # 主题入口
│   │   ├── components/    # Vue 组件库
│   │   └── styles/       # 自定义样式
│   ├── utils/             # 工具函数
│   └── dist/              # 构建输出
├── scripts/                # 构建脚本
│   └── sync-content.mjs  # 内容同步脚本
├── server/                # Webhook 服务
│   └── webhook.mjs        # GitHub Webhook 接收服务
├── deploy/                # 部署配置
│   ├── deploy.sh          # 一键部署脚本
│   ├── setup-deploy-key.sh # Deploy Key 配置助手
│   └── nginx.conf        # Nginx 配置模板
├── docs/                  # 文档目录
│   ├── akasha-web-architecture-analysis.md
│   ├── akasha-web-architecture-deep-dive.md
│   ├── ui-animation-consistency-report.md
│   └── ui-animation-fix-report.md
├── public/                # 静态资源
│   ├── api/              # 生成的 API 数据
│   └── icons/            # SVG 图标库
├── records/               # 同步的记录
├── tags/                 # 标签索引页
├── .akasha-repo/         # 阿卡西数据仓库克隆
├── index.md              # 首页
├── package.json          # 项目配置
└── README.md            # 项目说明
```

## 数据同步原理

本站点从私有仓库 [AgentSkill-Akasha-KT](https://github.com/KTSAMA001/AgentSkill-Akasha-KT) 同步数据，流程如下：

```
GitHub (AgentSkill-Akasha-KT)
    │ push 事件
    ▼
Webhook 服务 (server/webhook.mjs, PM2 常驻)
    │ 分析变更文件，决定是否需要重新构建
    ▼
同步脚本 (scripts/sync-content.mjs)
    │ git clone / git pull 私有仓库到 .akasha-repo/
    │ 解析 Markdown → 生成导航、标签、API 数据
    ▼
VitePress 构建 → 静态站点更新
```

**认证方式**（二选一，用于访问私有仓库）：

| | Deploy Key（推荐） | GitHub Token |
|---|---|---|
| 原理 | SSH 密钥对，通过 `GIT_SSH_COMMAND` 注入 | Token 嵌入 HTTPS URL |
| 权限 | 仅限单个仓库（只读） | 所有仓库（可读写） |
| 安全性 | ✅ 更安全，泄露影响小 | ⚠️ 泄露可访问所有仓库 |
| 有效期 | 永久（除非手动删除） | 可设置过期时间 |
| 服务器配置 | `DEPLOY_KEY_PATH=/root/.ssh/akasha_deploy_key` | `GITHUB_TOKEN=ghp_xxx` |

> 两种方式完全兼容。如果同时设置，Deploy Key 优先。旧部署使用 GITHUB_TOKEN 的无需修改，新部署推荐用 Deploy Key。

## 服务器部署

### 环境准备

本指南假设你使用的是 **宝塔面板** 服务器。

1. **安装 Node.js**（v18+）
   ```bash
   # CentOS / Alibaba Cloud Linux
   yum install nodejs -y

   # Ubuntu / Debian
   apt-get install -y nodejs
   ```

2. **安装 PM2**（进程管理）
   ```bash
   npm install -g pm2
   ```

3. **克隆仓库**
   ```bash
   cd /www/wwwroot
   git clone https://github.com/KTSAMA001/AkashaRecord-Web.git
   cd AkashaRecord-Web
   npm install
   ```

4. **配置私有仓库访问**（如果阿卡西记录仓库为私有，二选一）

   **方式一：Deploy Key（推荐）** — 一键配置脚本：
   ```bash
   bash deploy/setup-deploy-key.sh
   ```
   脚本会自动完成：生成 SSH 密钥 → 引导你添加到 GitHub → 验证连通性 → 测试克隆。

   > 如果你想手动配置，步骤如下：
   > 1. 在服务器上生成密钥：`ssh-keygen -t ed25519 -f /root/.ssh/akasha_deploy_key -N "" -C "akasha-deploy"`
   > 2. 复制公钥：`cat /root/.ssh/akasha_deploy_key.pub`
   > 3. 打开 [AgentSkill-Akasha-KT → Settings → Deploy keys](https://github.com/KTSAMA001/AgentSkill-Akasha-KT/settings/keys/new)，添加公钥（不需要勾选 Write access）
   > 4. 设置环境变量：`export DEPLOY_KEY_PATH=/root/.ssh/akasha_deploy_key`

   **方式二：GitHub Token**
   ```bash
   # 前往 https://github.com/settings/tokens 创建 Personal Access Token（需要 repo 权限）
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

   > **Deploy Key vs Token 对比**
   > | | Deploy Key | GitHub Token |
   > |---|---|---|
   > | 权限范围 | 仅限单个仓库（只读） | 所有仓库（可读写） |
   > | 安全性 | ✅ 更安全 | ⚠️ 泄露风险更大 |
   > | 有效期 | 永久 | 可设置过期时间 |
   > | 配置方式 | SSH 密钥对 | 环境变量 |

### 配置域名与 SSL

1. **DNS 解析**
   - 登录域名服务商控制台（如阿里云）
   - 添加 `A` 记录：主机记录 `akasha`，记录值填服务器公网 IP

2. **SSL 证书**
   - 登录宝塔面板
   - 进入「网站」→「akasha.ktsama.top」（或你的域名）
   - 点击「设置」→「SSL」→「Let's Encrypt」→ 申请
   - 开启「强制 HTTPS」

### 一键部署

使用项目内置的部署脚本：

```bash
cd /www/wwwroot/AkashaRecord-Web

# 如果阿卡西记录仓库为私有，需要先设置认证（二选一）
# 方式一（推荐）：Deploy Key
export DEPLOY_KEY_PATH=/root/.ssh/akasha_deploy_key

# 方式二：GitHub Token
# export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

bash deploy/deploy.sh
```

部署脚本会自动完成：
- ✅ 检查并安装 Node.js (v18+) 和 PM2
- ✅ 拉取最新的阿卡西记录数据
- ✅ 构建 VitePress 静态站点
- ✅ 生成 Nginx 配置文件
- ✅ 重启 Webhook 服务

### Nginx 配置

部署脚本会生成 `deploy/nginx.conf`，手动替换到宝塔面板：

1. 进入「网站」→「akasha.ktsama.top」→「配置文件」
2. 将配置内容粘贴替换
3. 保存并重载 Nginx

### Webhook 配置

1. 打开 [AgentSkill-Akasha-KT 仓库设置](https://github.com/KTSAMA001/AgentSkill-Akasha-KT/settings/hooks)
2. 添加 Webhook：
   - **Payload URL**: `https://akasha.ktsama.top/webhook`
   - **Content type**: `application/json`
   - **Secret**: (根据 `server/webhook.mjs` 配置填写，或留空跳过验证)
   - **Which events**: 选择 `Just the push event`
3. 保存

现在每当你向阿卡西记录 push 新笔记，网站会在 1-2 分钟内自动更新。

### 常用运维命令

```bash
# 查看 Webhook 服务日志
pm2 logs akasha-webhook

# 重启 Webhook 服务
pm2 restart akasha-webhook

# 健康检查
curl http://127.0.0.1:3721/webhook/health

# 手动触发构建
curl -X POST http://127.0.0.1:3721/webhook/rebuild
```

### 从旧版本升级

如果服务器上已有旧版本部署（使用 `GITHUB_TOKEN`），更新代码后 **无需任何操作**，原有 Token 认证方式继续有效。

**可选：迁移到 Deploy Key（更安全）**

```bash
cd /www/wwwroot/AkashaRecord-Web

# 1. 配置 Deploy Key
bash deploy/setup-deploy-key.sh

# 2. 重新部署（会自动写入 PM2 ecosystem 配置）
export DEPLOY_KEY_PATH=/root/.ssh/akasha_deploy_key
bash deploy/deploy.sh

# 迁移完成后，可以到 GitHub Settings → Tokens 中删除旧 Token
```

## License

MIT

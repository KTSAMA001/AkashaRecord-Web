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

## License

MIT

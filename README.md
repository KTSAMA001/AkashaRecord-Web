# AkashaRecord-Web

阿卡西记录的可交互网站，基于 [VitePress](https://vitepress.dev/) 构建。

自动从 [AgentSkill-Akasha-KT](https://github.com/KTSAMA001/AgentSkill-Akasha-KT) 仓库同步内容，渲染为美观的文档站点。

## 特性

- 📝 自动分类导航（经验 / 知识 / 灵感）
- 🔍 全文搜索（内置本地搜索，支持中文）
- 🔗 交叉引用跳转
- 📊 首页仪表盘（统计 + 最近更新）
- 🏷️ 标签云
- 🌙 暗色模式
- 📱 响应式设计
- 🔄 GitHub Webhook 自动更新

## 本地开发

```bash
# 安装依赖
npm install

# 同步内容 + 启动开发服务
npm run dev

# 仅同步内容
npm run sync

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 服务器部署

### 一键部署（宝塔面板）

```bash
# SSH 登录服务器后执行
git clone https://github.com/KTSAMA001/AkashaRecord-Web.git /www/wwwroot/AkashaRecord-Web
cd /www/wwwroot/AkashaRecord-Web
bash deploy/deploy.sh
```

### 部署后配置

1. **DNS 解析**：`akasha.ktsama.top` → 服务器 IP（A 记录）
2. **SSL 证书**：宝塔面板中为域名申请免费证书
3. **GitHub Webhook**：
   - 打开 [AgentSkill-Akasha-KT 仓库设置](https://github.com/KTSAMA001/AgentSkill-Akasha-KT/settings/hooks)
   - Payload URL: `https://akasha.ktsama.top/webhook`
   - Content type: `application/json`
   - Events: `Just the push event`

### 常用运维命令

```bash
# 查看 Webhook 服务日志
pm2 logs akasha-webhook

# 重启 Webhook 服务
pm2 restart akasha-webhook

# 手动触发重建
curl -X POST http://127.0.0.1:3721/webhook/rebuild

# 健康检查
curl http://127.0.0.1:3721/webhook/health
```

## 项目结构

```
AkashaRecord-Web/
├── .vitepress/
│   ├── config.mts          # VitePress 配置
│   ├── theme/              # 自定义主题
│   │   ├── index.ts        # 主题入口
│   │   ├── components/     # Vue 组件
│   │   └── styles/         # 自定义样式
│   └── utils/
│       └── sidebar.ts      # 侧边栏自动生成
├── content/                # 同步的阿卡西记录内容（gitignore）
├── public/                 # 静态资源
├── scripts/
│   └── sync-content.mjs    # 内容同步脚本
├── server/
│   └── webhook.mjs         # Webhook 服务
├── deploy/
│   ├── deploy.sh           # 一键部署脚本
│   └── nginx.conf          # Nginx 配置模板
├── experiences/            # 经验分类首页（+ 同步内容）
├── knowledge/              # 知识分类首页（+ 同步内容）
├── ideas/                  # 灵感分类首页（+ 同步内容）
└── index.md                # 网站首页
```

## License

MIT

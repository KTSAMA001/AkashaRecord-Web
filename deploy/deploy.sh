#!/bin/bash
# =============================================
# 阿卡西记录 - 服务器一键部署脚本
# 适用于宝塔面板 + CentOS/Ubuntu
#
# 使用方式：
#   1. SSH 登录服务器
#   2. bash deploy.sh
#
# 前提条件：
#   - 已安装宝塔面板
#   - 已在宝塔中安装 Nginx
# =============================================

set -e

# ====== 配置 ======
DOMAIN="akasha.ktsama.top"
PROJECT_NAME="AkashaRecord-Web"
INSTALL_DIR="/www/wwwroot/${PROJECT_NAME}"
REPO_URL="https://github.com/KTSAMA001/AkashaRecord-Web.git"
NODE_VERSION="18"  # Node.js 主版本号
WEBHOOK_PORT=3721

# ====== 颜色 ======
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     阿卡西记录 - 服务器一键部署脚本          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ====== Step 1: 检查环境 ======
log_info "Step 1/6: 检查环境..."

# 检查是否 root
if [ "$EUID" -ne 0 ]; then
  log_error "请使用 root 用户运行此脚本"
  exit 1
fi

# 检查宝塔
if [ ! -d "/www/server/panel" ]; then
  log_error "未检测到宝塔面板，请先安装宝塔"
  exit 1
fi
log_ok "宝塔面板已安装"

# 检查 Nginx
if ! command -v nginx &> /dev/null && [ ! -f "/www/server/nginx/sbin/nginx" ]; then
  log_error "未检测到 Nginx，请在宝塔面板中安装 Nginx"
  exit 1
fi
log_ok "Nginx 已安装"

# ====== Step 2: 安装 Node.js ======
log_info "Step 2/6: 检查 Node.js..."

if command -v node &> /dev/null; then
  CURRENT_NODE=$(node -v | grep -oP '\d+' | head -1)
  if [ "$CURRENT_NODE" -ge "$NODE_VERSION" ]; then
    log_ok "Node.js $(node -v) 已安装"
  else
    log_warn "Node.js 版本过低 ($(node -v))，需要 v${NODE_VERSION}+"
    NEED_NODE=1
  fi
else
  log_info "未检测到 Node.js，正在安装..."
  NEED_NODE=1
fi

if [ "${NEED_NODE}" = "1" ]; then
  # 使用 NodeSource 安装
  if command -v apt &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
  elif command -v yum &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    yum install -y nodejs
  fi
  log_ok "Node.js $(node -v) 安装完成"
fi

# 安装 PM2（进程守护）
if ! command -v pm2 &> /dev/null; then
  log_info "安装 PM2 进程管理器..."
  npm install -g pm2
  log_ok "PM2 安装完成"
fi

# ====== Step 3: 克隆项目 ======
log_info "Step 3/6: 部署项目..."

if [ -d "${INSTALL_DIR}" ]; then
  log_warn "项目目录已存在，正在更新..."
  cd "${INSTALL_DIR}"
  git pull --ff-only || {
    log_warn "pull 失败，尝试 reset..."
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
  }
else
  log_info "克隆项目仓库..."
  git clone "${REPO_URL}" "${INSTALL_DIR}"
  cd "${INSTALL_DIR}"
fi

log_ok "项目代码就绪"

# ====== Step 4: 安装依赖 & 构建 ======
log_info "Step 4/6: 安装依赖并构建..."

cd "${INSTALL_DIR}"
npm install --production=false

# 同步阿卡西记录内容 & 构建
log_info "同步阿卡西记录内容..."
node scripts/sync-content.mjs

log_info "构建 VitePress 站点..."
npx vitepress build

log_ok "站点构建完成"

# ====== Step 5: 配置 Nginx ======
log_info "Step 5/6: 配置 Nginx..."

NGINX_CONF="/www/server/panel/vhost/nginx/${DOMAIN}.conf"

# 从模板生成配置
cp deploy/nginx.conf "${NGINX_CONF}"
sed -i "s|YOUR_DOMAIN|${DOMAIN}|g" "${NGINX_CONF}"
sed -i "s|/www/wwwroot/AkashaRecord-Web|${INSTALL_DIR}|g" "${NGINX_CONF}"

# 创建日志目录
mkdir -p /www/wwwlogs

# 测试 Nginx 配置
if /www/server/nginx/sbin/nginx -t 2>&1; then
  /www/server/nginx/sbin/nginx -s reload
  log_ok "Nginx 配置已应用"
else
  log_error "Nginx 配置有误，请检查 ${NGINX_CONF}"
  exit 1
fi

# ====== Step 6: 启动 Webhook 服务 ======
log_info "Step 6/6: 启动 Webhook 服务..."

# 创建 PM2 ecosystem 配置
cat > "${INSTALL_DIR}/ecosystem.config.cjs" << EOF
module.exports = {
  apps: [{
    name: 'akasha-webhook',
    script: 'server/webhook.mjs',
    cwd: '${INSTALL_DIR}',
    env: {
      NODE_ENV: 'production',
      WEBHOOK_PORT: ${WEBHOOK_PORT},
      PROJECT_DIR: '${INSTALL_DIR}',
    },
    max_memory_restart: '200M',
    error_file: '/www/wwwlogs/akasha-webhook-error.log',
    out_file: '/www/wwwlogs/akasha-webhook-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
EOF

# 停止旧进程（如果存在）
pm2 delete akasha-webhook 2>/dev/null || true

# 启动服务
cd "${INSTALL_DIR}"
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup 2>/dev/null || true

log_ok "Webhook 服务已启动"

# ====== 完成 ======
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                   🎉 部署完成！                      ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  网站地址:  http://${DOMAIN}                          "
echo "║  Webhook:   http://${DOMAIN}/webhook                  "
echo "║  健康检查:  http://${DOMAIN}/webhook/health           "
echo "║                                                      ║"
echo "║  项目路径:  ${INSTALL_DIR}                            "
echo "║  Nginx配置: ${NGINX_CONF}                             "
echo "║                                                      ║"
echo "║  常用命令:                                            ║"
echo "║    pm2 logs akasha-webhook   # 查看日志               ║"
echo "║    pm2 restart akasha-webhook # 重启服务              ║"
echo "║    curl -X POST http://127.0.0.1:${WEBHOOK_PORT}/webhook/rebuild  "
echo "║                               # 手动触发重建          ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "📌 下一步："
echo "   1. 确保域名 ${DOMAIN} 已解析到本服务器 IP"
echo "   2. 在宝塔面板中为 ${DOMAIN} 申请 SSL 证书"
echo "   3. 在 GitHub 仓库 Settings → Webhooks 中添加："
echo "      Payload URL: https://${DOMAIN}/webhook"
echo "      Content type: application/json"
echo "      Events: Just the push event"
echo ""

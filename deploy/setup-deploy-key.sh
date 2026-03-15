#!/bin/bash
# =============================================
# Deploy Key 一键配置脚本
# 为阿卡西记录私有仓库生成 SSH Deploy Key
#
# 使用方式：bash deploy/setup-deploy-key.sh
# =============================================

set -e

# ====== 配置 ======
KEY_PATH="/root/.ssh/akasha_deploy_key"
REPO_OWNER="KTSAMA001"
REPO_NAME="AgentSkill-Akasha-KT"

# ====== 颜色 ======
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   阿卡西记录 - Deploy Key 配置脚本           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ====== Step 1: 生成 SSH 密钥 ======
if [ -f "${KEY_PATH}" ]; then
  log_warn "密钥已存在: ${KEY_PATH}"
  echo -n "  是否重新生成？(y/N) "
  read -r answer
  if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    log_info "保留现有密钥"
  else
    rm -f "${KEY_PATH}" "${KEY_PATH}.pub"
    log_info "已删除旧密钥，重新生成..."
    ssh-keygen -t ed25519 -f "${KEY_PATH}" -N "" -C "akasha-deploy-$(hostname)"
    chmod 600 "${KEY_PATH}"
    log_ok "新密钥已生成"
  fi
else
  log_info "Step 1: 生成 SSH 密钥..."
  mkdir -p "$(dirname "${KEY_PATH}")"
  ssh-keygen -t ed25519 -f "${KEY_PATH}" -N "" -C "akasha-deploy-$(hostname)"
  chmod 600 "${KEY_PATH}"
  log_ok "密钥已生成: ${KEY_PATH}"
fi

# 预填 GitHub 主机密钥到 known_hosts（防止首次连接的 MITM 风险）
if ! ssh-keygen -F github.com > /dev/null 2>&1; then
  log_info "添加 GitHub SSH 主机密钥到 known_hosts..."
  ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null
  log_ok "GitHub 主机密钥已添加"
fi

# ====== Step 2: 显示公钥 ======
echo ""
log_info "Step 2: 复制下方公钥内容"
echo ""
echo -e "${CYAN}========== 公钥内容（全部复制）==========${NC}"
cat "${KEY_PATH}.pub"
echo -e "${CYAN}=========================================${NC}"
echo ""

# ====== Step 3: 引导添加到 GitHub ======
DEPLOY_KEY_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/keys/new"

log_info "Step 3: 将公钥添加到 GitHub 仓库"
echo ""
echo "  请打开以下链接（或手动导航）："
echo ""
echo -e "  ${GREEN}${DEPLOY_KEY_URL}${NC}"
echo ""
echo "  在页面中填写："
echo "    Title:  Akasha Web Server ($(hostname))"
echo "    Key:    粘贴上面的公钥内容"
echo "    ☐ Allow write access  ← 不需要勾选（只读即可）"
echo ""
echo "  点击 [Add key] 保存"
echo ""

# ====== Step 4: 验证连通性 ======
echo -n "完成 GitHub 配置后，按回车验证连通性..."
read -r

log_info "Step 4: 验证 SSH 连通性..."
echo ""

# 测试 SSH 连接
if ssh -i "${KEY_PATH}" -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  log_ok "SSH 认证成功！"
else
  # GitHub 即使认证成功也会返回 exit code 1，所以检查输出内容
  SSH_OUTPUT=$(ssh -i "${KEY_PATH}" -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1 || true)
  if echo "$SSH_OUTPUT" | grep -q "successfully authenticated"; then
    log_ok "SSH 认证成功！"
  else
    log_warn "SSH 认证未确认，输出如下："
    echo "  $SSH_OUTPUT"
    echo ""
    log_warn "请确认已在 GitHub 仓库中添加了公钥"
  fi
fi

# ====== Step 5: 测试克隆 ======
echo ""
log_info "Step 5: 测试克隆私有仓库..."
TEST_DIR=$(mktemp -d)
if GIT_SSH_COMMAND="ssh -i ${KEY_PATH} -o StrictHostKeyChecking=accept-new" \
   git clone --depth 1 "git@github.com:${REPO_OWNER}/${REPO_NAME}.git" "${TEST_DIR}/test-clone" 2>&1; then
  log_ok "仓库克隆测试成功！Deploy Key 配置正确"
  rm -rf "${TEST_DIR}"
else
  log_warn "克隆测试失败，请检查："
  log_warn "  1. 公钥是否已添加到 GitHub 仓库的 Deploy keys"
  log_warn "  2. 仓库地址是否正确: ${REPO_OWNER}/${REPO_NAME}"
  rm -rf "${TEST_DIR}"
  echo ""
  echo "你可以手动测试："
  echo "  GIT_SSH_COMMAND=\"ssh -i ${KEY_PATH}\" git ls-remote git@github.com:${REPO_OWNER}/${REPO_NAME}.git"
  exit 1
fi

# ====== 完成 ======
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              🎉 Deploy Key 配置完成！                ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  密钥路径:  ${KEY_PATH}"
echo "║                                                      ║"
echo "║  部署时使用：                                         ║"
echo "║    export DEPLOY_KEY_PATH=${KEY_PATH}"
echo "║    bash deploy/deploy.sh                              ║"
echo "║                                                      ║"
echo "║  或直接本地测试同步：                                  ║"
echo "║    DEPLOY_KEY_PATH=${KEY_PATH} npm run sync"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

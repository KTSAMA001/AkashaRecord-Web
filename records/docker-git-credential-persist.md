---
title: 'Docker 容器内 Git PAT 凭据持久化配置 {#docker-git-credential}'
tags:
  - git
  - experience
  - pat
  - docker
  - credential
status: ✅ 已验证
description: 'Docker 容器内 Git PAT 凭据持久化配置 {#docker-git-credential}'
source: KTSAMA 实践经验
recordDate: '2026-02-05'
sourceDate: '2026-02-05'
credibility: ⭐⭐⭐⭐ (实践验证)
version: Git 2.x+
---
# Docker 容器内 Git PAT 凭据持久化配置 {#docker-git-credential}


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=git" class="meta-tag">Git</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=pat" class="meta-tag">PAT 令牌</a> <a href="/records/?tags=docker" class="meta-tag">Docker</a> <a href="/records/?tags=credential" class="meta-tag">凭证管理</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-05</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2026-02-05</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Git 2.x+</span></div>
</div>


**问题/场景**：

在 Docker 容器中使用 Git over HTTPS 时，需要实现：
- 远程地址不含明文 token（安全）
- 容器重启后凭据仍然有效（持久化）

**解决方案/结论**：

使用 `credential.helper store` 将 PAT 凭据写入宿主机挂载文件。

### 1. 宿主机创建凭据文件

```bash
# 创建凭据文件并限制权限
touch /path/to/mounted/.git-credentials
chmod 600 /path/to/mounted/.git-credentials
```

### 2. 容器内配置凭据存储

```bash
# 配置 credential helper 指向挂载文件
git config --global credential.helper "store --file /container/path/.git-credentials"

# 确保远程地址干净（无 token）
git remote set-url origin https://github.com/<user>/<repo>.git
```

### 3. 首次推送

```bash
# 第一次 push 时按提示输入用户名与 PAT
# 凭据会自动写入挂载文件，后续无需再输入
git push origin main
```

**关键点**：

- 远程地址应为无 token 的 HTTPS：`https://github.com/<user>/<repo>.git`
- 凭据文件放在挂载卷（宿主机持久化）
- 凭据文件权限建议 `600`
- 已暴露的 PAT 应立即撤销，重新生成

**验证记录**：

- [2026-02-05] AstrBot 容器内实践验证成功

**相关经验**：

- [macOS osxkeychain 路径问题](./macos-git-osxkeychain-path)

---
title: Git HTTPS 拉取失败，改用 SSH 协议解决
tags:
  - git
  - experience
  - pat
  - docker
  - credential
status: ✅ 已验证
description: Git HTTPS 拉取失败，改用 SSH 协议解决
source: KTSAMA 实践经验
credibility: ⭐⭐⭐⭐ (实践验证)01-30
version: Git 2.x+
---
# Git HTTPS 拉取失败，改用 SSH 协议解决


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=git" class="meta-tag">Git</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=pat" class="meta-tag">PAT 令牌</a> <a href="/records/?tags=docker" class="meta-tag">Docker</a> <a href="/records/?tags=credential" class="meta-tag">凭证管理</a></span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Git 2.x+</span></div>
</div>


**问题/场景**：

在已存在的 Git 仓库执行 `git pull` 或 `git fetch` 时报错：
- `fatal: unable to access 'https://xxx.git/': Recv failure: Connection was aborted`
- `fatal: unable to access 'https://xxx.git/': Recv failure: Connection was reset`

但将仓库**克隆到新位置却可以成功**，通常是因为 HTTPS 连接不稳定或被拦截。

**解决方案/结论**：

最有效的方案是将远程 URL 从 HTTPS 改为 SSH。

### 1. 将 HTTPS URL 改为 SSH URL

```powershell
# 查看当前远程配置
git remote -v

# 将 HTTPS URL 改为 SSH URL
git remote set-url origin git@你的gitlab地址:命名空间/仓库名.git
```

**URL 格式对照**：
- HTTPS: `https://gitlab.com/group/repo.git`
- SSH: `git@gitlab.com:group/repo.git`

### 2. 验证与拉取

```powershell
# 再次尝试拉取
git fetch origin
git pull
```

### 处理本地修改冲突

切换协议后，如果 `git pull` 报本地修改冲突：

```powershell
# 方案：暂存本地修改
git stash
git pull
git stash pop
```

**验证记录**：

- [2026-01-30] 初次记录，来源：实践总结。在公司内网 GitLab 仓库遇到此问题，HTTPS 持续失败，改 SSH 后立即解决。
- [2026-01-30] 再次验证：如果不处理本地修改直接 Pull 可能会失败，建议配合 Stash 使用。

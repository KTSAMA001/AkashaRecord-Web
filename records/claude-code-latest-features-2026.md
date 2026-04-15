---
title: Claude Code 最新功能 (2026-03)
tags:
  - ai
  - tools
  - reference
  - claude-code
status: ✅ 已验证
description: Claude Code 最新功能 (2026-03)
source: Claude Code 官方发布说明 / 官方文档
recordDate: '2026-03-10'
credibility: ⭐⭐⭐⭐ (官方文档)
---
# Claude Code 最新功能 (2026-03)


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-10</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=ai" class="meta-tag">AI</a> <a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=reference" class="meta-tag">参考</a> <a href="/records/?tags=claude-code" class="meta-tag">Claude Code</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Claude Code 官方发布说明 / 官方文档</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">官方文档</span></span></div>
</div>


**问题/场景**：


### 概要
Claude Code 最新功能 (2026-03)

了解 Claude Code 2026 年最新发布的功能和改进。

**解决方案/结论**：

## v2.0.x 重大更新

### v2.0.12 - Plugin System (插件系统)

**重大功能**：插件系统正式发布

- `/plugin install` - 安装插件
- `/plugin enable/disable` - 启用/禁用插件
- `/plugin marketplace` - 浏览插件市场
- `/plugin validate` - 验证插件结构
- 支持自定义 commands、agents、hooks、MCP servers

### v2.0.0 - 重大改版

- **原生 VS Code 扩展** - 全新的 IDE 集成
- **`/rewind`** - 回退对话和代码更改
- **`/usage`** - 查看计划限制
- **Tab 切换思考** - 跨会话持久化
- **Ctrl-R 搜索历史** - 类似 bash/zsh
- **SDK 更名** - Claude Code SDK → Claude Agent SDK
- **`--agents` 标志** - 动态添加子代理

## Agent Teams (代理团队)

配合 Opus 4.6 发布的新功能：

- 启动多个代理并行工作，自主协调
- 适用于可拆分的独立任务（如代码库审查）
- Shift+Up/Down 或 tmux 可直接接管子代理

## API 新特性

### 自适应思考 (Adaptive Thinking)

- Claude 自动判断何时需要深度推理
- 默认 effort 级别：high
- 开发者可调整 effort 级别

### Effort 控制

四个级别可选：
- `low` - 最低思考
- `medium` - 中等思考
- `high` - 默认，平衡
- `max` - 最大思考

### 上下文压缩 (Context Compaction)

- 自动总结旧对话，替换为新上下文
- 可配置压缩阈值
- 支持更长运行的任务

### 1M Token 上下文 (Beta)

- Opus 4.6 和 Sonnet 4.6 支持
- 使用 `context-1m-2025-08-07` beta header
- 超过 200K tokens 部分适用长上下文定价
- 仅 Claude Developer Platform 可用

### 128K 输出 Tokens

- Opus 4.6 支持
- 单次请求完成更大输出任务

## 其他重要更新

| 版本 | 功能 |
|------|------|
| v2.0.10 | 重写终端渲染器，流畅 UI；Ctrl-G 编辑提示词 |
| v1.0.71 | Ctrl-b 后台运行 Bash 命令；`/statusline` 自定义状态行 |
| v1.0.60 | 自定义子代理 (`/agents`) |
| v1.0.38 | Hooks 系统 |
| v1.0.23 | TypeScript SDK & Python SDK 发布 |

**参考链接**：

- [Claude Code CHANGELOG](https://github.com/anthropics-claude/claude-code/blob/main/CHANGELOG.md)
- [Claude Opus 4.6 发布](https://www.anthropic.com/news/claude-opus-4-6)
- [Claude Code 插件文档](https://docs.claude.com/en/docs/claude-code/plugins)

### 验证记录
- [2026-03-10] 来源：官方 CHANGELOG + 博客

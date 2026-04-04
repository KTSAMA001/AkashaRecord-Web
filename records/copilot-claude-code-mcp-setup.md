---
title: Copilot 调用 Claude Code 作为子 Agent 的 MCP 配置
tags:
  - copilot
  - claude-code
  - mcp
  - vscode
  - ai
  - experience
status: ⚠️ 待验证
description: Copilot 调用 Claude Code 作为子 Agent 的 MCP 配置
source: 实践总结 + GitHub steipete/claude-code-mcp
recordDate: '2026-04-01'
credibility: ⭐⭐⭐⭐
---
# Copilot 调用 Claude Code 作为子 Agent 的 MCP 配置


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=copilot" class="meta-tag">Copilot</a> <a href="/records/?tags=claude-code" class="meta-tag">Claude Code</a> <a href="/records/?tags=mcp" class="meta-tag">MCP 协议</a> <a href="/records/?tags=vscode" class="meta-tag">VS Code</a> <a href="/records/?tags=ai" class="meta-tag">AI</a> <a href="/records/?tags=experience" class="meta-tag">经验</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结 + GitHub steipete/claude-code-mcp</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-04-01</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--warning"><img class="inline-icon inline-icon--status" src="/icons/status-pending.svg" alt="待验证" /> 待验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
</div>


### 概要

通过 `@steipete/claude-code-mcp` 将 Claude Code CLI 包装为 MCP server，注册到 VS Code 用户级 `mcp.json`，使 GitHub Copilot（Agent 模式）在执行任务时可直接调用 `claude_code` 工具，将复杂子任务委派给 Claude Code 完成。

### 前置条件

1. **Claude Code CLI** 已安装（`npm install -g @anthropic-ai/claude-code`），版本 ≥ 2.x
2. **Node.js** ≥ v20
3. **一次性接受权限条款**：手动在终端执行 `claude --dangerously-skip-permissions`，按提示接受后 Ctrl+C 退出

### 配置方法

编辑 VS Code 用户级 MCP 配置文件：

- **路径**：`%APPDATA%\Code\User\mcp.json`（Windows）

在 `servers` 中新增：

```json
{
  "servers": {
    "claude-code": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@steipete/claude-code-mcp@latest"],
      "env": {
        "CLAUDE_CLI_NAME": "claude"
      }
    }
  }
}
```

> **Windows 注意**：必须用 `cmd /c npx` 包装，否则会出现 "Connection closed" 错误。

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CLAUDE_CLI_NAME` | Claude CLI 的二进制名或绝对路径 | `claude` |
| `MCP_CLAUDE_DEBUG` | 启用调试日志 | `false` |

### 验证方式

1. 重启 VS Code / 重新加载窗口
2. 命令面板 → `MCP: List Servers` → 确认 `claude-code` 状态为 Running
3. 在 Copilot Chat 中输入需要复杂操作的任务，Copilot 应能调用 `claude_code` 工具

### 工作原理

```
用户任务 → Copilot (Agent 模式)
              ↓ 判断需要委派
              ↓ 调用 MCP 工具 claude_code
              ↓
    @steipete/claude-code-mcp (stdio MCP server)
              ↓ 执行 claude --dangerously-skip-permissions -p "prompt"
              ↓
    Claude Code CLI (one-shot 模式)
              ↓ 返回结果
              ↓
    Copilot 汇总结果，继续后续步骤
```

### 替代方案

| 方案 | 说明 | 适用场景 |
|------|------|----------|
| `claude mcp serve` | Claude Code 官方内置 MCP server 模式 | 暴露 View/Edit/LS/Bash 等原子工具 |
| `vscode-claude-code-bridge` 插件 | VS Code 工作区智能桥接给 Claude Code | 让 Claude Code 能用 VS Code 的 LSP 能力 |
| `copilot-mcp` 插件 (AutomataLabs) | MCP server 搜索/安装管理面板 | 一站式管理多个 MCP server |

### 参考链接

- steipete/claude-code-mcp: https://github.com/steipete/claude-code-mcp
- VS Code MCP 配置官方文档: https://code.visualstudio.com/docs/copilot/customization/mcp-servers
- Claude Code MCP 官方文档: https://code.claude.com/docs/en/mcp

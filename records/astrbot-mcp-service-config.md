---
title: AstrBot 集成 MCP 服务经验
tags:
  - ai
  - experience
  - mcp
  - astrbot
status: ✅ 已验证
description: AstrBot 集成 MCP 服务经验
source: KTSAMA 实践经验
recordDate: '2026-02-01'
sourceDate: 2026-01-30 ~ 2026-02-01
credibility: ⭐⭐⭐⭐ (实践验证)
version: AstrBot v4.13.2+
---
# AstrBot 集成 MCP 服务经验


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=ai" class="meta-tag">AI</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=mcp" class="meta-tag">MCP 协议</a> <a href="/records/?tags=astrbot" class="meta-tag">AstrBot</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-01</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2026-01-30 ~ 2026-02-01</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">AstrBot v4.13.2+</span></div>
</div>


**问题/场景**：

在 AstrBot 容器中集成 MCP 工具服务，需解决网络、依赖、工具命名冲突等问题。

**解决方案/结论**：

- MCP 服务建议以 stdio 模式运行，避免 SSE 网络限制。
- 工具命名统一加 kt_ 前缀，防止与 AstrBot 内置工具冲突。
- 容器内需安装 Playwright 浏览器依赖。
- MCP 服务路径配置需与 AstrBot mcp_server.json 保持一致。

**关键代码**：

```json
{
  "mcpServers": {
    "web_search_mcp": {
      "active": true,
      "command": "python",
      "args": ["-m", "web_search_mcp.server"],
      "env": {"PYTHONPATH": "/AstrBot/data/mcp_servers"}
    }
  }
}
```

**参考链接**：
- [AstrBot 官方文档](https://github.com/AstrBot/AstrBot)

**验证记录**：
- [2026-02-01] MCP 工具服务在 AstrBot 容器内成功集成，工具可用

**相关经验**：
- [MCP 协议与 Agent 服务开发经验](./mcp-protocol-agent-dev)

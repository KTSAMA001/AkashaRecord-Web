---
title: Unity MCP — AI 驱动编辑器操控工具
tags:
  - unity
  - mcp
  - tools
  - claude-code
  - ai
  - knowledge
status: ⚠️ 待验证
description: >-
  让 LLM（Claude、Cursor、VS Code Copilot 等）通过 MCP 协议直接操控 Unity Editor，实现自然语言创建
  GameObject、编辑材质、管理场景、编写脚本等操作。
source: GitHub CoplayDev/unity-mcp（MIT 开源，7100★）
recordDate: '2026-03-16'
sourceDate: 2026-03-16（最新推送）
updateDate: —
credibility: ⭐⭐⭐⭐（GitHub 7100★ 活跃开发，ACM 引用）
version: Unity 2021.3 LTS+
---
# Unity MCP — AI 驱动编辑器操控工具


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=mcp" class="meta-tag">MCP 协议</a> <a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=claude-code" class="meta-tag">Claude Code</a> <a href="/records/?tags=ai" class="meta-tag">AI</a> <a href="/records/?tags=knowledge" class="meta-tag">知识</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">GitHub CoplayDev/unity-mcp（MIT 开源，7100★）</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-16</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2026-03-16（最新推送）</span></div>
<div class="meta-item"><span class="meta-label">更新日期</span><span class="meta-value">—</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--warning"><img class="inline-icon inline-icon--status" src="/icons/status-pending.svg" alt="待验证" /> 待验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">GitHub 7100★ 活跃开发，ACM 引用</span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2021.3 LTS+</span></div>
</div>


### 概要
让 LLM（Claude、Cursor、VS Code Copilot 等）通过 MCP 协议直接操控 Unity Editor，实现自然语言创建 GameObject、编辑材质、管理场景、编写脚本等操作。

### 架构

```
LLM (Claude/Cursor/Cline/Gemini CLI 等)
    ↕ MCP 协议 (HTTP localhost:8080)
Python 服务端 (mcpforunityserver)
    ↕ HTTP/WebSocket
Unity Editor C# Bridge (Package)
```

- Unity 侧安装 Package（C# Bridge）
- 启动后在 `localhost:8080` 开 HTTP MCP 服务端
- LLM 客户端配置 JSON 连接即可

### 安装

**Unity Package Manager**：`Add package from git URL...`
```
https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main
```

**前置条件**：Python 3.10+、uv、Unity 2021.3+

**MCP 客户端配置**（Claude Desktop / Claude Code）：
```json
{
  "mcpServers": {
    "unityMCP": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

### 核心工具（35+）

| 类别 | 工具 | 功能 |
|------|------|------|
| 场景/物体 | `manage_gameobject` / `manage_scene` | 创建/删除/修改 GameObject，场景管理 |
| 材质/贴图 | `manage_material` / `manage_texture` | 创建材质、Shader 参数、贴图导入 |
| 脚本 | `create_script` / `manage_script` / `validate_script` | C# 脚本创建/编辑/删除，Roslyn 验证 |
| 组件 | `manage_components` / `manage_camera` | 组件管理，Cinemachine 支持 |
| 动画 | `manage_animation` | 动画状态机、剪辑管理 |
| 渲染 | `manage_graphics` | Volume/后处理、光照烘焙、URP Renderer Feature、渲染统计 |
| Shader | `manage_shader` | Shader 代码编辑 |
| VFX | `manage_vfx` | Visual Effect Graph |
| UI | `manage_ui` | Unity UI 管理 |
| ProBuilder | `manage_probuilder` | 网格编辑 |
| 包管理 | `manage_packages` | 安装/删除/搜索 Unity Package |
| 资源 | `manage_asset` / `manage_prefabs` | 资源导入、Prefab 编辑 |
| 批量执行 | `batch_execute` | 一次执行多个操作（10-100x 提速） |
| 测试 | `run_tests` / `get_tests` | 运行单元测试 |
| 脚本能力 | `manage_script_capabilities` | 脚本功能查询 |

### 可用资源（Resources）

`cameras` / `volumes` / `rendering_stats` / `renderer_features` / `editor_state` / `gameobject` / `project_info` / `prefab_hierarchy` / `menu_items` / `unity_instances` / `tool_groups` 等

### 支持的 MCP 客户端

Claude Desktop、Claude Code、Cursor、VS Code Copilot、Windsurf、Cline、Gemini CLI、Qwen Code、GitHub Copilot CLI

### 版本迭代（最近一周）

| 版本 | 日期 | 新增 |
|------|------|------|
| v9.5.4 beta | 2026-03-15 | `manage_packages`：包管理工具 |
| v9.5.3 | 2026-03-09 | `manage_graphics`（33 actions）：后处理/光照/管线 |
| v9.5.2 | 2026-03-07 | `manage_camera`：Cinemachine 支持 |
| v9.4.8 | 2026-03-06 | Editor UI、`manage_tools`、ProBuilder |
| v9.4.7 | 2026-02-21 | Per-call Unity 实例路由 |

### 注意事项

- **安全**：AI 直接操作编辑器，需注意误操作（有 undo 机制）
- **批量操作**：多个操作建议用 `batch_execute`，快 10-100x
- **多实例**：支持多个 Unity Editor，通过 `set_active_instance` 切换
- **Roslyn 验证**：可选安装，用于脚本语法检查（需 NuGetForUnity）
- **安全默认**：HTTP 仅允许 localhost，远程需显式开启

### 适用场景

- 自然语言快速搭建场景原型
- AI 辅助 URP 渲染管线配置（Volume/后处理/Renderer Feature）
- Shader 代码编辑与调试
- 自动化重复性编辑器操作
- 与 Claude Code 工作流深度集成

### 参考链接

- [GitHub 仓库](https://github.com/CoplayDev/unity-mcp) — 源码与文档
- [Unity Asset Store](https://assetstore.unity.com/packages/tools/generative-ai/mcp-for-unity-ai-driven-development-329908) — 官方包
- [MCP 协议规范](https://modelcontextprotocol.io/introduction) — Model Context Protocol
- [Coplay 官网](https://www.coplay.dev/?ref=unity-mcp) — 维护商
- [ACM 论文](https://doi.org/10.1145/3757376.3771417) — SA Technical Communications '25

### 验证记录
- [2026-03-16] 初次记录，来源：GitHub 调研，标注 ⚠️待验证

---

---
title: PrefabVariantGeneratorV4 工具本体说明
tags:
  - unity
  - tools
  - architecture
  - custom-editor
status: ✅ 已验证
description: >-
  `PrefabVariantGeneratorV4` 是 Unity Editor 下的 DAG 节点式 Prefab 批处理工具。它以
  `PipelineGraphData` 作为配置资产，按拓扑顺序执行各 Stage，支持分支派生、路径注入与多终端批量产物生成。
source: 项目内工具文档与代码实现（实践归纳）
recordDate: '2026-03-12'
updateDate: '2026-03-12'
credibility: ⭐⭐⭐⭐
version: Unity Editor 2022.3+（PrefabVariantGeneratorV4）
---
# PrefabVariantGeneratorV4 工具本体说明


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=architecture" class="meta-tag">架构设计</a> <a href="/records/?tags=custom-editor" class="meta-tag">自定义编辑器</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">项目内工具文档与代码实现（实践归纳）</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-12</span></div>
<div class="meta-item"><span class="meta-label">更新日期</span><span class="meta-value">2026-03-12</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity Editor 2022.3+（PrefabVariantGeneratorV4）</span></div>
</div>


### 概要
`PrefabVariantGeneratorV4` 是 Unity Editor 下的 DAG 节点式 Prefab 批处理工具。它以 `PipelineGraphData` 作为配置资产，按拓扑顺序执行各 Stage，支持分支派生、路径注入与多终端批量产物生成。

### 内容

## 1) 工具定位与入口

- 定位：离线批处理工具（Editor-only），用于从单一源 Prefab 生成多分支变体。
- 菜单入口：`KT_Tools/Pipeline Graph V4`
- 资产入口：双击 `PipelineGraphData` 自动打开编辑器。
- Inspector 入口：在图资产上点击“打开节点图编辑器”。

## 2) 架构分层

- View 层：`PipelineGraphEditorWindow`、`PipelineGraphView`、`PipelineNodeView`、`NodeSearchWindow`
- Data 层：`PipelineGraphData`、`BaseNodeData`/`StageNodeData`/`SourcePrefabNodeData`/`OutputFolderNodeData`、`NodeConnectionData`、`PortDefinition`
- Core 层：`GraphExecutionEngine`、`PipelineStageBase`、`PipelineUtility`、`StageUtility`
- Stage 层：`RootCreateStage`、`EnemyCreateStage`、`PetCreateStage`、`SkinStage`、`PartnerStage`

## 3) 执行模型（稳定约束）

- 图模型：DAG（Kahn 拓扑排序），有环即终止执行。
- Source 约束：必须且仅允许 1 个 `SourcePrefabNodeData`。
- 状态流转：节点执行状态分为 `Success / Failed / Skipped`，下游依赖上游成功。
- 路径节点：`OutputFolderNodeData` 仅作为数据节点，不直接执行。

## 4) 端口机制（当前版本核心）

- 每个节点通过 `GetPortDefinitions()` 自声明端口，不再依赖固定端口硬编码。
- 连接以“四元组”存储：`OutputNodeGuid + OutputPortId + InputNodeGuid + InputPortId`。
- 连接合法性由端口定义校验：方向正确、端口存在、`PortType` 匹配。
- 旧图迁移：`PipelineGraphData.MigrateConnections()` 自动为历史连接补齐端口 ID。

## 5) 路径注入机制

- 执行前由 `GraphExecutionEngine` 将路径端口值注入 Stage 的 `PortValues`。
- Stage 使用 `GetPortValue(portId, fallback)` 读取注入值（无注入时回退本地配置）。
- 标准路径端口：`path-in`
- Partner 双路径端口：
  - `prefab-path-in`（预制体输出目录）
  - `material-path-in`（材质输出目录）

## 6) Stage 职责边界

- `RootCreateStage`：根结构搭建与基础替换
- `EnemyCreateStage`：怪物逻辑补全
- `PetCreateStage`：宠物分支特化
- `SkinStage`：外观/材质派生
- `PartnerStage`：多条目多缩放终端批量产出

## 7) 能力边界（非目标）

- 不处理运行时逻辑（仅 Editor 内执行）。
- 不实现复杂多源合流语义（当前以单源主链为主）。
- 不提供运行时节点可视化回填（主要依赖日志与产物路径）。

## 8) 维护与扩展规范

- 新增 Stage 时：
  1. 继承 `PipelineStageBase`
  2. 覆写 `DisplayName` / `NodeHeaderColor` / `GetPortDefinitions()`
  3. 在 `Validate()` 仅做配置合法性检查
  4. 复用 `PipelineUtility` / `StageUtility` 沉淀共性逻辑
- 新增端口类型时：
  - 在 `PortTypes` 增加类型常量、映射类型与颜色
  - 保持 `PipelineGraphData.IsConnectionValid()` 的类型匹配约束

### 关键代码（如有）

```csharp
public virtual List<PortDefinition> GetPortDefinitions()
{
    return new List<PortDefinition>
    {
        PortDefinition.PrefabInput(),
        PortDefinition.PrefabOutput(),
        PortDefinition.PathInput(),
    };
}

var conn = graphData.GetConnectionToPort(guid, prefabInPort.Id);
```

### 相关记录（如有）

- [unity-editor-api.md](./unity-editor-api) - Unity Editor 扩展 API 背景知识
- [effect-system-code-review.md](./effect-system-code-review) - 代码审查时的架构边界表述参考

### 验证记录
- [2026-03-12] 初次记录，来源：工具文档《PrefabVariantGeneratorV4-使用手册》《PrefabVariantGeneratorV4-架构详解》与当前代码实现交叉核对。
- [2026-03-12] 验证：执行模型、端口机制、路径注入、Partner 双路径端口与图迁移逻辑均在代码中存在对应实现。

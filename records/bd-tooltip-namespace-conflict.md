---
title: 'BD 节点 Tooltip 命名空间冲突解决 {#bd-tooltip-namespace-conflict}'
tags:
  - unity
  - experience
  - editor
  - behavior-designer
status: ✅ 已验证
description: 'BD 节点 Tooltip 命名空间冲突解决 {#bd-tooltip-namespace-conflict}'
source: KTSAMA 实践经验
recordDate: '2026-02-03'
credibility: ⭐⭐⭐⭐ (实践验证)
version: BehaviorDesigner 1.7.x
---
# BD 节点 Tooltip 命名空间冲突解决 {#bd-tooltip-namespace-conflict}


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-03</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=editor" class="meta-tag">编辑器</a> <a href="/records/?tags=behavior-designer" class="meta-tag">行为树</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">BehaviorDesigner 1.7.x</span></div>
</div>


### 问题/场景

在 BehaviorDesigner 节点中使用 `[Tooltip]` 属性时，编译报错：
```
'Tooltip' is an ambiguous reference between 
'BehaviorDesigner.Runtime.Tasks.TooltipAttribute' and 'UnityEngine.TooltipAttribute'
```

### 解决方案

**方案 1：使用完整命名空间（推荐）**
```csharp
[UnityEngine.Tooltip("说明文字")]
public float myValue;
```

**方案 2：using 别名**
```csharp
using Tooltip = BehaviorDesigner.Runtime.Tasks.TooltipAttribute;

[Tooltip("说明文字")]
public float myValue;
```

**方案 3：枚举值用 XML 注释替代**
```csharp
public enum DirectionType
{
    /// &lt;summary&gt;前方</summary>
    Forward,
    /// &lt;summary&gt;后方</summary>
    Back
}
```

### 验证记录

| 日期 | 验证者 | 结果 |
|------|--------|------|
| 2026-02-03 | KT | <img class="inline-icon inline-icon--check" src="/icons/mark-check.svg" alt="✅" /> 方案1在项目中验证通过 |

### 理论基础

- [BehaviorDesigner Task Attributes 系统](./behavior-designer-api.md#behaviordesigner-task-attributes-系统)

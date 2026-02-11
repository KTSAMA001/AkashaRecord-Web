---
title: 'BD 节点条件显示的替代方案 {#bd-showif-workaround}'
tags:
  - unity
  - experience
  - editor
  - behavior-designer
status: ✅ 已验证
description: 'BD 节点条件显示的替代方案 {#bd-showif-workaround}'
source: KTSAMA 实践经验
recordDate: '2026-02-03'
credibility: ⭐⭐⭐⭐ (实践验证)
version: BehaviorDesigner 1.7.x
---
# BD 节点条件显示的替代方案 {#bd-showif-workaround}


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-03</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=editor" class="meta-tag">编辑器</a> <a href="/records/?tags=behavior-designer" class="meta-tag">行为树</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">BehaviorDesigner 1.7.x</span></div>
</div>


### 问题/场景

希望在 BehaviorDesigner 节点中实现类似 Odin 的 `[ShowIf]` 功能，让某些参数只在特定条件下显示。

经调查发现：
- BD 的 ObjectDrawer 无法访问其他字段，**无法实现真正的条件显示**
- Odin 的 `[ShowIf]` 在 BD 节点中**不生效**（BD 用自己的 Inspector）

### 解决方案

**采用 Header 分组 + 注释标注的方式：**

```csharp
[TaskDescription("节点描述\n用途说明")]
[TaskCategory("Custom")]
public class MyAction : ProfilingAction
{
    #region 基础设置
    [Header("【基础设置】")]
    [UnityEngine.Tooltip("Forward=前方, Back=后方, Custom=自定义")]
    public DirectionType directionType = DirectionType.Forward;
    
    [Header("↳ 仅 directionType=Custom 时生效")]
    [UnityEngine.Tooltip("自定义方向向量")]
    public SharedVector3 customDirection;
    #endregion

    #region 可选功能
    [Header("【可选功能】")]
    [UnityEngine.Tooltip("是否启用高度限制")]
    public bool enableHeightLimit = true;
    
    [Header("↳ 仅 enableHeightLimit=true 时生效")]
    [UnityEngine.Tooltip("最大高度差")]
    public SharedFloat maxHeightDifference;
    #endregion
}
```

**关键技巧：**
- 用 `【】` 标记主分组
- 用 `↳` 标记条件参数，说明生效条件
- 用 `#region` 在代码中分组（不影响 Inspector 显示，便于维护）
- TaskDescription 用 `\n` 换行写多行说明

### 为什么不用其他方案

| 方案 | 问题 |
|------|------|
| Odin [ShowIf] | BD 用自己的 Inspector，Odin 不生效 |
| 自定义 ObjectDrawer | 无法访问其他字段的值 |
| 重写 Task Inspector | 工作量大，需修改 BD 源码或大量反射 |

### 验证记录

| 日期 | 验证者 | 结果 |
|------|--------|------|
| 2026-02-03 | KT | <img class="inline-icon inline-icon--check" src="/icons/mark-check.svg" alt="✅" /> Header 分组在 BD Inspector 中正常显示 |

### 理论基础

- [BehaviorDesigner ObjectDrawer 系统](./behavior-designer-api.md#behaviordesigner-objectdrawer-系统)

---
title: 物理碰撞更新时机
tags:
  - unity
  - physics
  - experience
status: ✅ 已验证
description: 需要物理碰撞/触发检测的物体，应在 FixedUpdate 而非 LateUpdate 中更新位置，否则检测位置是上一帧的位置。
source: 实践总结
recordDate: '2026-03-05'
credibility: ⭐⭐⭐⭐
version: Unity 2020.3+
---
# 物理碰撞更新时机


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=physics" class="meta-tag">物理系统</a> <a href="/records/?tags=experience" class="meta-tag">经验</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2020.3+</span></div>
</div>


### 概要
需要物理碰撞/触发检测的物体，应在 FixedUpdate 而非 LateUpdate 中更新位置，否则检测位置是上一帧的位置。

## 内容

### Unity 物理帧执行顺序

```
FixedUpdate (激活物体)
    ↓
OnTrigger
    ↓
OnCollider
    ↓
LateUpdate (更新位置)
```

### 问题分析

如果在 LateUpdate 中更新位置：
- OnTrigger/OnCollider 触发时
- 位置还是上一帧的
- 导致检测位置滞后一帧

### 解决方案

**需要物理检测的物体**：
- 在 FixedUpdate 中更新实际位置
- 或在物理帧激活物体后立即更新

### 代码示例

```csharp
// ❌ 错误做法
void LateUpdate()
{
    transform.position = targetPosition; // 物理检测会滞后
}

// ✅ 正确做法
void FixedUpdate()
{
    transform.position = targetPosition; // 物理检测位置正确
}
```

### 注意事项

- 物理帧频率（Fixed Timestep）与渲染帧可能不同
- 如果物理帧频率较低，位置更新可能不够平滑
- 可考虑插值来平滑显示

### 验证记录
- [2025-02-24] 实际调试发现问题并验证解决方案
- [2026-03-05] 从长期记录提取到阿卡西

---
title: Unity 动态分辨率与注视点渲染冲突
tags:
  - unity
  - vr
  - bug
  - experience
status: ⚠️ 待验证
description: Unity 动态分辨率与注视点渲染冲突
source: 实践总结
recordDate: '2026-03-05'
credibility: ⭐⭐⭐
version: Unity 2022.3.39f1
---
# Unity 动态分辨率与注视点渲染冲突


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=vr" class="meta-tag">vr</a> <a href="/records/?tags=bug" class="meta-tag">Bug</a> <a href="/records/?tags=experience" class="meta-tag">经验</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--warning"><img class="inline-icon inline-icon--status" src="/icons/status-pending.svg" alt="待验证" /> 待验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2022.3.39f1</span></div>
</div>


## 概要

在 Unity 2022.3.39f1 版本中，动态分辨率（Dynamic Resolution）不能与注视点渲染（Foveated Rendering）同时启用。

## 内容

### 问题描述

- **版本**：Unity 2022.3.39f1
- **冲突功能**：Dynamic Resolution + Foveated Rendering
- **现象**：两者同时启用时会出现问题

### 可能原因

两者都涉及渲染分辨率的动态调整，底层实现可能存在冲突。

### 解决方案

- 在需要注视点渲染时，关闭动态分辨率
- 或升级 Unity 版本查看是否已修复

### 注意事项

- VR 项目尤其需要注意此限制
- 其他 Unity 版本可能有不同表现

### 验证记录

- [2026-03-05] 从长期记录提取，待进一步验证

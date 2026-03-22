---
title: SRP Batcher 参数开销分析
tags:
  - unity
  - srp-batcher
  - performance
  - experience
status: ✅ 已验证
description: SRP Batcher 参数开销分析
source: 实践总结 + RenderDoc 抓帧
recordDate: '2026-03-05'
credibility: ⭐⭐⭐⭐
version: Unity 2020.3+ / DX 平台
---
# SRP Batcher 参数开销分析


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=srp-batcher" class="meta-tag">SRP Batcher</a> <a href="/records/?tags=performance" class="meta-tag">性能优化</a> <a href="/records/?tags=experience" class="meta-tag">经验</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结 + RenderDoc 抓帧</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2020.3+ / DX 平台</span></div>
</div>


## 概要

相同 Shader 不同材质的参数绑定开销分析，基于 RenderDoc 抓帧验证。

## 内容

### 测试环境

- 编辑器下使用 RenderDoc 抓帧
- 理论上适用于 DX 平台

### 参数类型开销

| 参数类型 | 开销 | 说明 |
|----------|------|------|
| float 参数 | 无额外开销 | 只在 GPU 上做参数偏移 |
| Vector 参数 | 无额外开销 | 同上 |
| 纹理不同 | 一次绑定调用 | 需要切换纹理槽位 |
| Shader 相同 | 减少 | 状态设置花费减少 |

### 结论

- **相同 Shader 不同材质**：减少了设置状态需要的花费
- **float/Vector 参数不同**：不会多一次额外的绑定操作，只在 GPU 上做参数偏移
- **纹理不同**：会多一次纹理绑定调用

### 优化建议

1. 尽量复用同一 Shader
2. 通过 Atlas 减少纹理种类可进一步降低开销
3. 不必担心参数数量，但要注意纹理切换

### 验证记录

- [2025-06-30] RenderDoc 抓帧分析验证
- [2026-03-05] 从长期记录提取到阿卡西

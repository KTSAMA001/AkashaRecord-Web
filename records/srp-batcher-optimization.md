---
title: SRP Batcher 场景优化要点
tags:
  - unity
  - srp-batcher
  - performance
  - experience
status: ✅ 已验证
description: SRP 管线下的场景优化建议，减少 DrawCall 和批次开销。
source: 实践总结
recordDate: '2026-03-05'
credibility: ⭐⭐⭐⭐
version: Unity 2020.3+ / URP 10+
---
# SRP Batcher 场景优化要点


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=srp-batcher" class="meta-tag">SRP Batcher</a> <a href="/records/?tags=performance" class="meta-tag">性能优化</a> <a href="/records/?tags=experience" class="meta-tag">经验</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2020.3+ / URP 10+</span></div>
</div>


### 概要
SRP 管线下的场景优化建议，减少 DrawCall 和批次开销。

## 内容

### 核心优化原则

1. **Shader 种类控制**
   - 同一场景内如无必要请使用更少种类的 Shader
   - 独立场景之间的材质需要考虑是否隔离

2. **碎模型问题**
   - 小范围内（如 2x2）不要有很多碎且使用系统材质的模型
   - 碎模型会导致 Batcher 过高
   - 可能达到单次 SRP Batcher 绘制上限而多开一个批次

3. **设备性能适配**
   - CPU 性能不足的设备，场景中 Mesh 数量要少
   - Stats 显示的 Batcher 数量 = 同屏可见的 Mesh 数量

### 性能指标参考

| 设备类型 | 建议 Mesh 数 | 说明 |
|----------|--------------|------|
| 高端 PC | 不限 | 看 Batcher 数量 |
| 中端设备 | < 500 | 保守估计 |
| 低端/移动端 | < 200 | 严格控制 |

### 常见问题

**Q: 为什么开了 SRP Batcher 还是很多批次？**
A: 可能是 Shader 种类过多，或者单次绘制达到上限

**Q: 独立场景的材质需要隔离吗？**
A: 取决于内存预算，隔离可以减少运行时内存占用

### 验证记录
- [2025-07-11] 实际项目优化验证
- [2026-03-05] 从长期记录提取到阿卡西

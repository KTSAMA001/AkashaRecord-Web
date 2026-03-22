---
title: ASTC 纹理压缩内存估算公式
tags:
  - unity
  - texture
  - memory
  - astc
  - experience
status: ✅ 已验证
description: ASTC 纹理压缩内存估算公式
source: 实践总结
recordDate: '2026-03-05'
credibility: ⭐⭐⭐⭐
version: Unity 2020.3+ / 移动平台
---
# ASTC 纹理压缩内存估算公式


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=texture" class="meta-tag">texture</a> <a href="/records/?tags=memory" class="meta-tag">memory</a> <a href="/records/?tags=astc" class="meta-tag">astc</a> <a href="/records/?tags=experience" class="meta-tag">经验</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2020.3+ / 移动平台</span></div>
</div>


## 概要

ASTC 压缩格式的内存估算公式，用于快速计算纹理占用内存。

## 内容

### 压缩倍率公式

```
压缩倍率 = n × n / 4
```

其中 `n` 为 ASTC 块大小（如 4x4、6x6、8x8、10x10、12x12）

### 内存计算示例

以 2048×2048 32位纹理，使用 10×10 压缩为例：

```
原始大小 = 2048 × 2048 × 32 / 8 / 1024 = 16384 KB = 16 MB

压缩后大小 = 原始大小 × (10 × 10 / 4)
         = 16 × 25
         = 400 KB ≈ 0.64 MB

开启 Mipmap 后 ≈ 0.9 MB
```

### ASTC 块大小与质量权衡

| 块大小 | 比特率 | 质量 | 适用场景 |
|--------|--------|------|----------|
| 4×4 | 8 bpp | 最高 | UI、重要纹理 |
| 6×6 | 3.56 bpp | 高 | 角色贴图 |
| 8×8 | 2 bpp | 中 | 场景贴图 |
| 10×10 | 1.28 bpp | 低 | 远景贴图 |
| 12×12 | 0.89 bpp | 最低 | 背景贴图 |

### 注意事项

- Mipmap 会额外增加约 33-50% 内存
- ASTC 主要用于移动平台（iOS/Android）
- PC 平台建议使用 BC 格式

### 验证记录

- [2026-03-05] 从项目实践经验提取并脱敏记录

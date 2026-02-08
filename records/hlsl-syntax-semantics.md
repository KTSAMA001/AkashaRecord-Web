---
title: Unity Shader / HLSL 基础知识
tags:
  - graphics
  - shader
  - knowledge
  - hlsl
status: ''
description: Unity Shader / HLSL 基础知识
source: Microsoft HLSL 文档、Unity Shader 官方文档
credibility: ⭐⭐⭐⭐⭐ (官方文档)
---
# Unity Shader / HLSL 基础知识

本文档聚焦 Unity Shader 里最常用的 HLSL 概念与工程习惯。

---

## 顶点/片元阶段与数据流


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=graphics" class="meta-tag">图形学</a> <a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=knowledge" class="meta-tag">知识</a> <a href="/records/?tags=hlsl" class="meta-tag">HLSL</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Microsoft HLSL 文档、Unity Shader 官方文档</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /></span> <span class="star-desc">官方文档</span></span></div>
</div>


- 顶点阶段输出：`SV_POSITION` + 自定义 varyings。
- 片元阶段输入：对 varyings 的插值结果（屏幕覆盖越大执行越多）。

---

## 语义（Semantics）


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=graphics" class="meta-tag">图形学</a> <a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=knowledge" class="meta-tag">知识</a> <a href="/records/?tags=hlsl" class="meta-tag">HLSL</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Microsoft HLSL 文档、Unity ShaderLab 文档</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /></span> <span class="star-desc">官方文档</span></span></div>
</div>


常见：
- `POSITION`：顶点输入位置（对象空间）
- `NORMAL` / `TANGENT`：顶点法线/切线
- `TEXCOORD0..n`：UV/自定义插值通道
- `SV_POSITION`：裁剪空间位置（顶点输出/片元输入）

---

## CBUFFER（Constant Buffer）与参数组织


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=graphics" class="meta-tag">图形学</a> <a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=knowledge" class="meta-tag">知识</a> <a href="/records/?tags=hlsl" class="meta-tag">HLSL</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Unity 官方博客 - SRP Batcher、Microsoft HLSL 文档</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /></span> <span class="star-desc">官方文档 + 实践验证</span></span></div>
</div>


- CBUFFER 是 GPU 侧常量数据块。
- SRP Batcher 通常要求材质参数在约定的 CBUFFER 中组织（例如 `UnityPerMaterial`），以便更稳定地提交。

---

## 精度选择（float/half）


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=graphics" class="meta-tag">图形学</a> <a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=knowledge" class="meta-tag">知识</a> <a href="/records/?tags=hlsl" class="meta-tag">HLSL</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Unity 官方文档 - Shader data types、ARM Mali GPU 文档</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">官方文档 + 实践验证</span></span></div>
</div>


- 移动端常用 `half` 以降低带宽/寄存器压力（但要注意精度问题）。
- 关键计算（深度、世界坐标、矩阵运算等）通常需要 `float` 更安全。

---

## 关键字与变体


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=graphics" class="meta-tag">图形学</a> <a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=knowledge" class="meta-tag">知识</a> <a href="/records/?tags=hlsl" class="meta-tag">HLSL</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Unity 官方文档 - Shader variants and keywords</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /></span> <span class="star-desc">官方文档 + 实践验证</span></span></div>
</div>


- 关键字组合会生成多个编译变体，组合数量容易爆炸。
- 通用原则：能少开就少开；用更少组合表达需求。

---

## 关联知识

- 渲染管线基础：./rendering-pipeline-overview.md

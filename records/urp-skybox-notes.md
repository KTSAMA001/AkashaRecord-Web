---
title: URP SkyBox 注意事项
tags:
  - unity
  - urp
  - shader
  - skybox
  - experience
status: ✅ 已验证
description: URP SkyBox 注意事项
source: 实践总结
recordDate: '2026-03-05'
credibility: ⭐⭐⭐⭐
version: Unity 2022.3+ / URP 14+
---
# URP SkyBox 注意事项


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=urp" class="meta-tag">URP</a> <a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=skybox" class="meta-tag">skybox</a> <a href="/records/?tags=experience" class="meta-tag">经验</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2022.3+ / URP 14+</span></div>
</div>


## 概要

URP 天空盒不能使用 URP 格式 Shader，必须使用 Built-in 管线写法。

## 内容

### 核心发现

1. **Shader 格式限制**：URP SkyBox 不能使用 URP 的 Shader 格式，必须使用 Built-in 管线的写法
2. **渲染路径不同**：天空盒和游戏对象的处理没有走同一个渲染流程

### 远裁切面行为

- 天空盒是一个以相机为中心、半径与远裁切平面相切的球体
- 当远裁切面拉得很近时，会感觉到前面有个离自己很近的弧形平面
- 天空盒材质给普通物体会被远裁切面裁切
- 但设置给环境的天空球选项时完全不受裁切影响（因为永远在裁切面内）

### 注意事项

- 天空盒 Shader 需要用传统 Built-in 语法编写
- 不要尝试将 URP 格式的 Shader 直接用于天空盒

### 验证记录

- [2026-01-20] 实际测试验证，远裁切面调整后观察到球体弧形
- [2026-03-05] 从长期记录提取到阿卡西

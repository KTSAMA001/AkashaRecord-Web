---
title: 基于物理的渲染 (Physically Based Rendering) 相关经验
tags:
  - shader
  - unity
  - experience
  - pbr
  - urp
  - hlsl
status: ✅ 已验证
description: 基于物理的渲染 (Physically Based Rendering) 相关经验
recordDate: '2026-02-07'
sourceDate: '2024-08-08'
version: Unity 2022.3+ / URP 14.0+
---
# 基于物理的渲染 (Physically Based Rendering) 相关经验

> 基于物理的渲染 (Physically Based Rendering) 相关经验
>
> 包含：自定义 PBR Shader、BRDF 实现、IBL、材质工作流等

---

## 自定义 PBR Shader 在 URP 中的实现 {#custom-pbr-urp}


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2024-08-08</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=pbr" class="meta-tag">PBR 渲染</a> <a href="/records/?tags=urp" class="meta-tag">URP</a> <a href="/records/?tags=hlsl" class="meta-tag">HLSL</a></span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2022.3+ / URP 14.0+</span></div>
</div>


**问题/场景**：

在 URP 中需要完全自定义 PBR Shader（非使用内置 Lit Shader），手动实现 Cook-Torrance BRDF 模型，包含直接光照和间接光照（IBL），并生成材质属性矩阵展示。

**解决方案/结论**：

### 1. Shader 架构拆分

将 BRDF 函数独立到 `PBR_Func.hlsl` 文件中，主 Shader 文件 `PBR_URP_Shader.shader` 通过 `#include` 引入：

```hlsl
#include "PBR_Func.hlsl"
```

这样实现了功能复用，草渲染等模块也可以引用相同的 PBR 函数库。

### 2. 金属度/粗糙度统一工作流

```hlsl
float3 F0 = lerp(0.04, albedo, metallic);  // 统一金属/非金属
float3 kd = (1 - F) * (1 - metallic);      // 能量守恒
```

### 3. 间接光照 IBL 实现

```hlsl
// 反射探针采样
float mip = roughness * (1.7 - 0.7 * roughness) * UNITY_SPECCUBE_LOD_STEPS;
float4 cubeMapColor = SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, samplerunity_SpecCube0, reflectDirWS, mip);
float3 envSpecular = DecodeHDREnvironment(cubeMapColor, unity_SpecCube0_HDR);

// 漫反射使用球谐
float3 diffuse_InDirect = SampleSH(N) * albedo * kd;
```

### 4. 材质矩阵展示工具

通过 C# 脚本 `MaterialMatrixShow.cs` 自动生成金属度×粗糙度×亮度的三维球阵列：

```csharp
for (int i = 0; i < _index; i++)       // 亮度轴
    for (int j = 0; j < _index; j++)   // 粗糙度轴
        for (int k = 0; k < _index; k++) // 金属度轴
        {
            temp.material.SetFloat("_Metallic", (float)(k + 0.2f) / _index);
            temp.material.SetFloat("_Roughness", (float)(j + 0.2f) / _index);
            temp.material.color = Color.white * ((float)(i + 0.2f) / _index);
        }
```

**参考链接**：

- [Unity_URP_Learning/PBR](https://github.com/KTSAMA001/Unity_URP_Learning/tree/main/Assets/Products/PBR) - 完整源码
- [LearnOpenGL PBR Theory](https://learnopengl.com/PBR/Theory) - PBR 理论参考

**验证记录**：

- [2026-02-07] 从 Unity_URP_Learning 仓库整合，项目实际运行验证

**理论基础**：

- [PBR BRDF 模型详解](./knowledge/graphics/pbr.md#cook-torrance-brdf)
- [IBL 间接光照](./knowledge/graphics/pbr.md#ibl)

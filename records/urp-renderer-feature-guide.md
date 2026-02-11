---
title: URP Renderer Feature 开发要点
tags:
  - shader
  - unity
  - experience
  - urp
  - srp-batcher
  - renderer-feature
status: ✅ 已验证
description: URP Renderer Feature 开发要点
source: Technical_Artist_Technotes/关于SRP、URP
recordDate: '2026-01-31'
credibility: ⭐⭐⭐⭐ (实践验证)
---
# URP Renderer Feature 开发要点


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-01-31</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=urp" class="meta-tag">URP</a> <a href="/records/?tags=srp-batcher" class="meta-tag">SRP Batcher</a> <a href="/records/?tags=renderer-feature" class="meta-tag">Renderer Feature</a></span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Technical_Artist_Technotes/关于SRP、URP</span></div>
</div>


**问题/场景**：

如何在 URP 中自定义 Renderer Feature？有哪些常见的踩坑点？

**核心概念**：

### 1. 什么是 Renderer Feature

Renderer Feature 是一系列对 **CommandBuffer 操作的集合**。它允许向 URP Renderer 添加额外的渲染通道，自定义渲染顺序、渲染对象、材质等。

**本质**：在渲染任务列表中插入、调整渲染任务

### 2. 为什么需要 Renderer Feature

**URP 的限制**：同一个 Shader 中，输出到某一缓冲区的 Pass 只能有一个。

**传统多 Pass 做法**（如描边）在 URP 中无法直接实现：
```
Pass 1: 渲染扩张后的背面 → 颜色缓冲区
Pass 2: 渲染正面 → 颜色缓冲区  // URP 不支持！
```

**解决方案**：使用 Renderer Feature 在指定渲染阶段添加新的 CommandBuffer

### 3. CommandBuffer 基本流程

```csharp
public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
{
    // 1. 申请 CommandBuffer（指定名称，对应 Frame Debugger 中的任务名）
    CommandBuffer cmd = CommandBufferPool.Get("MyFeatureName");
    
    // 2. 设置相机、光照等信息
    Camera camera = renderingData.cameraData.camera;
    
    // 3. 添加绘制命令
    cmd.DrawMesh(mesh, matrix, material);
    // 或 cmd.DrawRenderer(renderer, material);
    
    // 4. 执行 CommandBuffer
    context.ExecuteCommandBuffer(cmd);
    
    // 5. 释放 CommandBuffer
    CommandBufferPool.Release(cmd);
}
```

### 4. 常见踩坑点

#### 4.1 部分物体不被渲染

**原因**：Render Layer Mask 设置问题

```csharp
// 在 FilteringSettings 中设置 LayerMask
FilteringSettings filteringSettings = new FilteringSettings(
    RenderQueueRange.opaque,
    layerMask: 1 << targetLayer  // 只渲染指定 Layer
);
```

#### 4.2 批处理失效

**原因1**：Shader 属性未放入 CBUFFER
```hlsl
// 所有属性都要在 CBUFFER 中声明
CBUFFER_START(UnityPerMaterial)
    half4 _Color;
CBUFFER_END
```

**原因2**：未知问题 → 尝试重新烘焙场景光照

#### 4.3 Frame Debugger 中 Pass 名称不对

**原因**：CommandBuffer 申请时的名称就是 Frame Debugger 中显示的任务名

```csharp
// 这个名称会显示在 Frame Debugger 中
CommandBuffer cmd = CommandBufferPool.Get("SurfaceOutline");
```

### 5. 官方 Renderer Feature 参考

| Feature | 功能 |
|---------|------|
| Render Objects | 在指定时机用指定材质渲染指定 Layer 的物体 |
| Decal | 贴花系统 |
| Screen Space Shadows | 屏幕空间阴影映射（需手动添加，非默认） |
| SSAO | 屏幕空间环境光遮蔽 |

### 6. ScriptableRenderPass 关键方法

```csharp
public class MyRenderPass : ScriptableRenderPass
{
    // 配置渲染目标
    public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData) { }
    
    // 执行渲染（核心方法）
    public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData) { }
    
    // 清理资源
    public override void OnCameraCleanup(CommandBuffer cmd) { }
}
```

### 7. ScriptableRendererFeature 基本结构

```csharp
public class MyRendererFeature : ScriptableRendererFeature
{
    MyRenderPass m_RenderPass;
    
    public override void Create()
    {
        m_RenderPass = new MyRenderPass();
        m_RenderPass.renderPassEvent = RenderPassEvent.AfterRenderingOpaques;
    }
    
    public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
    {
        renderer.EnqueuePass(m_RenderPass);
    }
}
```

**验证记录**：

- [2026-01-31] 从 Technical_Artist_Technotes 整理提取

---
title: 'RenderFeature 运行时开关控制 {#renderfeature-toggler}'
tags:
  - shader
  - unity
  - experience
  - urp
  - srp-batcher
  - renderer-feature
status: ✅ 已验证
description: 'RenderFeature 运行时开关控制 {#renderfeature-toggler}'
source: Unity_URP_Learning
recordDate: '2026-02-07'
sourceDate: '2024-08-08'
credibility: ⭐⭐⭐⭐ (代码验证)
version: Unity 2022.3+ / URP 14.0+
---
# RenderFeature 运行时开关控制 {#renderfeature-toggler}


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-07</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2024-08-08</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=shader" class="meta-tag">着色器</a> <a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=urp" class="meta-tag">URP</a> <a href="/records/?tags=srp-batcher" class="meta-tag">SRP Batcher</a> <a href="/records/?tags=renderer-feature" class="meta-tag">Renderer Feature</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Unity_URP_Learning</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">代码验证</span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Unity 2022.3+ / URP 14.0+</span></div>
</div>


**问题/场景**：

在 URP 中需要运行时动态开关 RenderFeature（如调试时禁用某些后处理效果），默认 RenderFeature 只能在 Inspector 中手动勾选。

**解决方案/结论**：

通过 `ScriptableRendererFeature.SetActive()` 方法运行时控制：

```csharp
[System.Serializable]
public struct RenderFeatureToggle
{
    public ScriptableRendererFeature feature;
    public bool isEnabled;
}

[ExecuteAlways]
public class RenderFeatureToggler : MonoBehaviour
{
    [SerializeField] private List&lt;RenderFeatureToggle&gt; renderFeatures;
    [SerializeField] private UniversalRenderPipelineAsset pipelineAsset;

    private void Update()
    {
        foreach (var toggle in renderFeatures)
            toggle.feature.SetActive(toggle.isEnabled);
    }
}
```

**关键代码**：

- `ScriptableRendererFeature.SetActive(bool)` — URP 内置 API
- `[ExecuteAlways]` — 确保在编辑器和运行时都生效

**验证记录**：

- [2026-02-07] 从 Unity_URP_Learning 仓库整合

**相关经验**：

- [URP Renderer Feature 开发要点](./urp-renderer-feature-guide) — RenderFeature 基础模式

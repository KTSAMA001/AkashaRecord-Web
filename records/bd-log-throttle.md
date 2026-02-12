---
title: BD 节点日志频率控制
tags:
  - unity
  - experience
  - editor
  - behavior-designer
status: ✅ 已验证
description: BD 节点日志频率控制
source: KTSAMA 实践经验
recordDate: '2026-02-03'
credibility: ⭐⭐⭐⭐ (实践验证)
---
# BD 节点日志频率控制 {#bd-log-throttle}


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-03</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=editor" class="meta-tag">编辑器</a> <a href="/records/?tags=behavior-designer" class="meta-tag">行为树</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA 实践经验</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">实践验证</span></span></div>
</div>


### 问题/场景

行为树节点的 `OnUpdate` 可能每帧执行，如果在其中打印日志会导致：
- Console 刷屏
- 性能下降
- 难以定位关键信息

### 解决方案

添加日志频率控制，限制同一消息最多每秒输出一次：

```csharp
public class MyConditional : ProfilingConditional
{
    // 日志频率控制
    private float _lastLogTime = 0f;
    private const float LOG_INTERVAL = 1f; // 秒

    private bool CanLog()
    {
        float currentTime = Time.time;
        if (currentTime - _lastLogTime >= LOG_INTERVAL)
        {
            _lastLogTime = currentTime;
            return true;
        }
        return false;
    }

    public override TaskStatus OnUpdate_Profiler()
    {
        if (someConditionFailed)
        {
            if (CanLog())
                Debug.LogWarning($"KT---{GetType().Name}---失败原因---{DateTime.Now:HH:mm:ss}");
            return TaskStatus.Failure;
        }
        return TaskStatus.Success;
    }
}
```

### 关键代码

- 使用 `Time.time` 而非 `DateTime.Now` 比较（性能更好）
- 每个节点实例独立计时
- 日志格式遵循项目规范：`KT---类名---信息---时间`

### 验证记录

| 日期 | 验证者 | 结果 |
|------|--------|------|
| 2026-02-03 | KT | <img class="inline-icon inline-icon--check" src="/icons/mark-check.svg" alt="✅" /> 日志频率正常控制，不再刷屏 |

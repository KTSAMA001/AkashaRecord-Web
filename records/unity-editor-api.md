---
title: Unity Editor 开发知识
tags:
  - unity
  - knowledge
  - editor
  - custom-editor
status: "\U0001F4D8 有效"
description: Unity Editor 开发知识
source: Unity Scripting API
recordDate: '2026-02-02'
sourceDate: '2026-02-02'
updateDate: '2026-02-02'
credibility: ⭐⭐⭐⭐⭐(官方)
---
# Unity Editor 开发知识

## [CustomEditor] 对子类的继承支持


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=unity" class="meta-tag">Unity 引擎</a> <a href="/records/?tags=knowledge" class="meta-tag">知识</a> <a href="/records/?tags=editor" class="meta-tag">编辑器</a> <a href="/records/?tags=custom-editor" class="meta-tag">自定义编辑器</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">Unity Scripting API</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2026-02-02</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-02</span></div>
<div class="meta-item"><span class="meta-label">更新日期</span><span class="meta-value">2026-02-02</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /></span> <span class="star-desc">官方</span></span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--info"><img class="inline-icon inline-icon--status" src="/icons/status-valid.svg" alt="有效" /> 有效</span></div>
</div>


### 定义/概念

Unity 的 `[CustomEditor]` 属性用于指定某个 Editor 类为特定组件的自定义 Inspector。
默认情况下，自定义 Editor 只对指定的类型生效。
通过设置构造函数的第二个参数 `editorForChildClasses` 为 `true`，可以使其对该类型的所有派生子类也生效。

### 原理/详解

`CustomEditor` 属性有两个构造函数：
1. `CustomEditor(Type inspectedType)`: 仅对 `inspectedType` 这一具体类型生效。
2. `CustomEditor(Type inspectedType, bool editorForChildClasses)`: 
   - 当 `editorForChildClasses` 为 `false`（默认）时，行为同上。
   - 当 `editorForChildClasses` 为 `true` 时，该 Editor 将应用于 `inspectedType` 及其所有派生类。

### 关键点

- **默认行为**：如果不传递第二个参数，默认为 `false`，即不应用到子类。
- **覆盖规则**：如果子类有自己专门定义的 `[CustomEditor]`（无论是否开启继承），则优先使用针对子类定义的 Editor，而不是基类的 Editor。
- **使用场景**：适用于创建通用的基类控制器，并希望所有仅仅是扩展了逻辑但未修改数据结构的子类都能共享同一套 Inspector UI 的情况。

### 示例

```csharp
// 这里的 true 表示该 Editor 也会应用于继承自 LogicMatAnimController 的所有子类
[CustomEditor(typeof(LogicMatAnimController), true)]
public class LogicMatAnimControllerEditor : UnityEditor.Editor
{
    public override void OnInspectorGUI()
    {
        // 绘制 Inspector
    }
}
```

```csharp
// 空壳子类也能享受到父类的自定义 Inspector
public class LogicMatAnimMarkerController : LogicMatAnimController
{
}
```

### 相关知识

- [Editor类](https://docs.unity3d.com/ScriptReference/Editor.html)
- [CustomEditor属性](https://docs.unity3d.com/ScriptReference/CustomEditor.html)

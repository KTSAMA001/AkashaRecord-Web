---
title: AstrBot 插件自动触发函数（LLM 请求拦截）
tags:
  - ai
  - experience
  - mcp
  - astrbot
status: ✅ 已验证
description: AstrBot 插件自动触发函数（LLM 请求拦截）
recordDate: '2026-02-05'
sourceDate: '2026-02-05'
version: AstrBot v4.14.2+
---
# AstrBot 插件自动触发函数（LLM 请求拦截）


<div class="record-meta-block">
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-02-05</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2026-02-05</span></div>
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=ai" class="meta-tag">AI</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=mcp" class="meta-tag">MCP 协议</a> <a href="/records/?tags=astrbot" class="meta-tag">AstrBot</a></span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">AstrBot v4.14.2+</span></div>
</div>


**问题/场景**：

需要在 AstrBot 插件中实现自动触发的功能，无需用户主动调用 LLM 工具，而是在每次 LLM 请求时自动执行某些逻辑（如记忆注入、上下文增强、日志记录等）。

**解决方案/结论**：

- 使用 `@on_llm_request()` 装饰器拦截 LLM 请求
- 在 LLM 处理前/后注入自定义逻辑
- 可修改 `event.context` 实现上下文增强
- 返回 `event` 继续正常流程，返回其他值可中断流程

**关键代码**：

```python
from astrbot.api.all import Star, on_llm_request, Context
from astrbot.api.event import AstrMessageEvent

class Main(Star):
    def __init__(self, context: Context):
        super().__init__(context)
        self.context = context
    
    @on_llm_request()
    async def on_llm_request_handler(self, event: AstrMessageEvent):
        """
        每次 LLM 请求时自动触发
        
        参数:
            event: 包含用户消息、会话上下文等信息
        
        返回:
            event: 返回 event 继续正常 LLM 流程
            其他: 返回其他值（如字符串）会中断流程并作为响应
        """
        # 示例：获取用户消息
        user_message = event.message_str
        sender_id = event.get_sender_id()
        
        # 示例：在 LLM 请求前注入系统提示
        # event.context.system_prompt += "\n额外的系统提示..."
        
        # 示例：记录日志
        self.context.logger.info(f"KT---{self.__class__.__name__}---on_llm_request---{sender_id}")
        
        # 返回 event 继续正常流程
        return event
```

**使用场景**：

| 场景 | 实现方式 |
|------|----------|
| 记忆注入 | 在 `on_llm_request` 中查询记忆，追加到 `event.context` |
| 上下文增强 | 动态修改 `system_prompt` 或 `messages` |
| 请求过滤 | 检查用户消息，返回非 event 值中断流程 |
| 日志记录 | 记录每次 LLM 请求的用户、时间、消息 |
| 权限控制 | 检查 `sender_id` 决定是否允许请求 |

**注意事项**：

1. `@on_llm_request()` 必须是无参数的装饰器（带括号）
2. 方法必须是 `async` 异步方法
3. 返回 `event` 继续流程；返回其他值（如字符串）会作为响应并中断 LLM 调用
4. 多个插件的 `on_llm_request` 会按插件加载顺序依次执行

**与 @llm_tool 的区别**：

| 装饰器 | 触发方式 | 用途 |
|--------|----------|------|
| `@llm_tool()` | LLM 主动调用 | 提供工具给 LLM 按需使用 |
| `@on_llm_request()` | 每次 LLM 请求自动触发 | 拦截/增强/过滤请求 |

**参考链接**：
- [AstrBot 插件开发文档](https://github.com/AstrBot/AstrBot)

**验证记录**：
- [2026-02-05] 通过 astrbot_plugin_file_sender 插件实践验证

**相关经验**：
- [AstrBot 集成 MCP 服务经验](./astrbot-mcp-service-config)
- [AstrBot 插件文件上传到QQ实现](./astrbot-plugin-file-upload-onebot)

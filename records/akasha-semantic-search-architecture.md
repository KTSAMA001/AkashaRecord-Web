---
title: 阿卡西记录语义搜索架构设计
tags:
  - architecture
  - ai
  - mcp
  - akasha
  - search-engine
  - python
status: "\U0001F4A1 构想中"
description: 阿卡西记录语义搜索架构设计
source: KTSAMA - 技术设计讨论
recordDate: '2026-03-04'
sourceDate: '2026-03-04'
updateDate: '2026-03-04'
credibility: ⭐⭐⭐⭐（设计讨论）
version: Akasha-KT v2.2.0+
---
# 阿卡西记录语义搜索架构设计


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=architecture" class="meta-tag">架构设计</a> <a href="/records/?tags=ai" class="meta-tag">AI</a> <a href="/records/?tags=mcp" class="meta-tag">MCP 协议</a> <a href="/records/?tags=akasha" class="meta-tag">阿卡西记录</a> <a href="/records/?tags=search-engine" class="meta-tag">搜索引擎</a> <a href="/records/?tags=python" class="meta-tag">Python</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">KTSAMA - 技术设计讨论</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-04</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2026-03-04</span></div>
<div class="meta-item"><span class="meta-label">更新日期</span><span class="meta-value">2026-03-04</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--info"><img class="inline-icon inline-icon--status" src="/icons/status-concept.svg" alt="构想中" /> 构想中</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span> <span class="star-desc">设计讨论</span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">Akasha-KT v2.2.0+</span></div>
</div>


### 概要

为阿卡西记录（Akasha-KT）设计基于向量模型的语义搜索架构，提升自然语言查询体验，实现从关键词匹配到语义理解的升级。

### 背景分析

当前阿卡西记录采用基于标签和关键词的检索机制：
- 通过 INDEX.md 进行文件定位
- 使用 Grep 工具进行内容匹配
- 依赖人工维护的标签系统

**局限性**：
1. 语义理解能力弱，需精确关键词匹配
2. 标签依赖人工维护，存在维护成本
3. 无法发现隐性关联内容
4. 查询体验受限于用户表达方式

### 方案设计

#### 方案一：本地嵌入 + 向量数据库（推荐）

**技术选型**：

| 组件 | 推荐方案 | 备选方案 |
|------|---------|---------|
| 嵌入模型 | OpenAI text-embedding-3-small | mxbai-embed-large（本地） |
| 向量数据库 | ChromaDB（轻量） | Qdrant（高性能） |
| 文档切分 | Markdown 结构化分块 | 固定窗口分块 |

**架构流程**：

```
┌─────────────────────────────────────────────────────────────┐
│                        首次构建阶段                           │
├─────────────────────────────────────────────────────────────┤
│  data/*.md → 文档解析 → 结构化分块 → 生成嵌入 → 存入 ChromaDB │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                         搜索查询阶段                          │
├─────────────────────────────────────────────────────────────┤
│  用户查询 → 生成查询嵌入 → 向量相似度检索 → 返回 Top-K 结果     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┤
│                      混合检索（增强版）                        │
├─────────────────────────────────────────────────────────────┤
│  向量检索 + 关键词检索 → 结果融合 → 重新排序 → 输出             │
└─────────────────────────────────────────────────────────────┘
```

**关键设计点**：

1. **文档分块策略**：
   - 基于 Markdown 结构：`##` 或 `###` 为分块边界
   - 标题 + 正文组合：保留语义上下文
   - 块大小：500-1000 token（约 2-4 段落）

2. **元数据保留**：
   ```python
   metadata = {
       "source_file": "record-name.md",
       "section_title": "标题",
       "tags": ["#unity", "#shader"],
       "status": "✅ 已验证",
       "chunk_id": 0
   }
   ```

3. **搜索结果呈现**：
   - 显示匹配度分数
   - 高亮相关段落
   - 关联同文件其他块

#### 方案二：纯 API 方案

利用现有 MCP 基础设施：
- 依赖外部向量搜索服务
- 无需本地部署向量数据库
- 适合快速验证原型

### 渐进式迁移路径

#### 阶段一：原型验证（POC）
- [ ] 实现基础向量检索功能
- [ ] 对比向量 vs 关键词检索效果
- [ ] 评估检索质量与性能

#### 阶段二：混合检索
- [ ] 实现向量 + 关键词融合检索
- [ ] 优化排序算法
- [ ] 支持检索结果解释（说明匹配来源）

#### 阶段三：生产集成
- [ ] 集成到 Akasha-KT 技能工作流
- [ ] 增量索引更新机制
- [ ] Web 可视化界面适配

### 技术实现要点

#### 增量更新机制
```python
# 记录更新触发
def on_record_updated(file_path):
    # 1. 检测变更类型
    if is_new_file or is_modified:
        # 2. 重新分块和嵌入
        chunks = parse_and_chunk(file_path)
        embeddings = embed(chunks)
        # 3. 删除旧索引（更新时）
        if is_modified:
            delete_embeddings(file_path)
        # 4. 写入新索引
        upsert_embeddings(chunks, embeddings)
```

#### 搜索 API 设计
```python
def semantic_search(
    query: str,
    top_k: int = 5,
    filter_tags: List[str] = None,
    include_metadata: bool = True
) -> List[SearchResult]:
    """
    语义搜索接口

    Args:
        query: 用户查询文本
        top_k: 返回结果数量
        filter_tags: 标签过滤（可选）
        include_metadata: 是否包含元数据

    Returns:
        SearchResult 列表，包含文件路径、匹配分块、相似度分数
    """
```

### 优势与挑战

**优势**：
- 语义理解能力强，支持自然语言查询
- 可发现隐性关联内容
- 减少对人工标签的依赖
- 查询体验更友好

**挑战**：
- 需要维护向量索引，增加存储开销
- 索引构建和更新需要时间
- 中文嵌入质量可能不如英文
- 检索准确度需要持续调优

### 参考链接

- [ChromaDB 文档](https://docs.trychroma.com/)
- [Qdrant 文档](https://qdrant.tech/documentation/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Sentence Transformers](https://www.sbert.net/) - 本地嵌入模型

### 相关记录

- [akasha-visualization-web.md](./akasha-visualization-web) - 阿卡西记录可视化网站架构
- [mcp-protocol-agent-dev.md](./mcp-protocol-agent-dev) - MCP 协议与 Agent 服务开发
- [self-hosted-search-engines.md](./self-hosted-search-engines) - 自搭建搜索引擎技术

### 验证记录

- [2026-03-04] 初次记录，基于技术讨论完成架构设计
- [ ] 待验证：选择嵌入模型并进行 POC 测试
- [ ] 待验证：评估向量数据库选型（ChromaDB vs Qdrant）
- [ ] 待实现：集成到 Akasha-KT 技能工作流

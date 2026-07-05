window.blogPosts = [
  {
    id: "ai-agent-design-patterns",
    title: "大语言模型智能体（Agent）的设计模式与多智能体协同",
    subtitle: "Design Patterns of LLM Agents and Multi-Agent Collaboration",
    summary: "深入剖析现代 AI Agent 的核心架构要素（规划、记忆、工具调用），结合 LangChain 与 AutoGen 框架，探讨如何通过多智能体协同提升复杂任务解决率。",
    date: "2026-07-04",
    readTime: "8 min read",
    tags: ["AI应用", "Agent", "大模型"],
    featured: true,
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p class="lead">从简单的 Chatbot 到具备自主规划和工具调用能力的智能体（Agent），大语言模型（LLM）的应用落地已经进入了全新的系统阶段。本文将结合雷科 AI 实习项目经验，探讨 Agent 系统的核心组件设计模式。</p>
      
      <h2>1. AI Agent 的核心组件架构</h2>
      <p>一个标准的智能体通常由以下四个基本模块协同构成：</p>
      <ul>
        <li><strong>规划（Planning）</strong>：Agent 需要拆解复杂的任务。常用技术包括 **ReAct (Reason + Act)**、**CoT (Chain of Thought)** 以及 **Tree of Thoughts**。通过这些思维链路，智能体能进行自我反思与多步纠错。</li>
        <li><strong>记忆（Memory）</strong>：
          <ul>
            <li><em>短期记忆</em>：上下文窗口内的多轮对话内容。</li>
            <li><em>长期记忆</em>：通过外部向量数据库（如 Milvus, Pinecone）或关系数据库，实现跨会话的数据持久化。</li>
          </ul>
        </li>
        <li><strong>工具（Tools）</strong>：这是智能体连接世界的触手。包括搜索引擎、API 接口、数据库查询、本地 Python 代码执行沙箱等。</li>
      </ul>
      
      <blockquote>
        “Agent 不仅能够思考，更能够借助工具去改变系统状态，这正是它与传统聊天机器人的本质区别。”
      </blockquote>

      <h2>2. 多智能体系统（Multi-Agent System）协作设计</h2>
      <p>当任务复杂度极高时，单一智能体往往受限于上下文窗口与角色冲突。多智能体协作通过“分工”（Role-Playing）将任务分发给不同的专家角色（例如：前端、后端、测试专家），每个角色配置特制的 Prompt 和工具集。</p>
      
      <p>多智能体之间的协作模式主要有两种：</p>
      <ol>
        <li><strong>链式模式（Sequential flow）</strong>：上一个 Agent 的输出作为下一个 Agent 的输入（类似于流水线工作）。</li>
        <li><strong>群聊模式（Hierarchical/Group chat）</strong>：引入“主持人（Manager）”决策角色，动态分派下一个发言的 Agent，实现复杂的网状协作。</li>
      </ol>
      
      <h2>3. ReAct 模式核心代码演示</h2>
      <p>以下是使用 Python 编写的极简 ReAct 循环伪代码，展示 Agent 如何在观察后循环决策执行：</p>
      
      <pre><code class="language-js">class AgentExecutor:
  def __init__(self, model, tools):
    self.model = model
    self.tools = tools

  def run(self, task_description):
    history = [f"Task: {task_description}"]
    for step in range(5):  # 限制最大思考步数
      prompt = self.build_prompt(history)
      thought_and_action = self.model.generate(prompt)
      
      if "Final Answer:" in thought_and_action:
        return thought_and_action.split("Final Answer:")[-1]
        
      tool_name, tool_input = self.parse_action(thought_and_action)
      observation = self.tools[tool_name].execute(tool_input)
      history.append(f"Observation: {observation}")
    return "Error: Exceeded max steps"</code></pre>
      
      <p>智能体技术正在飞速演进。从简单的接口调用到具备多模态规划能力的智能实体，掌握 Agent 系统工程化落地，将是下一代 AI 应用开发的核心基石。</p>
    `
  },
  {
    id: "backend-high-concurrency",
    title: "高并发后端微服务的性能瓶颈定位与优化实践",
    subtitle: "Locating and Optimizing Bottlenecks in High-Concurrency Backend Services",
    summary: "从实战角度出发，分享在高并发数据接收服务中，如何利用连接池化、分布式锁、并发协程及 MySQL/Redis 深度调优手段，提升接口吞吐量与系统稳定性。",
    date: "2026-06-28",
    readTime: "7 min read",
    tags: ["开发", "后端", "高并发"],
    featured: true,
    cover: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p class="lead">在高并发车联网系统或核心微服务中，系统响应速度哪怕延迟 50 毫秒，在高峰期也可能引起级联故障。本文总结了长城汽车实习期间参与的微服务系统调优经验，详解如何快速定位瓶颈并实施重构。</p>
      
      <h2>1. 瓶颈定位：从系统指标到代码层追踪</h2>
      <p>定位系统瓶颈切忌凭空猜测，应当依靠严密的监控指标：</p>
      <ul>
        <li><strong>系统级监控</strong>：使用 Prometheus + Grafana 观察 CPU Wait、内存泄露趋势以及网络 I/O 堵塞情况。</li>
        <li><strong>应用级追踪</strong>：通过 SkyWalking/Jaeger 链路追踪，查看各 RPC 节点耗时，抓取耗时最长的 SQL 或数据库事务。</li>
        <li><strong>代码级分析</strong>：使用 Go pprof 或 Java JProfiler 分析 CPU 耗时比例与堆内存分配。</li>
      </ul>
      
      <h2>2. 实战调优方案</h2>
      
      <h3>2.1. 缓存银弹：读写分离与分布式锁设计</h3>
      <p>在高读低写场景中，引入 Redis 缓存可以分担数据库 90% 以上的查询压力。但在高并发写或删除场景中，必须注意**缓存一致性**与**缓存击穿**问题：</p>
      
      <pre><code class="language-js">// Redis 分布式锁典型加锁流程 (Go 伪代码)
func AcquireLock(ctx context.Context, key string, ttl time.Duration) bool {
    success, err := rdb.SetNX(ctx, key, "lock_owner_val", ttl).Result()
    if err != nil {
        return false
    }
    return success
}</code></pre>

      <h3>2.2. 连接池化与协程复用</h3>
      <p>频繁创建和销毁连接（MySQL、Redis、TCP 连接）是极大的性能消耗。配置合理的连接池参数（如设置 MaxOpenConns 和 MaxIdleConns）至关重要。同时，并发处理时必须注意控制并发上限，避免协程暴涨导致 OOM。</p>
      
      <h2>3. 总结</h2>
      <p>后端调优是一门空间换时间、在一致性与可用性（CAP 原则）之间寻找平衡的艺术。通过优化缓存、池化连接、限制资源并发，我们能成功将系统吞吐上限提高数倍，确保海量流量下系统仍能平稳运行。</p>
    `
  },
  {
    id: "automated-testing-pytest",
    title: "从零构建接口自动化测试框架：基于 Pytest + Request 的工程化实践",
    subtitle: "Building API Test Automation Framework from Scratch with Pytest",
    summary: "详细讲解企业级接口自动化测试框架的构建，如何优雅设计数据驱动测试（DDT）、多环境切换，以及如何将其无缝融合到 CI/CD 的流水线链路中。",
    date: "2026-06-15",
    readTime: "6 min read",
    tags: ["测开", "自动化测试", "CI/CD"],
    featured: false,
    cover: "https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p class="lead">手动接口测试耗时且容易遗漏边缘用例。基于 Pytest 强大的插件生态，搭建一套支持多配置、自动断言和丰富报告输出的接口自动化测试框架，是提升产品研发迭代效能的必由之路。本文结合联想测开实习经验进行归纳分享。</p>
      
      <h2>1. 自动化框架的分层设计</h2>
      <p>高质量的自动化测试框架必须保持良好的“高内聚低耦合”属性，通常采用如下架构分层：</p>
      <ul>
        <li><strong>配置层 (Config)</strong>：管理测试环境地址、数据库连接串、全局参数等（如 <code>config.yaml</code>）。</li>
        <li><strong>用例数据层 (Data)</strong>：采用 YAML 或 Excel 存放测试输入与预期输出，实现测试逻辑与测试数据完全解耦。</li>
        <li><strong>API 封装层 (Service)</strong>：将系统各个业务 API 接口封装为类和方法，便于复用与链式调用。</li>
        <li><strong>测试用例层 (Cases)</strong>：具体用例逻辑编写，使用 Pytest 的 fixture 机制实现用例的前置初始化与后置清理。</li>
      </ul>

      <h2>2. Pytest 核心特性实践</h2>
      <p>利用 Pytest 的 <code>@pytest.mark.parametrize</code> 实现数据驱动，一份用例代码即可批量扫描执行各种异常测试流：</p>
      
      <pre><code class="language-js"># 接口自动化驱动示例
import pytest
import requests

test_data = [
    ({"username": "valid_user", "password": "123"}, 200, "登录成功"),
    ({"username": "", "password": "123"}, 400, "用户名不能为空"),
    ({"username": "valid_user", "password": ""}, 400, "密码不能为空"),
]

@pytest.mark.parametrize("payload, expected_status, expected_msg", test_data)
def test_login_api(payload, expected_status, expected_msg):
    response = requests.post("http://api.test.com/login", json=payload)
    assert response.status_code == expected_status
    assert expected_msg in response.json()["message"]</code></pre>
      
      <h2>3. 融入 CI/CD 流水线</h2>
      <p>自动化测试的最终归宿是集成到持续集成链路中。在代码合并分支（Gitlab MR 或 Jenkins Build）时触发测试脚本，运行结束后自动抓取 Allure 历史测试趋势报告，若用例失败自动阻断发布流并通知研发，构筑起坚实的代码交付底线。</p>
    `
  },
  {
    id: "rag-knowledge-base",
    title: "基于企业知识库的精准检索增强生成（RAG）优化技术",
    subtitle: "Precision RAG Optimization for Enterprise Knowledge Base",
    summary: "聚焦企业级知识库落地痛点，剖析文档结构化切分、向量多路召回、BM25 混合检索以及 Rerank 重排对大模型回答效果的提升作用。",
    date: "2026-06-05",
    readTime: "7 min read",
    tags: ["AI应用", "RAG", "开发"],
    featured: false,
    cover: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p class="lead">虽然 RAG（Retrieval-Augmented Generation，检索增强生成）架构易于理解，但在实际企业落地场景中，面临着文档格式杂乱、向量检索语义偏差以及生成内容幻觉等重大痛点。本文将详细探讨如何在工程端实施一系列精度优化策略。</p>
      
      <h2>1. 文档清洗与切分优化（Data Chunking）</h2>
      <p>粗暴地按照固定长度切分段落会造成上下文截断。优化的 Chunk 策略包括：</p>
      <ul>
        <li><strong>结构敏感切分</strong>：根据 Markdown 的 Heading、PDF 的段落标记分段，保持语义块完整。</li>
        <li><strong>滑动窗口切分</strong>：在分段时，相邻 Chunk 保留 10%-20% 的重叠区域，避免边缘词汇遗失背景。</li>
        <li><strong>Parent-Document 机制</strong>：检索时提取精细的子 Chunk 向量计算相似度，而最终喂给 LLM 的则是子 Chunk 所属的父 Document 段落，平衡高精细计算与宏观上下文。</li>
      </ul>

      <h2>2. 多路混合检索与重排（Hybrid Search & Reranking）</h2>
      <p>纯向量检索（Dense Vector）非常善于捕捉语义和代词关系，但在面对“专有名词”、“产品型号”或“特定代码参数”时往往召回率极低。因此，生产环境中必须采用**混合检索模式**：</p>
      <p>将传统的关键字检索（如 **BM25**）与向量相似度检索（如 **Cosine Similarity**）并行计算，获取各自排名前 N 的文档。接着将合并结果输入到重排模型（如 **Cohere Rerank**、**BGE-Reranker**）进行精细排序，仅提取最顶层的 Top-K 送给大模型。</p>
      
      <h2>3. RAG 优化前后效果对比</h2>
      <p>根据团队内部评测指标，经过以上优化：</p>
      <ul>
        <li>文档关联段落召回精确率从 62% 提升至 89%。</li>
        <li>智能体知识问答准确率提升 25%，幻觉现象显著压制。</li>
      </ul>
      <p>在企业级 Agent 的闭环流中，高精度的 RAG 就像是大脑的高速缓存器，源源不断提供高度可信的事实来源，是目前最行之有效的垂直大模型落地底座。</p>
    `
  }
];

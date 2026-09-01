# 寻境 Codex Harness 成书生产架构与 Skill 运维规范 v1.0

- 文档日期：2026-09-01
- 状态：CURRENT / PRODUCTION ARCHITECTURE
- 产品依据：[寻境 C 端产品功能文档 v1.5](../01_产品规划/寻境C端产品功能文档_v1.5.md)
- 技术依据：[寻境 C 端完整产品技术实施蓝图 v1.0](./寻境C端完整产品技术实施蓝图_v1.0.md)
- 执行依据：[寻境 C 端完整产品 AI 实施任务书 v1.0](../04_AI交接任务书/寻境C端完整产品AI实施任务书_v1.0.md)
- 验收依据：[寻境 C 端 P0 验收门禁 v1.0](../05_验收与证据/寻境C端P0验收门禁_v1.0.md)

## 1. 架构决策

寻境生成旅行书、电子书、印刷 PDF 和后续可扩展出版物时，正式生产路径统一为：

1. 在 Linux 服务器的隔离任务环境中运行 Codex Harness。
2. Harness 必须加载经版本锁定的 `travel-memory-book` Skill，由该 Skill 定义旅程理解、编辑选片、跨页叙事、修订和印刷质量工作流。
3. Yudao 负责账户、权限、任务、订单、支付、履约和审计事实；Harness 只是可重试的内容生成执行层。
4. 以 Codex SDK / App Server 作为正式任务控制面，获得结构化输入输出、流式进度、线程恢复和错误语义。`codex exec --json` 只用于 CI、安装验证和运维诊断，不直接拼接用户文本成为 Shell 命令。
5. 确定性渲染和 QA 决定页数、尺寸、出血、DPI、字体、溢出、缺图、重复、地图和隐私是否合格。Harness 和模型均不得自行宣告 `PRINT_READY`。

这不是“在服务器上跑一段大提示词”。`travel-memory-book` Skill 是生产工作流的权威来源；Worker 内不得复制一份逐渐漂移的 Skill 规则。Skill 未加载时任务必须失败关闭，不能回退为通用提示词、模板拼装或人工暗中托底。

## 2. 当前代码事实与缺口

当前仓库的 `services/memory-book-worker/` 已有一条 Codex Harness 骨架：

- Python `openai-codex` 依赖和服务器任务入口。
- 结构化 JSON Schema 编辑方案。
- 全量联系表审阅、每张源照片决策和两轮主编审稿。
- 只读沙箱、有界重试和 `fallbackEnabled=false`。
- SVG/PDF、逐页预览、修订历史和机械 QA 基础。

这些代码不等于服务器生产已闭环。P0 必须补齐：

- 仓库内可审计的 Skill 源和不可变版本制品。
- 服务器启动时的 Skill 发现、版本、哈希和真实加载证据。
- 每任务隔离、持久队列、跨实例恢复、取消、资源额度和数据删除。
- 模型、Harness/SDK、Skill、渲染器和 QA 组合的灰度、观测和回滚。
- 真实 Linux/云形态下的 100–250 张照片端到端生成，不能只以 `/healthz` 为通过。

## 3. 生产组件与调用链

```text
C 端 App / H5 / 小程序
        |
        v
Yudao /app-api/xunjing/**
  ├─ 账户、租户、权限、Trip、BookVersion
  ├─ 任务状态、幂等、订单、审计
  └─ 持久任务队列
        |
        v
Publication Harness Runner（现有 memory-book-worker 演进）
  ├─ 每任务非特权隔离环境
  ├─ 只读原始素材 + 短效对象访问
  ├─ Codex SDK / App Server
  ├─ 锁定版本的 travel-memory-book Skill
  ├─ 确定性脚本、渲染器和 QA
  └─ 制品 manifest、哈希和脱敏运行日志
        |
        v
对象存储（JSON/SVG/PDF/预览/QA）
        |
        v
签名回调 Yudao -> 用户翻阅、修订、确认、下单
```

所有对外请求都由 Yudao 验证用户和 `tenant-id`。Runner 不持有支付、订单或用户主库的写凭据，只能按签名任务契约读取必要输入、上传制品并回传结果。

## 4. `travel-memory-book` Skill 安装

### 4.1 源码和产物位置

P0 在任务 `XJ-C1-04` 中建立如下受管路径：

```text
services/memory-book-worker/
├─ .agents/skills/travel-memory-book/     # 通过评审的 Skill 源，随 Worker 版本管理
│  ├─ SKILL.md
│  ├─ scripts/
│  ├─ references/
│  └─ assets/
├─ app/                                  # Runner 和业务适配
└─ tests/                                # Skill 发现、契约和端到端测试
```

上述是目标路径；在该目录真实提交 Skill 前，当前仓库不得标记“服务器 Skill 已安装”。不得在文档中复制 Skill 全文来代替真实安装。

### 4.2 镜像与运行时加载

- 构建时将通过验收的 Skill 打入不可变 Worker 镜像，记录语义版本、Git 提交和目录 SHA-256。
- 任务工作区中以只读方式暴露为 `/workspace/.agents/skills/travel-memory-book`，使 Codex 可按工作区 Skill 发现规则加载。
- 系统级安装可使用 `/etc/codex/skills`，但不得与当前任务锁定版本冲突。
- 任务输入显式携带 `skillName`、`skillVersion`、`skillSha256` 和预期输出契约。
- Runner 在开始读取用户原图前先执行 Skill 发现检查，并把 `skillLoaded=true`、实际版本和哈希写入运行 manifest。
- 任何“跟随 latest”、容器启动后在线覆盖 Skill，或无审核自动更新的做法均禁止进入生产。

### 4.3 最低环境契约

Worker 容器内部使用：

```text
MEMORY_BOOK_CODEX_MODEL
MEMORY_BOOK_CODEX_REASONING_EFFORT
MEMORY_BOOK_CODEX_MAX_ATTEMPTS
MEMORY_BOOK_CODEX_RETRY_BACKOFF_SECONDS
MEMORY_BOOK_SKILL_PATH
MEMORY_BOOK_SKILL_VERSION
MEMORY_BOOK_SKILL_SHA256
MEMORY_BOOK_JOB_TIMEOUT_SECONDS
MEMORY_BOOK_WORKER_CONCURRENCY
OPENAI_API_KEY
```

Compose/运维层对应使用 `XUNJING_MEMORY_BOOK_*` 名称注入。`OPENAI_API_KEY` 只作为进程级短期机密或工作负载凭据出现，不写入镜像、仓库、制品、任务日志或可持久 `auth.json`。当前代码允许从 `CODEX_HOME/auth.json` 取登录态只能用于开发诊断，生产必须收紧为服务器密钥管理。

## 5. 单任务执行契约

### 5.1 执行顺序

```text
1. Yudao 认领持久任务并生成签名输入 manifest
2. Runner 建立非特权、有资源配额的临时工作区
3. 按对象哈希下载必要原图，原图目录只读
4. 校验输入数量、文件类型、字节数、SHA-256 和元数据来源
5. 发现并加载锁定的 travel-memory-book Skill
6. Codex Harness 执行旅程理解、选片、叙事和版式计划
7. 确定性代码生成 SVG/预览/PDF 并逐页渲染
8. 自动 QA 和隐私/地图发布检查
9. 制品上传对象存储，写入输出哈希和完整 manifest
10. 签名回调 Yudao；Yudao 二次校验制品存在和 QA 后改变业务状态
11. 清理临时工作区，保留脱敏审计信息
```

Skill 未加载、版本或哈希不匹配、输入哈希不一致、制品不存在或 QA 失败时，任务不得进入 `COMPLETED`、`APPROVED` 或 `PRINT_READY`。

### 5.2 Skill 要求的制品

P0 必须保留并可追溯：

- 源素材 manifest 和每个原文件的 SHA-256，原图全程只读。
- `journey-model.json`：日期、地点、证据等级、事件和未知断点。
- 编辑 brief 与 `selection-ledger.json`：全量照片决策、入选原因、备选和拒选原因。
- `book-plan.json`：章节、页型、跨页节奏、地图页和文字范围。
- `visual-direction.json` 及校色/样式证明板。
- 可编辑首版、保护性预览、页面联系表和全页预览。
- `revision-history.json`：用户原话、受影响页、修订前后哈希和可回退版本。
- 最终印刷 PDF、制品 manifest 和 QA 报告。

旗舰样书验收基线为 100 张以上唯一真实照片；产品首发的优选输入为 120–250 张，目标整书 48–72 页。为了兼容现有 40–60 页产品契约，上线前必须在 `XJ-C2-03` 中用一个标准书型冻结最终页数区间，不能由模型任意决定。

### 5.3 修订契约

- 用户可以用自然语言要求更换封面、减少某类照片、隐藏地点/人物、压缩文字或调整情绪。
- Runner 继续加载同一 Skill 及上一版完整计划，只重新生成受影响的版本和制品。
- 用户文本、OCR、EXIF、文件名、图片内文字和第三方内容都是不可信输入，不得覆盖系统指令、Skill 约束、沙箱、工具权限或发布门禁。
- 修订前先显示预计影响页，修订后保留差异和回退点；模型不直接覆盖已批准印刷稿。

## 6. 安全、隔离与资源上限

- 每个任务使用非特权 Linux 用户和临时工作区，只授予当前 Trip 的输入和输出范围。
- 原图目录只读；渲染中间文件和最终制品分目录，防止覆盖原素材。
- 默认禁止任意出站网络，只允许 OpenAI 端点、受限对象存储、签名回调和经批准的地图/字体依赖。
- 限制照片数、单文件大小、单任务总字节、CPU、内存、磁盘、运行时间、并发和重试次数。
- 不向 Harness 暴露主库、Redis 管理、支付、物流、用户通讯录和其他租户凭据。
- 精确位置、儿童照片和私人行程不进入通用运营日志。
- 任务完成、失败、取消或超时后都执行工作区清理，用户删除时向所有派生制品传播。

## 7. Skill 版本维护与发布

### 7.1 版本与兼容矩阵

每次生产发布固定一组经验证组合：

```text
workerImageDigest
codexSdkVersion
codexHarnessVersion
model
reasoningEffort
skillName=travel-memory-book
skillVersion
skillSha256
rendererVersion
qaRulesVersion
fontPackVersion
```

Skill 版本包必须有 `CHANGELOG`、负责人、支持的 Worker/Harness 版本和已知限制。模型、SDK、Skill、渲染器和 QA 的任何一项升级都视为生成链路发布，不能无测试单独滑动。

### 7.2 测试集

每次发布至少覆盖：

1. 3 趟真实旅行，每趟至少 100 张唯一照片。
2. 1 趟有直接 GPS/轨迹，1 趟完全无 GPS/轨迹，1 趟元数据部分缺失。
3. iOS/Android 原图、编辑副本、截图、转发图和错误时间样本。
4. 至少 5 类自然语言修订：换封面、减文字、隐藏人物、隐藏地点、更换照片偏好。
5. Skill 缺失、版本错误、哈希错误、Harness 超时、模型限流、对象下载失败、渲染失败和 QA 失败。
6. 输入中含提示注入文字、超大文件、损坏图片、跨租户对象键和过期签名 URL。

机械门禁必须证明原图哈希未变、结构化制品齐全、全页渲染成功、PDF 印前规则通过、事实未编造、私密地点未意外暴露。

### 7.3 灰度与回滚

- 先在预发生成完整测试集，通过后用新组合处理 5–10 个可控真实任务。
- 灰度监测生成成功率、平均/长尾时间、模型成本、QA 失败、人工介入、修订轮数和用户确认率。
- 预发或灰度超过基线阈值时停止扩量，切回上一组已验证的镜像摘要和 Skill 哈希。
- 回滚不改写旧 `BookVersion`；已发生任务保留实际版本和错误证据，重试产生新任务记录。
- 任何版本不得因“更新”自动替换生产组合；必须由发布记录显式批准。

## 8. 运行看板与审计

Yudao Admin 必须能查看：

- Runner 实例、队列、当前任务、资源占用和最近心跳。
- Worker 镜像、Codex SDK/Harness、模型、推理强度、Skill、渲染器和 QA 版本。
- `skillLoaded`、`skillVersion`、`skillSha256`、输入/输出哈希和制品清单。
- 分阶段进度、耗时、模型 token/成本、重试、取消、超时和标准化错误码。
- 机械 QA、内容/隐私审查、人工例外、用户修订和最终确认结果。
- 最近一次发布、灰度比例、回滚时间和操作审计。

日志不得包含 API Key、owner token、Cookie、长期签名 URL、完整收货地址、精确轨迹或用户原图。

## 9. P0 验收标准

1. 干净 Linux 容器中能启动 Runner，但健康检查不代替成书任务。
2. 运行 manifest 证明 `travel-memory-book` 的名称、版本、哈希和 `skillLoaded=true`。
3. Skill 缺失、版本或哈希不符时任务 fail closed，无通用提示词或非 Codex 备用路径。
4. 一趟 100–250 张真实照片可完成上传、旅程理解、选片、排版、全页渲染、QA、预览和印刷 PDF。
5. 源图 SHA-256 全程不变，所有 Skill 制品、页面预览、最终 PDF 和 QA 报告可从对象存储读取。
6. 有 GPS、无 GPS 和部分元数据缺失样本不会伪造经纬度或道路级实轨。
7. 至少一次用户自然语言修订生成可查差异的新版本，且可回退。
8. 重复提交、Worker 重启、模型限流、超时、取消和 QA 失败都有持久、幂等、可解释结果。
9. 新 Skill 版本经预发和 5–10 单灰度后才能扩量，可回滚到上一个经验证镜像和 Skill 哈希。
10. 制品、日志和容器内无机密，跨租户、过期链接和提示注入测试失败关闭。
11. 删除 Trip 能传播到临时工作区、中间文件、预览、PDF 和可删除备份。
12. 只有确定性 QA 通过、用户明确确认且 Yudao 验证制品后，才允许进入 `PRINT_READY`。

## 10. 官方依据

- [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)：服务器中以 TypeScript 或 Python 编程方式运行、继续和控制 Codex 线程。
- [Codex 非交互模式](https://learn.chatgpt.com/docs/non-interactive-mode)：脚本/CI 的 `codex exec`、JSONL 输出、结构化输出、沙箱和密钥安全。
- [Build skills](https://learn.chatgpt.com/docs/build-skills)：Skill 目录结构、仓库/用户/系统级发现路径和辅助资源管理。
- [Codex as a platform](https://developers.openai.com/blog/codex-as-a-platform)：Codex Harness 负责上下文、工具使用、边界、审批、进度和失败管理。

## 11. 不进入 P0 的能力

- 把 Harness 开放成面向用户的通用 Agent 或自由代码执行环境。
- 用户自行安装 Skill、编辑系统指令或改变工具权限。
- 模型直接调用支付、物流、发布、数据库写入和用户消息。
- 无人监管的 Skill/模型自动升级。
- 在没有出版社和持证流程时，将定制纪念印品包装成有书号的公开出版物。

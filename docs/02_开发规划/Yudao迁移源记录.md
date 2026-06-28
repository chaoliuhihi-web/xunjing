# Yudao 迁移源记录

更新时间：2026-06-21

## 1. 用途

星河寻境是独立项目，Yudao 必须复制到本项目 `backend/yudao` 单独维护。本文件记录复制来源、基线状态和后续同步策略，避免后续误接原 XingheAI2026V2 运行环境。

## 2. 基线记录

| 项 | 内容 |
| --- | --- |
| 源路径 | `/Users/bruce/Developer/work/XingheAI2026V2/vendor/xingheai-yudao` |
| 目标路径 | `/Users/bruce/Developer/work/AI文旅/01_星河寻境/backend/yudao` |
| 源仓库 commit | `45ebafb5f9fd094a27df33caabf743c7d3752195` |
| 源路径状态 | `vendor/xingheai-yudao`、`xingheai/services/kb-service`、`xingheai/services/crawler-gateway` 无未提交差异 |
| 复制时间 | `2026-06-21 02:25:24 CST` |
| 执行人/AI | Codex |
| 当前目标分支 | `master` |
| 上游快照分支 | 未创建，当前以本文件记录源 commit；如后续需要长期跟踪上游，再单独创建 `yudao-upstream-snapshot` |

## 3. 复制排除项

```text
.git
target
node_modules
.runtime
.env
.env.*
*.log
```

复制命令：

```bash
rsync -a --delete \
  --exclude '.git' \
  --exclude 'target' \
  --exclude 'node_modules' \
  --exclude '.runtime' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '*.log' \
  /Users/bruce/Developer/work/XingheAI2026V2/vendor/xingheai-yudao/ \
  backend/yudao/
```

## 4. 运行隔离

| 资源 | 星河寻境配置 | 说明 |
| --- | --- | --- |
| MySQL | `yudao_xinghe_xunjing` | 不共用 XingheAI2026V2 数据库 |
| Redis | 独立 DB 或 `xj:` 前缀 | 不共用无前缀缓存 |
| Object Storage | `xinghe-xunjing/` prefix | 不和原项目混存素材 |
| Qdrant | `xinghe_xunjing_*` collection | 不共用原 collection |
| AI Key | Yudao AI 管理或未提交 env | 不写入源码 |

## 5. 后续同步策略

- 不自动同步上游 Yudao。
- 只 cherry-pick 明确 bugfix、安全修复或 AI 模块增强。
- 每次改 Yudao 原生模块必须记录到 `docs/02_开发规划/Yudao二开变更记录.md`。
- 星河寻境业务默认进入 `yudao-module-xunjing`，不修改 `yudao-module-ai` 承接业务表。

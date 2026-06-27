# City Companion Codebase Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a clean city-companion product branch, document the target code structure, and define multi-agent collaboration rules before feature development continues.

**Architecture:** The branch starts from `origin/master` and cherry-picks the clean P0 full-loop design commit. Product code remains in the existing APP and Yudao locations, while new work is organized by reusable city-companion domains and region content packs.

**Tech Stack:** Git, GitHub, Gitee, UniApp mini-program code under `assets/references/APP/kashgar-mini-program/`, Yudao Java module under `backend/yudao/yudao-module-xunjing/`, MySQL SQL under `backend/yudao/sql/mysql/`, Node/Vitest static gates under `scripts/`.

## Global Constraints

- Do not continue development on `handoff/xicheng-app-yudao-dev`.
- Use `product/city-companion-main` as the long-running city-companion product branch.
- Push the long-running branch to both GitHub `github` and Gitee `origin`.
- Keep APP code under `assets/references/APP/kashgar-mini-program/` until a dedicated rename migration is approved.
- Keep Yudao backend code under `backend/yudao/yudao-module-xunjing/`.
- Keep SQL under `backend/yudao/sql/mysql/`.
- Do not commit `tmp/`, `workbench/`, `dist/`, `target/`, `node_modules/`, `.env`, `.runtime/`, API keys, tokens, or cookies.

---

### Task 1: Create Clean Product Branch

**Files:**
- No file edits.

**Interfaces:**
- Consumes: `origin/master @ 6476c6c`, `github/codex/xicheng-p0-full-loop-docs-github @ f1335a7`.
- Produces: local branch `product/city-companion-main`.

- [ ] **Step 1: Fetch both remotes**

```bash
git fetch origin --prune
git fetch github --prune
```

Expected: `origin/master`, `origin/codex/xicheng-ai-companion-ui`, and `github/codex/xicheng-p0-full-loop-docs-github` are available.

- [ ] **Step 2: Create isolated worktree**

```bash
git worktree add workbench/city-companion-main -b product/city-companion-main origin/master
cd workbench/city-companion-main
```

Expected: branch `product/city-companion-main` is checked out at `6476c6c`.

- [ ] **Step 3: Cherry-pick clean design commit**

```bash
git cherry-pick f1335a7
```

Expected: commit applies cleanly and only changes PRD/design docs.

### Task 2: Add Collaboration Documentation

**Files:**
- Create: `docs/02_开发规划/城市AI旅伴产品代码结构与多AI协作规范.md`
- Create: `docs/04_AI交接任务书/城市AI旅伴多AI协作任务书.md`
- Modify: `docs/00_项目总览/资料索引.md`
- Modify: `docs/02_开发规划/开发入口说明.md`

**Interfaces:**
- Consumes: product design in `docs/superpowers/specs/2026-06-27-xicheng-p0-full-loop-design.md`.
- Produces: single onboarding path for all agents.

- [ ] **Step 1: Add code structure and collaboration spec**

Create `docs/02_开发规划/城市AI旅伴产品代码结构与多AI协作规范.md` with these sections:

```text
统一分支
远端策略
产品底座
内容包
前端目录规划
后端目录规划
SQL 规划
多 AI 分工
多设备接手命令
功能开发流程
PR 要求
当前上线硬阻塞
```

Expected: the document states `product/city-companion-main` is the only long-running city-companion development branch.

- [ ] **Step 2: Add AI handoff task book**

Create `docs/04_AI交接任务书/城市AI旅伴多AI协作任务书.md` with these role-specific task cards:

```text
AI-App
AI-Backend-App
AI-Backend-Admin
AI-QA
AI-Product
```

Expected: each task card includes branch naming, primary scope, verification commands, and excluded scope.

- [ ] **Step 3: Update document index**

Modify `docs/00_项目总览/资料索引.md` so the city-companion structure spec and AI handoff task book are listed as current onboarding documents.

Expected: a new agent can find the current branch and collaboration docs from the index.

- [ ] **Step 4: Update development entry**

Modify `docs/02_开发规划/开发入口说明.md` so it marks the city-companion product branch as the current development entry and explains that older book/map/globe P0 wording is historical context.

Expected: the file no longer tells agents to push only to Gitee for current product work.

### Task 3: Verify And Push

**Files:**
- No file edits.

**Interfaces:**
- Consumes: committed documentation changes.
- Produces: pushed branch on GitHub and Gitee.

- [ ] **Step 1: Verify branch cleanliness and diff**

```bash
git status --short
git diff --check
git log --oneline -3
```

Expected: `git diff --check` exits 0; status only shows intentional documentation edits before commit and clean after commit.

- [ ] **Step 2: Commit documentation**

```bash
git add docs/00_项目总览/资料索引.md \
  docs/02_开发规划/开发入口说明.md \
  docs/02_开发规划/城市AI旅伴产品代码结构与多AI协作规范.md \
  docs/04_AI交接任务书/城市AI旅伴多AI协作任务书.md \
  docs/superpowers/plans/2026-06-27-city-companion-codebase-governance.md
git commit -m "docs: define city companion branch and ai collaboration"
```

Expected: commit contains only documentation files.

- [ ] **Step 3: Push to both remotes**

```bash
git push -u github product/city-companion-main
git push -u origin product/city-companion-main
```

Expected: both remotes contain `product/city-companion-main`.

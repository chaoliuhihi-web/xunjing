# AI Wenlv Directory Reorg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `/Users/bruce/Developer/work/AI文旅` into a stable project workspace that is easy to browse, develop from, and hand off to another AI or engineer.

**Architecture:** Keep the top-level folder as a portfolio workspace, with numbered project/material directories. Keep `01_星河寻境` as the core project, split into `docs`, `assets`, `deliverables`, `workbench`, `tools`, and `archive` so source planning, reusable assets, final outputs, generation pipelines, and temporary files do not mix.

**Tech Stack:** macOS filesystem, Markdown documentation, existing PPT/PDF/DOCX/media assets, existing Python tool scripts.

## Global Constraints

- Do not delete original project content during this cleanup.
- Preserve the PPT generation project as one intact workbench directory.
- Keep development documentation inside `01_星河寻境/docs`.
- Keep final human-facing files inside `01_星河寻境/deliverables`.
- Keep temporary downloads, Office lock files, and system metadata in `01_星河寻境/archive`.
- This directory is not currently a git repository, so no GitHub/Gitee pull or push is performed during this cleanup.

---

### Task 1: Create Stable Top-Level Workspace

**Files:**
- Move: `/Users/bruce/Developer/work/AI文旅/星河寻境`
- Create: `/Users/bruce/Developer/work/AI文旅/01_星河寻境`
- Create: `/Users/bruce/Developer/work/AI文旅/02_图游喀什素材`

**Interfaces:**
- Consumes: Current local folder layout.
- Produces: Numbered top-level workspace layout.

- [ ] **Step 1: Rename the project directory**

Run from `/Users/bruce/Developer/work/AI文旅`:

```bash
mv 星河寻境 01_星河寻境
```

Expected: the project exists at `/Users/bruce/Developer/work/AI文旅/01_星河寻境`.

- [ ] **Step 2: Create material package directory**

Run:

```bash
mkdir -p 02_图游喀什素材/原始下载包 02_图游喀什素材/手绘导览图_透明PNG 02_图游喀什素材/压缩包归档
```

Expected: Kashgar material packages have a dedicated top-level location.

### Task 2: Move Current Documents and Outputs

**Files:**
- Move: `规划资料/产品规划/*` to `docs/01_产品规划/`
- Move: `规划资料/开发规划/*` to `docs/02_开发规划/`
- Move: `规划资料/PPT/图秀中华PPT内容与布局规划.docx` to `docs/03_汇报与PPT规划/`
- Move: final PPT/PDF/media files to `deliverables/`
- Move: generated design references to `assets/references/`

**Interfaces:**
- Consumes: Existing document, image, video, and presentation folders.
- Produces: Searchable project documentation, reusable assets, and final deliverables.

- [ ] **Step 1: Move product and development documents**

Expected: product planning files are in `docs/01_产品规划`, and development planning files are in `docs/02_开发规划`.

- [ ] **Step 2: Move presentation planning and final deliverables**

Expected: PPT planning docs are in `docs/03_汇报与PPT规划`, final PPT/PDF files are in `deliverables/ppt` and `deliverables/pdf`, and MP4/GIF files are in `deliverables/media`.

- [ ] **Step 3: Move visual references**

Expected: web, mobile, product, and PPT effect images are in `assets/references`.

### Task 3: Preserve Workbench and Archive Noise

**Files:**
- Move: `projects/tuxiu_zhonghua_ppt_ppt169_20260620` to `workbench/ppt-generation/`
- Move: `downloads` to `archive/downloads`
- Move: `tmp` to `archive/temp`
- Move: `~$*` files to `archive/office-lock-files`
- Move: `.DS_Store` files to `archive/system-files`

**Interfaces:**
- Consumes: Generation pipeline, temporary downloads, and system metadata.
- Produces: Clean project root while preserving reproducible context and temporary evidence.

- [ ] **Step 1: Move the PPT generation project intact**

Expected: the full PPT generation project remains available at `workbench/ppt-generation/tuxiu_zhonghua_ppt_ppt169_20260620`.

- [ ] **Step 2: Archive temporary and system files**

Expected: temporary files no longer clutter project source, docs, or deliverables.

### Task 4: Add Entry Documentation

**Files:**
- Create: `/Users/bruce/Developer/work/AI文旅/README.md`
- Create: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/README.md`
- Create: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/docs/00_项目总览/项目总览.md`
- Create: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/docs/00_项目总览/资料索引.md`
- Create: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/docs/02_开发规划/开发入口说明.md`
- Create: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/docs/04_AI交接任务书/下一阶段开发任务书.md`
- Create: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/.gitignore`

**Interfaces:**
- Consumes: Final folder layout.
- Produces: Human and AI-readable project entry points.

- [ ] **Step 1: Write root and project README files**

Expected: new collaborators can identify where the project, materials, deliverables, and workbench live.

- [ ] **Step 2: Write development entry and AI handoff documents**

Expected: future development starts from a known document path and avoids confusing generated assets with source code.

### Task 5: Verify Layout

**Files:**
- Inspect: `/Users/bruce/Developer/work/AI文旅`
- Inspect: `/Users/bruce/Developer/work/AI文旅/01_星河寻境`

**Interfaces:**
- Consumes: Organized filesystem.
- Produces: Verification evidence for the user.

- [ ] **Step 1: Print top-level tree and size summary**

Run:

```bash
find /Users/bruce/Developer/work/AI文旅 -maxdepth 2 -mindepth 1 -print
du -sh /Users/bruce/Developer/work/AI文旅/*
```

Expected: top-level has numbered project/material directories and README.

- [ ] **Step 2: Confirm git status**

Run:

```bash
find /Users/bruce/Developer/work/AI文旅 -maxdepth 3 -name .git -type d -print
```

Expected: no `.git` directory unless the user later asks to initialize and push to GitHub/Gitee.

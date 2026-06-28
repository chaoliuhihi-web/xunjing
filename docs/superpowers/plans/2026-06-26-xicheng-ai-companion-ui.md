# Xicheng AI Companion UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Beijing Xicheng APP UI MVP around Xiaojing, a scan entry, AI Q&A, route recommendations, travelogue generation, and recent recognition.

**Architecture:** Keep the existing UniApp app and add Xicheng-specific branches instead of replacing Kashgar content. The homepage lives in `pages/index/index.vue`; detail states live in `pages/ai-guide/ai-guide.vue` so they can reuse the existing AI companion route and package wiring.

**Tech Stack:** UniApp Vue 3, static local APP content, existing node-based contract tests, existing `npm run build` APP build.

## Global Constraints

- Do not replace existing `api2/*` calls or Kashgar pages.
- Do not store third-party API keys in the client.
- APP requests to `/app-api/xunjing/**` must keep `tenant-id` behavior.
- Use code-native UI text for all Chinese copy.
- Avoid root-directory screenshots or temporary artifacts.

---

### Task 1: Xicheng Static Contracts

**Files:**
- Create: `assets/references/APP/kashgar-mini-program/tests/xicheng-ai-companion-ui.test.mjs`
- Modify: `assets/references/APP/kashgar-mini-program/pages/index/index.vue`
- Modify: `assets/references/APP/kashgar-mini-program/pages/ai-guide/ai-guide.vue`

**Interfaces:**
- Consumes: existing UniApp page files.
- Produces: static tests that require Xicheng visible copy, route query wiring, and branch guards.

- [ ] **Step 1: Write failing test**

Create a test that asserts:
- home page has Xicheng mode guard and approved copy
- home actions navigate to `pages/ai-guide/ai-guide` Xicheng modes
- detail page has recognition, route, and travelogue branches

- [ ] **Step 2: Run test to verify it fails**

Run: `cd assets/references/APP/kashgar-mini-program && node tests/xicheng-ai-companion-ui.test.mjs`

Expected: fail because the Xicheng branches do not exist yet.

### Task 2: Xicheng Home Branch

**Files:**
- Modify: `assets/references/APP/kashgar-mini-program/pages/index/index.vue`

**Interfaces:**
- Produces: `showXichengAiHome`, `goXichengScan`, `askXiaojing`, `openXichengRoute`, `openXichengTravelogue`, `openXichengRecognition`.

- [ ] **Step 1: Implement Xicheng home template**

Add a first-priority branch for `mode=xicheng` with:
- 小京形象
- 扫一扫入口
- 问问小京
- 3 route cards
- 生成我的西城游记
- 最近识别：白塔寺

- [ ] **Step 2: Implement data and navigation handlers**

Add Xicheng data arrays and methods that navigate to:
- `/pages/ai-guide/ai-guide?mode=xicheng-recognition&poi=baitasi`
- `/pages/ai-guide/ai-guide?mode=xicheng-chat`
- `/pages/ai-guide/ai-guide?mode=xicheng-route&route=<key>`
- `/pages/ai-guide/ai-guide?mode=xicheng-travelogue`

### Task 3: Xicheng Detail Branches

**Files:**
- Modify: `assets/references/APP/kashgar-mini-program/pages/ai-guide/ai-guide.vue`

**Interfaces:**
- Consumes: route query `mode`.
- Produces: `showXichengRecognition`, `showXichengRoute`, `showXichengTravelogue`, `showXichengChat`.

- [ ] **Step 1: Implement recognition result branch**

Render 白塔寺 recognition result with confidence, source context, and CTA to start guide.

- [ ] **Step 2: Implement route branch**

Render the selected Xicheng route with stops, duration, and cultural notes.

- [ ] **Step 3: Implement travelogue branch**

Render Xiaojing travelogue generation page with selected materials and a generated preview.

- [ ] **Step 4: Implement Xicheng chat entry**

Render a compact Ask Xiaojing state or reuse existing chat with Xicheng seed question.

### Task 4: Verification

**Files:**
- Test: `assets/references/APP/kashgar-mini-program/tests/xicheng-ai-companion-ui.test.mjs`

- [ ] **Step 1: Run targeted test**

Run: `cd assets/references/APP/kashgar-mini-program && node tests/xicheng-ai-companion-ui.test.mjs`

Expected: pass.

- [ ] **Step 2: Run APP build**

Run: `cd assets/references/APP/kashgar-mini-program && npm run build`

Expected: build completes.

- [ ] **Step 3: Render H5/mobile smoke**

Run the H5 dev server and verify `/pages/index/index?mode=xicheng` plus detail modes in a mobile viewport.

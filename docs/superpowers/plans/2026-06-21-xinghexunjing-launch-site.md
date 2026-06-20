# Xinghe Xunjing Launch Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable first-stage Xinghe Xunjing public website from the Web_V3 reference images.

**Architecture:** A Vite React SPA renders code-native marketing pages from shared content data and reusable visual components. The static build outputs to `dist/` for Nginx or object-storage deployment.

**Tech Stack:** React 18, Vite 5, Vitest, Testing Library, CSS modules through plain `src/styles.css`, existing PNG assets under `assets/`.

## Global Constraints

- Use `assets/references/Web_V3` as the visual baseline and `assets/references/mobile_site` for responsive direction.
- Keep the current documentation and deliverables directories intact.
- Do not ship a screenshot-only site; text, navigation, buttons, and forms must be code-native.
- Use npm because pnpm is not installed in this environment.
- Push code to `https://gitee.com/xinghetech/xinghexunjing.git` after verification.

---

### Task 1: Project Shell and Tests

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `src/test/setup.js`
- Create: `src/data/siteContent.test.js`
- Create: `src/App.test.jsx`

**Interfaces:**
- Produces: `npm run test:run` and `npm run build` commands.
- Produces: content contract for `src/data/siteContent.js`.
- Produces: behavior contract for `src/App.jsx`.

- [x] **Step 1: Add npm scripts and testing dependencies**

Run: `npm install`

Expected: dependencies are installed and `package-lock.json` is created.

- [x] **Step 2: Write failing tests**

Run: `npm run test:run`

Expected before implementation: tests fail because `src/data/siteContent.js` and `src/App.jsx` do not exist.

### Task 2: Content Model and App Components

**Files:**
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/data/siteContent.js`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: tests from Task 1.
- Produces: `App` default export.
- Produces: named exports `navItems`, `pages`, `homeMetrics`, `capabilityCards`, `solutionTracks`, `travelogueOutputs`.

- [ ] **Step 1: Implement site content data**

Create arrays for navigation, metrics, capability cards, solution tracks, sample cases, process steps, FAQ, and travelogue outputs.

- [ ] **Step 2: Implement React SPA**

Create route state from `window.location.hash`, header navigation, mobile menu, page renderer, CTA scroll behavior, and demo form success state.

- [ ] **Step 3: Implement CSS system**

Create tokens, responsive grid rules, hero layers, glass cards, buttons, form controls, mobile menu, and reduced-motion fallback.

- [ ] **Step 4: Verify tests**

Run: `npm run test:run`

Expected: all tests pass.

### Task 3: Build and Visual QA

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Create: `qa/desktop-1440.png`
- Create: `qa/mobile-390.png`

**Interfaces:**
- Consumes: built React app.
- Produces: screenshot evidence for desktop and mobile layouts.

- [ ] **Step 1: Build static output**

Run: `npm run build`

Expected: Vite exits 0 and writes `dist/`.

- [ ] **Step 2: Start local server**

Run: `npm run dev -- --port 5173`

Expected: local app responds at `http://localhost:5173/`.

- [ ] **Step 3: Capture screenshots**

Use Playwright or browser tooling to capture desktop `1440x900` and mobile `390x844` screenshots under `qa/`.

- [ ] **Step 4: Fix visual defects**

Check first viewport composition, mobile overflow, CTA contrast, image loading, section anchors, mobile menu behavior, and form success state. Edit code until the defects are resolved.

### Task 4: Commit and Push

**Files:**
- Modify: repository working tree.

**Interfaces:**
- Consumes: verified tests, build, and screenshots.
- Produces: a Git commit pushed to Gitee `master`.

- [ ] **Step 1: Review git diff**

Run: `git status --short` and `git diff --check`

Expected: no whitespace errors and no accidental archive/temp files.

- [ ] **Step 2: Commit**

Run: `git add . && git commit -m "feat: build xinghe xunjing launch site"`

Expected: one commit containing the launch site and verification assets.

- [ ] **Step 3: Push to Gitee**

Run: `git push -u origin master`

Expected: push succeeds to `https://gitee.com/xinghetech/xinghexunjing.git`.

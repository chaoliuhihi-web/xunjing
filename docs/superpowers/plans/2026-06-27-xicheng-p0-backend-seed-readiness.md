# Xicheng P0 Backend Seed Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Xicheng P0 Yudao backend from in-memory POI samples toward a deployable, seedable, and gate-checked local candidate.

**Architecture:** Keep the current `feature/xicheng-p0` branch and backend ownership boundary. Add a maintainable Xicheng POI schema and seed data to MySQL initialization, then make the platform readiness verifier fail if the Xicheng seed/gate assets disappear.

**Tech Stack:** Yudao Java backend, MySQL SQL initialization, Node.js readiness verifier, Vitest static contract tests.

## Global Constraints

- Only use `feature/xicheng-p0`; do not push `master` or `product/city-companion-main`.
- Edit only `backend/yudao/yudao-module-xunjing/`, `backend/yudao/sql/mysql/`, `scripts/`, `docs/`, and necessary tests.
- Do not edit `assets/references/APP/kashgar-mini-program/`.
- Do not commit `tmp/`, `workbench/`, `dist/`, `target/`, `node_modules/`, `.env`, keys, or tokens.
- Production launch remains blocked until real WeChat AppID, HTTPS backend domain, OCR/vision service, upload credentials/object storage, AI key, and fully reviewed POI/source data are available.

---

### Task 1: Xicheng Seed Readiness Gate

**Files:**
- Create: `scripts/xicheng-backend-launch-readiness.test.mjs`
- Modify: `scripts/verify-xunjing-platform-readiness.mjs`
- Modify: `scripts/verify-xunjing-platform-readiness.test.mjs`

**Interfaces:**
- Consumes: `verifyXunjingPlatformReadiness({ staticOnly: true })`
- Produces: static check name `xicheng-seed-data`

- [ ] **Step 1: Write the failing test**

```js
test('gates Xicheng P0 backend launch seed and verifier coverage', async () => {
  const verifier = await readText('scripts/verify-xunjing-platform-readiness.mjs')
  const seed = await readText('backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')

  expect(verifier).toContain('xunjing-seed-xicheng-p0.sql')
  expect(verifier).toContain('xicheng-seed-data')
  expect(seed).toContain('XICHENG-MAP-001')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- scripts/xicheng-backend-launch-readiness.test.mjs`
Expected: FAIL because `xunjing-seed-xicheng-p0.sql` is missing.

- [ ] **Step 3: Write minimal implementation**

Add the Xicheng seed file and verifier checks described in Task 2 and Task 3.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- scripts/xicheng-backend-launch-readiness.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/xicheng-backend-launch-readiness.test.mjs scripts/verify-xunjing-platform-readiness.mjs scripts/verify-xunjing-platform-readiness.test.mjs
git commit -m "test: gate xicheng backend seed readiness"
```

### Task 2: Xicheng POI Schema and Seed

**Files:**
- Modify: `backend/yudao/sql/mysql/xunjing-module.sql`
- Create: `backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql`
- Modify: `scripts/xunjing-yudao-sql-contract.test.mjs`

**Interfaces:**
- Consumes: existing `xunjing_project`, `xunjing_school`, `xunjing_resource_package`, `xunjing_knowledge_document`, `xunjing_map_point`, `xunjing_qrcode`, `xunjing_public_report`, and AI quota/eval tables
- Produces: table `xunjing_poi`, package code `XICHENG-MAP-001`, region code `beijing-xicheng`, and seed POI IDs such as `xicheng-baitasi`

- [ ] **Step 1: Write the failing test**

```js
expect(moduleSql).toContain('CREATE TABLE IF NOT EXISTS `xunjing_poi`')
expect(seed).toContain('"poiId":"xicheng-baitasi"')
expect(seed.match(/"poiId":"xicheng-/g)?.length ?? 0).toBeGreaterThanOrEqual(20)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- scripts/xicheng-backend-launch-readiness.test.mjs`
Expected: FAIL before schema and seed are added.

- [ ] **Step 3: Write minimal implementation**

Add `xunjing_poi` with POI code, region, aliases JSON, trigger JSON, source JSON, audit fields, and indexes. Seed a first reviewed Xicheng local-candidate data pack with at least 20 PRD-aligned POIs and explicit review status.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- scripts/xicheng-backend-launch-readiness.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/yudao/sql/mysql/xunjing-module.sql backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql scripts/xunjing-yudao-sql-contract.test.mjs
git commit -m "feat: seed xicheng p0 backend data"
```

### Task 3: Handoff and Verification

**Files:**
- Create: `docs/04_AI交接任务书/西城P0后台上线状态.md`

**Interfaces:**
- Consumes: completed seed/gate state
- Produces: APP AI contract summary and backend launch status

- [ ] **Step 1: Document current state**

Write local-candidate status, endpoint contracts, remaining blockers, and next smallest backend task.

- [ ] **Step 2: Run required verification**

Run:

```bash
npm run test:run
npm run xunjing:platform:verify:static
mvn -pl yudao-module-xunjing -Dtest=XunjingAppServiceImplTest test
git diff --check
git status --short --branch
```

- [ ] **Step 3: Commit and push**

```bash
git add docs/04_AI交接任务书/西城P0后台上线状态.md
git commit -m "docs: update xicheng backend launch handoff"
git push github feature/xicheng-p0
git push origin feature/xicheng-p0
```

# Tourism Knowledge And Media Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Xunjing admin console knowledge and media tables into usable tourism knowledge-base and image-material-library operations.

**Architecture:** Keep AI文旅 on the current Yudao stack. MySQL remains the source of truth through `xunjing_knowledge_document` and `xunjing_media_asset`; Yudao AI/Qdrant remains the vector direction through the existing `aiKnowledgeId` package binding and `vectorStatus` lifecycle; file URLs/object keys remain compatible with Yudao file/object storage.

**Tech Stack:** Spring Boot/Yudao module APIs, MyBatis Plus, MySQL, Vue 3 admin console, Element Plus, Vitest contract tests, future Yudao AI/Qdrant indexing.

## Global Constraints

- Do not build school operations in this phase.
- Do not build new resource-package management in this phase.
- Focus only on tourism knowledge documents and tourism image/material assets.
- Keep database selection consistent with the current AI文旅/Yudao implementation: MySQL for metadata, object storage/file URLs for originals, Yudao AI/Qdrant for vectors.
- Make frequent commits after independently verified milestones.

---

## Current Gap Map

- Already present: `backend/yudao/sql/mysql/xunjing-module.sql` defines `xunjing_knowledge_document` and `xunjing_media_asset`.
- Already present: `XunjingConsoleController` exposes `POST /knowledge-documents`, `GET /knowledge-documents/page`, `POST /knowledge-documents/review`, `POST /media-assets`, `GET /media-assets/page`, and `POST /media-assets/review`.
- Already present: `XunjingConsoleServiceImpl` inserts and reviews knowledge documents and media assets.
- Missing for operations: the admin API client lacks `createKnowledgeDocument`.
- Missing for operations: the admin page only lists/reviews knowledge documents and media assets; it does not provide a direct tourism knowledge entry form or image material entry form.
- Deferred: file upload parsing, webpage extraction, document segmentation/versioning, and real Qdrant indexing jobs.

## Task 1: Admin API Client

**Files:**
- Modify: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts`
- Test: `scripts/xunjing-admin-ui-contract.test.mjs`

**Interfaces:**
- Consumes: existing backend `POST /xunjing/console/knowledge-documents`.
- Produces: `createKnowledgeDocument(data: KnowledgeDocumentCreateReqVO): Promise<number>`.

- [ ] **Step 1: Add the failing contract expectation**

```js
expect(api).toContain('KnowledgeDocumentCreateReqVO')
expect(api).toContain('createKnowledgeDocument')
expect(api).toContain('url: `${baseUrl}/knowledge-documents`')
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run: `npm run test:run -- scripts/xunjing-admin-ui-contract.test.mjs`
Expected: FAIL because `createKnowledgeDocument` is missing.

- [ ] **Step 3: Add the API wrapper**

```ts
export interface KnowledgeDocumentCreateReqVO {
  packageId: number
  title: string
  sourceType: string
  sourceUrl?: string
  contentDigest?: string
  authorityLevel?: string
  reviewStatus?: string
  vectorStatus?: string
}

export const createKnowledgeDocument = (data: KnowledgeDocumentCreateReqVO) => {
  return request.post<number>({ url: `${baseUrl}/knowledge-documents`, data })
}
```

- [ ] **Step 4: Run the contract test to verify it passes**

Run: `npm run test:run -- scripts/xunjing-admin-ui-contract.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts scripts/xunjing-admin-ui-contract.test.mjs
git commit -m "feat(admin): expose tourism knowledge create api"
```

## Task 2: Tourism Knowledge And Image Material Entry Forms

**Files:**
- Modify: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue`
- Test: `scripts/xunjing-admin-ui-contract.test.mjs`

**Interfaces:**
- Consumes: `createKnowledgeDocument`, `createMediaAsset`, `getKnowledgeDocumentPage`, `getMediaAssetPage`, and `loadOverview`.
- Produces: `openKnowledgeCreateDialog`, `submitKnowledgeCreate`, `openMediaCreateDialog`, and `submitMediaCreate`.

- [ ] **Step 1: Add failing UI contract expectations**

```js
expect(view).toContain('新增文旅资料')
expect(view).toContain('新增图片素材')
expect(view).toContain('submitKnowledgeCreate')
expect(view).toContain('submitMediaCreate')
expect(view).toContain("v-hasPermi=\"['xunjing:knowledge:create']\"")
expect(view).toContain("v-hasPermi=\"['xunjing:media:create']\"")
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run: `npm run test:run -- scripts/xunjing-admin-ui-contract.test.mjs`
Expected: FAIL because the entry forms and submit handlers are missing.

- [ ] **Step 3: Add toolbar buttons**

```vue
<el-button type="primary" @click="openKnowledgeCreateDialog" v-hasPermi="['xunjing:knowledge:create']">
  <Icon icon="ep:plus" class="mr-5px" /> 新增文旅资料
</el-button>

<el-button type="primary" @click="openMediaCreateDialog" v-hasPermi="['xunjing:media:create']">
  <Icon icon="ep:plus" class="mr-5px" /> 新增图片素材
</el-button>
```

- [ ] **Step 4: Add create dialog state and submit handlers**

```ts
const knowledgeCreateDialogVisible = ref(false)
const knowledgeCreateSubmitLoading = ref(false)
const knowledgeCreateForm = reactive<XunjingConsoleApi.KnowledgeDocumentCreateReqVO>({
  packageId: 1,
  title: '',
  sourceType: 'MANUAL',
  sourceUrl: '',
  contentDigest: '',
  authorityLevel: 'OFFICIAL',
  reviewStatus: 'PENDING',
  vectorStatus: 'PENDING'
})

const mediaCreateDialogVisible = ref(false)
const mediaCreateSubmitLoading = ref(false)
const mediaCreateForm = reactive<XunjingConsoleApi.MediaAssetCreateReqVO>({
  packageId: 1,
  title: '',
  mediaType: 'IMAGE',
  fileUrl: '',
  objectKey: '',
  sourceProvider: '',
  sourceUrl: '',
  copyrightStatus: 'PENDING',
  reviewStatus: 'PENDING',
  imageTags: '',
  canPublic: true,
  canAiUse: true,
  canPromotionUse: false
})
```

- [ ] **Step 5: Run the contract test to verify it passes**

Run: `npm run test:run -- scripts/xunjing-admin-ui-contract.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue scripts/xunjing-admin-ui-contract.test.mjs
git commit -m "feat(admin): add tourism knowledge and media entry forms"
```

## Task 3: Static Readiness Guard

**Files:**
- Modify: `scripts/verify-xunjing-platform-readiness.mjs`

**Interfaces:**
- Consumes: admin API and view snippets from Tasks 1 and 2.
- Produces: a static readiness check that fails if the create entry points disappear.

- [ ] **Step 1: Add guard snippets**

```js
for (const snippet of ['getReadiness', 'getDashboard', 'getAiGenerationLogPage', 'createKnowledgeDocument', 'createMediaAsset']) {
  assertContains(api, snippet, 'xunjing console API')
}
for (const snippet of ['XunjingConsole', '资料导入审核', '图影中华素材', '新增文旅资料', '新增图片素材']) {
  assertContains(view, snippet, 'xunjing console view')
}
```

- [ ] **Step 2: Run static readiness**

Run: `npm run xunjing:platform:verify:static`
Expected: `"ok": true` and `"failedChecks": 0`.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-xunjing-platform-readiness.mjs
git commit -m "test(admin): guard tourism library entry points"
```

## Deferred Tasks

- Real upload endpoint and object-storage persistence for documents/images.
- Webpage ingestion with image extraction, adapted from XingheAI2026V2 `ingestWebToKnowledgeBase`.
- Document versioning and segment tables equivalent to `kb_document_versions` and `kb_segments`.
- Async index-run table and worker that writes to Yudao AI/Qdrant and updates `vectorStatus`.
- Image OCR/vision metadata enrichment and batch operations.

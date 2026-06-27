# Xicheng P0 Backend Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend and contract slice for "scan/photo/OCR/GPS/text recognizes a Xicheng POI, returns app-ready result data, and carries POI context into sourced AI chat."

**Architecture:** Keep the current `/app-api/xunjing/triggers/resolve` and `/app-api/xunjing/ai/chat` entrypoints. Extend the existing VO and service behavior narrowly so the APP receives `suggestedQuestions` and `sources` from trigger results, while chat accepts `regionCode`, `poiCode`, and `routeId` and blocks answers when no reviewed source is available.

**Tech Stack:** Java, Spring Boot, Yudao module conventions, MyBatis Plus mappers, JUnit 5, Mockito, Vitest static contract tests.

## Global Constraints

- Work only on branch `feature/xicheng-p0-backend-contract` from `product/city-companion-main`.
- Do not continue from `master`, `handoff/xicheng-app-yudao-dev`, or historical workbench branches.
- Do not modify APP page experience under `assets/references/APP/kashgar-mini-program/` except contract tests or docs if needed.
- Do not restore `backend/yudao/sql/mysql/ruoyi-vue-pro.sql`.
- Do not commit `tmp/`, `workbench/`, `dist/`, `target/`, `node_modules/`, or secrets.
- `/app-api/xunjing/**` calls must keep tenant-aware Yudao APP API semantics.
- AI answers must bind to reviewed sources; no-source answers return a blocked state instead of invented content.

---

### Task 1: Trigger Contract Returns APP-Ready Xicheng POI Data

**Files:**
- Modify: `backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java`
- Modify: `backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java`
- Test: `backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java`

**Interfaces:**
- Consumes: `MultimodalTriggerReqVO.regionCode`, `text`, `ocrText`, `location`, `imageLabels`, `recentPoiCodes`.
- Produces: `MultimodalTriggerRespVO.suggestedQuestions`, `sources`, and candidate-level `suggestedQuestions`, `sources`.

- [ ] **Step 1: Write failing tests**

```java
@Test
public void testResolveMultimodalTriggerAcceptsXichengAliasAndReturnsSourcesAndQuestions() {
    MultimodalTriggerReqVO reqVO = multimodalReq();
    reqVO.setRegionCode("XICHENG");
    reqVO.setOcrText("妙应寺白塔入口");
    reqVO.setLocation(location("39.923100", "116.357260", 18));

    MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

    assertEquals("beijing-xicheng", respVO.getRegionCode());
    assertEquals("xicheng-baitasi", respVO.getPoiCode());
    assertFalse(respVO.getSuggestedQuestions().isEmpty());
    assertFalse(respVO.getSources().isEmpty());
    assertEquals("妙应寺白塔", respVO.getSources().get(0).getTitle());
    assertFalse(respVO.getCandidates().get(0).getSuggestedQuestions().isEmpty());
    assertFalse(respVO.getCandidates().get(0).getSources().isEmpty());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing -Dtest=XunjingAppServiceImplTest#testResolveMultimodalTriggerAcceptsXichengAliasAndReturnsSourcesAndQuestions test
```

Expected: FAIL because `suggestedQuestions` and `sources` do not exist on trigger response DTOs, or because `XICHENG` is not normalized to `beijing-xicheng`.

- [ ] **Step 3: Write minimal implementation**

Add `suggestedQuestions` and `sources` fields to trigger response DTOs. Normalize `XICHENG` to `beijing-xicheng`. Extend the in-memory Xicheng POI seed with source metadata and recommended questions, then copy them into the best response and candidates.

- [ ] **Step 4: Run test to verify it passes**

Run the same Maven test. Expected: PASS.

### Task 2: Chat Contract Accepts POI Context and Blocks No-Source Answers

**Files:**
- Modify: `backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java`
- Modify: `backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java`
- Test: `backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java`

**Interfaces:**
- Consumes: `RagChatReqVO.regionCode`, `poiCode`, `poiName`, `routeId`.
- Produces: `RagChatRespVO.safetyStatus=BLOCKED` and empty `sources` when no reviewed source exists.

- [ ] **Step 1: Write failing tests**

```java
@Test
public void testAnswerRecordsXichengPoiContextAndUsesReviewedSources() {
    Long projectId = consoleService.createProject(xichengProjectReq());
    Long schoolId = consoleService.createSchool(xichengSchoolReq());
    Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
    consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));

    RagChatReqVO reqVO = xichengRagReq();
    reqVO.setRegionCode("beijing-xicheng");
    reqVO.setPoiCode("xicheng-baitasi");
    reqVO.setPoiName("妙应寺白塔");

    RagChatRespVO answer = appService.answer(reqVO);

    assertEquals("PASSED", answer.getSafetyStatus());
    assertEquals("妙应寺白塔权威讲解稿", answer.getSources().get(0).getTitle());
    XunjingInteractionEventDO event = interactionEventMapper.selectList().get(0);
    assertTrue(event.getPayloadJson().contains("\"regionCode\":\"beijing-xicheng\""));
    assertTrue(event.getPayloadJson().contains("\"poiCode\":\"xicheng-baitasi\""));
}

@Test
public void testAnswerBlocksWhenNoReviewedSourcesForXichengPoi() {
    Long projectId = consoleService.createProject(xichengProjectReq());
    Long schoolId = consoleService.createSchool(xichengSchoolReq());
    consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));

    RagChatRespVO answer = appService.answer(xichengRagReq());

    assertEquals("BLOCKED", answer.getSafetyStatus());
    assertTrue(answer.getAnswer().contains("没有找到已审核"));
    assertTrue(answer.getSources().isEmpty());
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing -Dtest=XunjingAppServiceImplTest#testAnswerRecordsXichengPoiContextAndUsesReviewedSources,XunjingAppServiceImplTest#testAnswerBlocksWhenNoReviewedSourcesForXichengPoi test
```

Expected: FAIL because `RagChatReqVO` has no context fields and no-source responses currently use `PASSED`.

- [ ] **Step 3: Write minimal implementation**

Add context fields to `RagChatReqVO`. Include context fields in ask event payload and AI log input summary. Change no-source generation to return a blocked response with `safetyStatus=BLOCKED`, empty sources, and a clear answer explaining that no reviewed source is available.

- [ ] **Step 4: Run tests to verify they pass**

Run the same Maven tests. Expected: PASS.

### Task 3: Static Contract Gates and Final Verification

**Files:**
- Modify: `scripts/xunjing-app-api-contract.test.mjs`
- Modify if necessary: `scripts/project-structure-contract.test.mjs`
- Test: root Vitest suite

**Interfaces:**
- Consumes: Java DTO/controller/service files as static contract evidence.
- Produces: root `npm run test:run` gate proving the trigger/chat fields and no-source guard remain present.

- [ ] **Step 1: Write failing static tests**

Add assertions that:

```js
assert.ok(voSource.includes('private List<String> suggestedQuestions;'))
assert.ok(voSource.includes('private List<SourceRespVO> sources;'))
assert.ok(voSource.includes('private String regionCode;'))
assert.ok(voSource.includes('private String poiCode;'))
assert.ok(serviceSource.includes('AiSafetyStatus.BLOCKED.getStatus()'))
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- scripts/xunjing-app-api-contract.test.mjs
```

Expected: FAIL until the Java contract fields and blocked guard are implemented.

- [ ] **Step 3: Run full verification**

Run:

```bash
git diff --check
npm run test:run
cd backend/yudao && mvn -pl yudao-module-xunjing -Dtest=XunjingAppServiceImplTest test
```

Expected: all commands pass.

- [ ] **Step 4: Commit and push**

```bash
git status --short
git add backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java \
  backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java \
  backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java \
  backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java \
  scripts/xunjing-app-api-contract.test.mjs \
  docs/superpowers/plans/2026-06-27-xicheng-p0-backend-contract.md
git commit -m "feat: add xicheng backend trigger chat contract"
git push -u github feature/xicheng-p0-backend-contract
git push -u origin feature/xicheng-p0-backend-contract
```

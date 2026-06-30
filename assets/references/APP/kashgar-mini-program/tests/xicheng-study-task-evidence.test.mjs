import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const sliceBetween = (content, start, end) => {
  const startIndex = content.indexOf(start)
  const endIndex = content.indexOf(end, startIndex)
  assert.ok(startIndex >= 0, `missing start marker ${start}`)
  assert.ok(endIndex > startIndex, `missing end marker ${end}`)
  return content.slice(startIndex, endIndex)
}
const studyTaskEvidenceFactory = sliceBetween(
  travelogue,
  'createStudyTaskEvidence(index, evidenceType, payload = {})',
  'persistStudyTaskEvidence(evidence)'
)

assert.ok(
  regionConfig.includes("studyTaskStorageKey: 'xicheng:studyTaskEvidence'"),
  'Xicheng config should define a local study task evidence storage key'
)

for (const required of [
  'studyTaskEvidence',
  'studyTaskDrafts',
  'studyTaskEvidenceCount',
  'completedStudyTaskEvidence',
  'hasReviewableStudyTaskEvidence',
  '提交观察',
  '拍照完成',
  'submitStudyTaskEvidence',
  'addStudyTaskPhoto',
  'deleteStudyTaskEvidence',
  'createStudyTaskEvidence',
  'persistStudyTaskEvidence',
  'studyTaskStorageKey',
  'taskId',
  'taskText',
  'evidenceType',
  'answerText',
  'photoPath',
  'completedAt',
  '研学任务证据',
  '删除证据'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should support study task evidence ${required}`)
}

assert.match(
  travelogue,
  /completedTaskCount\(\)[\s\S]*return Math\.min\(this\.studyTaskEvidenceCount, this\.parentChildTasks\.length\)/,
  'Study task completion count should be driven by completed evidence, not just material count'
)

assert.match(
  travelogue,
  /studyTaskEvidenceCount\(\)[\s\S]*return this\.completedStudyTaskEvidence\.length/,
  'Travelogue should compute the completed study task evidence count'
)

assert.match(
  travelogue,
  /completedStudyTaskEvidence\(\)[\s\S]*return this\.studyTaskEvidence\.filter\(evidence => hasReviewableStudyTaskEvidence\(evidence\)\)/,
  'Completed study task evidence should require completedAt plus observation text or photo evidence'
)

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.studyTaskStorageKey\)[\s\S]*this\.studyTaskEvidence/,
  'Travelogue should restore study task evidence from local storage'
)

assert.match(
  travelogue,
  /submitStudyTaskEvidence\(index\)[\s\S]*this\.createStudyTaskEvidence\(index, 'answer'[\s\S]*answerText:\s*this\.studyTaskDrafts\[index\]\.trim\(\)[\s\S]*this\.persistStudyTaskEvidence\(evidence\)/,
  'Submitting a study task observation should create and persist answer evidence'
)

assert.match(
  travelogue,
  /addStudyTaskPhoto\(index\)[\s\S]*uni\.chooseImage\(\{[\s\S]*this\.createStudyTaskEvidence\(index, 'photo'[\s\S]*photoPath:\s*filePath[\s\S]*this\.persistStudyTaskEvidence\(evidence\)/,
  'Completing a study task by photo should create and persist photo evidence'
)

assert.match(
  travelogue,
  /addStudyTaskPhoto\(index\)[\s\S]*const confirmed = await this\.confirmTraveloguePhotoPurpose\('研学照片'\)[\s\S]*if \(!confirmed\) return[\s\S]*uni\.chooseImage/,
  'Completing a study task by photo should ask for photo-use confirmation before opening camera or album'
)

assert.match(
  travelogue,
  /addStudyTaskPhoto\(index\)[\s\S]*fail:\s*\(err\) => \{[\s\S]*if\s*\(this\.isXichengPhotoSelectionCancel\(err\)\)\s*\{[\s\S]*return[\s\S]*this\.showPhotoEvidenceCaptureFailed\(\)/,
  'Completing a study task by photo should ignore normal image picker cancellation and only show failure copy for non-cancel failures'
)

assert.match(
  travelogue,
  /v-if="getStudyTaskEvidence\(index\)"[\s\S]*@click="deleteStudyTaskEvidence\(index\)"[\s\S]*删除证据/,
  'Completed study task evidence should expose a delete action so users can remove photo evidence'
)

assert.match(
  travelogue,
  /deleteStudyTaskEvidence\(index\)[\s\S]*const taskId = `study-task-\$\{index \+ 1\}`[\s\S]*this\.studyTaskEvidence = this\.studyTaskEvidence\.filter\(evidence => evidence && evidence\.taskId !== taskId\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.studyTaskStorageKey, this\.studyTaskEvidence\)[\s\S]*this\.refreshDraftFromEvidence\(\)[\s\S]*研学证据已删除/,
  'Deleting study task evidence should remove the local photo or answer evidence, persist storage, and refresh the draft'
)

assert.match(
  studyTaskEvidenceFactory,
  /taskId:\s*`study-task-\$\{index \+ 1\}`[\s\S]*taskText:\s*this\.parentChildTasks\[index\][\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Study task evidence should include task identity, attribution context, and default private review status'
)

assert.match(
  travelogue,
  /persistStudyTaskEvidence\(evidence\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.studyTaskStorageKey, this\.studyTaskEvidence\)[\s\S]*this\.refreshDraftFromEvidence\(\)/,
  'Persisting study task evidence should save local evidence and refresh the travelogue draft'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*studyTaskEvidence = \[\][\s\S]*studyEvidenceText[\s\S]*研学任务证据/,
  'Travelogue draft generation should summarize study task evidence'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*studyTaskEvidence:\s*this\.studyTaskEvidence/,
  'Saved travelogue draft should include study task evidence'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*studyTaskEvidence:\s*this\.studyTaskEvidence[\s\S]*studyTaskEvidenceCount:\s*this\.studyTaskEvidenceCount/,
  'Review package should include study task evidence for operations review'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*publicStudyTaskEvidence:\s*this\.completedStudyTaskEvidence\.map\(evidence => this\.sanitizeStudyTaskEvidenceForPublicShare\(evidence\)\)[\s\S]*studyTaskEvidenceCount:\s*this\.studyTaskEvidenceCount/,
  'Poster and PDF assets should include sanitized public study task completion evidence'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*studyTaskEvidenceCount:\s*this\.studyTaskEvidenceCount/,
  'Local operations report should include study task evidence count'
)

assert.doesNotMatch(
  travelogue,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Study task evidence MVP should stay local and avoid background location, backend calls, or client-side secrets'
)

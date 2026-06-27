import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  '现场备注',
  '补充照片',
  'remarkInput',
  'photoMaterialCount',
  'remarkMaterialCount',
  'addRemarkMaterial',
  'addPhotoMaterial',
  'refreshDraftFromEvidence'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should support field evidence input ${required}`)
}

assert.match(
  travelogue,
  /createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*const photoCount[\s\S]*const remarkTexts[\s\S]*photoText[\s\S]*remarkText[\s\S]*return `今天的西城 Citywalk/,
  'Travelogue draft generator should summarize photo evidence and user remarks'
)

assert.match(
  travelogue,
  /textarea[\s\S]*v-model="remarkInput"[\s\S]*placeholder="记录现场观察、亲子问答或同行感受"/,
  'Travelogue page should expose a user remark input'
)

assert.match(
  travelogue,
  /addRemarkMaterial\(\)[\s\S]*type:\s*'remark'[\s\S]*remarkText:\s*this\.remarkInput\.trim\(\)[\s\S]*this\.persistJourneyMaterials\(\)/,
  'Adding a remark should create a remark material and persist the journey materials'
)

assert.match(
  travelogue,
  /addPhotoMaterial\(\)[\s\S]*uni\.chooseImage\(\{[\s\S]*type:\s*'photo'[\s\S]*imagePath:\s*filePath[\s\S]*this\.persistJourneyMaterials\(\)/,
  'Adding a photo should use chooseImage and persist a local photo material'
)

assert.match(
  travelogue,
  /refreshDraftFromEvidence\(\)[\s\S]*createXichengTravelogueDraft\(\{[\s\S]*materials:\s*this\.materials[\s\S]*recordingSession:\s*this\.recordingSession/,
  'Refreshing the draft should rebuild it from materials and the recording session'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*photoMaterialCount:\s*this\.photoMaterialCount[\s\S]*remarkMaterialCount:\s*this\.remarkMaterialCount/,
  'Review package should include photo and remark evidence counts'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*photoMaterialCount:\s*this\.photoMaterialCount[\s\S]*remarkMaterialCount:\s*this\.remarkMaterialCount/,
  'Poster and PDF artifacts should include photo and remark evidence counts'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*photoMaterialCount:\s*this\.photoMaterialCount[\s\S]*remarkMaterialCount:\s*this\.remarkMaterialCount/,
  'Local operations report should include photo and remark evidence counts'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Field evidence MVP should stay local and avoid client-side secrets or new backend calls'
)

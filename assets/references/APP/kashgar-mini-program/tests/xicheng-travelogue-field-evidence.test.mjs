import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const getBlock = (source, pattern, label) => {
  const block = source.match(pattern)?.[0] || ''
  assert.ok(block, `Should find ${label}`)
  return block
}
const addRemarkMaterialBlock = getBlock(
  travelogue,
  /addRemarkMaterial\(\)[\s\S]*?\n\t\t\},\n\t\tnormalizeCaptureLocationForMaterial/,
  'addRemarkMaterial block'
)
const addPhotoMaterialBlock = getBlock(
  travelogue,
  /addPhotoMaterial\(\)[\s\S]*?\n\t\t\},\n\t\thasReviewableJourneyEvidence/,
  'addPhotoMaterial block'
)
const saveDraftBlock = getBlock(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*?\n\t\t\},\n\t\tgeneratePoster/,
  'saveDraft block'
)

for (const required of [
  '现场备注',
  '补充照片',
  'remarkInput',
  'photoMaterialCount',
  'remarkMaterialCount',
  'addRemarkMaterial',
  'addPhotoMaterial',
  'photoId',
  'takenAt',
  'captureLocation',
  'exifLocation',
  'nearestTrackPoint',
  '隐藏地点',
  '删除素材',
  'hideMaterialLocation',
  'deleteJourneyMaterial',
  'locationHidden',
  'publicLocationLabel',
  '修正 POI',
  'correctMaterialPoi',
  'poiCorrected',
  'poiCorrection',
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
  addRemarkMaterialBlock,
  /type:\s*'remark'[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Remark materials should carry Xicheng attribution and private review status for operations review'
)

assert.match(
  travelogue,
  /addPhotoMaterial\(\)[\s\S]*uni\.chooseImage\(\{[\s\S]*type:\s*'photo'[\s\S]*imagePath:\s*filePath[\s\S]*this\.persistJourneyMaterials\(\)/,
  'Adding a photo should use chooseImage and persist a local photo material'
)

assert.match(
  addPhotoMaterialBlock,
  /type:\s*'photo'[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Photo materials should carry Xicheng attribution and private review status for operations review'
)

assert.match(
  travelogue,
  /confirmTraveloguePhotoPurpose\(actionLabel = '补充照片'\)[\s\S]*uni\.showModal\(\{[\s\S]*title:\s*`\$\{actionLabel\}用途说明`[\s\S]*仅用于本次西城游记素材[\s\S]*不默认公开[\s\S]*拍摄时定位和定位精度[\s\S]*不会用于模型评估或运营纠错，除非你另行授权/,
  'Travelogue photo evidence should explain material use, private default, capture location use, and no model-evaluation reuse'
)

assert.match(
  travelogue,
  /addPhotoMaterial\(\)[\s\S]*const confirmed = await this\.confirmTraveloguePhotoPurpose\('补充照片'\)[\s\S]*if \(!confirmed\) return[\s\S]*uni\.chooseImage/,
  'Adding a travelogue photo should ask for photo-use confirmation before opening camera or album'
)

assert.match(
  travelogue,
  /addPhotoMaterial\(\)[\s\S]*requestCurrentLocationForTrigger\(\)[\s\S]*const photoTrackPoint = await this\.capturePhotoTrackPointIfRecording\(\)[\s\S]*captureLocation:\s*this\.normalizeCaptureLocationForMaterial\(captureLocation\)[\s\S]*nearestTrackPoint:\s*photoTrackPoint \|\| this\.findNearestTrackPoint\(takenAt\)/,
  'Adding a photo should bind the photo material to capture-time location and prefer a forced photo track point before falling back to nearest track point'
)

assert.match(
  travelogue,
  /findNearestTrackPoint\(capturedAt = ''\)[\s\S]*this\.recordingSession\.trackPoints[\s\S]*Math\.abs\(new Date\(pointTime\)\.getTime\(\) - capturedTime\)[\s\S]*trackSessionId:\s*this\.recordingSession\.sessionId/,
  'Photo evidence should match the nearest recorded track point by time and include the recording session id'
)

assert.match(
  travelogue,
  /@click="hideMaterialLocation\(index\)"/,
  'Each journey material should expose a hide-location action'
)

assert.match(
  travelogue,
  /hideMaterialLocation\(index\)[\s\S]*locationHidden:\s*true[\s\S]*publicLocationLabel[\s\S]*this\.persistJourneyMaterials\(\)[\s\S]*this\.refreshDraftFromEvidence\(\)/,
  'Hiding a material location should mark it hidden, keep only an approximate public label, persist materials, and refresh the draft'
)

assert.match(
  travelogue,
  /@click="deleteJourneyMaterial\(index\)"/,
  'Each journey material should expose a delete action'
)

assert.match(
  travelogue,
  /deleteJourneyMaterial\(index\)[\s\S]*this\.materials\.filter\(\(_, materialIndex\) => materialIndex !== index\)[\s\S]*this\.persistJourneyMaterials\(\)[\s\S]*this\.refreshDraftFromEvidence\(\)/,
  'Deleting a material should remove it from the local material box, persist, and refresh the draft'
)

assert.match(
  travelogue,
  /<picker[\s\S]*:range="officialPoiNames"[\s\S]*@change="correctMaterialPoi\(index, \$event\)"[\s\S]*修正 POI[\s\S]*<\/picker>/,
  'Each journey material should expose an official POI picker for correcting attribution'
)

assert.match(
  travelogue,
  /correctMaterialPoi\(index, event\)[\s\S]*this\.officialPois\[selectedIndex\][\s\S]*poiCode:\s*poi\.poiCode[\s\S]*poiName:\s*poi\.poiName[\s\S]*poiCorrected:\s*true[\s\S]*poiCorrection:[\s\S]*this\.persistJourneyMaterials\(\)[\s\S]*this\.refreshDraftFromEvidence\(\)/,
  'Correcting POI attribution should store the official POI, mark the material as user-corrected, persist, and refresh the draft'
)

assert.match(
  travelogue,
  /refreshDraftFromEvidence\(\)[\s\S]*createXichengTravelogueDraft\(\{[\s\S]*materials:\s*this\.materials[\s\S]*recordingSession:\s*this\.recordingSession/,
  'Refreshing the draft should rebuild it from materials and the recording session'
)

assert.match(
  saveDraftBlock,
  /photoMaterialCount:\s*this\.photoMaterialCount[\s\S]*remarkMaterialCount:\s*this\.remarkMaterialCount/,
  'Saved travelogue draft should include photo and remark evidence counts'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*photoMaterialCount:\s*this\.photoMaterialCount[\s\S]*remarkMaterialCount:\s*this\.remarkMaterialCount/,
  'Review package should include photo and remark evidence counts'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*const publicPhotoMaterialCount = publicMaterials\.filter\(material => material && material\.type === 'photo'\)\.length[\s\S]*const publicRemarkMaterialCount = publicMaterials\.filter\(material => material && material\.type === 'remark'\)\.length[\s\S]*photoMaterialCount:\s*publicPhotoMaterialCount[\s\S]*remarkMaterialCount:\s*publicRemarkMaterialCount/,
  'Poster and PDF artifacts should include public-only photo and remark evidence counts'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*photoMaterialCount:\s*this\.photoMaterialCount[\s\S]*remarkMaterialCount:\s*this\.remarkMaterialCount/,
  'Local operations report should include photo and remark evidence counts'
)

assert.doesNotMatch(
  travelogue,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Field evidence MVP should stay local and avoid background location, client-side secrets, or new backend calls'
)

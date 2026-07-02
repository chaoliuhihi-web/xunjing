import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const opsDetails = read('components', 'xicheng', 'XichengTravelogueOpsDetails.vue')
const traveloguePrivacySurface = `${travelogue}\n${opsDetails}`
const pagesJson = read('pages.json')

assert.ok(
  regionConfig.includes('privacyClearStorageKeys'),
  'Xicheng config should centralize the local storage keys that can be cleared for privacy acceptance'
)

for (const requiredKey of [
  'storageKey',
  'materialsStorageKey',
  'journeyStorageKey',
  'inspirationStorageKey',
  'localOpsReportKey',
  'reviewStorageKey',
  'shareAssetStorageKey',
  'recordingStorageKey',
  'studyTaskStorageKey',
  'badgeAwardStorageKey',
  'checkinStorageKey',
  'inspirationImportStorageKey',
  'recognitionFeedbackStorageKey'
]) {
  assert.match(
    regionConfig,
    new RegExp(`privacyClearStorageKeys:[\\s\\S]*(?:XICHENG_REGION_CONFIG|XICHENG_REGION_BASE_CONFIG)\\.${requiredKey}`),
    `Privacy clear list should include ${requiredKey}`
  )
}

for (const required of [
  '隐私与本地数据',
  '清除西城本地数据',
  '隐私政策',
  '用户协议',
  'AI 内容说明',
  '反馈入口',
  'clearXichengLocalData',
  'resetXichengLocalState',
  'openPrivacyPolicy',
  'openUserProtocol',
  'openAiContentNotice',
  'openXichengFeedbackEntry',
  'privacyClearStorageKeys'
]) {
  assert.ok(traveloguePrivacySurface.includes(required), `Travelogue should expose privacy/local data control ${required}`)
}

assert.match(
  travelogue,
  /clearXichengLocalData\(\)[\s\S]*uni\.showModal\([\s\S]*清除西城本地数据[\s\S]*XICHENG_REGION_CONFIG\.privacyClearStorageKeys\.forEach\(key => uni\.removeStorageSync\(key\)\)[\s\S]*this\.resetXichengLocalState\(\)/,
  'Clearing Xicheng local data should confirm with the user, remove every configured local storage key, and reset in-memory state'
)

assert.match(
  travelogue,
  /resetXichengLocalState\(\)[\s\S]*this\.materials = \[\][\s\S]*this\.importedRoute = null[\s\S]*this\.reviewSubmission = null[\s\S]*this\.shareArtifacts = \[\][\s\S]*this\.studyTaskEvidence = \[\][\s\S]*this\.badgeAwards = \[\][\s\S]*this\.routeCheckins = \[\][\s\S]*this\.inspirationImports = \[\][\s\S]*this\.recognitionFeedbacks = \[\][\s\S]*this\.recordingSession = createEmptyRecordingSession\(\)/,
  'Resetting Xicheng local state should clear all local journey, review, share, badge, check-in, import, feedback, and recording state'
)

assert.match(
  travelogue,
  /openPrivacyPolicy\(\)[\s\S]*url:\s*'\/pagesInfo\/aboutus\/policy'/,
  'Privacy entry should navigate to the existing privacy policy page'
)

assert.match(
  travelogue,
  /openUserProtocol\(\)[\s\S]*url:\s*'\/pagesInfo\/aboutus\/protocol'/,
  'User agreement entry should navigate to the existing user protocol page'
)

assert.match(
  travelogue,
  /openAiContentNotice\(\)[\s\S]*uni\.showModal\([\s\S]*AI 内容说明[\s\S]*AI 辅助生成[\s\S]*仅作旅行参考[\s\S]*已审核来源[\s\S]*不编造/,
  'AI content notice should explain AI-assisted output, reference-only use, reviewed-source priority, and no fabrication without sources'
)

assert.match(
  travelogue,
  /openXichengFeedbackEntry\(\)[\s\S]*uni\.showModal\(\{[\s\S]*反馈入口[\s\S]*识别结果页[\s\S]*识别准确\/有误反馈[\s\S]*清除西城本地数据[\s\S]*现场运营/,
  'Feedback entry should explain where to submit recognition feedback, delete local data, and contact trial operations'
)

assert.match(
  pagesJson,
  /"path":\s*"aboutus\/policy"[\s\S]*"navigationBarTitleText":\s*"隐私政策"/,
  'pages.json should keep the privacy policy page registered'
)

assert.match(
  pagesJson,
  /"path":\s*"aboutus\/protocol"[\s\S]*"navigationBarTitleText":\s*"用户协议"/,
  'pages.json should keep the user agreement page registered'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Local data privacy clear flow should not introduce backend calls or client-side secrets'
)

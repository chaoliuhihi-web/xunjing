import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  "aiGuideChatCachePrefix: 'ai_guide_messages_cache:xicheng:'",
  "aiGuideConversationCachePrefix: 'ai_guide_conversation_id:xicheng:'",
  'privacyClearStorageKeyPrefixes',
  'XICHENG_REGION_BASE_CONFIG.aiGuideChatCachePrefix',
  'XICHENG_REGION_BASE_CONFIG.aiGuideConversationCachePrefix'
]) {
  assert.ok(regionConfig.includes(required), `Xicheng privacy config should include AI guide cache token ${required}`)
}

assert.match(
  travelogue,
  /clearXichengLocalData\(\)[\s\S]*XICHENG_REGION_CONFIG\.privacyClearStorageKeys\.forEach\(key => uni\.removeStorageSync\(key\)\)[\s\S]*this\.clearXichengAiGuideCaches\(\)[\s\S]*this\.resetXichengLocalState\(\)/,
  'Clearing Xicheng local data should also clear Xiaojing Xicheng chat caches before resetting in-memory state'
)

assert.match(
  travelogue,
  /clearXichengAiGuideCaches\(\)[\s\S]*uni\.getStorageInfoSync\(\)[\s\S]*XICHENG_REGION_CONFIG\.privacyClearStorageKeyPrefixes[\s\S]*startsWith\(prefix\)[\s\S]*uni\.removeStorageSync\(key\)/,
  'Xicheng privacy clear should enumerate local storage and remove every configured Xiaojing Xicheng cache prefix'
)

assert.doesNotMatch(
  travelogue,
  /uni\.removeStorageSync\('ai_guide_messages_cache'\)|uni\.removeStorageSync\('ai_guide_conversation_id'\)/,
  'Xicheng privacy clear should not remove the non-Xicheng global AI guide cache keys'
)

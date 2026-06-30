import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const messageCache = fs.readFileSync(path.join(root, 'request', 'xunjing', 'messageCache.js'), 'utf8')
const chatKeySource = aiGuide.match(/const getActiveChatCacheKey\s*=\s*\(\)\s*=>\s*\{[\s\S]*?\n\}/)?.[0] || ''
const conversationKeySource = aiGuide.match(/const getActiveConversationKey\s*=\s*\(\)\s*=>\s*\{[\s\S]*?\n\}/)?.[0] || ''

for (const required of [
  'getActiveXichengCacheScope',
  'getActiveChatCacheKey',
  'getActiveConversationKey',
  'xichengAiContext.value',
  'poiCode || context.poiName ||',
  'regionCode',
  'CHAT_CACHE_KEY',
  'CONVERSATION_KEY'
]) {
  assert.ok(aiGuide.includes(required), `AI guide should define Xicheng-aware cache isolation token ${required}`)
}

assert.ok(chatKeySource.includes('getActiveXichengCacheScope()'), 'active chat cache key should read the Xicheng cache scope')
assert.ok(chatKeySource.includes('${CHAT_CACHE_KEY}:xicheng:'), 'active chat cache key should namespace Xicheng messages')
assert.ok(chatKeySource.includes(': CHAT_CACHE_KEY'), 'active chat cache key should preserve the original global cache for non-Xicheng chat')

assert.ok(conversationKeySource.includes('getActiveXichengCacheScope()'), 'active conversation key should read the Xicheng cache scope')
assert.ok(conversationKeySource.includes('${CONVERSATION_KEY}:xicheng:'), 'active conversation key should namespace Xicheng conversations')
assert.ok(conversationKeySource.includes(': CONVERSATION_KEY'), 'active conversation key should preserve the original global key for non-Xicheng chat')

assert.match(
  messageCache,
  /const safetyStatus = normalizeXichengSafetyStatus\(item\.safetyStatus\)[\s\S]*const unsafeSafetyStatus = isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*followUps:\s*unsafeSafetyStatus \? \[\] : normalizeXichengDisplayFollowUps\(item\.followUps\)[\s\S]*sources:\s*unsafeSafetyStatus \? \[\] : normalizeXichengReviewedSources\(item\.sources\)[\s\S]*safetyStatus,/,
  'AI guide message cache helper should fail closed when restoring cached BLOCKED or UNAVAILABLE messages while repairing safe cached follow-ups and reviewed sources'
)

assert.match(
  aiGuide,
  /const saveMessagesCache\s*=\s*\(\)\s*=>\s*\{[\s\S]*uni\.setStorageSync\(getActiveChatCacheKey\(\),\s*normalizeCachedMessages\(messages\.value\)\)/,
  'saveMessagesCache should persist messages to the active city/POI cache key'
)

assert.match(
  aiGuide,
  /const loadMessagesCache\s*=\s*\(\)\s*=>\s*normalizeCachedMessages\(uni\.getStorageSync\(getActiveChatCacheKey\(\)\) \|\| \[\]\)/,
  'loadMessagesCache should restore messages from the active city/POI cache key'
)

assert.match(
  aiGuide,
  /uni\.removeStorageSync\(getActiveConversationKey\(\)\)/,
  'AI guide should clear the active conversation key instead of the global key while in Xicheng context'
)

assert.match(
  aiGuide,
  /uni\.removeStorageSync\(getActiveChatCacheKey\(\)\)/,
  'AI guide should clear the active chat cache key instead of the global key while in Xicheng context'
)

assert.doesNotMatch(
  aiGuide,
  /uni\.(?:setStorageSync|getStorageSync|removeStorageSync)\(CHAT_CACHE_KEY/,
  'AI guide should not directly use CHAT_CACHE_KEY for storage operations after adding active cache keys'
)

assert.doesNotMatch(
  aiGuide,
  /uni\.(?:setStorageSync|getStorageSync|removeStorageSync)\(CONVERSATION_KEY/,
  'AI guide should not directly use CONVERSATION_KEY for storage operations after adding active cache keys'
)

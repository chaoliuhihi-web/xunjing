import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuidePath = path.join(root, 'pages', 'ai-guide', 'ai-guide.vue')
const aiGuide = fs.readFileSync(aiGuidePath, 'utf8')
const runScrollToBottomSource = aiGuide.match(/const runScrollToBottom = \(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const sendMessageSource = aiGuide.match(/const sendMessage = async \(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const loadChatHistorySource = aiGuide.match(/const loadChatHistory = async \(\{ preferCache = false \} = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const renderStreamContentSource = aiGuide.match(/const renderStreamContent = \(state\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.match(
  aiGuide,
  /import \{ onShow, onUnload, onLoad, onReady \} from '@dcloudio\/uni-app'/,
  'AI guide should use onReady so initial bottom scrolling runs after the mini-program view is mounted'
)

assert.doesNotMatch(
  aiGuide,
  /<scroll-view[\s\S]*class="chat-list"/,
  'AI guide should not use an inner scroll-view because it can fail to scroll correctly on real WeChat devices'
)

assert.doesNotMatch(
  aiGuide,
  /:scroll-top="scrollTop"|:scroll-into-view="scrollIntoView"/,
  'AI guide should not depend on scroll-view scrollTop or scroll-into-view for bottom positioning'
)

assert.match(
  aiGuide,
  /<view id="chat-bottom-anchor" class="chat-bottom-spacer"><\/view>/,
  'AI guide should render a stable page-level bottom anchor below all messages'
)

assert.match(
  runScrollToBottomSource,
  /nextTick\(\(\) => \{[\s\S]*uni\.pageScrollTo\(\{[\s\S]*selector:\s*'#chat-bottom-anchor'[\s\S]*duration:\s*0/,
  'AI guide should use pageScrollTo against the page-level bottom anchor'
)

assert.doesNotMatch(
  runScrollToBottomSource,
  /scrollIntoView|scrollTop|bottomAnchorId/,
  'AI guide bottom scroll should not depend on scroll-view reactive state'
)

assert.match(
  aiGuide,
  /\.chat-bottom-spacer\s*\{[\s\S]*height:\s*calc\(220rpx \+ env\(safe-area-inset-bottom\)\)/,
  'AI guide should leave enough scrollable bottom space for the fixed input area'
)

assert.match(
  aiGuide,
  /\.content\s*\{[\s\S]*min-height:\s*100vh[\s\S]*padding-bottom:\s*calc\(220rpx \+ env\(safe-area-inset-bottom\)\)/,
  'AI guide page content should be naturally scrollable with room for the fixed input area'
)

assert.doesNotMatch(
  aiGuide,
  /bottomAnchorSeed|createBottomAnchorId|scrollIntoView|const scrollTop/,
  'AI guide should remove stale scroll-view anchor bookkeeping'
)

assert.match(
  aiGuide,
  /onReady\(\(\) => \{[\s\S]*scheduleHistoryScrollToBottom\(\)[\s\S]*\}\)/,
  'AI guide should retry bottom scrolling once the scroll-view is ready'
)

assert.match(
  loadChatHistorySource,
  /preferCache && cachedMessages\.length > 0[\s\S]*messages\.value = cachedMessages[\s\S]*scheduleHistoryScrollToBottom\(\)/,
  'AI guide should scroll to the bottom after restoring cached messages'
)

assert.match(
  sendMessageSource,
  /messages\.value\.push\(assistantMessage\)[\s\S]*saveMessagesCache\(\)[\s\S]*scrollToBottom\(\{ immediate: true \}\)/,
  'AI guide should scroll again after inserting the pending assistant bubble'
)

assert.match(
  renderStreamContentSource,
  /commitAssistantMessage\(state\.message,[\s\S]*content: state\.displayContent[\s\S]*\)[\s\S]*scrollToBottom\(\)/,
  'AI guide should keep the latest streaming text near the bottom while the answer grows'
)

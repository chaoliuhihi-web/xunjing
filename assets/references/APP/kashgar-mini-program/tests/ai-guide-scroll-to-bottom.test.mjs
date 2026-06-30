import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuidePath = path.join(root, 'pages', 'ai-guide', 'ai-guide.vue')
const aiGuide = fs.readFileSync(aiGuidePath, 'utf8')
const aiGuideTheme = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide-theme.css'), 'utf8')
const runScrollToBottomSource = aiGuide.match(/const runScrollToBottom = \(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const sendMessageSource = aiGuide.match(/const sendMessage = async \(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const loadChatHistorySource = aiGuide.match(/const loadChatHistory = async \(\{ preferCache = false \} = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const renderStreamContentSource = aiGuide.match(/const renderStreamContent = \(state\) => \{[\s\S]*?\n\}/)?.[0] || ''
const welcomeOnlyGuardSource = aiGuide.match(/const isCurrentXichengWelcomeOnlyConversation = \(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const setWelcomeMessageSource = aiGuide.match(/const setWelcomeMessage = \([^)]*\) => \{[\s\S]*?\n\}/)?.[0] || ''
const scheduleHistoryScrollSource = aiGuide.match(/const scheduleHistoryScrollToBottom = \(\) => \{[\s\S]*?\n\}/)?.[0] || ''

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

assert.match(
  welcomeOnlyGuardSource,
  /hasXichengAiContext\(\)[\s\S]*messages\.value\.length !== 1[\s\S]*message\.role !== 'assistant'[\s\S]*String\(message\.content \|\| ''\) !== getXichengWelcomeContent\(\)/,
  'Xicheng Xiaojing should detect the first welcome-only state so the hero remains visible on cold entry'
)

assert.match(
  aiGuide,
  /const scrollXichengWelcomeToTop = \(\) => \{[\s\S]*uni\.pageScrollTo\(\{[\s\S]*selector:\s*'\.xicheng-chat-container'[\s\S]*scrollTop:\s*0[\s\S]*duration:\s*0/,
  'Xicheng Xiaojing welcome-only entry should explicitly reset page scroll to the page container top because H5 can preserve the previous route scroll position'
)

assert.match(
  setWelcomeMessageSource,
  /messages\.value = \[welcomeMessage\][\s\S]*if \(isCurrentXichengWelcomeOnlyConversation\(\)\) \{[\s\S]*scrollXichengWelcomeToTop\(\)[\s\S]*\} else \{[\s\S]*scrollToBottom\(\{ immediate: true \}\)/,
  'Setting the Xicheng welcome message should reset to top instead of scrolling the first-screen hero under the nav'
)

assert.match(
  scheduleHistoryScrollSource,
  /if \(isCurrentXichengWelcomeOnlyConversation\(\)\) \{[\s\S]*scrollXichengWelcomeToTop\(\)[\s\S]*return[\s\S]*clearHistoryScrollTimer\(\)/,
  'Scheduled history scrolling should also reset top for the Xicheng welcome-only cold entry while preserving history scroll behavior'
)

assert.doesNotMatch(
  runScrollToBottomSource,
  /scrollIntoView|scrollTop|bottomAnchorId/,
  'AI guide bottom scroll should not depend on scroll-view reactive state'
)

assert.match(
  aiGuideTheme,
  /\.chat-bottom-spacer\s*\{[\s\S]*height:\s*calc\(300rpx \+ env\(safe-area-inset-bottom\)\)/,
  'AI guide should leave enough scrollable bottom space for the fixed input area'
)

assert.match(
  aiGuideTheme,
  /\.content\s*\{[\s\S]*min-height:\s*100vh[\s\S]*padding-bottom:\s*calc\(300rpx \+ env\(safe-area-inset-bottom\)\)/,
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

assert.doesNotMatch(
  aiGuide,
  /\/\/ 页面加载时加载历史对话[\s\S]*loadChatHistory\(\{ preferCache: true \}\)\s*<\/script>/,
  'AI guide should not load chat history from script setup before onLoad applies the Xicheng route context'
)

assert.match(
  aiGuide,
  /onLoad\(\(options = \{\}\) => \{[\s\S]*const context = refreshXichengAiRouteContext[\s\S]*if \(!hasXichengAiContext\(context\) && !options\.question\) \{[\s\S]*loadChatHistory\(\{ preferCache: true \}\)/,
  'AI guide should keep the generic non-Xicheng direct-entry fallback inside onLoad after route context is known'
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

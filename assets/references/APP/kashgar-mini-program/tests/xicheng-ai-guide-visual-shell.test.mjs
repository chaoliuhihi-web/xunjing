import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const aiGuideTheme = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide-theme.css'), 'utf8')
const aiGuideChat = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide-chat.css'), 'utf8')

for (const required of [
  'class="xicheng-chat-hero-card"',
  'class="xicheng-chat-hero-landmark"',
  ':src="XICHENG_REGION_CONFIG.visualAssets.heroLandmark"',
  'class="xicheng-chat-companion-avatar"',
  ':src="XICHENG_REGION_CONFIG.companionAvatar"',
  '你想了解西城的哪一面？',
  'xichengHeroQuestions',
  'class="xicheng-chat-prompt-chip"',
  '@click="handleFollowUpClick(question)"',
  'class="loading-status-text"',
  '正在检索已审核来源'
]) {
  assert.ok(aiGuide.includes(required), `Xicheng AI guide visual shell should include ${required}`)
}

assert.match(
  aiGuide,
  /import \{[\s\S]*createXichengPoiSuggestedQuestions[\s\S]*XICHENG_REGION_CONFIG[\s\S]*\} from '@\/config\/regions\/xicheng\.js'/,
  'Xicheng AI guide should reuse shared region config and suggested question helpers'
)

assert.match(
  aiGuide,
  /const xichengHeroQuestions = computed\(\(\) => \{[\s\S]*createXichengPoiSuggestedQuestions\(context\.poiName[\s\S]*slice\(0,\s*3\)/,
  'Xicheng AI guide should derive visible quick questions from the active official POI context'
)

assert.match(
  aiGuide,
  /\.xicheng-chat-hero-card\s*\{[\s\S]*min-height:\s*420rpx[\s\S]*border-radius:\s*34rpx/,
  'Xicheng AI guide hero should have stable mobile dimensions and match the rounded reference surface'
)

assert.match(
  aiGuide,
  /\.xicheng-chat-hero-landmark\s*\{[\s\S]*position:\s*absolute[\s\S]*opacity:\s*0\.26[\s\S]*object-fit:\s*cover/,
  'Xicheng AI guide should use the shared landmark photo as a muted background, not as a full-page mockup screenshot'
)

assert.match(
  aiGuideTheme,
  /\.content\s*\{[\s\S]*padding-bottom:\s*calc\(300rpx \+ env\(safe-area-inset-bottom\)\)[\s\S]*\.chat-bottom-spacer\s*\{[\s\S]*height:\s*calc\(300rpx \+ env\(safe-area-inset-bottom\)\)/,
  'Xicheng AI guide chat list should reserve enough bottom space so the fixed input bar does not cover the latest answer or sources'
)

assert.match(
  aiGuideChat,
  /\.loading-content\s*\{[\s\S]*\.loading-status-text\s*\{[\s\S]*font-size:\s*22rpx[\s\S]*color:\s*#746F68/,
  'Xicheng AI guide pending state should explain that Xiaojing is checking reviewed sources, not show only an ambiguous ellipsis'
)

assert.doesNotMatch(
  aiGuide,
  /xicheng-multimodal\/design-mockups|03-ask-xiaojing-chat\.png/,
  'Xicheng AI guide runtime UI should not reference full-page design mockup screenshots'
)

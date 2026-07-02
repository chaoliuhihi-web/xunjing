import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const componentPath = path.join(root, 'components', 'xicheng', 'XichengAiGuideHero.vue')

assert.ok(
  fs.existsSync(componentPath),
  'Xicheng AI guide hero should be isolated in components/xicheng/XichengAiGuideHero.vue instead of growing ai-guide.vue'
)

const heroComponent = fs.readFileSync(componentPath, 'utf8')

assert.match(
  aiGuide,
  /import XichengAiGuideHero from '@\/components\/xicheng\/XichengAiGuideHero\.vue'/,
  'ai-guide.vue should import the isolated Xicheng AI guide hero component'
)

assert.match(
  aiGuide,
  /<XichengAiGuideHero[\s\S]*:context="xichengAiContext"[\s\S]*:region-config="XICHENG_REGION_CONFIG"[\s\S]*:hero-subtitle="xichengHeroSubtitle"[\s\S]*:vision-agent-context-chips="xichengVisionAgentContextChips"[\s\S]*:service-handoff-context="xichengServiceHandoffContext"[\s\S]*:hero-questions="xichengHeroQuestions"[\s\S]*@follow-up="handleFollowUpClick"/,
  'ai-guide.vue should pass only prepared display data into the hero component and keep follow-up routing on the page'
)

for (const required of [
  'name: \'XichengAiGuideHero\'',
  'class="xicheng-chat-hero-card"',
  'class="xicheng-chat-hero-landmark"',
  ':src="regionConfig.visualAssets.heroLandmark"',
  'class="xicheng-chat-companion-avatar"',
  ':src="regionConfig.companionAvatar"',
  '你想了解西城的哪一面？',
  'xicheng-vision-agent-strip',
  'AI识境已接入',
  'xicheng-service-handoff-strip',
  'AI识境服务承接',
  'class="xicheng-chat-prompt-chip"',
  '$emit(\'follow-up\', question)'
]) {
  assert.ok(
    heroComponent.includes(required),
    `Xicheng AI guide hero component should include ${required}`
  )
}

assert.doesNotMatch(
  aiGuide,
  /<view v-if="isXichengChatMode" class="xicheng-chat-hero-card">[\s\S]*xicheng-service-handoff-strip[\s\S]*xicheng-chat-prompt-chip[\s\S]*<\/view>\s*<view v-if="isXichengPlaybackMode" class="xicheng-playback-card">/,
  'ai-guide.vue should not keep the full inline Xicheng hero/service/prompt template after the component split'
)

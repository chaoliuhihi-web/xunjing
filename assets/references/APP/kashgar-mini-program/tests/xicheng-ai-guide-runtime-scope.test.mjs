import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const packageDetailRequest = aiGuide.match(/const requestXunjingPackageDetail\s*=\s*\(context = xichengAiContext\.value\)[\s\S]*?\n\}/)?.[0] || ''
const resourceEventRequest = aiGuide.match(/const requestXunjingResourceEvent\s*=\s*\(\{ eventType = 'VIEW', payload = \{\}, context = xichengAiContext\.value \} = \{\}\)[\s\S]*?\n\}/)?.[0] || ''
const packageLoader = aiGuide.match(/const loadXunjingPackageDetail\s*=\s*async\s*\(context = xichengAiContext\.value\)[\s\S]*?\n\}/)?.[0] || ''
const onLoadBlock = aiGuide.match(/onLoad\(\(options = \{\}\) => \{[\s\S]*?\n\}\)/)?.[0] || ''

assert.match(
  aiGuide,
  /const getActiveXunjingResourceConfig\s*=\s*\(context = xichengAiContext\.value\) => \{[\s\S]*hasXichengAiContext\(context\)[\s\S]*packageCode:\s*context\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*tenantId:\s*XICHENG_REGION_CONFIG\.tenantId[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*return XUNJING_RESOURCE_CONFIG/,
  'AI guide should resolve resource package config from active Xicheng context instead of always using the Kashgar package'
)

assert.match(
  aiGuide,
  /const getActiveXunjingEventConfig\s*=\s*\(context = xichengAiContext\.value\) => \{[\s\S]*hasXichengAiContext\(context\)[\s\S]*packageCode:\s*context\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*tenantId:\s*XICHENG_REGION_CONFIG\.tenantId[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*return XUNJING_EVENT_CONFIG/,
  'AI guide should resolve analytics event config from active Xicheng context instead of always using the Kashgar package'
)

assert.match(
  packageDetailRequest,
  /const resourceConfig = getActiveXunjingResourceConfig\(context\)[\s\S]*url:\s*buildYudaoAppApiUrl\(resourceConfig\.apiPath\)[\s\S]*packageCode:\s*resourceConfig\.packageCode[\s\S]*'tenant-id':\s*resourceConfig\.tenantId/,
  'Package detail request should send the active Xicheng packageCode and tenant-id when Xiaojing is opened from a Xicheng recognition'
)

assert.match(
  resourceEventRequest,
  /const eventConfig = getActiveXunjingEventConfig\(context\)[\s\S]*url:\s*buildYudaoAppApiUrl\(eventConfig\.apiPath\)[\s\S]*'tenant-id':\s*eventConfig\.tenantId[\s\S]*packageCode:\s*eventConfig\.packageCode[\s\S]*sourceChannel:\s*eventConfig\.sourceChannel/,
  'Resource event request should send VIEW/ASK/MEDIA_USE events under the active Xicheng package'
)

assert.match(
  packageLoader,
  /const packageScope = getXunjingPackageDetailScope\(context\)[\s\S]*xunjingPackageDetailRequestedScope === packageScope[\s\S]*requestXunjingPackageDetail\(context\)/,
  'Package detail loading should be scoped by active package so Kashgar and Xicheng do not block each other'
)

assert.match(
  onLoadBlock,
  /const context = applyXichengAiContext\(options\)[\s\S]*loadXunjingPackageDetail\(context\)/,
  'AI guide onLoad should apply Xicheng route context before loading the active package detail'
)

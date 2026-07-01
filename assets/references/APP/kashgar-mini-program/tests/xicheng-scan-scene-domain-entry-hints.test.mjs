import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scan = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan', 'scan.vue'), 'utf8')

for (const required of [
  'scan-scene-domain-panel',
  '看见什么，就能问什么',
  'sceneDomainCapabilities',
  'sceneDomainImageLabels',
  '建筑',
  '文物',
  '菜单',
  '食物',
  '路牌/OCR',
  '非遗',
  '植物',
  '动物',
  '人物',
  '活动'
]) {
  assert.ok(scan.includes(required), `AI识境 scan entry should expose scene-domain hint: ${required}`)
}

assert.match(
  scan,
  /<view class="scan-scene-domain-panel xicheng-paper-card">[\s\S]*v-for="domain in sceneDomainCapabilities"[\s\S]*domain\.label[\s\S]*domain\.copy/,
  'Scan page should render a pre-capture scene-domain panel from the same domain list used by the Agent'
)

assert.match(
  scan,
  /sceneDomainCapabilities:\s*\[[\s\S]*domainKey:\s*'architecture'[\s\S]*domainKey:\s*'artifact'[\s\S]*domainKey:\s*'menu'[\s\S]*domainKey:\s*'food'[\s\S]*domainKey:\s*'sign-ocr'[\s\S]*domainKey:\s*'heritage'[\s\S]*domainKey:\s*'plant'[\s\S]*domainKey:\s*'animal'[\s\S]*domainKey:\s*'person'[\s\S]*domainKey:\s*'event'/,
  'Scan entry should cover the ten product-required Vision Agent scene domains before capture'
)

assert.match(
  scan,
  /sceneDomainImageLabels\(\)[\s\S]*this\.sceneDomainCapabilities[\s\S]*domain\.label[\s\S]*domain\.title[\s\S]*照片[\s\S]*OCR文字[\s\S]*地点线索[\s\S]*路线图/,
  'Photo recognition should derive backend image labels from the visible scene-domain capability list plus generic input labels'
)

assert.match(
  scan,
  /resolveXichengPhotoTrigger\(\{[\s\S]*imageLabels:\s*this\.sceneDomainImageLabels/,
  'Photo trigger should pass the expanded scene-domain labels into the multimodal backend facade'
)

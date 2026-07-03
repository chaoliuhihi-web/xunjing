import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResultPath = path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue')
const routeCardPath = path.join(root, 'components', 'xicheng', 'XichengScanResultRouteCard.vue')

const scanResult = fs.readFileSync(scanResultPath, 'utf8')
const routeCard = fs.readFileSync(routeCardPath, 'utf8')
const regionConfig = fs.readFileSync(path.join(root, 'config', 'regions', 'xicheng.js'), 'utf8')
const template = scanResult.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''

assert.ok(template, 'Recognition result page should have a template')

assert.match(
  scanResult,
  /import XichengScanResultRouteCard from '@\/components\/xicheng\/XichengScanResultRouteCard\.vue'/,
  'Recognition result page should import the split route card component'
)

assert.match(
  scanResult,
  /XichengScanResultRouteCard/,
  'Recognition result page should register the split route card component'
)

assert.match(
  template,
  /<xicheng-scan-result-route-card[\s\S]*v-if="recommendedRoute"[\s\S]*:recommended-route="recommendedRoute"[\s\S]*:route-steps="routeSteps"[\s\S]*\/>/,
  'Recognition result page should render the split route card with recommendedRoute and routeSteps props'
)

assert.ok(
  !template.includes('class="route-card xicheng-paper-card"'),
  'Recognition result page shell should not keep inline route card markup after the split'
)

for (const token of [
  'class="route-card xicheng-paper-card"',
  '推荐路线',
  '可开始记录',
  'route-title',
  'route-desc',
  'route-steps',
  'route-stop'
]) {
  assert.ok(routeCard.includes(token), `Split route card component should keep ${token}`)
}

assert.doesNotMatch(
  routeCard,
  /可加入路线护照|路线护照/,
  'Recognition result route card should not expose route-passport wording after the route flow moved to recording and travelogue'
)

assert.doesNotMatch(
  regionConfig.match(/export const XICHENG_RECOMMENDED_ROUTES\s*=\s*Object\.freeze\(\[[\s\S]*?\n\]\)/)?.[0] || '',
  /完成路线护照|可加入路线护照|路线护照/,
  'Official route summaries shown on the recognition result route card should point to recording/travelogue, not route-passport growth copy'
)

assert.match(
  routeCard,
  /v-for="\(\s*stop,\s*index\s*\) in routeSteps"[\s\S]*\{\{\s*index \+ 1\s*\}\}\. \{\{\s*formatRouteStop\(stop\)\s*\}\}/,
  'Split route card should render numbered route stops through a local formatter'
)

assert.ok(
  scanResult.split('\n').length < 2015,
  'Component split should reduce scan-result.vue below its previous 2015 line count'
)

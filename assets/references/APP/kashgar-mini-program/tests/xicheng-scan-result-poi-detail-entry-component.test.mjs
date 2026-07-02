import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResultPath = path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue')
const poiDetailEntryPath = path.join(root, 'components', 'xicheng', 'XichengScanResultPoiDetailEntry.vue')

const scanResult = fs.readFileSync(scanResultPath, 'utf8')
const poiDetailEntry = fs.readFileSync(poiDetailEntryPath, 'utf8')
const template = scanResult.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''

assert.ok(template, 'Recognition result page should have a template')

assert.match(
  scanResult,
  /import XichengScanResultPoiDetailEntry from '@\/components\/xicheng\/XichengScanResultPoiDetailEntry\.vue'/,
  'Recognition result page should import the split POI detail entry component'
)

assert.match(
  scanResult,
  /components:\s*\{[\s\S]*XichengScanResultPoiDetailEntry[\s\S]*\}/,
  'Recognition result page should register the split POI detail entry component'
)

assert.match(
  template,
  /<xicheng-scan-result-poi-detail-entry[\s\S]*:poi-name="result\.poiName"[\s\S]*:recognition-action-blocked="recognitionActionBlocked"[\s\S]*@open-poi-detail="openPoiDetail"[\s\S]*\/>/,
  'Recognition result page should delegate POI detail entry UI while keeping route guards in the page shell'
)

assert.ok(
  !template.includes('class="poi-detail-entry xicheng-paper-card"'),
  'Recognition result page shell should not keep inline POI detail entry markup after the split'
)

for (const token of [
  'class="poi-detail-entry xicheng-paper-card"',
  "poi-detail-entry-disabled",
  'poi-detail-entry-icon',
  'poi-detail-entry-copy',
  'poi-detail-entry-title',
  'poi-detail-entry-desc',
  'poi-detail-entry-label',
  '建筑看点',
  '官方地点详情',
  '地点详情',
  '@click="$emit(\'open-poi-detail\')"'
]) {
  assert.ok(poiDetailEntry.includes(token), `Split POI detail entry should keep ${token}`)
}

assert.match(
  poiDetailEntry,
  /name:\s*'XichengScanResultPoiDetailEntry'/,
  'Split POI detail entry should have a component name'
)

assert.match(
  poiDetailEntry,
  /emits:\s*\[[\s\S]*'open-poi-detail'[\s\S]*\]/,
  'Split POI detail entry should emit an open event instead of navigating itself'
)

assert.match(
  poiDetailEntry,
  /props:[\s\S]*poiName:[\s\S]*recognitionActionBlocked:/,
  'Split POI detail entry should accept POI name and blocked state as props'
)

assert.ok(
  poiDetailEntry.split('\n').length <= 120,
  'Split POI detail entry component should stay compact'
)

assert.ok(
  scanResult.split('\n').length < 1848,
  'Component split should reduce scan-result.vue below its previous 1848 line count'
)

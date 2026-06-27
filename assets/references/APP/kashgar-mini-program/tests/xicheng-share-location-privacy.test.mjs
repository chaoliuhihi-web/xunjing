import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

for (const required of [
  'sanitizeMaterialForPublicShare',
  'createPublicRecordingSummary',
  'publicMaterials',
  'publicRecordingSummary',
  "shareLocationPrecision: 'poi_area'",
  'exactCoordinatesHidden: true'
]) {
  assert.ok(travelogue.includes(required), `Share exports should declare location privacy token ${required}`)
}

const sanitizeBlock = travelogue.match(/sanitizeMaterialForPublicShare\(material = \{\}\)[\s\S]*?\n\t\t\},\n\t\tcreatePublicRecordingSummary/)?.[0] || ''
assert.ok(sanitizeBlock, 'Travelogue should expose a bounded public material sanitizer for share exports')

for (const required of [
  'publicLocationLabel: material.publicLocationLabel || this.createPublicLocationLabel(material)',
  'locationHidden: true',
  'sourceCount: Array.isArray(material.sources) ? material.sources.length : 0'
]) {
  assert.ok(sanitizeBlock.includes(required), `Public material sanitizer should preserve safe public field ${required}`)
}

assert.doesNotMatch(
  sanitizeBlock,
  /captureLocation|exifLocation|nearestTrackPoint|latitude|longitude|trackPoints|stayPoints/,
  'Public material sanitizer should not expose exact coordinates, EXIF location, track points, or stay points'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*publicMaterials:\s*this\.materials\.map\(material => this\.sanitizeMaterialForPublicShare\(material\)\)[\s\S]*publicRecordingSummary:\s*this\.createPublicRecordingSummary\(\)[\s\S]*privacy:\s*\{[\s\S]*shareLocationPrecision:\s*'poi_area'[\s\S]*exactCoordinatesHidden:\s*true/,
  'Generated poster and PDF assets should include only sanitized public materials and a public recording summary'
)

assert.doesNotMatch(
  travelogue.match(/createShareArtifact\(assetType\)[\s\S]*?\n\t\t\},\n\t\tcreatePosterTemplate/)?.[0] || '',
  /materials:\s*this\.materials|recordingSession:\s*this\.recordingSession|trackPoints:\s*this\.recordingSession\.trackPoints|stayPoints:\s*this\.recordingSession\.stayPoints/,
  'Share assets should not embed raw materials, full recording sessions, or exact track arrays'
)

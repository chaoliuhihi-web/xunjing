import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

assert.match(
  scanResult,
  /const clampConfidence\s*=\s*\(value\)[\s\S]*Math\.min\(1, Math\.max\(0, value\)\)[\s\S]*const clampConfidencePercent\s*=\s*\(value\)[\s\S]*Math\.min\(100, Math\.max\(0, value\)\)/,
  'Recognition result page should clamp decimal and percent confidence into display-safe ranges'
)

assert.ok(
  scanResult.includes('const normalizeCandidateConfidence = (candidate = {}) => {') &&
    scanResult.includes('const hasConfidence = candidate.confidence !== undefined') &&
    scanResult.includes('return clampConfidence(hasConfidence && rawConfidence > 1 ? rawConfidence / 100 : rawConfidence)'),
  'Recognition result page should keep a clamped decimal confidence normalizer for backend percent and decimal values'
)

assert.match(
  scanResult,
  /const normalizeConfidencePercent\s*=\s*\(result = \{\}\)[\s\S]*Number\.isFinite\(explicitPercent\)[\s\S]*return clampConfidencePercent\(Math\.round\(explicitPercent\)\)[\s\S]*return clampConfidencePercent\(Math\.round\(normalizeCandidateConfidence\(result\) \* 100\)\)[\s\S]*const normalizeResult = \(result = \{\}\) => \(\{[\s\S]*confidence:\s*normalizeCandidateConfidence\(result\)[\s\S]*confidencePercent:\s*normalizeConfidencePercent\(result\)/,
  'Recognition result page should normalize main result confidence and confidencePercent before display'
)

assert.match(
  scanResult,
  /confidencePercent\(\)\s*\{[\s\S]*this\.result\.confidencePercent[\s\S]*Number\.isFinite[\s\S]*Math\.round\(Number\(this\.result\.confidence \|\| 0\) \* 100\)/,
  'Recognition result computed confidence should prefer normalized confidencePercent and fall back to decimal confidence'
)

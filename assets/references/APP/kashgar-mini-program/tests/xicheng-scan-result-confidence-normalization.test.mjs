import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

assert.match(
  scanResult,
  /const normalizeCandidateConfidence\s*=\s*\(candidate = \{\}\)[\s\S]*rawConfidence > 1 \? rawConfidence \/ 100 : rawConfidence/,
  'Recognition result page should keep a decimal confidence normalizer for backend percent and decimal values'
)

assert.match(
  scanResult,
  /const normalizeConfidencePercent\s*=\s*\(result = \{\}\)[\s\S]*Number\.isFinite\(explicitPercent\)[\s\S]*Math\.round\(normalizeCandidateConfidence\(result\) \* 100\)[\s\S]*const normalizeResult = \(result = \{\}\) => \(\{[\s\S]*confidence:\s*normalizeCandidateConfidence\(result\)[\s\S]*confidencePercent:\s*normalizeConfidencePercent\(result\)/,
  'Recognition result page should normalize main result confidence and confidencePercent before display'
)

assert.match(
  scanResult,
  /confidencePercent\(\)\s*\{[\s\S]*this\.result\.confidencePercent[\s\S]*Number\.isFinite[\s\S]*Math\.round\(Number\(this\.result\.confidence \|\| 0\) \* 100\)/,
  'Recognition result computed confidence should prefer normalized confidencePercent and fall back to decimal confidence'
)

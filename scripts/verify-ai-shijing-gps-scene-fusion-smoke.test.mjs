import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function readText(path) {
  return await readFile(resolve(rootDir, path), 'utf8')
}

describe('AI Shijing GPS scene fusion smoke', () => {
  test('exposes a backend GPS simulation smoke command and evidence contract', async () => {
    const packageJson = JSON.parse(await readText('package.json'))
    const gate = await readText('scripts/run-ai-shijing-p0-backend-gate.mjs')
    const verifier = await readText('scripts/verify-ai-shijing-p0-backend-loop.mjs')

    expect(packageJson.scripts['xunjing:ai-shijing:gps-smoke'])
      .toBe('node scripts/verify-ai-shijing-gps-scene-fusion-smoke.mjs')
    expect(gate).toContain('npm run xunjing:ai-shijing:gps-smoke')
    expect(verifier).toContain('requirementId: \'gps-scene-fusion-smoke\'')
    expect(verifier).toContain('verify-ai-shijing-gps-scene-fusion-smoke.mjs')
  })

  test('simulates Xicheng GPS plus photo OCR scene resolution without production evidence claims', () => {
    const output = execFileSync(process.execPath, [
      'scripts/verify-ai-shijing-gps-scene-fusion-smoke.mjs',
      '--evidence-file',
      'tmp/ai-shijing-gps-scene-fusion-smoke-test.json'
    ], {
      cwd: rootDir,
      encoding: 'utf8'
    })
    const report = JSON.parse(output)

    expect(report).toMatchObject({
      artifactType: 'ai-shijing-gps-scene-fusion-smoke',
      ok: true,
      status: 'AI_SHIJING_GPS_SCENE_FUSION_SMOKE_READY',
      summary: {
        seedSource: 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql',
        caseCount: 6,
        passedCaseCount: 6,
        failedCaseCount: 0,
        wrongAreaAutoTriggerCount: 0,
        evidenceScope: 'local_simulation_not_production'
      }
    })
    expect(report.cases.map((item) => item.caseId)).toEqual([
      'baitasi-gps-ocr-photo',
      'gongwangfu-gps-ocr-photo',
      'planetarium-near-zoo-disambiguation',
      'gps-only-baitasi-needs-confirmation',
      'wrong-area-ocr-photo-needs-confirmation',
      'baitasi-memory-continuation'
    ])
    const baitasi = report.cases.find((item) => item.caseId === 'baitasi-gps-ocr-photo')
    expect(baitasi.resolvedPoiCode).toBe('xicheng-baitasi')
    expect(baitasi.triggerType).toBe('scene_fusion')
    expect(baitasi.matchedSignals).toEqual(expect.arrayContaining(['gps_radius', 'ocr_alias', 'gps_ocr_fused', 'image_label']))
    const planetarium = report.cases.find((item) => item.caseId === 'planetarium-near-zoo-disambiguation')
    expect(planetarium.resolvedPoiCode).toBe('xicheng-planetarium')
    expect(planetarium.candidatePoiCodes).toContain('xicheng-beijing-zoo')
    const wrongArea = report.cases.find((item) => item.caseId === 'wrong-area-ocr-photo-needs-confirmation')
    expect(wrongArea.requiresUserConfirm).toBe(true)
    expect(wrongArea.autoTriggered).toBe(false)
    const memory = report.cases.find((item) => item.caseId === 'baitasi-memory-continuation')
    expect(memory.matchedSignals).toEqual(expect.arrayContaining(['context_poi', 'scene_context_alias']))
    expect(JSON.stringify(report)).not.toContain('PRODUCTION_READY')
    expect(JSON.stringify(report)).not.toContain('imageBase64')
  })
})

import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []
const aLevelSourceUrl = 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html'
const heritageSourceUrl = 'https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html'

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-source-coverage-'))
  tempDirs.push(rootDir)
  await mkdir(path.join(rootDir, 'workbench'), { recursive: true })
  await mkdir(path.join(rootDir, 'tmp'), { recursive: true })
  return rootDir
}

async function writeSourceReview(rootDir) {
  const sourceReviewFile = path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv')
  await writeFile(sourceReviewFile, [
    'sourceTitle,sourceUrl,sourceType,poiCount,poiCodes,poiNames,licenseStatus,licenseEvidenceRef,licenseReviewedBy,licenseReviewedAt,nextAction',
    [
      '3A级及以下旅游景区名录',
      aLevelSourceUrl,
      'OFFICIAL_PUBLIC',
      '2',
      'xicheng-daguanyuan|xicheng-baitasi',
      '北京大观园|妙应寺白塔',
      'REVIEW_REQUIRED',
      '',
      '',
      '',
      'confirm page coverage before source approval'
    ].join(','),
    [
      '西城区文物保护单位（81处）',
      heritageSourceUrl,
      'OFFICIAL_PUBLIC',
      '2',
      'xicheng-heritage-001-sanguanmiao|xicheng-heritage-003-shuangsi',
      '三官庙|双寺',
      'REVIEW_REQUIRED',
      '',
      '',
      '',
      'confirm page coverage before source approval'
    ].join(',')
  ].join('\n') + '\n')
  return sourceReviewFile
}

async function writeSourcePageCache(rootDir) {
  const cacheFile = path.join(rootDir, 'tmp/xicheng-source-pages.json')
  await writeFile(cacheFile, `${JSON.stringify({
    [aLevelSourceUrl]: '3A级及以下旅游景区名录。北京大观园、宋庆龄同志故居、中国地质博物馆。',
    [heritageSourceUrl]: '西城区文物保护单位（81处）：1 三官庙；3 双 寺；4 普济寺（高庙）。'
  }, null, 2)}\n`)
  return cacheFile
}

function runCoverageAudit(rootDir) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/verify-xicheng-poi-source-coverage.mjs'),
    '--root', rootDir,
    '--source-review', 'workbench/xicheng-poi-source-review-summary.csv',
    '--source-page-cache', 'tmp/xicheng-source-pages.json',
    '--evidence-file', 'qa/xicheng-poi-source-coverage-evidence.json'
  ], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng POI source coverage audit', () => {
  test('flags POIs whose assigned official source page does not contain their name', async () => {
    const rootDir = await createTempRoot()
    const sourceReviewFile = await writeSourceReview(rootDir)
    await writeSourcePageCache(rootDir)

    const result = runCoverageAudit(rootDir)

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    const evidenceFile = path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json')
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-source-coverage',
      ok: false,
      status: 'SOURCE_COVERAGE_REVIEW_REQUIRED',
      summary: {
        sourceReviewFile,
        evidenceFile,
        sourceReviewRows: 2,
        sourceGroupCount: 2,
        poiCount: 4,
        coveredPoiCount: 3,
        uncoveredPoiCount: 1,
        sourcePageFetchMode: 'cache'
      }
    })
    expect(report.blockers).toContain('1 POI names are not found in their assigned source pages')
    expect(report.summary.sourceGroups).toEqual([
      expect.objectContaining({
        sourceUrl: aLevelSourceUrl,
        poiCount: 2,
        coveredPoiCount: 1,
        uncoveredPoiCount: 1,
        uncoveredPoiCodes: ['xicheng-baitasi'],
        uncoveredPoiNames: ['妙应寺白塔']
      }),
      expect.objectContaining({
        sourceUrl: heritageSourceUrl,
        poiCount: 2,
        coveredPoiCount: 2,
        uncoveredPoiCount: 0,
        uncoveredPoiCodes: []
      })
    ])
    expect(report.summary.sourcePages).toEqual([
      expect.objectContaining({
        sourceUrl: aLevelSourceUrl,
        sourceTextSha256: expect.stringMatching(/^[a-f0-9]{64}$/)
      }),
      expect.objectContaining({
        sourceUrl: heritageSourceUrl,
        sourceTextSha256: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    ])
    expect(JSON.stringify(report)).not.toContain('北京大观园、宋庆龄同志故居')

    const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'))
    expect(evidence.summary.uncoveredPoiCodes).toEqual(['xicheng-baitasi'])
  })

  test('exposes the source coverage audit command through npm scripts and handoff docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:source-coverage:audit']).toBe(
      'node scripts/verify-xicheng-poi-source-coverage.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:source-coverage:audit')
    expect(deployDoc).toContain('qa/xicheng-poi-source-coverage-evidence.json')
    expect(statusDoc).toContain('xicheng:poi:source-coverage:audit')
    expect(statusDoc).toContain('SOURCE_COVERAGE_REVIEW_REQUIRED')
  })
})

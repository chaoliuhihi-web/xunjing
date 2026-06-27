import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

function productionPoi(index, overrides = {}) {
  const suffix = String(index).padStart(3, '0')
  const poiCode = `xicheng-prod-poi-${suffix}`
  const categories = [
    'heritage_site',
    'museum',
    'park_scenic',
    'historic_district',
    'culture_space',
    'science_museum',
    'citywalk_street',
    'urban_landmark'
  ]
  return {
    poiCode,
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    name: `西城生产点位${suffix}`,
    displayName: `西城生产点位${suffix}`,
    aliases: [`西城生产点位${suffix}`, `生产点位${suffix}`, `别名${suffix}`],
    category: categories[(index - 1) % categories.length],
    priority: 'P0',
    address: `北京市西城区生产审核路${index}号`,
    latitude: 39.88 + index / 10000,
    longitude: 116.34 + index / 10000,
    coordType: 'GCJ02',
    source: {
      sourceTitle: `西城生产点位${suffix}官方审核来源`,
      sourceUrl: `https://www.bjxch.gov.cn/xicheng/poi/${suffix}`,
      sourceType: 'OFFICIAL',
      licenseStatus: 'APPROVED'
    },
    trigger: {
      gpsRadiusMeters: 180,
      ocrKeywords: [`西城生产点位${suffix}`, `生产点位${suffix}`],
      photoLabels: ['xicheng', 'landmark'],
      minConfidence: 0.85
    },
    content: {
      shortIntro: `西城生产点位${suffix}已完成来源授权、坐标复核和内容审核，可用于生产试运营讲解。`,
      recommendedQuestions: [
        `西城生产点位${suffix}有什么看点？`,
        `这里适合怎么游览？`,
        `附近可以串联哪些西城点位？`
      ]
    },
    audit: {
      reviewStatus: 'APPROVED',
      geoStatus: 'APPROVED',
      licenseStatus: 'APPROVED',
      status: 'PUBLISHED',
      reviewedBy: 'xicheng-content-reviewer',
      reviewedAt: '2026-06-27'
    },
    ...overrides
  }
}

function productionManifest(overrides = {}) {
  const pois = Array.from({ length: 80 }, (_, index) => productionPoi(index + 1))
  pois[0] = productionPoi(1, {
    name: "西城 O'Clock 点位",
    displayName: "西城 O'Clock 官方点位",
    aliases: ["西城 O'Clock 点位", '生产点位001', '别名001'],
    source: {
      sourceTitle: "西城 O'Clock 官方审核来源",
      sourceUrl: 'https://www.bjxch.gov.cn/xicheng/poi/001',
      sourceType: 'OFFICIAL',
      licenseStatus: 'APPROVED'
    }
  })
  return {
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    targetP0PoiCount: 80,
    productionReady: true,
    pois,
    ...overrides
  }
}

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-seed-'))
  tempDirs.push(rootDir)
  return rootDir
}

async function writeJson(rootDir, relativePath, value) {
  const filePath = path.join(rootDir, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
  return filePath
}

function runGenerator(args) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/generate-xicheng-poi-production-seed.mjs'),
    ...args
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

describe('xicheng POI production seed generator', () => {
  test('generates reviewed production SQL from a passing POI manifest', async () => {
    const rootDir = await createTempRoot()
    const manifestPath = await writeJson(rootDir, 'workbench/xicheng-production-pois.json', productionManifest())
    const outputPath = path.join(rootDir, 'tmp/xicheng-poi-production-seed.sql')

    const result = runGenerator([
      '--manifest', manifestPath,
      '--root', rootDir,
      '--output', 'tmp/xicheng-poi-production-seed.sql'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('PRODUCTION_POI_SEED_GENERATED')
    expect(report.summary).toMatchObject({
      totalPoiCount: 80,
      outputFile: outputPath
    })

    const sql = await readFile(outputPath, 'utf8')
    expect(sql).toContain('Generated from reviewed Xicheng POI production manifest')
    expect(sql).toContain('INSERT INTO `xunjing_poi`')
    expect(sql).toContain('INSERT INTO `xunjing_knowledge_document`')
    expect(sql).toContain('INSERT INTO `xunjing_map_point`')
    expect(sql).toContain('INSERT INTO `xunjing_public_report`')
    expect(sql).toContain("'xicheng-prod-poi-001'")
    expect(sql).toContain("西城 O''Clock 点位")
    expect(sql).toContain('https://www.bjxch.gov.cn/xicheng/poi/001')
    expect(sql).toContain('"poiSeedCount":80')
    expect(sql).toContain('"targetP0PoiCount":80')
    expect(sql).toContain('"productionReady":true')
    expect(sql).toContain("'APPROVED', 'APPROVED', 'APPROVED', 'PUBLISHED'")
    expect(sql).not.toContain('REVIEW_REQUIRED')
  })

  test('refuses to generate SQL when the manifest gate is not ready', async () => {
    const rootDir = await createTempRoot()
    const manifestPath = await writeJson(rootDir, 'workbench/xicheng-production-pois.json', productionManifest({
      productionReady: false,
      pois: [productionPoi(1)]
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-poi-production-seed.sql')

    const result = runGenerator([
      '--manifest', manifestPath,
      '--root', rootDir,
      '--output', 'tmp/xicheng-poi-production-seed.sql'
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('manifest is not production-ready')
    expect(result.stderr).toContain('80 production-ready POIs required; found 1/80')
    expect(existsSync(outputPath)).toBe(false)
  })

  test('exposes the seed generator through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:seed:generate']).toBe(
      'node scripts/generate-xicheng-poi-production-seed.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:seed:generate')
    expect(deployDoc).toContain('xicheng-poi-production-seed.sql')
  })
})

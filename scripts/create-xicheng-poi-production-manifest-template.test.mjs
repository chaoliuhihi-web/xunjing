import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-template-'))
  tempDirs.push(rootDir)
  return rootDir
}

function runTemplateGenerator(args, options = {}) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/create-xicheng-poi-production-manifest-template.mjs'),
    ...args
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...options
  })
}

function runManifestGate(args, options = {}) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/verify-xicheng-poi-production-manifest.mjs'),
    ...args
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...options
  })
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng POI production manifest template generator', () => {
  test('generates a non-production 80 POI manifest template under workbench', async () => {
    const rootDir = await createTempRoot()
    const outputFile = path.join(rootDir, 'workbench/xicheng-production-pois.template.json')

    const result = runTemplateGenerator([
      '--root', rootDir,
      '--output', 'workbench/xicheng-production-pois.template.json'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-production-manifest-template',
      ok: true,
      status: 'TEMPLATE_GENERATED'
    })
    expect(report.summary).toMatchObject({
      outputFile,
      poiSlots: 80,
      productionReady: false
    })

    const manifest = JSON.parse(await readFile(outputFile, 'utf8'))
    expect(manifest).toMatchObject({
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      targetP0PoiCount: 80,
      productionReady: false,
      reviewBatch: {
        batchCode: '',
        dataOwner: '',
        sourceCompiledBy: '',
        sourceCompiledAt: '',
        reviewedBy: '',
        reviewedAt: '',
        evidencePackageRef: ''
      }
    })
    expect(manifest.pois).toHaveLength(80)
    expect(manifest.templateNotice).toContain('must not be used as production evidence')

    const firstPoi = manifest.pois[0]
    expect(firstPoi).toMatchObject({
      poiCode: 'TODO-xicheng-poi-001',
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      priority: 'P0',
      coordType: 'GCJ02',
      source: {
        sourceTitle: '',
        sourceUrl: '',
        sourceType: 'OFFICIAL',
        licenseStatus: 'REVIEW_REQUIRED',
        licenseEvidenceRef: '',
        licenseReviewedBy: '',
        licenseReviewedAt: ''
      },
      fieldEvidence: {
        photoEvidenceStatus: 'REVIEW_REQUIRED',
        triggerSmokeStatus: 'NOT_RUN',
        evidenceRefs: [],
        verifiedBy: '',
        verifiedAt: ''
      },
      audit: {
        reviewStatus: 'REVIEW_REQUIRED',
        geoStatus: 'REVIEW_REQUIRED',
        licenseStatus: 'REVIEW_REQUIRED',
        status: 'DRAFT',
        reviewedBy: '',
        reviewedAt: ''
      }
    })
    expect(firstPoi.aliases).toEqual([])
    expect(firstPoi.trigger).toMatchObject({
      gpsRadiusMeters: 180,
      ocrKeywords: [],
      photoLabels: [],
      minConfidence: 0.85
    })
    expect(firstPoi.content).toMatchObject({
      shortIntro: '',
      recommendedQuestions: []
    })

    const gateEvidenceFile = path.join(rootDir, 'tmp/template-manifest-gate-evidence.json')
    const gateResult = runManifestGate([
      '--manifest', outputFile,
      '--root', rootDir,
      '--evidence-file', 'tmp/template-manifest-gate-evidence.json'
    ])
    expect(gateResult.status).toBe(1)
    const gateReport = JSON.parse(await readFile(gateEvidenceFile, 'utf8'))
    expect(gateReport.status).toBe('NOT_READY')
    expect(gateReport.blockers.join('\n')).toContain('manifest.productionReady must be true before production seed merge')
    expect(gateReport.blockers.join('\n')).toContain('manifest.reviewBatch.batchCode is required')
    expect(gateReport.blockers.join('\n')).toContain('TODO-xicheng-poi-001 poiCode must be a stable xicheng-* slug')
    expect(gateReport.blockers.join('\n')).toContain('TODO-xicheng-poi-001 source.licenseStatus must be APPROVED')
  })

  test('rejects template output outside qa tmp or workbench', async () => {
    const rootDir = await createTempRoot()

    const result = runTemplateGenerator([
      '--root', rootDir,
      '--output', 'xicheng-production-pois.template.json'
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('output file must be under qa/, tmp/ or workbench/')
  })

  test('prefills the production manifest draft from the current local candidate seed without marking it production ready', async () => {
    const rootDir = await createTempRoot()
    const outputFile = path.join(rootDir, 'workbench/xicheng-production-pois.prefilled.json')
    const checklistFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-checklist.csv')
    const workbookFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv')
    const seedSql = path.resolve('backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')

    const result = runTemplateGenerator([
      '--root', rootDir,
      '--output', 'workbench/xicheng-production-pois.prefilled.json',
      '--seed-sql', seedSql,
      '--review-checklist', 'workbench/xicheng-production-pois.review-checklist.csv',
      '--review-workbook', 'workbench/xicheng-production-pois.review-workbook.csv'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-production-manifest-template',
      ok: true,
      status: 'TEMPLATE_GENERATED',
      summary: {
        outputFile,
        reviewChecklistFile: checklistFile,
        reviewWorkbookFile: workbookFile,
        poiSlots: 80,
        importedPoiCount: 24,
        checklistRows: 80,
        workbookRows: 80,
        todoPoiSlots: 56,
        productionReady: false
      }
    })

    const manifest = JSON.parse(await readFile(outputFile, 'utf8'))
    expect(manifest).toMatchObject({
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      targetP0PoiCount: 80,
      productionReady: false,
      seedSource: {
        localCandidateOnly: true,
        importedPoiCount: 24
      }
    })
    expect(manifest.pois).toHaveLength(80)
    expect(manifest.templateNotice).toContain('local-candidate seed')

    expect(manifest.pois[0]).toMatchObject({
      poiCode: 'xicheng-baitasi',
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      name: '妙应寺白塔',
      displayName: '妙应寺白塔',
      category: 'heritage_site',
      priority: 'P0',
      address: '北京市西城区阜成门内大街171号',
      latitude: 39.9231,
      longitude: 116.35726,
      coordType: 'GCJ02',
      source: {
        sourceType: 'OFFICIAL_PUBLIC',
        sourceUrl: 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html',
        licenseStatus: 'REVIEW_REQUIRED'
      },
      trigger: {
        gpsRadiusMeters: 220,
        minConfidence: 0.85
      },
      fieldEvidence: {
        photoEvidenceStatus: 'REVIEW_REQUIRED',
        triggerSmokeStatus: 'NOT_RUN'
      },
      audit: {
        reviewStatus: 'REVIEW_REQUIRED',
        geoStatus: 'REVIEW_REQUIRED',
        licenseStatus: 'REVIEW_REQUIRED',
        status: 'DRAFT'
      }
    })
    expect(manifest.pois[0].aliases).toContain('白塔寺')
    expect(manifest.pois[0].trigger.ocrKeywords).toContain('妙应寺白塔')
    expect(manifest.pois[0].content.recommendedQuestions).toHaveLength(3)
    expect(manifest.pois[23].poiCode).toBe('xicheng-financial-street')
    expect(manifest.pois[24].poiCode).toBe('TODO-xicheng-poi-025')

    const gateEvidenceFile = path.join(rootDir, 'tmp/prefilled-manifest-gate-evidence.json')
    const gateResult = runManifestGate([
      '--manifest', outputFile,
      '--root', rootDir,
      '--evidence-file', 'tmp/prefilled-manifest-gate-evidence.json'
    ])
    expect(gateResult.status).toBe(1)
    const gateReport = JSON.parse(await readFile(gateEvidenceFile, 'utf8'))
    expect(gateReport.status).toBe('NOT_READY')
    expect(gateReport.blockers.join('\n')).toContain('manifest.productionReady must be true before production seed merge')
    expect(gateReport.blockers.join('\n')).toContain('xicheng-baitasi source.licenseStatus must be APPROVED')
    expect(gateReport.blockers.join('\n')).toContain('TODO-xicheng-poi-025 poiCode must be a stable xicheng-* slug')

    const checklist = await readFile(checklistFile, 'utf8')
    const checklistLines = checklist.trim().split('\n')
    expect(checklistLines).toHaveLength(81)
    expect(checklistLines[0]).toBe('poiCode,name,category,sourceUrl,reviewStatus,geoStatus,licenseStatus,photoEvidenceStatus,triggerSmokeStatus,missingFields')
    expect(checklistLines[1]).toContain('xicheng-baitasi')
    expect(checklistLines[1]).toContain('妙应寺白塔')
    expect(checklistLines[1]).toContain('source.licenseEvidenceRef')
    expect(checklistLines[1]).toContain('audit.reviewStatus=APPROVED')
    expect(checklistLines[25]).toContain('TODO-xicheng-poi-025')
    expect(checklistLines[25]).toContain('name')
    expect(checklistLines[25]).toContain('source.sourceUrl')

    const workbook = await readFile(workbookFile, 'utf8')
    const workbookLines = workbook.trim().split('\n')
    expect(workbookLines).toHaveLength(81)
    expect(workbookLines[0]).toBe([
      'poiCode',
      'name',
      'displayName',
      'aliases',
      'category',
      'priority',
      'address',
      'latitude',
      'longitude',
      'coordType',
      'sourceTitle',
      'sourceUrl',
      'sourceType',
      'licenseStatus',
      'licenseEvidenceRef',
      'licenseReviewedBy',
      'licenseReviewedAt',
      'gpsRadiusMeters',
      'ocrKeywords',
      'photoLabels',
      'minConfidence',
      'photoEvidenceStatus',
      'triggerSmokeStatus',
      'fieldEvidenceRefs',
      'fieldVerifiedBy',
      'fieldVerifiedAt',
      'shortIntro',
      'recommendedQuestions',
      'reviewStatus',
      'geoStatus',
      'auditLicenseStatus',
      'status',
      'reviewedBy',
      'reviewedAt'
    ].join(','))
    expect(workbookLines[1]).toContain('xicheng-baitasi')
    expect(workbookLines[1]).toContain('妙应寺白塔')
    expect(workbookLines[1]).toContain('妙应寺白塔|妙应寺|白塔寺')
    expect(workbookLines[1]).toContain('REVIEW_REQUIRED')
    expect(workbookLines[25]).toContain('TODO-xicheng-poi-025')
  })

  test('exposes the template generator through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')
    const statusDoc = await readFile('docs/04_AI交接任务书/西城P0后台上线状态.md', 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:manifest:template']).toBe(
      'node scripts/create-xicheng-poi-production-manifest-template.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:manifest:template')
    expect(deployDoc).toContain('productionReady=false')
    expect(deployDoc).toContain('--seed-sql backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')
    expect(deployDoc).toContain('--review-checklist workbench/xicheng-production-pois.review-checklist.csv')
    expect(deployDoc).toContain('--review-workbook workbench/xicheng-production-pois.review-workbook.csv')
    expect(statusDoc).toContain('npm run xunjing:xicheng:poi:manifest:template')
    expect(statusDoc).toContain('模板不会通过 production manifest gate')
    expect(statusDoc).toContain('--seed-sql backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')
    expect(statusDoc).toContain('--review-checklist workbench/xicheng-production-pois.review-checklist.csv')
    expect(statusDoc).toContain('--review-workbook workbench/xicheng-production-pois.review-workbook.csv')
  })
})

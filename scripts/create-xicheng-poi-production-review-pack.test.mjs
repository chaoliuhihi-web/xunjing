import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-review-pack-'))
  tempDirs.push(rootDir)
  return rootDir
}

function runReviewPack(args, options = {}) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/create-xicheng-poi-production-review-pack.mjs'),
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

describe('xicheng POI production review pack', () => {
  test('creates the default prefilled review pack without marking it production ready', async () => {
    const rootDir = await createTempRoot()

    const result = runReviewPack([
      '--root', rootDir
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    const outputFile = path.join(rootDir, 'workbench/xicheng-production-pois.prefilled.json')
    const reviewChecklistFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-checklist.csv')
    const reviewWorkbookFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv')
    const reviewPacketFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-packet.json')
    const workbookEvidenceFile = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const reviewTasksFile = path.join(rootDir, 'workbench/xicheng-poi-review-tasks.csv')
    const sourceReviewFile = path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv')
    const productionReviewFile = path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv')
    const reviewPackEvidenceFile = path.join(rootDir, 'qa/xicheng-poi-production-review-pack-evidence.json')

    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-production-review-pack',
      ok: false,
      status: 'REVIEW_DATA_REQUIRED',
      summary: {
        outputFile,
        reviewChecklistFile,
        reviewWorkbookFile,
        reviewPacketFile,
        workbookEvidenceFile,
        reviewTasksFile,
        sourceReviewFile,
        productionReviewFile,
        reviewPackEvidenceFile,
        poiSlots: 80,
        importedPoiCount: 80,
        todoPoiSlots: 0,
        productionReady: false,
        sourceReviewGroupCount: 25,
        sourceReviewGroupBreakdown: expect.arrayContaining([
          expect.objectContaining({
            sourceTitle: '妙应寺白塔公开来源',
            sourceUrl: 'https://www.bjxch.gov.cn/zt/xjkjmp/xxxq/pnidpv969571.html',
            sourceType: 'OFFICIAL_PUBLIC',
            poiCount: 1
          }),
          expect.objectContaining({
            sourceTitle: '西城区 3A 及以下旅游景区名录：历代帝王庙',
            sourceUrl: 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-emperors-temple',
            sourceType: 'OFFICIAL_PUBLIC',
            poiCount: 1
          }),
          expect.objectContaining({
            sourceTitle: '西城区 3A 及以下旅游景区名录：什刹海',
            sourceUrl: 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-shichahai',
            sourceType: 'OFFICIAL_PUBLIC',
            poiCount: 1
          }),
          expect.objectContaining({
            sourceTitle: '西城区 3A 及以下旅游景区名录：金融街',
            sourceUrl: 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-financial-street',
            sourceType: 'OFFICIAL_PUBLIC',
            poiCount: 1
          }),
          expect.objectContaining({
            sourceTitle: '北京旅游网：牛街',
            sourceUrl: 'https://www.visitbeijing.com.cn/article/4M2HM3VB4pD?device=amp&device=amp',
            sourceType: 'OFFICIAL_PUBLIC',
            poiCount: 1
          }),
          expect.objectContaining({
            sourceTitle: '西城区文物保护单位（81处）',
            sourceUrl: 'https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html',
            sourceType: 'OFFICIAL_PUBLIC',
            poiCount: 56
          })
        ]),
        workbookGateStatus: 'NOT_READY',
        workbookReadyPoiCount: 0,
        workbookPendingPoiCount: 80,
        reviewTaskStatus: 'REVIEW_TASKS_REQUIRED',
        reviewTaskOwnerLaneCounts: {
          'source-license': 80,
          'field-review': 80,
          'content-audit': 80,
          cleanup: 80
        },
        reviewTaskOwnerLaneBreakdown: [
          {
            ownerLane: 'cleanup',
            taskCount: 80,
            poiCount: 80,
            blockerGroups: ['no-placeholder-cells']
          },
          {
            ownerLane: 'content-audit',
            taskCount: 80,
            poiCount: 80,
            blockerGroups: ['poi-content-audit']
          },
          {
            ownerLane: 'field-review',
            taskCount: 80,
            poiCount: 80,
            blockerGroups: ['poi-field-evidence']
          },
          {
            ownerLane: 'source-license',
            taskCount: 80,
            poiCount: 80,
            blockerGroups: ['poi-source-license']
          }
        ]
      }
    })
    expect(report.blockers).toContain('review workbook still contains TODO or REVIEW_REQUIRED placeholders')
    expect(report.blockers).toContain('workbook review tasks remain; complete ownerLane CSV rows before production release')
    expect(report.nextCommands).toContain(
      'npm run xunjing:xicheng:poi:workbook:gate -- --workbook workbench/xicheng-production-pois.review-workbook.csv --evidence-file qa/xicheng-poi-review-workbook-evidence.json'
    )
    expect(report.nextCommands).toContain(
      'npm run xunjing:xicheng:poi:tasks:export -- --workbook-evidence qa/xicheng-poi-review-workbook-evidence.json --output workbench/xicheng-poi-review-tasks.csv'
    )

    const manifest = JSON.parse(await readFile(outputFile, 'utf8'))
    expect(manifest.seedSource).toMatchObject({
      localCandidateOnly: true,
      importedPoiCount: 80
    })
    expect(manifest.productionReady).toBe(false)
    expect(manifest.pois).toHaveLength(80)

    const workbook = await readFile(reviewWorkbookFile, 'utf8')
    expect(workbook).toContain('xicheng-heritage-001-sanguanmiao')
    expect(workbook).toContain('三官庙')
    expect(workbook).toContain('REVIEW_REQUIRED')

    const workbookEvidence = JSON.parse(await readFile(workbookEvidenceFile, 'utf8'))
    expect(workbookEvidence).toMatchObject({
      artifactType: 'xicheng-poi-review-workbook-readiness',
      ok: false,
      status: 'NOT_READY',
      summary: {
        workbookFile: reviewWorkbookFile,
        workbookRows: 80,
        workbookPendingPoiCount: 80
      }
    })

    const reviewTasks = await readFile(reviewTasksFile, 'utf8')
    expect(reviewTasks).toContain('workbookRowNumber,poiIndex,poiCode,blockerGroup,ownerLane,taskDetail,requiredEvidence,workbookColumns,taskStatus,sourceEvidenceFile')
    expect(reviewTasks).toContain('xicheng-heritage-001-sanguanmiao')
    expect(reviewTasks).toContain('source-license')
    expect(reviewTasks).toContain('Approve source license and attach non-local source evidence.')
    expect(reviewTasks).toContain('sourceTitle|sourceUrl|sourceType|licenseStatus|licenseEvidenceRef|licenseReviewedBy|licenseReviewedAt')

    const sourceReview = await readFile(sourceReviewFile, 'utf8')
    expect(sourceReview).toContain('sourceTitle,sourceUrl,sourceType,poiCount,poiCodes,poiNames,licenseStatus,licenseEvidenceRef,licenseReviewedBy,licenseReviewedAt,nextAction')
    expect(sourceReview).toContain('妙应寺白塔公开来源,https://www.bjxch.gov.cn/zt/xjkjmp/xxxq/pnidpv969571.html,OFFICIAL_PUBLIC,1,xicheng-baitasi,妙应寺白塔')
    expect(sourceReview).toContain('北京旅游网：恭王府,https://s.visitbeijing.com.cn/attraction/117810,OFFICIAL_PUBLIC,1,xicheng-gongwangfu,恭王府')
    expect(sourceReview).toContain('西城区 3A 及以下旅游景区名录：历代帝王庙,https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-emperors-temple,OFFICIAL_PUBLIC,1,xicheng-emperors-temple,历代帝王庙')
    expect(sourceReview).toContain('西城区 3A 及以下旅游景区名录：什刹海,https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-shichahai,OFFICIAL_PUBLIC,1,xicheng-shichahai,什刹海')
    expect(sourceReview).toContain('西城区 3A 及以下旅游景区名录：金融街,https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-financial-street,OFFICIAL_PUBLIC,1,xicheng-financial-street,金融街')
    expect(sourceReview).not.toContain('https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html,OFFICIAL_PUBLIC,11')
    expect(sourceReview).not.toContain('xicheng-baitasi|xicheng-emperors-temple')
    expect(sourceReview).not.toContain('xicheng-emperors-temple|xicheng-shichahai')
    expect(sourceReview).toContain('北京旅游网：牛街,https://www.visitbeijing.com.cn/article/4M2HM3VB4pD?device=amp&device=amp,OFFICIAL_PUBLIC,1,xicheng-niujie,牛街')
    expect(sourceReview).toContain('西城区文物保护单位（81处）,https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html,OFFICIAL_PUBLIC,56')
    expect(sourceReview).toContain('xicheng-heritage-001-sanguanmiao|xicheng-heritage-002-jingyesi')
    expect(sourceReview).toContain('Approve source license once per source group and attach non-local evidence refs to every POI row.')

    const productionReview = await readFile(productionReviewFile, 'utf8')
    expect(productionReview).toContain('poiCode,photoEvidenceStatus,triggerSmokeStatus,fieldEvidenceRefs,fieldVerifiedBy,fieldVerifiedAt,reviewStatus,geoStatus,auditLicenseStatus,status,reviewedBy,reviewedAt,nextAction')
    expect(productionReview).toContain('xicheng-baitasi,REVIEW_REQUIRED,NOT_RUN,,,,REVIEW_REQUIRED,REVIEW_REQUIRED,REVIEW_REQUIRED,DRAFT,,,"Attach field evidence, pass trigger smoke, approve geo/content/license audit, and keep evidence refs non-local."')
    expect(productionReview).toContain('xicheng-heritage-001-sanguanmiao,REVIEW_REQUIRED,NOT_RUN,,,,REVIEW_REQUIRED,REVIEW_REQUIRED,REVIEW_REQUIRED,DRAFT,,,"Attach field evidence, pass trigger smoke, approve geo/content/license audit, and keep evidence refs non-local."')

    const reviewPackEvidence = JSON.parse(await readFile(reviewPackEvidenceFile, 'utf8'))
    expect(reviewPackEvidence).toMatchObject({
      artifactType: 'xicheng-poi-production-review-pack',
      ok: false,
      status: 'REVIEW_DATA_REQUIRED',
      summary: {
        reviewPackEvidenceFile,
        workbookEvidenceFile,
        reviewTasksFile,
        sourceReviewFile,
        productionReviewFile,
        productionReviewRowCount: 80,
        sourceReviewGroupCount: 25,
        workbookGateStatus: 'NOT_READY',
        reviewTaskStatus: 'REVIEW_TASKS_REQUIRED'
      }
    })

    const reviewPacket = JSON.parse(await readFile(reviewPacketFile, 'utf8'))
    expect(reviewPacket).toMatchObject({
      artifactType: 'xicheng-poi-production-review-packet',
      ok: false,
      status: 'REVIEW_DATA_REQUIRED',
      summary: {
        poiSlots: 80,
        importedPoiCount: 80,
        todoPoiSlots: 0,
        productionReady: false
      }
    })
    expect(await readFile(reviewChecklistFile, 'utf8')).toContain('xicheng-heritage-001-sanguanmiao')
  })

  test('exposes the review pack through npm scripts and handoff docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:review:pack']).toBe(
      'node scripts/create-xicheng-poi-production-review-pack.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:review:pack')
    expect(deployDoc).toContain('qa/xicheng-poi-review-workbook-evidence.json')
    expect(deployDoc).toContain('workbench/xicheng-poi-review-tasks.csv')
    expect(deployDoc).toContain('workbench/xicheng-poi-source-review-summary.csv')
    expect(deployDoc).toContain('workbench/xicheng-poi-production-review-summary.csv')
    expect(deployDoc).toContain('--workbook-evidence qa/xicheng-poi-review-workbook-evidence.json')
    expect(deployDoc).toContain('--review-tasks workbench/xicheng-poi-review-tasks.csv')
    expect(deployDoc).toContain('--source-review workbench/xicheng-poi-source-review-summary.csv')
    expect(deployDoc).toContain('--production-review workbench/xicheng-poi-production-review-summary.csv')
    expect(deployDoc).toContain('--evidence-file qa/xicheng-poi-production-review-pack-evidence.json')
    expect(statusDoc).toContain('npm run xunjing:xicheng:poi:review:pack')
    expect(statusDoc).toContain('qa/xicheng-poi-production-review-pack-evidence.json')
    expect(statusDoc).toContain('workbookGateStatus')
    expect(statusDoc).toContain('reviewTaskStatus')
    expect(statusDoc).toContain('reviewTaskOwnerLaneBreakdown')
    expect(statusDoc).toContain('sourceReviewGroupBreakdown')
    expect(statusDoc).toContain('productionReviewRowCount')
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:source-review:apply')
    expect(deployDoc).toContain('reviewTaskOwnerLaneBreakdown')
  })
})

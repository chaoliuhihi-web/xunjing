import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []
const servers = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-trigger-smoke-'))
  await mkdir(path.join(rootDir, 'workbench'), { recursive: true })
  await mkdir(path.join(rootDir, 'qa'), { recursive: true })
  tempDirs.push(rootDir)
  return rootDir
}

async function startTriggerServer(handler) {
  const server = createServer(async (req, res) => {
    if (req.url !== '/app-api/xunjing/triggers/resolve' || req.method !== 'POST') {
      res.writeHead(404)
      res.end()
      return
    }
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      const payload = JSON.parse(body || '{}')
      const response = handler(payload, req)
      res.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' })
      res.end(JSON.stringify(response))
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  servers.push(server)
  const { port } = server.address()
  return `http://127.0.0.1:${port}`
}

function runSmoke(rootDir, baseUrl) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [
    path.resolve('scripts/verify-xicheng-poi-trigger-smoke.mjs'),
    '--root',
    rootDir,
    '--workbook',
    'workbench/xicheng-production-pois.review-workbook.source-applied.csv',
    '--base-url',
    baseUrl,
    '--tenant-id',
    '1',
    '--evidence-file',
    'qa/xicheng-poi-trigger-smoke-evidence.json'
    ], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('close', (status) => {
      resolve({ status, stdout, stderr })
    })
  })
}

async function writeWorkbook(rootDir) {
  const header = 'poiCode,name,displayName,latitude,longitude,coordType,ocrKeywords,photoLabels,minConfidence'
  await writeFile(path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.source-applied.csv'), [
    header,
    'xicheng-baitasi,妙应寺白塔,妙应寺白塔,39.9231,116.35726,GCJ02,妙应寺白塔|白塔寺,white_pagoda|temple,0.85',
    'xicheng-emperors-temple,历代帝王庙,北京历代帝王庙,39.91893,116.36587,GCJ02,历代帝王庙|帝王庙,temple|paifang,0.85'
  ].join('\n') + '\n')
}

afterEach(async () => {
  while (servers.length > 0) {
    const server = servers.pop()
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections()
    }
    await new Promise((resolve) => server.close(resolve))
  }
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng POI trigger smoke evidence', () => {
  test('smokes every workbook POI through the live trigger resolve API', async () => {
    const rootDir = await createTempRoot()
    await writeWorkbook(rootDir)
    const seenPayloads = []
    const baseUrl = await startTriggerServer((payload) => {
      seenPayloads.push(payload)
      const isBaitasi = String(payload.ocrText || '').includes('妙应寺白塔')
      const poiCode = isBaitasi ? 'xicheng-baitasi' : 'xicheng-emperors-temple'
      const poiName = isBaitasi ? '妙应寺白塔' : '历代帝王庙'
      return {
        code: 0,
        data: {
          packageCode: 'XICHENG-MAP-001',
          regionCode: 'beijing-xicheng',
          poiCode,
          poiName,
          confidence: 0.96,
          requiresUserConfirm: false,
          targetPath: `/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=${poiCode}&packageCode=XICHENG-MAP-001`,
          sources: [{ title: `${poiName} POI source` }]
        }
      }
    })

    const result = await runSmoke(rootDir, baseUrl)

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-trigger-smoke',
      ok: true,
      status: 'XICHENG_POI_TRIGGER_SMOKE_READY',
      summary: {
        workbookRows: 2,
        passedPoiCount: 2,
        failedPoiCount: 0,
        baseUrl,
        tenantId: '1'
      }
    })
    expect(seenPayloads).toHaveLength(2)
    expect(seenPayloads[0]).toMatchObject({
      packageCode: 'XICHENG-MAP-001',
      regionCode: 'beijing-xicheng',
      ocrText: '妙应寺白塔',
      location: {
        latitude: 39.9231,
        longitude: 116.35726,
        coordType: 'GCJ02'
      },
      imageLabels: ['white_pagoda', 'temple']
    })
    const evidence = JSON.parse(await readFile(path.join(rootDir, 'qa/xicheng-poi-trigger-smoke-evidence.json'), 'utf8'))
    expect(evidence.summary.passedPoiCodes).toEqual(['xicheng-baitasi', 'xicheng-emperors-temple'])
    expect(JSON.stringify(evidence)).not.toContain('imageBase64')
  })

  test('fails closed when the API resolves a different POI', async () => {
    const rootDir = await createTempRoot()
    await writeWorkbook(rootDir)
    const baseUrl = await startTriggerServer(() => ({
      code: 0,
      data: {
        packageCode: 'XICHENG-MAP-001',
        regionCode: 'beijing-xicheng',
        poiCode: 'xicheng-wrong',
        poiName: '错误点位',
        confidence: 0.99,
        requiresUserConfirm: false,
        targetPath: '/pages/ai-guide/detail?poiCode=xicheng-wrong&packageCode=XICHENG-MAP-001',
        sources: [{ title: 'wrong source' }]
      }
    }))

    const result = await runSmoke(rootDir, baseUrl)

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      ok: false,
      status: 'XICHENG_POI_TRIGGER_SMOKE_REVIEW_REQUIRED',
      summary: {
        passedPoiCount: 0,
        failedPoiCount: 2
      }
    })
    expect(report.blockers.join('\n')).toContain('xicheng-baitasi trigger smoke did not resolve expected POI')
  })
})

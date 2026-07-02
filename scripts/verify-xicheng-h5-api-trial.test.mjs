import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import {
  buildXichengH5ApiTrialEvidence,
  checkXichengH5ApiTrial,
  resolveH5ApiTrialEvidenceFile,
  validateH5ApiTrialEnv
} from './verify-xicheng-h5-api-trial.mjs'

const tempDirs = []

const env = {
  XUNJING_APP_API_BASE_URL: 'https://xunjingapi.xingheai.net',
  XUNJING_ADMIN_BASE_URL: 'https://xunjingadmin.xingheai.net',
  XUNJING_TENANT_ID: '1'
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('Xicheng H5/API trial verifier', () => {
  test('checks API public report and protected admin H5 domain without secrets', async () => {
    const calls = []
    const trial = await checkXichengH5ApiTrial({
      env,
      checkedAt: '2026-07-02T08:00:00.000Z',
      nowMs: (() => {
        let now = 5000
        return () => {
          now += 30
          return now
        }
      })(),
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, options })
        if (url === 'https://xunjingapi.xingheai.net/app-api/xunjing/public-report/summary?packageCode=XICHENG-MAP-001') {
          expect(options.headers['tenant-id']).toBe('1')
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            text: async () => JSON.stringify({
              code: 0,
              data: {
                p0Ready: true,
                packageCount: 1,
                reviewedKnowledgeCount: 80,
                reviewedMediaCount: 8,
                mapPointCount: 80
              }
            })
          }
        }
        if (url === 'https://xunjingadmin.xingheai.net/') {
          expect(options.headers.accept).toContain('text/html')
          return {
            ok: false,
            status: 401,
            headers: new Headers({ 'www-authenticate': 'Basic realm="Xinghe Xunjing Admin"' }),
            text: async () => '<html><body>Unauthorized</body></html>'
          }
        }
        throw new Error(`unexpected url ${url}`)
      }
    })

    expect(calls).toHaveLength(2)
    expect(trial).toMatchObject({
      checkedAt: '2026-07-02T08:00:00.000Z',
      apiBaseUrl: 'https://xunjingapi.xingheai.net',
      adminBaseUrl: 'https://xunjingadmin.xingheai.net',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      publicReportHttpStatus: 200,
      publicReportP0Ready: true,
      publicReportPackageCount: 1,
      publicReportReviewedKnowledgeCount: 80,
      publicReportReviewedMediaCount: 8,
      publicReportMapPointCount: 80,
      adminHttpStatus: 401,
      adminH5Mode: 'BASIC_AUTH_PROTECTED',
      adminBasicAuthRealm: 'Xinghe Xunjing Admin',
      latencyMs: 30
    })
  })

  test('accepts an authenticated admin SPA response when the H5 shell is visible', async () => {
    const trial = await checkXichengH5ApiTrial({
      env,
      fetchImpl: async (url) => {
        if (url.includes('/app-api/xunjing/public-report/summary')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            text: async () => JSON.stringify({
              code: 0,
              data: {
                p0Ready: true,
                packageCount: 1,
                reviewedKnowledgeCount: 81,
                reviewedMediaCount: 8,
                mapPointCount: 80
              }
            })
          }
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<!doctype html><html><body><div id="app"></div><script type="module" src="/assets/index.js"></script></body></html>'
        }
      }
    })

    expect(trial.adminHttpStatus).toBe(200)
    expect(trial.adminH5Mode).toBe('SPA_READY')
  })

  test('builds ready evidence and rejects local or incomplete trial inputs', () => {
    const providerTrial = {
      checkedAt: '2026-07-02T08:00:00.000Z',
      apiBaseUrl: 'https://xunjingapi.xingheai.net',
      apiHost: 'xunjingapi.xingheai.net',
      adminBaseUrl: 'https://xunjingadmin.xingheai.net',
      adminHost: 'xunjingadmin.xingheai.net',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      publicReportHttpStatus: 200,
      publicReportP0Ready: true,
      publicReportPackageCount: 1,
      publicReportReviewedKnowledgeCount: 80,
      publicReportReviewedMediaCount: 8,
      publicReportMapPointCount: 80,
      adminHttpStatus: 401,
      adminH5Mode: 'BASIC_AUTH_PROTECTED',
      adminBasicAuthRealm: 'Xinghe Xunjing Admin',
      latencyMs: 50
    }

    const evidence = buildXichengH5ApiTrialEvidence({
      env: {
        ...env,
        MYSQL_PASSWORD: 'prod-db-password'
      },
      providerTrial,
      checkedAt: '2026-07-02T08:00:00.000Z'
    })

    expect(evidence).toMatchObject({
      artifactType: 'xicheng-h5-api-trial',
      ok: true,
      status: 'XICHENG_H5_API_TRIAL_READY',
      summary: {
        apiBaseUrl: 'https://xunjingapi.xingheai.net',
        adminBaseUrl: 'https://xunjingadmin.xingheai.net',
        tenantId: '1',
        packageCode: 'XICHENG-MAP-001',
        publicReportMapPointCount: 80,
        adminH5Mode: 'BASIC_AUTH_PROTECTED'
      },
      checks: [
        { name: 'https-api-domain', ok: true, blockers: [] },
        { name: 'https-admin-h5-domain', ok: true, blockers: [] },
        { name: 'tenant-header', ok: true, blockers: [] },
        { name: 'xicheng-public-report', ok: true, blockers: [] },
        { name: 'admin-h5-protection', ok: true, blockers: [] },
        { name: 'secret-redaction', ok: true, blockers: [] }
      ],
      blockers: []
    })
    expect(JSON.stringify(evidence)).not.toContain('prod-db-password')

    expect(() => validateH5ApiTrialEnv({
      ...env,
      XUNJING_ADMIN_BASE_URL: 'http://127.0.0.1:48080'
    })).toThrow('XUNJING_ADMIN_BASE_URL must be a non-local HTTPS URL')
    expect(() => buildXichengH5ApiTrialEvidence({
      env,
      providerTrial: {
        ...providerTrial,
        publicReportMapPointCount: 12
      }
    })).toThrow('H5/API trial must prove Xicheng P0 API data and admin H5 access boundary are ready')
  })

  test('writes evidence only under qa, tmp or workbench and exposes npm script', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-h5-api-trial-'))
    tempDirs.push(rootDir)

    expect(resolveH5ApiTrialEvidenceFile(rootDir, 'qa/xicheng-h5-api-trial-evidence.json')).toBe(
      path.join(rootDir, 'qa/xicheng-h5-api-trial-evidence.json')
    )
    expect(() => resolveH5ApiTrialEvidenceFile(rootDir, 'xicheng-h5-api-trial-evidence.json'))
      .toThrow('evidence file must be under qa/, tmp/ or workbench/')

    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    expect(packageJson.scripts['xunjing:xicheng:h5-api:trial']).toBe(
      'node scripts/verify-xicheng-h5-api-trial.mjs'
    )
  })
})

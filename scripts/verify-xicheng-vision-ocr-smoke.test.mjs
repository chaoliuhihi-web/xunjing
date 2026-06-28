import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import {
  buildVisionOcrSmokeEvidence,
  buildVisionOcrSmokeRequest,
  checkVisionOcrProviderSmoke,
  resolveChatCompletionsUrl,
  resolveEvidenceFile,
  validateVisionOcrEnv
} from './verify-xicheng-vision-ocr-smoke.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const env = {
  XUNJING_VISION_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  XUNJING_VISION_API_KEY: 'sk-vision-fixture-key',
  XUNJING_VISION_MODEL: 'qwen-vl-max'
}

const sampleImageUrl = 'https://xunjing-assets.example.com/smoke/xicheng-baitasi-test-card.jpg'

describe('Xicheng vision OCR smoke verifier', () => {
  test('builds an OpenAI-compatible multimodal smoke request without leaking keys', () => {
    const request = buildVisionOcrSmokeRequest({ env, imageUrl: sampleImageUrl })
    const body = JSON.parse(request.options.body)

    expect(request.url).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
    expect(request.options.method).toBe('POST')
    expect(request.options.headers.Authorization).toBe(`Bearer ${env.XUNJING_VISION_API_KEY}`)
    expect(body.model).toBe('qwen-vl-max')
    expect(body.temperature).toBe(0)
    expect(JSON.stringify(body)).toContain(sampleImageUrl)
    expect(JSON.stringify(body)).toContain('xunjing_vision_smoke')
  })

  test('calls the configured provider and records secret-safe smoke metadata', async () => {
    const fetchCalls = []
    const smoke = await checkVisionOcrProviderSmoke({
      env,
      imageUrl: sampleImageUrl,
      checkedAt: '2026-06-28T12:00:00.000Z',
      nowMs: (() => {
        let now = 1000
        return () => {
          now += 42
          return now
        }
      })(),
      fetchImpl: async (url, options) => {
        fetchCalls.push({ url, options })
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            choices: [
              {
                message: {
                  content: '{"labels":["xunjing_vision_smoke","white_pagoda"],"caption":"西城白塔寺测试图已识别"}'
                }
              }
            ]
          })
        }
      }
    })

    expect(fetchCalls).toHaveLength(1)
    expect(smoke).toMatchObject({
      checkedAt: '2026-06-28T12:00:00.000Z',
      baseUrlHost: 'dashscope.aliyuncs.com',
      endpointPath: '/compatible-mode/v1/chat/completions',
      model: 'qwen-vl-max',
      httpStatus: 200,
      sampleImageRef: sampleImageUrl,
      labels: ['xunjing_vision_smoke', 'white_pagoda'],
      responseTextLength: expect.any(Number),
      latencyMs: expect.any(Number)
    })
  })

  test('builds release-gate evidence that proves provider smoke and redacts secrets', () => {
    const evidence = buildVisionOcrSmokeEvidence({
      env,
      providerSmoke: {
        checkedAt: '2026-06-28T12:00:00.000Z',
        baseUrlHost: 'dashscope.aliyuncs.com',
        endpointPath: '/compatible-mode/v1/chat/completions',
        model: 'qwen-vl-max',
        httpStatus: 200,
        sampleImageRef: sampleImageUrl,
        responseTextLength: 64,
        labels: ['xunjing_vision_smoke'],
        captionLength: 12,
        latencyMs: 42
      },
      checkedAt: '2026-06-28T12:00:00.000Z'
    })

    expect(evidence).toMatchObject({
      artifactType: 'xicheng-vision-ocr-smoke',
      ok: true,
      status: 'XICHENG_VISION_OCR_SMOKE_READY',
      summary: {
        model: 'qwen-vl-max',
        providerSmokeHost: 'dashscope.aliyuncs.com',
        providerSmokeEndpointPath: '/compatible-mode/v1/chat/completions',
        providerSmokeHttpStatus: 200,
        sampleImageRef: sampleImageUrl,
        labels: ['xunjing_vision_smoke']
      },
      checks: [
        { name: 'vision-provider-request', ok: true, blockers: [] },
        { name: 'vision-provider-smoke', ok: true, blockers: [] },
        { name: 'secret-redaction', ok: true, blockers: [] }
      ],
      blockers: []
    })
    expect(JSON.stringify(evidence)).not.toContain(env.XUNJING_VISION_API_KEY)
  })

  test('rejects provider smoke without the xunjing vision marker label', () => {
    expect(() => buildVisionOcrSmokeEvidence({
      env,
      providerSmoke: {
        checkedAt: '2026-06-28T12:00:00.000Z',
        baseUrlHost: 'dashscope.aliyuncs.com',
        endpointPath: '/compatible-mode/v1/chat/completions',
        model: 'qwen-vl-max',
        httpStatus: 200,
        sampleImageRef: sampleImageUrl,
        responseTextLength: 64,
        labels: ['white_pagoda'],
        captionLength: 12,
        latencyMs: 42
      },
      checkedAt: '2026-06-28T12:00:00.000Z'
    })).toThrow('Vision OCR provider smoke must include xunjing_vision_smoke label')
  })

  test('rejects placeholder env and local or embedded smoke images', () => {
    expect(() => validateVisionOcrEnv({ ...env, XUNJING_VISION_API_KEY: 'replace-with-real-key' })).toThrow(
      'XUNJING_VISION_API_KEY must be configured with a real value'
    )
    expect(() => buildVisionOcrSmokeRequest({ env, imageUrl: 'http://127.0.0.1/test.jpg' })).toThrow(
      'vision OCR smoke image must be a non-local HTTPS URL'
    )
    expect(() => buildVisionOcrSmokeRequest({ env, imageUrl: 'data:image/png;base64,abc' })).toThrow(
      'vision OCR smoke image must be a non-local HTTPS URL'
    )
  })

  test('keeps evidence under qa tmp or workbench and exposes npm script/docs', async () => {
    expect(resolveChatCompletionsUrl('https://vision.example.com/v1/chat/completions')).toBe(
      'https://vision.example.com/v1/chat/completions'
    )
    expect(resolveEvidenceFile(rootDir, 'qa/xicheng-vision-ocr-smoke-evidence.json')).toBe(
      resolve(rootDir, 'qa/xicheng-vision-ocr-smoke-evidence.json')
    )
    expect(() => resolveEvidenceFile(rootDir, 'ops/vision-evidence.json')).toThrow(
      'evidence file must be under qa/, tmp/ or workbench/'
    )

    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(resolve(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:vision:smoke']).toBe(
      'node scripts/verify-xicheng-vision-ocr-smoke.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:vision:smoke')
    expect(statusDoc).toContain('npm run xunjing:vision:smoke')
  })
})

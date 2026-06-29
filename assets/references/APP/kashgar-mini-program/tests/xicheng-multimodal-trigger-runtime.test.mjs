import assert from 'node:assert/strict'
import fs from 'node:fs'

const moduleSource = fs.readFileSync(new URL('../request/xunjingMultimodal.js', import.meta.url), 'utf8')
  .replace(
    "import config from './config.js'",
    "const config = { UrlYudaoAppRequest: 'https://kashi.weiapp.net/', UrlRequest: 'https://kashi.weiapp.net/', XunjingTenantId: '1' }"
  )
const triggerModule = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`)

const {
  MAX_VISION_IMAGE_BASE64_CHARS,
  buildPhotoMetaForTrigger,
  buildYudaoAppApiUrl,
  getXunjingUserTraceId,
  getYudaoCommonResultPayload,
  inferImageLabelsFromLocalHints,
  normalizeLocationForTrigger,
  readLocalImageBase64ForTrigger,
  requestCurrentLocationForTrigger,
  requestImageInfoForTrigger,
  resolveXunjingMultimodalTrigger,
  resolveXunjingPhotoTrigger,
  toImageMimeType
} = triggerModule

const requestCalls = []

function installUniMock({
  storage = {},
  location = null,
  locationFails = false,
  imageInfo = null,
  imageInfoFails = false,
  fileData = '',
  readFileFails = false,
  requestHandler = null
} = {}) {
  requestCalls.length = 0
  globalThis.uni = {
    getStorageSync: (key) => storage[key] || '',
    getLocation: (options) => {
      if (locationFails) {
        options.fail?.({ errMsg: 'getLocation:fail' })
        return
      }
      options.success?.(location || {
        latitude: '39.9231',
        longitude: '116.35726',
        accuracy: 17.6
      })
    },
    getImageInfo: (options) => {
      if (imageInfoFails) {
        options.fail?.({ errMsg: 'getImageInfo:fail' })
        return
      }
      options.success?.(imageInfo || {
        width: '1440',
        height: '1080',
        type: 'jpeg'
      })
    },
    getFileSystemManager: () => ({
      readFile: (options) => {
        if (readFileFails) {
          options.fail?.({ errMsg: 'readFile:fail' })
          return
        }
        options.success?.({ data: fileData || 'base64-photo' })
      }
    }),
    request: (options) => {
      requestCalls.push(options)
      if (requestHandler) {
        requestHandler(options)
        return
      }
      options.success?.({
        statusCode: 200,
        data: {
          code: 0,
          data: {
            intent: 'guide',
            poiCode: 'xicheng-baitasi'
          }
        }
      })
    }
  }
}

installUniMock({ storage: { openid: 'openid-001' } })
assert.equal(
  buildYudaoAppApiUrl('/app-api/xunjing/triggers/resolve'),
  'https://kashi.weiapp.net/app-api/xunjing/triggers/resolve'
)
assert.equal(getXunjingUserTraceId(), 'openid_openid-001')

installUniMock({ storage: { userId: 'user-9' } })
assert.equal(getXunjingUserTraceId(), 'user_user-9')

installUniMock()
assert.equal(getXunjingUserTraceId(), 'guest')
assert.deepEqual(getYudaoCommonResultPayload({ data: { code: 0, data: { ok: true } } }), { ok: true })
assert.throws(
  () => getYudaoCommonResultPayload({ data: { code: 500, msg: 'bad request' } }),
  /bad request/
)
assert.throws(
  () => getYudaoCommonResultPayload({ data: { code: 401, msg: '账号未登录' } }),
  (error) => {
    assert.equal(error.yudaoCommonResultCode, 401)
    assert.equal(error.yudaoCommonResultMessage, '账号未登录')
    return true
  },
  'Yudao CommonResult business errors should keep their code so development fixture fallback cannot mask auth or backend guard failures'
)

assert.deepEqual(
  normalizeLocationForTrigger({
    latitude: '39.923100',
    longitude: '116.357260',
    accuracy: 18.4,
    type: 'gcj02'
  }),
  {
    latitude: 39.9231,
    longitude: 116.35726,
    coordType: 'gcj02',
    accuracyMeters: 18
  }
)
assert.equal(normalizeLocationForTrigger(null), null)

installUniMock()
assert.deepEqual(await requestCurrentLocationForTrigger(), {
  latitude: 39.9231,
  longitude: 116.35726,
  coordType: 'gcj02',
  accuracyMeters: 18
})

installUniMock({ locationFails: true })
assert.equal(await requestCurrentLocationForTrigger(), null)

assert.equal(toImageMimeType('/tmp/photo.png'), 'image/png')
assert.equal(toImageMimeType('/tmp/photo.webp'), 'image/webp')
assert.equal(toImageMimeType('/tmp/photo.heic'), 'image/heic')
assert.equal(toImageMimeType('/tmp/photo.unknown', { mimeType: 'image/gif' }), 'image/gif')
assert.equal(toImageMimeType('/tmp/photo.unknown'), 'image/jpeg')

installUniMock({ imageInfo: { width: '800', height: '600', type: 'image/png' } })
assert.deepEqual(await requestImageInfoForTrigger('/tmp/photo.png'), {
  width: 800,
  height: 600,
  type: 'image/png'
})

installUniMock({ imageInfoFails: true })
assert.equal(await requestImageInfoForTrigger('/tmp/photo.png'), null)

installUniMock({ fileData: 'small-photo-base64' })
assert.equal(await readLocalImageBase64ForTrigger('/tmp/photo.jpg'), 'small-photo-base64')

installUniMock({ fileData: 'x'.repeat(MAX_VISION_IMAGE_BASE64_CHARS + 1) })
assert.equal(await readLocalImageBase64ForTrigger('/tmp/too-large.jpg'), null)

installUniMock({ readFileFails: true })
assert.equal(await readLocalImageBase64ForTrigger('/tmp/photo.jpg'), null)

assert.deepEqual(
  inferImageLabelsFromLocalHints({
    filePath: '/photos/baitasi.jpg',
    text: '白塔寺',
    ocrText: '妙应寺白塔入口'
  }),
  ['white_pagoda', 'temple']
)
assert.ok(inferImageLabelsFromLocalHints({ ocrText: '北海公园琼华岛' }).includes('imperial_garden'))
assert.ok(inferImageLabelsFromLocalHints({ text: '历代帝王庙' }).includes('imperial_temple'))
assert.ok(inferImageLabelsFromLocalHints({ text: '什刹海胡同' }).includes('hutong'))
assert.ok(inferImageLabelsFromLocalHints({ text: '大栅栏前门' }).includes('shop_sign'))

const photoMeta = buildPhotoMetaForTrigger({
  filePath: '/tmp/xicheng-baitasi.png',
  location: { latitude: 39.9231, longitude: 116.35726, accuracy: 18 },
  imageInfo: { width: 1024, height: 768, type: 'image/png' },
  imageBase64: 'photo-b64'
})
assert.equal(photoMeta.imageId, 'xicheng-baitasi.png')
assert.equal(photoMeta.imageMimeType, 'image/png')
assert.equal(photoMeta.imageWidth, 1024)
assert.equal(photoMeta.imageHeight, 768)
assert.equal(photoMeta.imageBase64, 'photo-b64')
assert.deepEqual(photoMeta.exifLocation, {
  latitude: 39.9231,
  longitude: 116.35726,
  coordType: 'gcj02',
  accuracyMeters: 18
})

installUniMock({ storage: { openId: 'open-id-002' } })
const triggerResp = await resolveXunjingMultimodalTrigger({
  text: '讲解白塔寺',
  ocrText: '妙应寺白塔',
  location: { latitude: '39.9231', longitude: '116.35726', accuracy: 17.8 },
  photoMeta,
  imageLabels: ['white_pagoda'],
  recentPoiCodes: ['xicheng-baitasi']
})
assert.equal(triggerResp.poiCode, 'xicheng-baitasi')
assert.equal(requestCalls.length, 1)
assert.equal(requestCalls[0].method, 'POST')
assert.equal(requestCalls[0].header['tenant-id'], '1')
assert.equal(requestCalls[0].data.regionCode, 'beijing-xicheng')
assert.equal(requestCalls[0].data.packageCode, 'XICHENG-MAP-001')
assert.equal(requestCalls[0].data.sceneCode, 'xicheng-multimodal-trigger')
assert.equal(requestCalls[0].data.userTraceId, 'openid_open-id-002')
assert.equal(requestCalls[0].data.location.accuracyMeters, 18)
assert.deepEqual(requestCalls[0].data.imageLabels, ['white_pagoda'])

installUniMock({
  requestHandler: (options) => options.success?.({ statusCode: 502, data: { msg: 'bad gateway' } })
})
await assert.rejects(
  () => resolveXunjingMultimodalTrigger({ text: '白塔寺' }),
  (error) => {
    assert.match(error.message, /多模态触发接口异常:502/)
    assert.equal(error.yudaoHttpStatusCode, 502)
    return true
  }
)

installUniMock({
  requestHandler: (options) => options.success?.({ statusCode: 200, data: { code: 400, msg: 'bad payload' } })
})
await assert.rejects(
  () => resolveXunjingMultimodalTrigger({ text: '白塔寺' }),
  /bad payload/
)

installUniMock({
  storage: { openid: 'photo-user' },
  location: { latitude: 39.91893, longitude: 116.36587, accuracy: 26.2 },
  imageInfo: { width: 1280, height: 720, type: 'image/jpeg' },
  fileData: 'photo-base64'
})
await resolveXunjingPhotoTrigger({
  filePath: '/tmp/imperial-temple.jpg',
  text: '历代帝王庙',
  ocrText: '帝王庙'
})
const photoRequest = requestCalls.at(-1)
assert.equal(photoRequest.data.location.accuracyMeters, 26)
assert.equal(photoRequest.data.photoMeta.imageMimeType, 'image/jpeg')
assert.equal(photoRequest.data.photoMeta.imageWidth, 1280)
assert.equal(photoRequest.data.photoMeta.imageHeight, 720)
assert.equal(photoRequest.data.photoMeta.imageBase64, 'photo-base64')
assert.ok(photoRequest.data.imageLabels.includes('imperial_temple'))

delete globalThis.uni

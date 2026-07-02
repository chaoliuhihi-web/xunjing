import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const root = process.cwd()
const port = Number(process.env.XUNJING_APP_E2E_PORT || 5176)
const baseUrl = `http://127.0.0.1:${port}`
const pageUrl = `${baseUrl}/#/pages/xicheng/inspiration/inspiration?target=map`
const linkOnlyInput = 'https://www.xiaohongshu.com/explore/xicheng-copy-homework-link-only'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const isServerReady = async () => {
	try {
		const response = await fetch(baseUrl)
		return response.ok
	} catch {
		return false
	}
}

const waitForServer = async (timeoutMs = 60000) => {
	const startedAt = Date.now()
	while (Date.now() - startedAt < timeoutMs) {
		if (await isServerReady()) return true
		await sleep(500)
	}
	return false
}

let devServer = null
if (!(await waitForServer(800))) {
	devServer = spawn('npm', ['run', 'dev:h5', '--', '--port', String(port)], {
		cwd: root,
		env: {
			...process.env,
			VITE_XUNJING_YUDAO_APP_BASE_URL: '/',
			VITE_XUNJING_H5_PROXY_TARGET: 'http://127.0.0.1:48082',
			UNI_INPUT_DIR: '.',
			UNI_OUTPUT_DIR: 'dist/dev/h5'
		},
		stdio: ['ignore', 'pipe', 'pipe']
	})
	const ready = await waitForServer()
	assert.equal(ready, true, 'H5 dev server should start for copy-homework link import user flow')
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
	viewport: {
		width: 390,
		height: 844
	}
})

const importRequests = []
await page.route('**/app-api/xunjing/inspirations/import-link', async (route) => {
	const request = route.request()
	const payload = request.postDataJSON()
	importRequests.push({
		url: request.url(),
		headers: request.headers(),
		payload
	})
	await route.fulfill({
		status: 200,
		contentType: 'application/json',
		body: JSON.stringify({
			code: 0,
			data: {
				sourceUrl: linkOnlyInput,
				sourceTitle: '小红书西城半日路线',
				sourcePlatform: 'xiaohongshu',
				sourcePlatforms: [{
					sourceKey: 'xiaohongshu',
					title: '小红书',
					sourceType: 'social-note',
					sourcePolicy: '不保存第三方平台原文；不抓取未授权内容'
				}],
				extractedText: '这篇攻略建议上午去白塔寺看建筑，中段到历代帝王庙了解礼制，傍晚去什刹海散步。',
				safetyStatus: 'PASSED',
				sources: [{
					sourceKey: 'user-submitted-link',
					title: '用户提交攻略链接',
					sourceType: 'user-submitted-link',
					reviewStatus: 'APPROVED'
				}]
			}
		})
	})
})

try {
	await page.goto(pageUrl, { waitUntil: 'networkidle' })
	await page.locator('textarea').first().fill(linkOnlyInput)
	await page.getByText('AI提取地点', { exact: true }).click()
	await page.waitForFunction(() => document.body.innerText.includes('3 个'), null, { timeout: 10000 })
	const bodyText = await page.locator('body').innerText()
	assert.equal(importRequests.length, 1, 'Clicking AI提取地点 with a link-only input should call backend link import once')
	assert.equal(importRequests[0].headers['tenant-id'], '1', 'Link import request should carry tenant-id')
	assert.equal(importRequests[0].payload.linkUrl, linkOnlyInput, 'Link import request should send the user supplied URL')
	assert.equal(importRequests[0].payload.regionCode, 'beijing-xicheng', 'Link import request should carry Xicheng region')
	assert.equal(importRequests[0].payload.packageCode, 'XICHENG-MAP-001', 'Link import request should carry Xicheng package')
	for (const expectedText of [
		'3 个',
		'白塔寺',
		'寺庙建筑 · 40分钟',
		'历代帝王庙',
		'礼制文化 · 35分钟',
		'什刹海',
		'水系胡同 · 50分钟',
		'1. 白塔寺',
		'2. 历代帝王庙',
		'3. 什刹海'
	]) {
		assert.ok(bodyText.includes(expectedText), `User flow should render backend-extracted route result: ${expectedText}`)
	}
} finally {
	await browser.close()
	if (devServer) {
		devServer.kill('SIGTERM')
	}
}

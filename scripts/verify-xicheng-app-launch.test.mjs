import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const appRoot = path.resolve('assets/references/APP/kashgar-mini-program')

function readAppFile(...segments) {
  return readFileSync(path.join(appRoot, ...segments), 'utf8')
}

describe('Xicheng mini program launch route', () => {
  test('starts unauthenticated visitors on the Xicheng P0 home', () => {
    const pagesJson = JSON.parse(readAppFile('pages.json'))
    const app = readAppFile('App.vue')

    expect(pagesJson.pages[0]?.path).toBe('pages/xicheng/home/home')

    for (const route of [
      'pages/xicheng/home/home',
      'pages/xicheng/scan-result/scan-result',
      'pages/xicheng/route-detail/route-detail',
      'pages/xicheng/travelogue/travelogue',
      'pages/xicheng/inspiration/inspiration',
      'pages/ai-guide/ai-guide'
    ]) {
      expect(app, `public route ${route}`).toContain(`'${route}'`)
    }
  })
})

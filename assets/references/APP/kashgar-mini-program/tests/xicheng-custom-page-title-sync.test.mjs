import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const pagesJson = JSON.parse(read('pages.json'))

const xichengCustomPages = pagesJson.pages
  .filter(page => page.path.startsWith('pages/xicheng/'))
  .filter(page => page.style?.navigationStyle === 'custom')
  .filter(page => page.style?.navigationBarTitleText)

assert.ok(xichengCustomPages.length > 0, 'Xicheng APP should register custom-navigation pages')

for (const page of xichengCustomPages) {
  const sourcePath = path.join(root, `${page.path}.vue`)
  assert.ok(fs.existsSync(sourcePath), `${page.path} should have a Vue page file`)
  const source = fs.readFileSync(sourcePath, 'utf8')
  const expectedTitle = page.style.navigationBarTitleText
  const expectedToken = `uni.setNavigationBarTitle({ title: '${expectedTitle}' })`

  assert.ok(
    source.includes(expectedToken),
    `${page.path} should actively sync the H5/APP navigation title "${expectedTitle}" from pages.json`
  )

  assert.doesNotMatch(
    source,
    /setNavigationBarTitle\(\{\s*title:\s*['"](?:xinxiake|uni-app|喀什)['"]/,
    `${page.path} should not regress to scaffold or old-city navigation titles`
  )
}

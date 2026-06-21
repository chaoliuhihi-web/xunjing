import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function trackedFiles() {
  return new Set(execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean))
}

function readTrackedPom(relativePath, files) {
  expect(files.has(relativePath)).toBe(true)
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function activeModules(pomText) {
  const withoutComments = pomText.replace(/<!--[\s\S]*?-->/g, '')
  return Array.from(withoutComments.matchAll(/<module>([^<]+)<\/module>/g), (match) => match[1])
}

describe('xunjing Yudao repository contract', () => {
  test('tracks the Yudao Lombok compile semantics used by upstream sources', () => {
    const files = trackedFiles()
    expect(files.has('backend/yudao/lombok.config')).toBe(true)

    const lombokConfig = fs.readFileSync(path.join(root, 'backend/yudao/lombok.config'), 'utf8')
    expect(lombokConfig).toContain('lombok.accessors.chain=true')
  })

  test('tracks every active Maven reactor module required by the backend entrypoint', () => {
    const files = trackedFiles()

    const rootPom = readTrackedPom('backend/yudao/pom.xml', files)
    const rootModules = activeModules(rootPom)
    for (const moduleName of rootModules) {
      expect(files.has(`backend/yudao/${moduleName}/pom.xml`)).toBe(true)
    }

    const frameworkPom = readTrackedPom('backend/yudao/yudao-framework/pom.xml', files)
    const frameworkModules = activeModules(frameworkPom)
    for (const moduleName of frameworkModules) {
      expect(files.has(`backend/yudao/yudao-framework/${moduleName}/pom.xml`)).toBe(true)
    }
  })
})

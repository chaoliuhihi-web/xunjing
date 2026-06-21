import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readText(relativePath) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8')
}

describe('project structure contract', () => {
  test('keeps generated Kashgar APP QA evidence out of repository root', () => {
    const rootFiles = readdirSync(rootDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)

    const misplacedQaFiles = rootFiles.filter((name) => (
      /^kashgar-/.test(name) ||
      /-comparison\.png$/.test(name) ||
      name === 'reference-contact-sheet.png'
    ))

    expect(misplacedQaFiles).toEqual([])
  })

  test('documents the canonical source, APP, backend, QA, and generated-output directories', () => {
    const readme = readText('README.md')

    for (const required of [
      '## 目录地图',
      'src/',
      'assets/references/APP/kashgar-mini-program/',
      'backend/yudao/',
      'qa/app-kashgar/',
      'deliverables/',
      'workbench/',
      'tmp/',
      'archive/'
    ]) {
      expect(readme).toContain(required)
    }
  })

  test('gives future AI agents explicit repository hygiene rules', () => {
    const agents = readText('AGENTS.md')
    const gitignore = readText('.gitignore')

    for (const required of [
      '禁止在仓库根目录写入截图、控制台快照、临时 Markdown、PPT 中间产物或发布包',
      '喀什 APP 视觉验证证据只能放在 `qa/app-kashgar/`',
      '临时构建、发布包、浏览器调试日志只能放在 `tmp/`、`workbench/` 或 `.playwright-mcp/`',
      '不得移动或重置用户未提交改动',
      '禁止把 APP 名称、全局标题、包名或描述恢复成 `xinxiake`、`uni-app` 等脚手架/旧项目默认值',
      '禁止给 APP 增加读取日志、读取账号、读取设备号、写系统设置、修改网络或 Wi-Fi、挂载文件系统等高风险 Android 权限'
    ]) {
      expect(agents).toContain(required)
    }

    for (const required of [
      'qa/app-kashgar/',
      '/kashgar-*',
      '/*-comparison.png',
      '/reference-contact-sheet.png'
    ]) {
      expect(gitignore).toContain(required)
    }
  })
})

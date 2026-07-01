import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

function copyStaticAsHashedAssets(source, target) {
  if (!existsSync(source)) return
  mkdirSync(target, { recursive: true })

  for (const name of readdirSync(source)) {
    const sourcePath = join(source, name)
    const stats = statSync(sourcePath)

    if (stats.isDirectory()) {
      copyStaticAsHashedAssets(sourcePath, target)
      continue
    }

    if (!stats.isFile()) continue

    const ext = extname(name)
    const base = basename(name, ext)
    const hash = createHash('sha256')
      .update(readFileSync(sourcePath))
      .digest('hex')
      .slice(0, 8)
    copyFileSync(sourcePath, join(target, `${base}.${hash}${ext}`))
  }
}

function copyProjectFile(projectRoot, outputRoot, relativePath) {
  const sourcePath = resolve(projectRoot, relativePath)
  if (!existsSync(sourcePath)) return

  const targetPath = resolve(outputRoot, relativePath)
  mkdirSync(dirname(targetPath), { recursive: true })
  copyFileSync(sourcePath, targetPath)
}

function copyDirectory(source, target) {
  if (!existsSync(source)) return
  mkdirSync(target, { recursive: true })

  for (const name of readdirSync(source)) {
    const sourcePath = join(source, name)
    const targetPath = join(target, name)
    const stats = statSync(sourcePath)

    if (stats.isDirectory()) {
      copyDirectory(sourcePath, targetPath)
      continue
    }

    if (stats.isFile()) {
      mkdirSync(dirname(targetPath), { recursive: true })
      copyFileSync(sourcePath, targetPath)
    }
  }
}

function removeStaleMainPackageAssetCopies(outputRoot) {
  const assetsDir = join(outputRoot, 'assets')
  if (!existsSync(assetsDir)) return

  for (const name of readdirSync(assetsDir)) {
    if (/^(map|map-ad)\.[a-f0-9]{8}\.png$/.test(name)) {
      rmSync(join(assetsDir, name), { force: true })
    }
  }
}

function enableRequiredComponentsLazyLoading(outputRoot) {
  const appJsonPath = join(outputRoot, 'app.json')
  if (!existsSync(appJsonPath)) return

  const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'))
  appJson.lazyCodeLoading = 'requiredComponents'
  writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`)
}

function copyMiniProgramStaticAssets() {
  const syncStaticAssets = () => {
    const outputDir = process.env.UNI_OUTPUT_DIR
    if (!outputDir || !outputDir.includes('mp-weixin')) return

    const projectRoot = process.cwd()
    const source = resolve(projectRoot, 'static', 'tabbar')
    const targetRoot = resolve(projectRoot, outputDir)

    rmSync(join(targetRoot, 'static'), { recursive: true, force: true })
    removeStaleMainPackageAssetCopies(targetRoot)
    enableRequiredComponentsLazyLoading(targetRoot)
    copyDirectory(resolve(projectRoot, 'static'), join(targetRoot, 'static'))
    copyStaticAsHashedAssets(source, join(targetRoot, 'assets'))
    copyProjectFile(projectRoot, targetRoot, 'subPackages/feature/img/nav.png')
  }

  return {
    name: 'copy-mini-program-static-assets',
    writeBundle() {
      syncStaticAssets()
    },
    closeBundle() {
      syncStaticAssets()
    }
  }
}

const xunjingBuildYudaoAppBaseUrl = process.env.VITE_XUNJING_YUDAO_APP_BASE_URL || ''
const xunjingBuildTenantId = process.env.VITE_XUNJING_TENANT_ID || ''

export default defineConfig({
  define: {
    __XUNJING_BUILD_YUDAO_APP_BASE_URL__: JSON.stringify(xunjingBuildYudaoAppBaseUrl),
    __XUNJING_BUILD_TENANT_ID__: JSON.stringify(xunjingBuildTenantId)
  },
  plugins: [uni(), copyMiniProgramStaticAssets()],
  server: {
    proxy: {
      '/app-api/xunjing': {
        target: process.env.VITE_XUNJING_H5_PROXY_TARGET || 'https://kashi.weiapp.net',
        changeOrigin: true,
        secure: true
      }
    }
  }
})

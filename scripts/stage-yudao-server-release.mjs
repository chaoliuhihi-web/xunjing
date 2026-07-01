import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-yudao-server-release-stage'
const readyStatus = 'YUDAO_SERVER_RELEASE_STAGED'

function readArgValue(args, name) {
  const equalPrefix = `${name}=`
  const equalArg = args.find((arg) => arg.startsWith(equalPrefix))
  if (equalArg) {
    return equalArg.slice(equalPrefix.length)
  }
  const index = args.indexOf(name)
  if (index >= 0) {
    return args[index + 1]
  }
  return undefined
}

function resolveRootPath(rootDir, filePath) {
  if (!filePath) {
    return undefined
  }
  return path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(rootDir, filePath)
}

async function assertNonEmptyFile(filePath, message) {
  let fileStat
  try {
    fileStat = await stat(filePath)
  } catch {
    throw new Error(message)
  }
  if (!fileStat.isFile() || fileStat.size <= 0) {
    throw new Error(message)
  }
  return fileStat
}

async function assertDirectory(sourceDir, message) {
  try {
    const sourceStat = await stat(sourceDir)
    if (sourceStat.isDirectory()) {
      return
    }
  } catch {
  }
  throw new Error(message)
}

async function copyRequiredDir(sourceDir, targetDir, message) {
  await assertDirectory(sourceDir, message)
  await mkdir(targetDir, { recursive: true })
  await cp(sourceDir, targetDir, { recursive: true })
}

export async function stageYudaoServerRelease({
  rootDir = process.cwd(),
  outputDir,
  releaseId = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14),
  jarPath = 'backend/yudao/yudao-server/target/yudao-server.jar',
  buildEvidenceFile = 'qa/xicheng-yudao-server-build-evidence.json',
  sqlDir = 'backend/yudao/sql/mysql',
  mysqlInitDir = 'ops/mysql-init',
  evidenceFile
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedOutputDir = resolveRootPath(
    resolvedRoot,
    outputDir || path.join('workbench/yudao-server-releases', releaseId)
  )
  const sourceJarFile = resolveRootPath(resolvedRoot, jarPath)
  const sourceBuildEvidenceFile = resolveRootPath(resolvedRoot, buildEvidenceFile)
  const sourceSqlDir = resolveRootPath(resolvedRoot, sqlDir)
  const sourceMysqlInitDir = resolveRootPath(resolvedRoot, mysqlInitDir)
  const stagedJarFile = path.join(resolvedOutputDir, 'app/yudao-server.jar')
  const stagedBuildEvidenceFile = path.join(resolvedOutputDir, 'xicheng-yudao-server-build-evidence.json')
  const stagedSqlDir = path.join(resolvedOutputDir, 'sql/mysql')
  const stagedMysqlInitDir = path.join(resolvedOutputDir, 'ops/mysql-init')

  const jarStat = await assertNonEmptyFile(sourceJarFile, 'Yudao server jar is missing or empty')
  await assertNonEmptyFile(sourceBuildEvidenceFile, 'Yudao server build evidence is missing or empty')

  await rm(resolvedOutputDir, { recursive: true, force: true })
  await mkdir(path.dirname(stagedJarFile), { recursive: true })
  await cp(sourceJarFile, stagedJarFile)
  await cp(sourceBuildEvidenceFile, stagedBuildEvidenceFile)
  await copyRequiredDir(sourceSqlDir, stagedSqlDir, 'backend/yudao/sql/mysql directory is missing')
  await copyRequiredDir(sourceMysqlInitDir, stagedMysqlInitDir, 'ops/mysql-init directory is missing')

  const report = {
    artifactType,
    ok: true,
    status: readyStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      releaseId,
      outputDir: resolvedOutputDir,
      sourceJarFile,
      jarFile: stagedJarFile,
      jarSizeBytes: jarStat.size,
      sourceBuildEvidenceFile,
      buildEvidenceFile: stagedBuildEvidenceFile,
      sourceSqlDir,
      sqlDir: stagedSqlDir,
      sqlCopied: true,
      sourceMysqlInitDir,
      mysqlInitDir: stagedMysqlInitDir,
      mysqlInitCopied: true
    },
    checks: [
      {
        name: 'compose-jar-layout',
        ok: true,
        detail: `Deployable jar staged at ${stagedJarFile}`,
        blockers: []
      },
      {
        name: 'mysql-init-layout',
        ok: true,
        detail: `MySQL init scripts staged at ${stagedMysqlInitDir}`,
        blockers: []
      },
      {
        name: 'sql-layout',
        ok: true,
        detail: `SQL files staged at ${stagedSqlDir}`,
        blockers: []
      }
    ],
    blockers: []
  }

  if (evidenceFile) {
    const resolvedEvidenceFile = resolveRootPath(resolvedRoot, evidenceFile)
    await mkdir(path.dirname(resolvedEvidenceFile), { recursive: true })
    await writeFile(resolvedEvidenceFile, `${JSON.stringify(report, null, 2)}\n`)
    report.summary.evidenceFile = resolvedEvidenceFile
  }

  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await stageYudaoServerRelease({
    outputDir: readArgValue(args, '--output-dir'),
    releaseId: readArgValue(args, '--release-id') || undefined,
    jarPath: readArgValue(args, '--jar'),
    buildEvidenceFile: readArgValue(args, '--yudao-server-build-evidence'),
    evidenceFile: readArgValue(args, '--evidence-file')
  })
  console.log(JSON.stringify(report, null, 2))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}

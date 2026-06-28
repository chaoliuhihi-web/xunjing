import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-yudao-server-build'
const readyStatus = 'YUDAO_SERVER_JAR_BUILT'
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])

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

function readFlag(args, name) {
  return args.includes(name) || args.some((arg) => arg === `${name}=true`)
}

function resolveRootPath(rootDir, filePath) {
  if (!filePath) {
    return undefined
  }
  return path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(rootDir, filePath)
}

function resolveEvidenceFile(rootDir, evidenceFile) {
  const resolvedFile = resolveRootPath(rootDir, evidenceFile)
  if (!resolvedFile) {
    return undefined
  }
  const relativePath = path.relative(rootDir, resolvedFile)
  const [topLevelDir] = relativePath.split(path.sep)
  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath) ||
    !allowedEvidenceDirs.has(topLevelDir)
  ) {
    throw new Error('evidence file must be under qa/, tmp/ or workbench/')
  }
  return resolvedFile
}

async function sha256File(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex')
}

function buildMavenArgs({ includeTests = false } = {}) {
  const args = ['-pl', 'yudao-server', '-am']
  if (!includeTests) {
    args.push('-DskipTests')
  }
  args.push('package')
  return args
}

async function writeEvidenceFile(rootDir, evidenceFile, report) {
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return undefined
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(report, null, 2)}\n`)
  return resolvedFile
}

export async function buildYudaoServer({
  rootDir = process.cwd(),
  mvnCommand = 'mvn',
  jarPath,
  evidenceFile,
  includeTests = false,
  spawnImpl = spawnSync,
  checkedAt = new Date().toISOString()
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const backendDir = path.join(resolvedRoot, 'backend/yudao')
  const jarFile = resolveRootPath(
    resolvedRoot,
    jarPath || 'backend/yudao/yudao-server/target/yudao-server.jar'
  )
  const mavenArgs = buildMavenArgs({ includeTests })
  const result = spawnImpl(mvnCommand, mavenArgs, {
    cwd: backendDir,
    encoding: 'utf8',
    env: process.env
  })
  if (result.error?.code === 'ENOENT') {
    throw new Error(`Maven CLI is required to build Yudao server; install Maven or pass --mvn /path/to/mvn. Tried: ${mvnCommand}`)
  }
  if (result.status !== 0) {
    const message = result.error?.message || result.stderr || result.stdout || 'Maven build failed'
    throw new Error(String(message).trim())
  }

  let jarStats
  try {
    jarStats = await stat(jarFile)
  } catch {
    throw new Error('Yudao server jar is missing or empty after build')
  }
  if (!jarStats.isFile() || jarStats.size <= 0) {
    throw new Error('Yudao server jar is missing or empty after build')
  }

  const report = {
    artifactType,
    ok: true,
    status: readyStatus,
    checkedAt,
    summary: {
      backendDir,
      mavenCommand: mvnCommand,
      mavenArgs,
      testsIncluded: includeTests,
      jarFile,
      jarSizeBytes: jarStats.size,
      jarSha256: await sha256File(jarFile)
    },
    checks: [
      {
        name: 'maven-package',
        ok: true,
        detail: `Maven package completed in ${backendDir}`,
        blockers: []
      },
      {
        name: 'yudao-server-jar',
        ok: true,
        detail: `Deployable Yudao server jar exists at ${jarFile}`,
        blockers: []
      }
    ],
    blockers: []
  }
  const resolvedEvidenceFile = await writeEvidenceFile(resolvedRoot, evidenceFile, report)
  if (resolvedEvidenceFile) {
    report.summary.evidenceFile = resolvedEvidenceFile
  }
  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await buildYudaoServer({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    mvnCommand: readArgValue(args, '--mvn') || process.env.MVN || 'mvn',
    jarPath: readArgValue(args, '--jar-file') || readArgValue(args, '--yudao-server-jar'),
    evidenceFile: readArgValue(args, '--evidence-file'),
    includeTests: readFlag(args, '--include-tests')
  })
  console.log(JSON.stringify(report, null, 2))
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}

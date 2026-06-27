import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-production-manifest-template'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])
const defaultPoiSlotCount = 80

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

function normalizeSlotCount(value) {
  const parsed = Number(value || defaultPoiSlotCount)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('--count must be a positive integer')
  }
  return parsed
}

function resolveOutputFile(rootDir, outputFile) {
  if (!outputFile) {
    throw new Error('--output is required')
  }
  const resolvedRoot = path.resolve(rootDir)
  const resolvedFile = path.isAbsolute(outputFile)
    ? path.resolve(outputFile)
    : path.resolve(resolvedRoot, outputFile)
  const relativePath = path.relative(resolvedRoot, resolvedFile)
  const [topLevelDir] = relativePath.split(path.sep)
  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath) ||
    !allowedOutputDirs.has(topLevelDir)
  ) {
    throw new Error('output file must be under qa/, tmp/ or workbench/')
  }
  return resolvedFile
}

function slotId(index) {
  return String(index + 1).padStart(3, '0')
}

function createPoiTemplate(index) {
  const id = slotId(index)
  return {
    poiCode: `TODO-xicheng-poi-${id}`,
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    name: '',
    displayName: '',
    aliases: [],
    category: '',
    priority: 'P0',
    address: '',
    latitude: null,
    longitude: null,
    coordType: 'GCJ02',
    source: {
      sourceTitle: '',
      sourceUrl: '',
      sourceType: 'OFFICIAL',
      licenseStatus: 'REVIEW_REQUIRED',
      licenseEvidenceRef: '',
      licenseReviewedBy: '',
      licenseReviewedAt: ''
    },
    trigger: {
      gpsRadiusMeters: 180,
      ocrKeywords: [],
      photoLabels: [],
      minConfidence: 0.85
    },
    fieldEvidence: {
      photoEvidenceStatus: 'REVIEW_REQUIRED',
      triggerSmokeStatus: 'NOT_RUN',
      evidenceRefs: [],
      verifiedBy: '',
      verifiedAt: ''
    },
    content: {
      shortIntro: '',
      recommendedQuestions: []
    },
    audit: {
      reviewStatus: 'REVIEW_REQUIRED',
      geoStatus: 'REVIEW_REQUIRED',
      licenseStatus: 'REVIEW_REQUIRED',
      status: 'DRAFT',
      reviewedBy: '',
      reviewedAt: ''
    }
  }
}

export function createXichengPoiProductionManifestTemplate({ count = defaultPoiSlotCount } = {}) {
  const poiSlotCount = normalizeSlotCount(count)
  return {
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    targetP0PoiCount: poiSlotCount,
    productionReady: false,
    reviewBatch: {
      batchCode: '',
      dataOwner: '',
      sourceCompiledBy: '',
      sourceCompiledAt: '',
      reviewedBy: '',
      reviewedAt: '',
      evidencePackageRef: ''
    },
    templateNotice: 'Fill with reviewed real POI data; this template must not be used as production evidence.',
    pois: Array.from({ length: poiSlotCount }, (_, index) => createPoiTemplate(index))
  }
}

export async function writeXichengPoiProductionManifestTemplate({
  rootDir = process.cwd(),
  outputFile,
  count = defaultPoiSlotCount
} = {}) {
  const resolvedOutputFile = resolveOutputFile(rootDir, outputFile)
  const manifest = createXichengPoiProductionManifestTemplate({ count })
  await mkdir(path.dirname(resolvedOutputFile), { recursive: true })
  await writeFile(resolvedOutputFile, `${JSON.stringify(manifest, null, 2)}\n`)
  return {
    artifactType,
    ok: true,
    status: 'TEMPLATE_GENERATED',
    checkedAt: new Date().toISOString(),
    summary: {
      outputFile: resolvedOutputFile,
      poiSlots: manifest.pois.length,
      productionReady: manifest.productionReady,
      warning: 'Template contains TODO placeholders and must fail production manifest gate until reviewed real data is filled.'
    }
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await writeXichengPoiProductionManifestTemplate({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    outputFile: readArgValue(args, '--output'),
    count: readArgValue(args, '--count') || defaultPoiSlotCount
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

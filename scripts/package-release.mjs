import { execFile as execFileCallback } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const appName = 'xinghexunjing-web';

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function walkFiles(dir) {
  const entries = [];

  for (const name of fs.readdirSync(dir).sort()) {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...walkFiles(fullPath));
    } else if (stat.isFile()) {
      entries.push(fullPath);
    }
  }

  return entries;
}

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

export function collectReleaseEntries({ rootDir = process.cwd(), distDir = path.join(rootDir, 'dist') } = {}) {
  assertFile(path.join(distDir, 'index.html'), 'dist index');
  assertFile(path.join(distDir, 'runtime-config.js'), 'runtime config');
  assertFile(path.join(distDir, 'healthz.json'), 'health check');
  assertFile(path.join(distDir, 'sitemap.xml'), 'sitemap');

  const entries = walkFiles(distDir).map((sourcePath) => ({
    sourcePath,
    archivePath: path.posix.join('site', path.relative(distDir, sourcePath).split(path.sep).join('/'))
  }));

  const nginxConfig = path.join(rootDir, 'ops', 'nginx.conf');
  const operationDoc = path.join(rootDir, 'docs', '02_开发规划', '官网运营配置说明.md');
  assertFile(nginxConfig, 'nginx config');
  assertFile(operationDoc, 'operation guide');

  entries.push(
    { sourcePath: nginxConfig, archivePath: 'ops/nginx.conf' },
    { sourcePath: operationDoc, archivePath: 'docs/官网运营配置说明.md' }
  );

  return entries;
}

export function buildReleaseManifest({ commit, generatedAt, entries }) {
  return {
    app: appName,
    commit,
    generatedAt,
    files: entries.map((entry) => {
      const stat = fs.statSync(entry.sourcePath);
      return {
        path: entry.archivePath,
        bytes: stat.size,
        sha256: sha256(entry.sourcePath)
      };
    })
  };
}

function copyEntryToStage(entry, stageDir) {
  const target = path.join(stageDir, entry.archivePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(entry.sourcePath, target);
}

function timestampForFilename(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
}

async function currentCommit(rootDir) {
  const { stdout } = await execFile('git', ['rev-parse', '--short', 'HEAD'], { cwd: rootDir });
  return stdout.trim();
}

export async function createReleaseArchive({
  rootDir = process.cwd(),
  distDir = path.join(rootDir, 'dist'),
  outDir = path.join(rootDir, 'tmp', 'releases'),
  commit,
  timestamp
} = {}) {
  const resolvedCommit = commit || await currentCommit(rootDir);
  const resolvedTimestamp = timestamp || timestampForFilename();
  const entries = collectReleaseEntries({ rootDir, distDir });
  const generatedAt = new Date().toISOString();
  const manifest = buildReleaseManifest({
    commit: resolvedCommit,
    generatedAt,
    entries
  });

  const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), `${appName}-`));
  fs.mkdirSync(outDir, { recursive: true });

  try {
    for (const entry of entries) {
      copyEntryToStage(entry, stageDir);
    }

    const manifestInArchive = path.join(stageDir, 'release-manifest.json');
    fs.writeFileSync(manifestInArchive, `${JSON.stringify(manifest, null, 2)}\n`);

    const baseName = `${appName}-${resolvedTimestamp}-${resolvedCommit}`;
    const archivePath = path.join(outDir, `${baseName}.tar.gz`);
    const manifestPath = path.join(outDir, `${baseName}.manifest.json`);

    await execFile('tar', ['-czf', archivePath, '-C', stageDir, '.']);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    return {
      archivePath,
      manifestPath,
      manifest
    };
  } finally {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
}

async function runCli() {
  const result = await createReleaseArchive();
  console.log(JSON.stringify({
    archivePath: result.archivePath,
    manifestPath: result.manifestPath,
    files: result.manifest.files.length
  }, null, 2));
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

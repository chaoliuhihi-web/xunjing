import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const defaultBasePath = '/xinghexunjing/';
const defaultDeployUrl = 'https://xinghetech.gitee.io/xinghexunjing/';

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function normalizeBasePath(value) {
  const configuredPath = value?.trim() || defaultBasePath;
  const withLeadingSlash = configuredPath.startsWith('/') ? configuredPath : `/${configuredPath}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function validateLeadWebhookUrl(leadWebhookUrl) {
  if (leadWebhookUrl && !leadWebhookUrl.startsWith('https://')) {
    throw new Error('leadWebhookUrl must be empty or start with https://');
  }
}

function escapeJsString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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

function copyDirectory(sourceDir, targetDir) {
  for (const sourcePath of walkFiles(sourceDir)) {
    const relativePath = path.relative(sourceDir, sourcePath);
    const targetPath = path.join(targetDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

async function currentCommit(rootDir) {
  const { stdout } = await execFile('git', ['rev-parse', '--short', 'HEAD'], { cwd: rootDir });
  return stdout.trim();
}

export function prepareGiteePagesArtifact({
  distDir,
  outDir,
  basePath = defaultBasePath,
  deployUrl = defaultDeployUrl,
  commit,
  leadWebhookUrl = ''
}) {
  const normalizedBasePath = normalizeBasePath(basePath);
  validateLeadWebhookUrl(leadWebhookUrl);
  assertFile(path.join(distDir, 'index.html'), 'dist index');
  assertFile(path.join(distDir, 'runtime-config.js'), 'runtime config');
  assertFile(path.join(distDir, 'healthz.json'), 'health check');

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  copyDirectory(distDir, outDir);

  const indexHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(outDir, '404.html'), indexHtml);
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(outDir, '.spa'), '');
  fs.writeFileSync(
    path.join(outDir, 'runtime-config.js'),
    [
      'window.XINGHE_SITE_CONFIG = {',
      `  leadWebhookUrl: "${escapeJsString(leadWebhookUrl)}"`,
      '};',
      ''
    ].join('\n')
  );
  fs.writeFileSync(
    path.join(outDir, 'README.md'),
    [
      '# Xinghe Xunjing Gitee Pages Artifact',
      '',
      `commit: ${commit}`,
      `basePath: ${normalizedBasePath}`,
      `deployUrl: ${deployUrl}`,
      '',
      'This directory is generated for static subpath hosting. Publish its contents to the configured Gitee Pages source branch/root.',
      ''
    ].join('\n')
  );

  return {
    outDir,
    basePath: normalizedBasePath,
    deployUrl,
    commit,
    files: walkFiles(outDir).length
  };
}

async function buildGiteePagesDist({ rootDir, distDir, basePath }) {
  await execFile(process.execPath, [
    path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js'),
    'build',
    '--outDir',
    distDir,
    '--emptyOutDir'
  ], {
    cwd: rootDir,
    env: {
      ...process.env,
      VITE_BASE_PATH: basePath
    },
    maxBuffer: 1024 * 1024 * 20
  });
}

async function runCli() {
  const rootDir = process.cwd();
  const basePath = normalizeBasePath(process.env.VITE_BASE_PATH || defaultBasePath);
  const leadWebhookUrl = process.env.XINGHE_LEAD_WEBHOOK_URL || '';
  const distDir = path.join(rootDir, 'tmp', 'gitee-pages-dist');
  const outDir = path.join(rootDir, 'tmp', 'gitee-pages');
  const commit = await currentCommit(rootDir);

  await buildGiteePagesDist({ rootDir, distDir, basePath });
  const result = prepareGiteePagesArtifact({
    distDir,
    outDir,
    basePath,
    commit,
    leadWebhookUrl
  });

  console.log(JSON.stringify(result, null, 2));
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

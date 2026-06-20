import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const defaultBranch = 'gh-pages';

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function validateBranch(branch) {
  if (!branch || !/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith('-') || branch.includes('..')) {
    throw new Error(`Invalid deploy branch: ${branch}`);
  }
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

async function git(args, options = {}) {
  const result = await execFile('git', args, {
    maxBuffer: 1024 * 1024 * 20,
    ...options
  });
  return result.stdout.trim();
}

async function defaultRemoteUrl(cwd = process.cwd()) {
  return await git(['remote', 'get-url', 'origin'], { cwd });
}

export async function publishGiteePagesArtifact({
  artifactDir = path.join(process.cwd(), 'tmp', 'gitee-pages'),
  remoteUrl,
  branch = defaultBranch,
  commitMessage,
  cwd = process.cwd()
} = {}) {
  validateBranch(branch);
  assertFile(path.join(artifactDir, 'index.html'), 'artifact index');

  const resolvedRemoteUrl = remoteUrl || await defaultRemoteUrl(cwd);
  const files = walkFiles(artifactDir);
  const publishDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xinghe-pages-publish-'));
  const resolvedCommitMessage = commitMessage || `deploy gitee pages artifact ${new Date().toISOString()}`;

  try {
    copyDirectory(artifactDir, publishDir);
    await git(['init'], { cwd: publishDir });
    await git(['checkout', '-B', branch], { cwd: publishDir });
    await git(['config', 'user.name', 'Xinghe Deploy Bot'], { cwd: publishDir });
    await git(['config', 'user.email', 'deploy-bot@xinghe.local'], { cwd: publishDir });
    await git(['add', '-A'], { cwd: publishDir });
    await git(['commit', '-m', resolvedCommitMessage], { cwd: publishDir });
    await git(['remote', 'add', 'origin', resolvedRemoteUrl], { cwd: publishDir });
    await git(['push', '--force', 'origin', `HEAD:refs/heads/${branch}`], { cwd: publishDir });

    return {
      branch,
      remoteUrl: resolvedRemoteUrl,
      files: files.length,
      commit: await git(['rev-parse', '--short', 'HEAD'], { cwd: publishDir })
    };
  } finally {
    fs.rmSync(publishDir, { recursive: true, force: true });
  }
}

async function runCli() {
  const result = await publishGiteePagesArtifact({
    artifactDir: process.env.GITEE_PAGES_ARTIFACT_DIR || path.join(process.cwd(), 'tmp', 'gitee-pages'),
    branch: process.env.GITEE_PAGES_BRANCH || defaultBranch,
    remoteUrl: process.env.GITEE_PAGES_REMOTE_URL || undefined,
    commitMessage: process.env.GITEE_PAGES_COMMIT_MESSAGE || undefined
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

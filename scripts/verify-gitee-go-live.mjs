import { execFile as execFileCallback } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { verifyGiteePagesPublication } from './verify-gitee-pages-publication.mjs';

const execFile = promisify(execFileCallback);
const defaultBranch = 'gh-pages';
const defaultRepoUrl = 'https://gitee.com/xinghetech/xinghexunjing';
const defaultPageUrl = 'https://xinghetech.gitee.io/xinghexunjing/';
const defaultMasterBranch = 'master';

function pass(name, detail) {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

async function git(args, options = {}) {
  const result = await execFile('git', args, {
    maxBuffer: 1024 * 1024 * 10,
    ...options
  });
  return result.stdout.trim();
}

function parseLsRemoteHead(output) {
  const [head] = String(output || '').trim().split(/\s+/);
  return head || '';
}

export async function verifyGiteeGoLive({
  branch = defaultBranch,
  masterBranch = defaultMasterBranch,
  remote = 'origin',
  repoUrl = defaultRepoUrl,
  pageUrl = defaultPageUrl,
  cwd = process.cwd(),
  gitImpl = git,
  pagesVerifier = verifyGiteePagesPublication
} = {}) {
  const actionItems = [];
  const localHead = await gitImpl(['rev-parse', '--short', 'HEAD'], { cwd });
  const remoteMaster = parseLsRemoteHead(await gitImpl(['ls-remote', remote, `refs/heads/${masterBranch}`], { cwd }));
  const remoteMasterShort = remoteMaster.slice(0, localHead.length);
  const checks = [];

  if (!remoteMaster) {
    checks.push(fail('master-sync', `${remote}/${masterBranch} does not exist`));
    actionItems.push(`Push local ${masterBranch} to ${remote}/${masterBranch} before go-live verification.`);
  } else if (remoteMaster.startsWith(localHead)) {
    checks.push(pass('master-sync', `local HEAD ${localHead} is pushed to ${remote}/${masterBranch}`));
  } else {
    checks.push(fail('master-sync', `local HEAD ${localHead} does not match ${remote}/${masterBranch} ${remoteMasterShort}`));
    actionItems.push(`Push local ${masterBranch} to ${remote}/${masterBranch}, or checkout the deployed commit before go-live verification.`);
  }

  const pages = await pagesVerifier({
    branch,
    currentHead: localHead,
    expectedArtifactCommit: localHead,
    remote,
    repoUrl,
    pageUrl,
    cwd,
    gitImpl
  });

  checks.push(...pages.checks);
  actionItems.push(...(pages.actionItems || []));

  return {
    ok: checks.every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    remote,
    masterBranch,
    branch,
    localHead,
    remoteMaster,
    repoUrl,
    pageUrl,
    checks,
    actionItems: [...new Set(actionItems)]
  };
}

async function runCli() {
  const result = await verifyGiteeGoLive({
    branch: process.env.GITEE_PAGES_BRANCH || defaultBranch,
    masterBranch: process.env.GITEE_MASTER_BRANCH || defaultMasterBranch,
    remote: process.env.GITEE_REMOTE || 'origin',
    repoUrl: process.env.GITEE_REPO_URL || defaultRepoUrl,
    pageUrl: process.env.GITEE_PAGES_URL || defaultPageUrl,
    cwd: process.cwd()
  });

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

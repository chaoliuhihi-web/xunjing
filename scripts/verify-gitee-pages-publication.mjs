import { execFile as execFileCallback } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

const defaultBranch = 'gh-pages';
const defaultRepoUrl = 'https://gitee.com/xinghetech/xinghexunjing';
const defaultPageUrl = 'https://xinghetech.gitee.io/xinghexunjing/';

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

async function resolveBranchHead({ branch, branchHead, remote, cwd, gitImpl }) {
  if (branchHead !== undefined) {
    return branchHead;
  }

  const output = await gitImpl(['ls-remote', remote, `refs/heads/${branch}`], { cwd });
  const [head] = output.split(/\s+/);
  return head || '';
}

async function fetchPage(url, fetchImpl) {
  const response = await fetchImpl(url, {
    method: 'GET',
    redirect: 'follow'
  });
  const body = await response.text();

  return {
    status: response.status,
    ok: response.ok,
    body
  };
}

export async function verifyGiteePagesPublication({
  branch = defaultBranch,
  branchHead,
  remote = 'origin',
  repoUrl = defaultRepoUrl,
  pageUrl = defaultPageUrl,
  cwd = process.cwd(),
  fetchImpl = fetch,
  gitImpl = git
} = {}) {
  const checks = [];
  const actionItems = [];
  const resolvedBranchHead = await resolveBranchHead({
    branch,
    branchHead,
    remote,
    cwd,
    gitImpl
  });

  if (resolvedBranchHead) {
    checks.push(pass('deploy-branch', `${branch} exists at ${resolvedBranchHead.slice(0, 7)}`));
  } else {
    checks.push(fail('deploy-branch', `${branch} does not exist on ${remote}`));
    actionItems.push(`Publish the generated Gitee Pages artifact to the ${branch} branch.`);
  }

  const repo = await fetchPage(repoUrl, fetchImpl);
  if (repo.ok) {
    checks.push(pass('public-repository', `${repoUrl} returned HTTP ${repo.status}`));
  } else {
    checks.push(fail('public-repository', `${repoUrl} returned HTTP ${repo.status}`));
    if ([401, 403, 404].includes(repo.status)) {
      actionItems.push(
        'Make the Gitee repository publicly accessible, or use a Gitee Pages plan that supports private repositories.'
      );
    }
  }

  const page = await fetchPage(pageUrl, fetchImpl);
  if (page.ok && page.body.includes('星河寻境')) {
    checks.push(pass('gitee-pages-url', `${pageUrl} returned HTTP ${page.status} with brand content`));
  } else if (page.ok) {
    checks.push(fail('gitee-pages-url', `${pageUrl} returned HTTP ${page.status} but did not contain 星河寻境`));
    actionItems.push('Verify the Gitee Pages source branch, directory, and Vite base path.');
  } else {
    checks.push(fail('gitee-pages-url', `${pageUrl} returned HTTP ${page.status}`));
    actionItems.push(
      `Enable or update Gitee Pages in the Gitee project console and set the source branch to ${branch}.`
    );
  }

  return {
    ok: checks.every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    branch,
    branchHead: resolvedBranchHead,
    repoUrl,
    pageUrl,
    checks,
    actionItems: [...new Set(actionItems)]
  };
}

async function runCli() {
  const result = await verifyGiteePagesPublication({
    branch: process.env.GITEE_PAGES_BRANCH || defaultBranch,
    remote: process.env.GITEE_PAGES_REMOTE || 'origin',
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

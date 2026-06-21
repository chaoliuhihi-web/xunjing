import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyGiteeGoLive } from './verify-gitee-go-live.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function makeGit({ localHead = 'a674a718', remoteMaster = 'a674a7189e38d5f3b27a69ca38d54821f19389a5' } = {}) {
  return async (args) => {
    if (args[0] === 'rev-parse' && args[1] === '--short' && args[2] === 'HEAD') {
      return localHead;
    }

    if (args[0] === 'ls-remote' && args[2] === 'refs/heads/master') {
      return `${remoteMaster}\trefs/heads/master`;
    }

    throw new Error(`Unexpected git command: ${args.join(' ')}`);
  };
}

function makePagesVerifier(result = {}) {
  return async (options) => ({
    ok: true,
    checkedAt: '2026-06-21T01:00:00.000Z',
    branch: options.branch,
    branchHead: 'pages-sha',
    repoUrl: options.repoUrl,
    pageUrl: options.pageUrl,
    checks: [
      { name: 'deploy-branch', ok: true, detail: 'gh-pages exists at pages-s' },
      { name: 'artifact-commit', ok: true, detail: `${options.branch} artifact was generated from ${options.expectedArtifactCommit}` },
      { name: 'public-repository', ok: true, detail: `${options.repoUrl} returned HTTP 200` },
      { name: 'gitee-pages-url', ok: true, detail: `${options.pageUrl} returned HTTP 200 with brand content` }
    ],
    actionItems: [],
    ...result
  });
}

describe('Gitee go-live verifier', () => {
  test('passes only when local HEAD is pushed and the Pages artifact is public for the same commit', async () => {
    const result = await verifyGiteeGoLive({
      gitImpl: makeGit(),
      pagesVerifier: makePagesVerifier()
    });

    expect(result.ok).toBe(true);
    expect(result.checks.map((check) => check.name)).toEqual([
      'master-sync',
      'deploy-branch',
      'artifact-commit',
      'public-repository',
      'gitee-pages-url'
    ]);
    expect(result.checks[0]).toMatchObject({
      ok: true,
      detail: 'local HEAD a674a718 is pushed to origin/master'
    });
  });

  test('fails with an explicit action when local HEAD is not pushed to master', async () => {
    const result = await verifyGiteeGoLive({
      gitImpl: makeGit({
        localHead: 'b5589dda',
        remoteMaster: 'a674a7189e38d5f3b27a69ca38d54821f19389a5'
      }),
      pagesVerifier: makePagesVerifier()
    });

    expect(result.ok).toBe(false);
    expect(result.checks[0]).toMatchObject({
      name: 'master-sync',
      ok: false,
      detail: 'local HEAD b5589dda does not match origin/master a674a718'
    });
    expect(result.actionItems).toContain('Push local master to origin/master, or checkout the deployed commit before go-live verification.');
  });

  test('carries through Gitee Pages control-plane blockers', async () => {
    const result = await verifyGiteeGoLive({
      gitImpl: makeGit(),
      pagesVerifier: makePagesVerifier({
        ok: false,
        checks: [
          { name: 'deploy-branch', ok: true, detail: 'gh-pages exists at e298468' },
          { name: 'artifact-commit', ok: true, detail: 'gh-pages artifact was generated from a674a718' },
          { name: 'public-repository', ok: false, detail: 'https://gitee.com/xinghetech/xinghexunjing returned HTTP 403' },
          { name: 'gitee-pages-url', ok: false, detail: 'https://xinghetech.gitee.io/xinghexunjing/ returned HTTP 404' }
        ],
        actionItems: [
          'Make the Gitee repository publicly accessible, or use a Gitee Pages plan that supports private repositories.',
          'Enable or update Gitee Pages in the Gitee project console and set the source branch to gh-pages.'
        ]
      })
    });

    expect(result.ok).toBe(false);
    expect(result.actionItems).toEqual([
      'Make the Gitee repository publicly accessible, or use a Gitee Pages plan that supports private repositories.',
      'Enable or update Gitee Pages in the Gitee project console and set the source branch to gh-pages.'
    ]);
  });

  test('is documented as the final Gitee Pages go-live gate', async () => {
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/部署上线说明.md'), 'utf8');

    expect(deployDoc).toContain('node scripts/verify-gitee-go-live.mjs');
    expect(deployDoc).toContain('master-sync');
  });
});

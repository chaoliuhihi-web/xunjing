import { describe, expect, test } from 'vitest';
import { verifyGiteePagesPublication } from './verify-gitee-pages-publication.mjs';

function makeFetch(routes) {
  return async (url) => {
    const key = url.toString();
    const route = routes[key];
    if (!route) {
      return new Response('not found', { status: 404 });
    }

    return new Response(route.body || '', {
      status: route.status,
      headers: route.headers || {}
    });
  };
}

describe('Gitee Pages publication verifier', () => {
  test('reports the exact Pages activation action when the deploy branch exists but the public URL is still 404', async () => {
    const result = await verifyGiteePagesPublication({
      branch: 'gh-pages',
      branchHead: '0701025',
      repoUrl: 'https://gitee.com/xinghetech/xinghexunjing',
      pageUrl: 'https://xinghetech.gitee.io/xinghexunjing/',
      fetchImpl: makeFetch({
        'https://gitee.com/xinghetech/xinghexunjing': {
          status: 200,
          body: '<title>xinghexunjing</title>'
        },
        'https://xinghetech.gitee.io/xinghexunjing/': {
          status: 404,
          body: '404 Not Found'
        }
      })
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toContainEqual({
      name: 'deploy-branch',
      ok: true,
      detail: 'gh-pages exists at 0701025'
    });
    expect(result.actionItems).toContain(
      'Enable or update Gitee Pages in the Gitee project console and set the source branch to gh-pages.'
    );
  });

  test('reports repository visibility as a separate blocker before treating the artifact as broken', async () => {
    const result = await verifyGiteePagesPublication({
      branch: 'gh-pages',
      branchHead: '0701025',
      repoUrl: 'https://gitee.com/xinghetech/xinghexunjing',
      pageUrl: 'https://xinghetech.gitee.io/xinghexunjing/',
      fetchImpl: makeFetch({
        'https://gitee.com/xinghetech/xinghexunjing': {
          status: 403,
          body: '{"status":403,"message":"403 Forbidden"}'
        },
        'https://xinghetech.gitee.io/xinghexunjing/': {
          status: 404,
          body: '404 Not Found'
        }
      })
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toContainEqual({
      name: 'public-repository',
      ok: false,
      detail: 'https://gitee.com/xinghetech/xinghexunjing returned HTTP 403'
    });
    expect(result.actionItems).toContain(
      'Make the Gitee repository publicly accessible, or use a Gitee Pages plan that supports private repositories.'
    );
  });
});

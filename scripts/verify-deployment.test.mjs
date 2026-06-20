import http from 'node:http';
import { once } from 'node:events';
import { afterEach, describe, expect, test } from 'vitest';
import { verifyDeployment } from './verify-deployment.mjs';

const servers = [];

const requiredSecurityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self'; connect-src 'self' https:",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

async function startFixtureServer({
  runtimeCacheControl = 'no-store',
  basePath = '/',
  includeSecurityHeaders = true
} = {}) {
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const server = http.createServer((req, res) => {
    if (includeSecurityHeaders) {
      for (const [header, value] of Object.entries(requiredSecurityHeaders)) {
        res.setHeader(header, value);
      }
    }

    if (!req.url.startsWith(normalizedBasePath)) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }

    const pathname = `/${req.url.slice(normalizedBasePath.length)}`;

    if (pathname === '/') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!doctype html><title>星河寻境｜地方 AI 文旅内容运营平台</title><main>把地方文旅资源转化为运营资产</main>');
      return;
    }

    if (pathname === '/healthz.json') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'ok',
        service: 'xinghexunjing-web',
        version: '0.1.0'
      }));
      return;
    }

    if (pathname === '/runtime-config.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', runtimeCacheControl);
      res.end('window.XINGHE_SITE_CONFIG = { leadWebhookUrl: "" };');
      return;
    }

    if (pathname === '/sitemap.xml') {
      res.setHeader('Content-Type', 'application/xml');
      res.end('<urlset><url><loc>https://example.com/#home</loc></url><url><loc>https://example.com/#capabilities</loc></url></urlset>');
      return;
    }

    if (pathname === '/social-share.svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.end('<svg viewBox="0 0 1200 630"></svg>');
      return;
    }

    res.statusCode = 404;
    res.end('not found');
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  servers.push(server);

  const { port } = server.address();
  return `http://127.0.0.1:${port}${normalizedBasePath}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

describe('deployment verifier', () => {
  test('passes when the deployed static site exposes required operational endpoints', async () => {
    const baseUrl = await startFixtureServer();

    const result = await verifyDeployment({ baseUrl });

    expect(result.ok).toBe(true);
    expect(result.baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:/);
    expect(result.checks.map((check) => check.name)).toEqual([
      'home',
      'security-headers',
      'healthz',
      'runtime-config',
      'sitemap',
      'social-image'
    ]);
    expect(result.checks.every((check) => check.ok)).toBe(true);
  });

  test('fails when runtime-config.js can be cached by clients', async () => {
    const baseUrl = await startFixtureServer({ runtimeCacheControl: 'public, max-age=3600' });

    await expect(verifyDeployment({ baseUrl })).rejects.toThrow(
      'runtime-config.js must be served with Cache-Control: no-store'
    );
  });

  test('fails when the homepage omits production security headers', async () => {
    const baseUrl = await startFixtureServer({ includeSecurityHeaders: false });

    await expect(verifyDeployment({ baseUrl })).rejects.toThrow(
      'home missing required security header Content-Security-Policy'
    );
  });

  test('keeps the configured path prefix for subpath deployments such as Gitee Pages', async () => {
    const baseUrl = await startFixtureServer({ basePath: '/xinghexunjing/' });

    const result = await verifyDeployment({ baseUrl });

    expect(result.ok).toBe(true);
    expect(result.baseUrl).toMatch(/\/xinghexunjing\/$/);
  });
});

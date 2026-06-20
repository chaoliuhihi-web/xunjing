import { describe, expect, test } from 'vitest';
import { verifyGoLive } from './verify-go-live.mjs';

const requiredSecurityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self'; connect-src 'self' https:",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

function response(body, { status = 200, headers = {} } = {}) {
  return new Response(body, {
    status,
    headers: {
      ...requiredSecurityHeaders,
      ...headers
    }
  });
}

function makeFetch({
  leadWebhookUrl = 'https://crm.xinghe.example.cn/api/xinghe/leads',
  hsts = 'max-age=15552000; includeSubDomains',
  leadHealthStatus = 200
} = {}) {
  return async (url) => {
    const { pathname } = new URL(url);

    if (pathname === '/') {
      return response('<!doctype html><title>星河寻境</title><main>星河寻境</main>', {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Strict-Transport-Security': hsts
        }
      });
    }

    if (pathname === '/healthz.json') {
      return response(JSON.stringify({
        status: 'ok',
        service: 'xinghexunjing-web',
        version: '0.1.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/runtime-config.js') {
      return response(`window.XINGHE_SITE_CONFIG = { leadWebhookUrl: '${leadWebhookUrl}' };`, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (pathname === '/api/leads/healthz') {
      return response(JSON.stringify({
        status: leadHealthStatus === 200 ? 'ok' : 'down',
        service: 'xinghexunjing-leads'
      }), {
        status: leadHealthStatus,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/sitemap.xml') {
      return response('<urlset><url><loc>https://travel.example.cn/#home</loc></url><url><loc>https://travel.example.cn/#capabilities</loc></url></urlset>', {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    if (pathname === '/social-share.svg') {
      return response('<svg viewBox="0 0 1200 630"></svg>', {
        headers: { 'Content-Type': 'image/svg+xml' }
      });
    }

    return response('not found', { status: 404 });
  };
}

describe('go-live verifier', () => {
  test('passes only when a production HTTPS deployment has HSTS and a real lead webhook', async () => {
    const result = await verifyGoLive({
      baseUrl: 'https://travel.example.cn/',
      fetchImpl: makeFetch()
    });

    expect(result.ok).toBe(true);
    expect(result.baseUrl).toBe('https://travel.example.cn/');
    expect(result.checks.map((check) => check.name)).toEqual([
      'home',
      'security-headers',
      'healthz',
      'runtime-config',
      'sitemap',
      'social-image',
      'https',
      'hsts',
      'lead-webhook'
    ]);
  });

  test('rejects non-HTTPS public base URLs', async () => {
    await expect(verifyGoLive({
      baseUrl: 'http://travel.example.cn/',
      fetchImpl: makeFetch()
    })).rejects.toThrow('Go-live verification requires an https:// URL');
  });

  test('rejects deployments without HSTS', async () => {
    await expect(verifyGoLive({
      baseUrl: 'https://travel.example.cn/',
      fetchImpl: makeFetch({ hsts: '' })
    })).rejects.toThrow('home must include Strict-Transport-Security');
  });

  test('rejects empty or placeholder lead webhook URLs', async () => {
    await expect(verifyGoLive({
      baseUrl: 'https://travel.example.cn/',
      fetchImpl: makeFetch({ leadWebhookUrl: '' })
    })).rejects.toThrow('runtime-config.js must configure a production HTTPS leadWebhookUrl');

    await expect(verifyGoLive({
      baseUrl: 'https://travel.example.cn/',
      fetchImpl: makeFetch({ leadWebhookUrl: 'https://your-crm.example.com/api/xinghe/leads' })
    })).rejects.toThrow('runtime-config.js leadWebhookUrl must not use an example domain');
  });

  test('accepts a healthy same-origin lead capture endpoint', async () => {
    const result = await verifyGoLive({
      baseUrl: 'https://travel.example.cn/',
      fetchImpl: makeFetch({ leadWebhookUrl: '/api/leads' })
    });

    expect(result.ok).toBe(true);
    expect(result.checks.find((check) => check.name === 'lead-webhook')).toMatchObject({
      ok: true,
      detail: 'same-origin /api/leads'
    });
  });

  test('rejects same-origin lead capture when its health check fails', async () => {
    await expect(verifyGoLive({
      baseUrl: 'https://travel.example.cn/',
      fetchImpl: makeFetch({ leadWebhookUrl: '/api/leads', leadHealthStatus: 503 })
    })).rejects.toThrow('same-origin lead capture health check returned HTTP 503');
  });
});

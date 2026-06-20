import path from 'node:path';
import { pathToFileURL } from 'node:url';

const requiredAnchors = ['#home', '#capabilities'];
const requiredSecurityHeaders = [
  { name: 'Content-Security-Policy', value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self'; connect-src 'self' https:" },
  { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { name: 'X-Content-Type-Options', value: 'nosniff' },
  { name: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' }
];

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    throw new Error('Usage: node scripts/verify-deployment.mjs <https://your-domain.example/>');
  }

  const url = new URL(baseUrl);
  url.hash = '';
  url.search = '';
  if (!url.pathname.endsWith('/')) {
    url.pathname = `${url.pathname}/`;
  }
  return url.toString();
}

async function fetchText(baseUrl, pathname, fetchImpl = fetch) {
  const relativePath = pathname.replace(/^\/+/, '');
  const url = new URL(relativePath, baseUrl);
  const response = await fetchImpl(url);
  const body = await response.text();
  return { url: url.toString(), response, body };
}

function assertOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }
}

function pass(name, detail) {
  return { name, ok: true, detail };
}

async function checkHome(baseUrl, fetchImpl) {
  const { response, body } = await fetchText(baseUrl, '/', fetchImpl);
  assertOk(response, 'home');
  if (!body.includes('星河寻境')) {
    throw new Error('home page does not contain 星河寻境');
  }
  return pass('home', 'homepage returned 200 and contains brand text');
}

async function checkSecurityHeaders(baseUrl, fetchImpl) {
  const { response } = await fetchText(baseUrl, '/', fetchImpl);
  assertOk(response, 'home');

  for (const { name, value } of requiredSecurityHeaders) {
    const actualValue = response.headers.get(name);
    if (!actualValue) {
      throw new Error(`home missing required security header ${name}`);
    }
    if (actualValue !== value) {
      throw new Error(`home security header ${name} expected "${value}" but received "${actualValue}"`);
    }
  }

  return pass('security-headers', 'homepage includes production security headers');
}

async function checkHealthz(baseUrl, fetchImpl) {
  const { response, body } = await fetchText(baseUrl, '/healthz.json', fetchImpl);
  assertOk(response, 'healthz.json');
  const health = JSON.parse(body);
  if (health.status !== 'ok' || health.service !== 'xinghexunjing-web') {
    throw new Error('healthz.json does not report xinghexunjing-web ok');
  }
  return pass('healthz', `${health.service} ${health.version || ''}`.trim());
}

async function checkRuntimeConfig(baseUrl, fetchImpl) {
  const { response, body } = await fetchText(baseUrl, '/runtime-config.js', fetchImpl);
  assertOk(response, 'runtime-config.js');

  const cacheControl = response.headers.get('cache-control') || '';
  if (!cacheControl.toLowerCase().includes('no-store')) {
    throw new Error('runtime-config.js must be served with Cache-Control: no-store');
  }
  if (!body.includes('window.XINGHE_SITE_CONFIG')) {
    throw new Error('runtime-config.js does not define window.XINGHE_SITE_CONFIG');
  }

  return pass('runtime-config', 'runtime config is reachable and no-store');
}

async function checkSitemap(baseUrl, fetchImpl) {
  const { response, body } = await fetchText(baseUrl, '/sitemap.xml', fetchImpl);
  assertOk(response, 'sitemap.xml');
  for (const anchor of requiredAnchors) {
    if (!body.includes(anchor)) {
      throw new Error(`sitemap.xml missing ${anchor}`);
    }
  }
  return pass('sitemap', `contains ${requiredAnchors.join(', ')}`);
}

async function checkSocialImage(baseUrl, fetchImpl) {
  const { response, body } = await fetchText(baseUrl, '/social-share.svg', fetchImpl);
  assertOk(response, 'social-share.svg');

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('image/svg+xml')) {
    throw new Error('social-share.svg must be served as image/svg+xml');
  }
  if (!body.includes('viewBox="0 0 1200 630"')) {
    throw new Error('social-share.svg must be a 1200x630 share image');
  }

  return pass('social-image', 'social share image is reachable');
}

export async function verifyDeployment({ baseUrl, fetchImpl = fetch }) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const checks = [];

  checks.push(await checkHome(normalizedBaseUrl, fetchImpl));
  checks.push(await checkSecurityHeaders(normalizedBaseUrl, fetchImpl));
  checks.push(await checkHealthz(normalizedBaseUrl, fetchImpl));
  checks.push(await checkRuntimeConfig(normalizedBaseUrl, fetchImpl));
  checks.push(await checkSitemap(normalizedBaseUrl, fetchImpl));
  checks.push(await checkSocialImage(normalizedBaseUrl, fetchImpl));

  return {
    ok: checks.every((check) => check.ok),
    baseUrl: normalizedBaseUrl,
    checkedAt: new Date().toISOString(),
    checks
  };
}

async function runCli() {
  const result = await verifyDeployment({ baseUrl: process.argv[2] });
  console.log(JSON.stringify(result, null, 2));
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

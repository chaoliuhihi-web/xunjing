import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyDeployment } from './verify-deployment.mjs';

const minimumHstsMaxAge = 15552000;

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    throw new Error('Usage: node scripts/verify-go-live.mjs <https://your-production-domain.example/>');
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

function parseLeadWebhookUrl(runtimeConfigBody) {
  const match = runtimeConfigBody.match(/leadWebhookUrl\s*:\s*['"]([^'"]*)['"]/);
  return match ? match[1].trim() : '';
}

function assertProductionLeadWebhook(leadWebhookUrl) {
  if (!leadWebhookUrl) {
    throw new Error('runtime-config.js must configure a production HTTPS leadWebhookUrl');
  }

  if (leadWebhookUrl.startsWith('/') && !leadWebhookUrl.startsWith('//')) {
    return {
      type: 'same-origin',
      path: leadWebhookUrl
    };
  }

  let parsed;
  try {
    parsed = new URL(leadWebhookUrl);
  } catch {
    throw new Error('runtime-config.js must configure a production HTTPS leadWebhookUrl');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('runtime-config.js must configure a production HTTPS leadWebhookUrl');
  }

  if (parsed.hostname === 'example.com' || parsed.hostname.endsWith('.example.com') || parsed.hostname.includes('your-crm')) {
    throw new Error('runtime-config.js leadWebhookUrl must not use an example domain');
  }

  return {
    type: 'external',
    parsed
  };
}

async function checkHttps(baseUrl) {
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:') {
    throw new Error('Go-live verification requires an https:// URL');
  }

  return pass('https', `using ${url.protocol}//${url.hostname}`);
}

async function checkHsts(baseUrl, fetchImpl) {
  const { response } = await fetchText(baseUrl, '/', fetchImpl);
  assertOk(response, 'home');

  const hsts = response.headers.get('strict-transport-security') || '';
  if (!hsts) {
    throw new Error('home must include Strict-Transport-Security');
  }

  const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
  const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 0;
  if (maxAge < minimumHstsMaxAge) {
    throw new Error(`Strict-Transport-Security max-age must be at least ${minimumHstsMaxAge}`);
  }

  return pass('hsts', `max-age ${maxAge}`);
}

async function checkLeadWebhook(baseUrl, fetchImpl) {
  const { response, body } = await fetchText(baseUrl, '/runtime-config.js', fetchImpl);
  assertOk(response, 'runtime-config.js');
  const leadWebhookUrl = parseLeadWebhookUrl(body);
  const leadWebhook = assertProductionLeadWebhook(leadWebhookUrl);

  if (leadWebhook.type === 'same-origin') {
    const normalizedPath = leadWebhook.path.split(/[?#]/)[0].replace(/\/+$/, '');
    const healthPath = `${normalizedPath}/healthz`;
    const { response: healthResponse, body: healthBody } = await fetchText(baseUrl, healthPath, fetchImpl);
    if (!healthResponse.ok) {
      throw new Error(`same-origin lead capture health check returned HTTP ${healthResponse.status}`);
    }

    const health = JSON.parse(healthBody);
    if (health.status !== 'ok' || health.service !== 'xinghexunjing-leads') {
      throw new Error('same-origin lead capture health check did not report xinghexunjing-leads ok');
    }

    return pass('lead-webhook', `same-origin ${normalizedPath}`);
  }

  return pass('lead-webhook', `configured ${leadWebhook.parsed.origin}`);
}

export async function verifyGoLive({ baseUrl, fetchImpl = fetch }) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const checks = [];

  const httpsCheck = await checkHttps(normalizedBaseUrl);
  const deployment = await verifyDeployment({ baseUrl: normalizedBaseUrl, fetchImpl });

  checks.push(...deployment.checks);
  checks.push(httpsCheck);
  checks.push(await checkHsts(normalizedBaseUrl, fetchImpl));
  checks.push(await checkLeadWebhook(normalizedBaseUrl, fetchImpl));

  return {
    ok: checks.every((check) => check.ok),
    baseUrl: normalizedBaseUrl,
    checkedAt: new Date().toISOString(),
    checks
  };
}

async function runCli() {
  const result = await verifyGoLive({ baseUrl: process.argv[2] });
  console.log(JSON.stringify(result, null, 2));
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

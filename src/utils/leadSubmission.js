const LEAD_STORAGE_KEY = 'xinghe_xunjing_leads';

function normalizeEndpoint(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getLeadWebhookUrl() {
  const runtimeUrl = normalizeEndpoint(window.XINGHE_SITE_CONFIG?.leadWebhookUrl);
  if (runtimeUrl) return runtimeUrl;

  return normalizeEndpoint(import.meta.env.VITE_LEAD_WEBHOOK_URL);
}

function buildLeadPayload(lead, options = {}) {
  return {
    ...lead,
    source: options.source || 'website',
    page: window.location.hash || '#home',
    url: window.location.href,
    userAgent: window.navigator.userAgent,
    submittedAt: new Date().toISOString()
  };
}

function storeLeadLocally(payload) {
  const existing = JSON.parse(window.localStorage.getItem(LEAD_STORAGE_KEY) || '[]');
  window.localStorage.setItem(
    LEAD_STORAGE_KEY,
    JSON.stringify([...existing, { ...payload, status: 'pending-sync' }])
  );
}

export async function submitLead(lead, options = {}) {
  const payload = buildLeadPayload(lead, options);
  const endpoint = getLeadWebhookUrl();

  if (!endpoint) {
    storeLeadLocally(payload);
    return { ok: true, mode: 'local' };
  }

  const response = await window.fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, status: 'new' })
  });

  if (!response.ok) {
    throw new Error('LEAD_WEBHOOK_FAILED');
  }

  return { ok: true, mode: 'webhook' };
}
